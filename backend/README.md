# FlowPay Support - Backend

Backend NestJS para o sistema de distribuição de atendimentos da FlowPay.

## Stack Tecnológica

- **Framework:** NestJS v10.3.0
- **Runtime:** Node.js 20+ LTS
- **Linguagem:** TypeScript 5.3+
- **ORM:** Prisma 5.8.1
- **Banco de Dados:** PostgreSQL 16
- **Cache/Filas:** Redis 7 + BullMQ 5.1.0
- **WebSocket:** Socket.IO 4.6.1
- **Documentação:** Swagger/OpenAPI
- **Validação:** class-validator + class-transformer
- **Testes:** Jest + Supertest

## Estrutura de Pastas

```
backend/
├── prisma/
│   ├── schema.prisma          # Schema do banco de dados
│   └── seed.ts                # Seed de dados iniciais
├── src/
│   ├── main.ts               # Bootstrap da aplicação
│   ├── app.module.ts         # Módulo raiz
│   ├── common/               # Código compartilhado
│   │   ├── filters/          # Exception filters
│   │   ├── interceptors/     # Interceptors (logging, transform)
│   │   └── dto/              # DTOs compartilhados
│   ├── modules/              # Módulos da aplicação
│   │   ├── teams/           # Gerenciamento de times
│   │   ├── agents/          # Gerenciamento de atendentes
│   │   ├── tickets/         # Gerenciamento de tickets
│   │   ├── queue/           # Sistema de filas (BullMQ)
│   │   └── dashboard/       # Dashboard e estatísticas
│   └── database/            # PrismaService e configurações
└── test/
    ├── unit/                # Testes unitários
    └── integration/         # Testes de integração
```

## Pré-requisitos

- Node.js >= 20.0.0 LTS
- Docker e Docker Compose (para PostgreSQL e Redis)
- npm ou yarn

## Setup e Instalação

### 1. Instalar dependências

```bash
cd backend
npm install
```

### 2. Subir infraestrutura (PostgreSQL + Redis)

```bash
# Na pasta raiz do projeto
docker compose up -d
```

### 3. Configurar variáveis de ambiente

Certifique-se de que o arquivo `.env` existe na raiz do projeto (um nível acima):

```env
DATABASE_URL=postgresql://flowpay:flowpay_dev@localhost:5432/flowpay
REDIS_HOST=localhost
REDIS_PORT=6379
API_PORT=3000
```

### 4. Executar migrations do Prisma

```bash
npx prisma migrate dev
```

### 5. Popular banco de dados (Seed)

```bash
npx prisma db seed
```

Isso criará:
- 3 times (Cartões, Empréstimos, Outros)
- 9 atendentes (3 por time)

### 6. Iniciar servidor de desenvolvimento

```bash
npm run start:dev
```

O servidor estará disponível em:
- **API:** http://localhost:3000/api
- **Swagger Docs:** http://localhost:3000/api/docs
- **WebSocket:** ws://localhost:3000

## Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev               # Modo watch com hot-reload (alias)
npm run start:dev         # Modo watch com hot-reload
npm run start:debug       # Modo debug

# Build e Produção
npm run build             # Compilar TypeScript
npm run start:prod        # Executar versão compilada

# Testes
npm run test              # Executar testes unitários
npm run test:unit         # Testes unitários em test/unit
npm run test:integration  # Testes de integração (WebSocket/API)
npm run test:watch        # Testes em modo watch
npm run test:cov          # Testes com coverage
npm run test:e2e          # Testes end-to-end

# Qualidade de Código
npm run lint              # ESLint
npm run format            # Prettier

