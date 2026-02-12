# Sistema de Filas e Distribuição - FlowPay Support

## Visão Geral

O sistema de distribuição de tickets do FlowPay Support implementa uma lógica inteligente de roteamento e balanceamento de carga usando **BullMQ** (filas com Redis) e **Prisma ORM** (PostgreSQL).

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUXO DE DISTRIBUIÇÃO                    │
└─────────────────────────────────────────────────────────────┘

1. Cliente cria ticket (POST /api/tickets)
   │
   ├─→ TicketsService.create()
   │   ├─→ Cria ticket no banco (status: WAITING)
   │   └─→ QueueService.distributeTicket(ticketId)
   │
2. Distribuição automática
   │
   ├─→ mapSubjectToTeam(subject)
   │   ├─→ CARD_PROBLEM → CARDS
   │   ├─→ LOAN_REQUEST → LOANS
   │   └─→ OTHER → OTHER
   │
   ├─→ findAvailableAgent(teamType)
   │   ├─→ Busca agentes online do time
   │   ├─→ Filtra agentes com < 3 tickets ativos
   │   └─→ Retorna agente com MENOR carga
   │
   ├─→ SE agente disponível:
   │   └─→ assignTicketToAgent(ticketId, agentId)
   │       ├─→ status = IN_PROGRESS
   │       ├─→ startedAt = now()
   │       └─→ queuePosition = null
   │
   └─→ SE NÃO há agente disponível:
       └─→ enqueueTicket(ticketId, teamType)
           ├─→ Adiciona job na fila BullMQ correspondente
           ├─→ Calcula queuePosition (FIFO)
           └─→ status = WAITING

3. Finalização de ticket (PATCH /api/tickets/:id/complete)
   │
   ├─→ TicketsService.complete(id)
   │   ├─→ Valida ticket (existe, IN_PROGRESS, tem agente)
   │   ├─→ status = COMPLETED
   │   ├─→ completedAt = now()
   │   └─→ QueueService.processQueue(teamType)
   │
   └─→ Processa próximo da fila
       └─→ LOOP: enquanto houver agentes disponíveis E tickets na fila
           ├─→ dequeueNext(teamType) → retorna ticket mais antigo
           ├─→ assignTicketToAgent(ticketId, agentId)
           └─→ updateQueuePositions() → recalcula posições
```

## Regras de Negócio Implementadas

### 1. Roteamento Automático por Assunto

```typescript
mapSubjectToTeam(subject: TicketSubject): TeamType {
  CARD_PROBLEM  → CARDS  (Time Cartões)
  LOAN_REQUEST  → LOANS  (Time Empréstimos)
  OTHER         → OTHER  (Time Outros Assuntos)
}
```

### 2. Limite de 3 Atendimentos Simultâneos

```typescript
findAvailableAgent(teamType: TeamType): Promise<Agent | null> {
  // 1. Busca agentes online do time
  // 2. Conta tickets ativos (status = IN_PROGRESS) de cada agente
  // 3. Filtra agentes com currentTickets.length < maxConcurrent (3)
  // 4. Ordena por carga (menor para maior)
  // 5. Retorna agente com MENOR carga OU null se todos ocupados
}
```

### 3. Fila FIFO (First In, First Out)

```typescript
dequeueNext(teamType: TeamType): Promise<Ticket | null> {
  // Busca próximo ticket em WAITING do time
  // Ordenado por createdAt ASC → primeiro que entrou, primeiro que sai
  return prisma.ticket.findFirst({
    where: {
      status: WAITING,
      subject: mapTeamToSubjects(teamType)
    },
    orderBy: {
      createdAt: 'asc' // FIFO
    }
  });
}
```

### 4. Processamento Automático da Fila

```typescript
processQueue(teamType: TeamType): Promise<void> {
  // Executado AUTOMATICAMENTE quando agente finaliza ticket

  while (true) {
    // 1. Busca agente disponível
    const agent = await findAvailableAgent(teamType);
    if (!agent) break; // Sem agentes disponíveis

    // 2. Busca próximo ticket da fila
    const ticket = await dequeueNext(teamType);
    if (!ticket) break; // Fila vazia

    // 3. Atribui ticket ao agente
    await assignTicketToAgent(ticket.id, agent.id);

    // 4. Atualiza posições na fila
    await updateQueuePositions(teamType);
  }
}
```

## Estrutura de Filas BullMQ

### Configuração Redis

```typescript
BullModule.forRootAsync({
  useFactory: async (configService: ConfigService) => ({
    connection: {
      host: configService.get('REDIS_HOST', 'localhost'),
      port: configService.get('REDIS_PORT', 6379),
    },
  }),
})
```

### 3 Filas Separadas

```typescript
cards-queue  → Tickets de CARD_PROBLEM
loans-queue  → Tickets de LOAN_REQUEST
other-queue  → Tickets de OTHER
```

### Processadores

Cada fila possui um processor dedicado:

```typescript
@Processor('cards-queue', { concurrency: 1 })
export class CardsQueueProcessor extends WorkerHost {
  async process(job: Job<DistributeTicketJob>): Promise<void> {
    await this.queueService.processQueueJob(job.data.ticketId);
  }
}
```

**Concurrency: 1** garante que apenas 1 job é processado por vez em cada fila.

## Fluxos de Uso

### Cenário 1: Ticket criado com agente disponível

```
1. POST /api/tickets { customerName: "João", subject: "CARD_PROBLEM" }
2. Ticket criado: ID abc123, status: WAITING
3. Roteamento: CARD_PROBLEM → Time CARDS
4. Busca agente: encontra Agent 1 (0/3 tickets)
5. Atribuição: ticket abc123 → Agent 1
6. Resultado: status: IN_PROGRESS, agentId: agent-1, startedAt: now()
```

### Cenário 2: Ticket entra na fila (todos ocupados)

```
1. POST /api/tickets { customerName: "Maria", subject: "LOAN_REQUEST" }
2. Ticket criado: ID def456, status: WAITING
3. Roteamento: LOAN_REQUEST → Time LOANS
4. Busca agente: todos os 3 agentes com 3/3 tickets → null
5. Enfileiramento: ticket def456 → loans-queue
6. Resultado: status: WAITING, queuePosition: 1
```

### Cenário 3: Agente finaliza ticket, fila processa

```
1. PATCH /api/tickets/abc123/complete
2. Ticket abc123: status: COMPLETED, completedAt: now()
3. Agent 1 agora tem 2/3 tickets (ficou disponível)
4. processQueue(CARDS) executado automaticamente
5. Busca próximo da fila: ticket def456 (mais antigo)
6. Atribuição: ticket def456 → Agent 1
7. Resultado: ticket def456 distribuído automaticamente!
```

### Cenário 4: FIFO garantido

```
Fila atual (Time CARDS):
  - Ticket A (criado às 10:00)
  - Ticket B (criado às 10:05)
  - Ticket C (criado às 10:10)

