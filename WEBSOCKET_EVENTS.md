# WebSocket Events Documentation

## FlowPay Support - Real-Time Events

Este documento descreve todos os eventos WebSocket disponíveis no sistema FlowPay Support.

---

## Configuração de Conexão

### Endpoint
```
ws://localhost:3000/ws
```

### Namespace
- `/ws` - Namespace principal para todos os eventos

### CORS
- Permitido para: `http://localhost:5173`, `http://localhost:3000`

### Configuração Cliente (Socket.IO)
```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/ws', {
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
  transports: ['websocket', 'polling'],
});
```

---

## Eventos do Sistema

### 1. `ticket:created`

**Descrição:** Emitido quando um novo ticket é criado no sistema.

**Quando é disparado:**
- Após a criação de um ticket via `POST /api/tickets`

**Payload:**
```typescript
{
  ticket: {
    id: string;
    customerName: string;
    subject: TicketSubject; // 'CARD_PROBLEM' | 'LOAN_REQUEST' | 'OTHER'
    status: TicketStatus;   // 'WAITING' | 'IN_PROGRESS' | 'COMPLETED'
    agentId?: string;
    agent?: {
      id: string;
      name: string;
    };
    queuePosition?: number;
    startedAt?: Date;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
  };
  queuePosition?: number;
}
```

**Exemplo de uso:**
```typescript
socket.on('ticket:created', (data) => {
  console.log('Novo ticket criado:', data.ticket.id);
  console.log('Cliente:', data.ticket.customerName);
  console.log('Posição na fila:', data.queuePosition);
});
```

---

### 2. `ticket:assigned`

**Descrição:** Emitido quando um ticket é atribuído a um agente.

**Quando é disparado:**
- Quando um ticket é automaticamente atribuído a um agente disponível
- Quando um ticket da fila é processado e atribuído

**Payload:**
```typescript
{
  ticket: TicketResponseDto;
  agent: {
    id: string;
    name: string;
    email: string;
    teamId: string;
    team: {
      id: string;
      name: string;
      type: TeamType; // 'CARDS' | 'LOANS' | 'OTHER'
    };
    maxConcurrent: number;
    activeTicketsCount: number;
    isOnline: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
}
```

**Exemplo de uso:**
```typescript
socket.on('ticket:assigned', (data) => {
  console.log(`Ticket ${data.ticket.id} atribuído ao agente ${data.agent.name}`);
  console.log(`Agente possui ${data.agent.activeTicketsCount} tickets ativos`);
});
```

---

### 3. `ticket:completed`

**Descrição:** Emitido quando um ticket é marcado como completado.

**Quando é disparado:**
- Após a chamada de `PATCH /api/tickets/:id/complete`

**Payload:**
```typescript
{
  ticket: TicketResponseDto;
  agent: AgentResponseDto;
}
```

**Exemplo de uso:**
```typescript
socket.on('ticket:completed', (data) => {
  console.log(`Ticket ${data.ticket.id} completado pelo agente ${data.agent.name}`);
  const duration = data.ticket.completedAt - data.ticket.startedAt;
  console.log(`Duração do atendimento: ${duration}ms`);
});
```

---

### 4. `queue:updated`

**Descrição:** Emitido quando o tamanho de uma fila é atualizado.

**Quando é disparado:**
- Quando um ticket é adicionado à fila (todos os agentes ocupados)
- Quando um ticket é removido da fila (processado e atribuído)

**Payload:**
```typescript
{
  teamType: TeamType; // 'CARDS' | 'LOANS' | 'OTHER'
  queueSize: number;
}
```

**Exemplo de uso:**
```typescript
socket.on('queue:updated', (data) => {
  console.log(`Fila do time ${data.teamType}: ${data.queueSize} tickets aguardando`);

  if (data.queueSize > 10) {
    console.warn('Fila muito grande! Considere adicionar mais agentes.');
  }
});
```

---

### 5. `agent:status-changed`

**Descrição:** Emitido quando o status online/offline de um agente muda.

**Quando é disparado:**
- Após a chamada de `PATCH /api/agents/:id/status`

**Payload:**
```typescript
{
  agent: AgentResponseDto;
  activeCount: number; // Número de tickets ativos do agente
}
```

**Exemplo de uso:**
```typescript
socket.on('agent:status-changed', (data) => {
  const status = data.agent.isOnline ? 'online' : 'offline';
  console.log(`Agente ${data.agent.name} está ${status}`);
  console.log(`Tickets ativos: ${data.activeCount}`);
});
```

---

### 6. `dashboard:stats`

**Descrição:** Emitido quando as estatísticas gerais do dashboard são atualizadas.

**Quando é disparado:**
- Pode ser emitido manualmente ou em intervalos regulares

**Payload:**
```typescript
{
  stats: {
    totalTickets: number;    // Total de tickets no sistema
    inProgress: number;      // Tickets em atendimento
    inQueue: number;         // Tickets aguardando na fila
    completed: number;       // Tickets completados
    avgWaitTime: number;     // Tempo médio de espera em segundos
  };
}
```

**Exemplo de uso:**
```typescript
socket.on('dashboard:stats', (data) => {
  console.log('Estatísticas atualizadas:');
  console.log(`Total: ${data.stats.totalTickets}`);
  console.log(`Em atendimento: ${data.stats.inProgress}`);
  console.log(`Na fila: ${data.stats.inQueue}`);
  console.log(`Completados: ${data.stats.completed}`);
  console.log(`Tempo médio de espera: ${data.stats.avgWaitTime}s`);
});
```

---

## Eventos de Conexão (Socket.IO)