# Prisma
npm run prisma:generate   # Gerar Prisma Client
npm run prisma:migrate    # Executar migrations
npm run prisma:seed       # Popular banco de dados
npm run prisma:reset-local # Reset local + seed (desenvolvimento)
npm run prisma:studio     # Abrir Prisma Studio (GUI)
```

## Endpoints da API

### Teams
- `GET /api/teams` - Listar todos os times
- `GET /api/teams/:id` - Detalhes de um time

### Agents
- `GET /api/agents` - Listar todos os atendentes
- `GET /api/agents/:id` - Detalhes de um atendente
- `PATCH /api/agents/:id/status` - Alternar status online/offline

### Tickets
- `POST /api/tickets` - Criar novo ticket
- `GET /api/tickets` - Listar tickets (com filtros)
- `GET /api/tickets/:id` - Detalhes de um ticket
- `PATCH /api/tickets/:id/complete` - Finalizar atendimento

### Dashboard
- `GET /api/dashboard/stats` - Estatísticas gerais
- `GET /api/dashboard/teams` - Resumo por time

### Health
- `GET /api/health` - Health check da aplicação

## Eventos WebSocket

O servidor emite eventos em tempo real via Socket.IO:

- `ticket:created` - Novo ticket criado
- `ticket:assigned` - Ticket atribuído a atendente
- `ticket:completed` - Atendimento finalizado
- `queue:updated` - Atualização da fila
- `agent:status-changed` - Status do atendente alterado
- `dashboard:stats` - Estatísticas atualizadas

## Regras de Negócio

### Roteamento por Assunto
- **CARD_PROBLEM** → Time Cartões
- **LOAN_REQUEST** → Time Empréstimos
- **OTHER** → Time Outros Assuntos

### Limite de Atendimentos
- Cada atendente pode atender no máximo **3 clientes simultaneamente**
- Quando todos os atendentes do time estão com 3 tickets, novos entram na fila

### Sistema de Filas
- Filas organizadas por time (FIFO)
- Quando um atendente finaliza um ticket, o próximo da fila é automaticamente distribuído
- Filas gerenciadas pelo BullMQ com persistência no Redis

## Desenvolvimento

### Arquitetura NestJS

O projeto segue a arquitetura modular do NestJS:

- **Controllers:** Recebem requisições HTTP
- **Services:** Lógica de negócio
- **Providers:** Injeção de dependências
- **Modules:** Encapsulamento de funcionalidades

### Validação de DTOs

Todos os DTOs utilizam decorators do `class-validator`:

```typescript
import { IsString, IsEnum, IsNotEmpty } from 'class-validator';

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsEnum(TicketSubject)
  subject: TicketSubject;
}
```

### Swagger/OpenAPI

A API é totalmente documentada com Swagger. Use decorators para documentar:

```typescript
@ApiTags('tickets')
@ApiOperation({ summary: 'Criar novo ticket' })
@ApiResponse({ status: 201, description: 'Ticket criado com sucesso' })
export class TicketsController { }
```

## Testes

### Executar Testes

```bash
# Todos os testes
npm test

# Com coverage
npm run test:cov

# Modo watch
npm run test:watch
```

### Estrutura de Testes

- **Unit:** Testar serviços e lógica isoladamente
- **Integration:** Testar endpoints e fluxos completos
- **E2E:** Testar fluxos de usuário end-to-end

## Troubleshooting

### Erro ao conectar no PostgreSQL

Verifique se o Docker está rodando:
```bash
docker compose ps
```

### Erro ao gerar Prisma Client

Execute:
```bash
npx prisma generate
```

### Porta 3000 já em uso

Altere a porta no `.env`:
```env
API_PORT=3001
```

## Status da Implementação

### MILESTONE 1: ✅ CONCLUÍDO
- ✅ Setup básico do projeto
- ✅ Configuração do Prisma
- ✅ Docker Compose
- ✅ Estrutura de pastas

### MILESTONE 2: ✅ CONCLUÍDO
- ✅ Módulo Database (PrismaService)
- ✅ Módulo Teams (CRUD completo)
- ✅ Módulo Agents (CRUD completo)
- ✅ Módulo Tickets (CRUD completo)
- ✅ Swagger 100% documentado
- ✅ Validações implementadas

### MILESTONE 3: ⏳ PRÓXIMO
- [ ] Módulo Queue (BullMQ)
- [ ] Lógica de distribuição automática
- [ ] Sistema de filas FIFO
- [ ] Processamento de fila

## Arquivos de Documentação

- `MILESTONE-2-REPORT.md`: Relatório completo da implementação do MILESTONE 2
- `QUICK-TEST.md`: Guia rápido para testar a API
- `README.md`: Este arquivo

## Recursos Adicionais

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [BullMQ Documentation](https://docs.bullmq.io/)
- [Socket.IO Documentation](https://socket.io/docs/)

---

**Desenvolvido pela equipe FlowPay** | 2026