Agente finaliza ticket → processQueue() executado

1. dequeueNext(CARDS) → retorna Ticket A (10:00)
2. assignTicketToAgent(ticketA, agent)
3. Ticket A sai da fila
4. updateQueuePositions():
   - Ticket B: queuePosition = 1
   - Ticket C: queuePosition = 2
```

## Endpoints API

### POST /api/tickets

Cria ticket e distribui automaticamente.

**Request:**
```json
{
  "customerName": "João Silva",
  "subject": "CARD_PROBLEM"
}
```

**Response:**
```json
{
  "id": "abc123",
  "customerName": "João Silva",
  "subject": "CARD_PROBLEM",
  "status": "IN_PROGRESS",
  "agentId": "agent-1",
  "agent": {
    "id": "agent-1",
    "name": "Agent 1"
  },
  "queuePosition": null,
  "startedAt": "2026-02-11T23:00:00Z",
  "completedAt": null,
  "createdAt": "2026-02-11T23:00:00Z",
  "updatedAt": "2026-02-11T23:00:00Z"
}
```

### PATCH /api/tickets/:id/complete

Completa ticket e processa próximo da fila.

**Response:**
```json
{
  "id": "abc123",
  "customerName": "João Silva",
  "subject": "CARD_PROBLEM",
  "status": "COMPLETED",
  "agentId": "agent-1",
  "agent": {
    "id": "agent-1",
    "name": "Agent 1"
  },
  "queuePosition": null,
  "startedAt": "2026-02-11T23:00:00Z",
  "completedAt": "2026-02-11T23:05:00Z",
  "createdAt": "2026-02-11T23:00:00Z",
  "updatedAt": "2026-02-11T23:05:00Z"
}
```

## Monitoramento e Logs

O sistema implementa logging detalhado em todas as operações:

```typescript
// Seleção de agente
this.logger.log(
  `Selected agent ${agent.name} (${agent.currentTickets.length} active tickets) for team ${teamType}`
);

// Atribuição de ticket
this.logger.log(
  `Ticket ${ticketId} assigned to agent ${agent.name}`
);

// Enfileiramento
this.logger.log(
  `Ticket ${ticketId} enqueued in ${teamType} queue at position ${queuePosition + 1}`
);

// Dequeue
this.logger.log(
  `Dequeued ticket ${ticket.id} from ${teamType} queue (created at ${ticket.createdAt})`
);

// Processamento de fila
this.logger.log(
  `Processing ${teamType} queue...`
);
this.logger.log(
  `Assigned ticket ${ticket.id} to agent ${agent.name} from queue`
);
this.logger.log(
  `Finished processing ${teamType} queue`
);
```

## Tratamento de Erros

Todos os métodos críticos possuem try/catch e logging de erros:

```typescript
try {
  // Lógica de negócio
} catch (error) {
  this.logger.error(`Error distributing ticket: ${error.message}`);
  throw error;
}
```

Erros específicos lançados:

- **NotFoundException**: Ticket não encontrado
- **BadRequestException**: Ticket não está IN_PROGRESS ou não tem agente

## Testes Unitários

Cobertura completa de testes em `test/unit/queue.service.spec.ts`:

- ✅ mapSubjectToTeam: 3 testes
- ✅ findAvailableAgent: 3 testes
- ✅ assignTicketToAgent: 1 teste
- ✅ distributeTicket: 2 testes
- ✅ dequeueNext (FIFO): 2 testes
- ✅ processQueue: 3 testes

**Total: 14 testes unitários**

## Dependências

- **@nestjs/bullmq**: Integração BullMQ com NestJS
- **bullmq**: Sistema de filas com Redis
- **ioredis**: Cliente Redis
- **@prisma/client**: ORM para PostgreSQL