### `connect`
```typescript
socket.on('connect', () => {
  console.log('Conectado ao servidor WebSocket');
  console.log('Socket ID:', socket.id);
});
```

### `disconnect`
```typescript
socket.on('disconnect', (reason) => {
  console.log('Desconectado:', reason);
});
```

### `connect_error`
```typescript
socket.on('connect_error', (error) => {
  console.error('Erro de conexão:', error.message);
});
```

### `reconnect`
```typescript
socket.on('reconnect', (attemptNumber) => {
  console.log(`Reconectado após ${attemptNumber} tentativa(s)`);
});
```

---

## Fluxo de Eventos

### Fluxo: Criação de Ticket

```
1. Cliente → POST /api/tickets { customerName, subject }
2. Sistema → Cria ticket no banco
3. Sistema → Emite 'ticket:created'
4. Sistema → Tenta distribuir ticket:

   a) Se há agente disponível:
      - Atribui ticket ao agente
      - Emite 'ticket:assigned'

   b) Se não há agente disponível:
      - Adiciona ticket na fila
      - Emite 'queue:updated'
```

### Fluxo: Conclusão de Ticket

```
1. Cliente → PATCH /api/tickets/:id/complete
2. Sistema → Marca ticket como COMPLETED
3. Sistema → Emite 'ticket:completed'
4. Sistema → Processa fila do time:

   a) Se há tickets na fila E agentes disponíveis:
      - Remove próximo ticket da fila (FIFO)
      - Atribui ao agente
      - Emite 'ticket:assigned'
      - Emite 'queue:updated' (tamanho reduzido)

   b) Se não há tickets ou agentes:
      - Fila permanece inalterada
```

### Fluxo: Mudança de Status do Agente

```
1. Cliente → PATCH /api/agents/:id/status { isOnline: true/false }
2. Sistema → Atualiza status do agente
3. Sistema → Emite 'agent:status-changed'
4. (Futuro) Sistema pode processar fila se agente ficou online
```

---

## Boas Práticas

### 1. Gerenciamento de Listeners
```typescript
// ✅ Correto: Remover listeners quando componente desmonta
useEffect(() => {
  const handler = (data) => {
    // processar evento
  };

  socket.on('ticket:created', handler);

  return () => {
    socket.off('ticket:created', handler);
  };
}, []);
```

### 2. Tratamento de Erros
```typescript
socket.on('connect_error', (error) => {
  // Notificar usuário
  toast.error('Erro de conexão com servidor');

  // Log para debug
  console.error('Socket error:', error);
});
```

### 3. Reconnection
```typescript
socket.on('reconnect', () => {
  // Recarregar dados após reconexão
  fetchDashboardData();
  toast.success('Reconectado ao servidor');
});
```

### 4. Performance
```typescript
// ✅ Correto: Debounce para atualizações frequentes
import { debounce } from 'lodash';

const updateDashboard = debounce((stats) => {
  setDashboardStats(stats);
}, 500);

socket.on('dashboard:stats', updateDashboard);
```

---

## Tipos TypeScript

### Enums
```typescript
enum TicketSubject {
  CARD_PROBLEM = 'CARD_PROBLEM',
  LOAN_REQUEST = 'LOAN_REQUEST',
  OTHER = 'OTHER'
}

enum TicketStatus {
  WAITING = 'WAITING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

enum TeamType {
  CARDS = 'CARDS',
  LOANS = 'LOANS',
  OTHER = 'OTHER'
}
```

---

## Testes

### Exemplo de Teste E2E
```typescript
import { io, Socket } from 'socket.io-client';

describe('WebSocket Events', () => {
  let socket: Socket;

  beforeEach((done) => {
    socket = io('http://localhost:3000/ws');
    socket.on('connect', done);
  });

  afterEach(() => {
    socket.disconnect();
  });

  it('deve emitir ticket:created ao criar ticket', (done) => {
    socket.on('ticket:created', (data) => {
      expect(data.ticket).toBeDefined();
      expect(data.ticket.customerName).toBe('Teste');
      done();
    });

    // Criar ticket via API
    createTicket({ customerName: 'Teste', subject: 'CARD_PROBLEM' });
  });
});
```

---

## Monitoramento

### Logs do Servidor
O servidor loga todas as conexões e eventos:

```
[TicketsGateway] WebSocket Gateway initialized
[TicketsGateway] Namespace: /ws
[TicketsGateway] CORS enabled for: http://localhost:5173, http://localhost:3000
[TicketsGateway] Client connected: pG7xQj_YZL9AAAAB
[TicketsGateway] Total clients: 1
[TicketsGateway] Ticket created event emitted: abc123 (CARD_PROBLEM)
[TicketsGateway] Ticket assigned event emitted: abc123 → Agent João Silva
```

---

## Troubleshooting

### Problema: Cliente não conecta
```typescript
// Verificar se a URL está correta
const socket = io('http://localhost:3000/ws'); // ✅ Com /ws

// Verificar transports
const socket = io(url, {
  transports: ['websocket', 'polling'], // Fallback para polling
});
```

### Problema: Eventos não recebidos
```typescript
// Garantir que listener foi adicionado ANTES da conexão
socket.on('ticket:created', handler);
socket.connect();

// Verificar se socket está conectado
if (socket.connected) {
  console.log('Socket conectado');
} else {
  console.log('Socket desconectado');
}
```

### Problema: Memory leak
```typescript
// ✅ Sempre remover listeners
useEffect(() => {
  socket.on('event', handler);

  return () => {
    socket.off('event', handler); // IMPORTANTE!
  };
}, []);
```

---

## Referências

- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [NestJS WebSockets](https://docs.nestjs.com/websockets/gateways)
- [PRD.md](./PRD.md) - Especificação completa do projeto
