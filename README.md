# FlowPay Support - Sistema de Distribuição de Atendimentos

<div align="center">

![FlowPay](https://img.shields.io/badge/FlowPay-Support-blue?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Produção%20Ready-success?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**Sistema full stack de distribuição inteligente e monitoramento em tempo real de atendimentos para fintech**

[Documentação](#documentação) • [Instalação](#instalação-rápida) • [API](#api-rest) • [Dashboard](#dashboard)

</div>

---

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Arquitetura](#arquitetura)
- [Stack Tecnológica](#stack-tecnológica)
- [Instalação Rápida](#instalação-rápida)
- [Configuração](#configuração)
- [Uso](#uso)
- [API REST](#api-rest)
- [Documentação Swagger](#documentação-swagger)
- [WebSocket](#websocket-tempo-real)
- [Dashboard](#dashboard)
- [Testes](#testes)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Regras de Negócio](#regras-de-negócio)
- [Contribuindo](#contribuindo)
- [Licença](#licença)

---

## 🎯 Sobre o Projeto

O **FlowPay Support** é um sistema completo para gerenciar e distribuir atendimentos de forma inteligente em uma fintech. O sistema automatiza a distribuição de tickets entre atendentes, respeitando limites de capacidade, gerenciando filas FIFO e fornecendo monitoramento em tempo real através de um dashboard interativo.

### Problema Resolvido

A FlowPay precisa distribuir solicitações de clientes entre 3 times especializados (Cartões, Empréstimos, Outros Assuntos), garantindo:
- ✅ Distribuição automática baseada no assunto
- ✅ Balanceamento de carga entre atendentes
- ✅ Respeito ao limite de 3 atendimentos simultâneos por atendente
- ✅ Fila de espera FIFO quando todos estão ocupados
- ✅ Monitoramento em tempo real

---

## ⚡ Funcionalidades

### 🎫 Gerenciamento de Tickets
- Criação automática de tickets com roteamento inteligente
- Distribuição automática para atendentes disponíveis
- Enfileiramento FIFO quando todos estão ocupados
- Finalização de tickets com liberação automática de agente
- Processamento automático da fila

### 👥 Gerenciamento de Atendentes
- Controle de status online/offline
- Limite configurável de atendimentos simultâneos (padrão: 3)
- Balanceamento de carga (sempre atribui ao atendente com menor carga)
- Organização por times especializados

### 📊 Dashboard em Tempo Real
- Estatísticas gerais (total, em atendimento, na fila, finalizados)
- Overview por time (capacidade, fila, atendentes disponíveis)
- Gráfico de evolução das filas
- Lista de atendentes com carga atual
- Tabela de tickets recentes
- Atualização via WebSocket (sem refresh)

### 🔔 Notificações em Tempo Real
- `ticket:created` - Novo ticket criado
- `ticket:assigned` - Ticket atribuído a atendente
- `ticket:completed` - Ticket finalizado
- `queue:updated` - Fila atualizada
- `agent:status-changed` - Status do atendente alterado
- `dashboard:stats` - Estatísticas atualizadas

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                       │
│  • Dashboard Interativo                                     │
│  • WebSocket Client (Socket.IO)                             │
│  • React Query (Cache + Refetch)                            │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          │ HTTP/WS
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                     BACKEND (NestJS)                        │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │   API REST     │  │   WebSocket    │  │  BullMQ      │  │
│  │   (Swagger)    │  │   Gateway      │  │  Queues      │  │
│  └────────────────┘  └────────────────┘  └──────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Queue Service (Distribuição)                │  │
│  │   • Roteamento por assunto                            │  │
│  │   • Balanceamento de carga                            │  │
│  │   • Fila FIFO                                         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          │ Prisma ORM
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                  INFRAESTRUTURA                             │
│  ┌────────────────┐              ┌────────────────┐         │
│  │  PostgreSQL    │              │     Redis      │         │
│  │  (Dados)       │              │  (Filas)       │         │
│  └────────────────┘              └────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Fluxo de Distribuição

```
1. Cliente solicita atendimento (POST /api/tickets)
   ↓
2. Sistema identifica assunto → determina time correto
   ↓
3. Busca atendente disponível (isOnline=true AND tickets<3)
   ↓
4. ┌─ Atendente disponível? ───┐
   │ SIM                   │ NÃO
   ↓                       ↓
5. Atribui ao atendente    Enfileira (BullMQ)
   com menor carga         Status: WAITING
   Status: IN_PROGRESS     ↓
   ↓                       └─→ Aguarda liberação
6. Emite eventos WebSocket
   (ticket:assigned)       └─→ Quando agente finaliza:
   ↓                            processa fila (FIFO)
7. Dashboard atualiza
   em tempo real
```

---

## 🛠️ Stack Tecnológica

### Backend
| Tecnologia | Versão | Uso |
|-----------|---------|-----|
| **Node.js** | 20 LTS | Runtime JavaScript |
| **NestJS** | 10.3.0 | Framework enterprise-ready |
| **TypeScript** | 5.3.3 | Type safety |
| **PostgreSQL** | 16 | Banco de dados relacional |
| **Prisma** | 5.8.1 | ORM type-safe |
| **Socket.IO** | 4.6.1 | WebSocket bidireacional |
| **BullMQ** | 5.1.0 | Sistema de filas com Redis |
| **Redis** | 7 | Cache e filas |
| **Swagger** | 7.1.17 | Documentação automática |
| **Jest** | 29.7.0 | Testes unitários |

### Frontend
| Tecnologia | Versão | Uso |
|-----------|---------|-----|
| **React** | 18.2.0 | UI Library |
| **TypeScript** | 5.3.3 | Type safety |
| **Vite** | 5.1.0 | Build tool |
| **Tailwind CSS** | 3.4.1 | Utility-first CSS |
| **PrimeReact** | 10.5.1 | Componentes UI |
| **Recharts** | 2.12.0 | Gráficos |
| **Socket.IO Client** | 4.6.1 | WebSocket |
| **React Query** | 5.20.0 | Data fetching |
| **Axios** | 1.6.7 | HTTP client |

### DevOps
| Tecnologia | Uso |
|-----------|-----|
| **Docker** | Containerização |
| **Docker Compose** | Orquestração local |
| **ESLint** | Linting |
| **Prettier** | Formatação |

---

## 🚀 Instalação Rápida

### Pré-requisitos

- **Node.js** >= 20 LTS ([Download](https://nodejs.org/))
- **Docker** e **Docker Compose** ([Download](https://www.docker.com/))
- **Git** ([Download](https://git-scm.com/))

### Passo a Passo

```bash
# 1. Clone o repositório
git clone <repository-url>
cd flowpay-support

# 2. Suba a infraestrutura (PostgreSQL + Redis)
docker compose up -d

# 3. Configure o backend
cd backend
npm install
npx prisma migrate dev --name init
npx prisma db seed

# 4. Configure o frontend
cd ../frontend
npm install

# 5. Inicie o projeto
# Terminal 1 (Backend)
cd backend
npm run start:dev

# Terminal 2 (Frontend)
cd frontend
npm run dev
```

### Acessos

- **Dashboard**: http://localhost:5173
- **API**: http://localhost:3000/api
- **Swagger**: http://localhost:3000/api/docs
- **Prisma Studio**: `npx prisma studio`

---

## ⚙️ Configuração

### Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env` na raiz do projeto:

```env
# Database
DATABASE_URL=postgresql://flowpay:flowpay_dev@localhost:5432/flowpay

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# API
API_PORT=3000
API_URL=http://localhost:3000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:5173

# Frontend
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000
```

### Banco de Dados

O seed popula automaticamente:
- **3 times**: Cartões, Empréstimos, Outros Assuntos
- **9 atendentes**: 3 por time
- **Emails**: formato `nome.sobrenome@flowpay.com`

**Atendentes criados:**
- **Time Cartões**: Ana Souza, Carlos Lima, Beatriz Rocha
- **Time Empréstimos**: Diego Alves, Fernanda Costa, Gabriel Santos
- **Time Outros**: Helena Dias, Igor Mendes, Julia Ferreira

---

## 📖 Uso

### Criar Ticket

**Via API:**
```bash
curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "João Silva",
    "subject": "CARD_PROBLEM"
  }'
```

**Via Swagger:**
1. Acesse http://localhost:3000/api/docs
2. Expanda `POST /api/tickets`
3. Clique em "Try it out"
4. Preencha o JSON
5. Clique em "Execute"

### Completar Ticket

```bash
curl -X PATCH http://localhost:3000/api/tickets/{ticket-id}/complete
```

### Alterar Status do Atendente

```bash
curl -X PATCH http://localhost:3000/api/agents/{agent-id}/status \
  -H "Content-Type: application/json" \
  -d '{"isOnline": false}'
```

---

## 🌐 API REST

### Base URL
```
http://localhost:3000/api
```

### Endpoints Disponíveis

#### Teams

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/teams` | Lista todos os times |
| `GET` | `/teams/:id` | Busca time por ID |

#### Agents

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/agents` | Lista todos os atendentes |
| `GET` | `/agents/:id` | Busca atendente por ID |
| `PATCH` | `/agents/:id/status` | Atualiza status online/offline |

**Body PATCH /agents/:id/status:**
```json
{
  "isOnline": true
}
```

#### Tickets

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/tickets` | Cria ticket (distribui automaticamente) |
| `GET` | `/tickets` | Lista tickets (com filtros) |
| `GET` | `/tickets/:id` | Busca ticket por ID |
| `PATCH` | `/tickets/:id/complete` | Finaliza ticket (processa fila) |

**Body POST /tickets:**
```json
{
  "customerName": "Maria Santos",
  "subject": "LOAN_REQUEST"
}
```

**Query Params GET /tickets:**
- `status` (WAITING, IN_PROGRESS, COMPLETED)
- `subject` (CARD_PROBLEM, LOAN_REQUEST, OTHER)
- `agentId` (UUID)
- `limit` (padrão: 50)
- `offset` (padrão: 0)

#### Dashboard

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/dashboard/stats` | Estatísticas gerais |
| `GET` | `/dashboard/teams` | Resumo por time |

---

## 📚 Documentação Swagger

A documentação interativa completa da API está disponível em:

### 🔗 http://localhost:3000/api/docs

### Recursos do Swagger

- ✅ Todos os endpoints documentados
- ✅ Schemas de request/response
- ✅ Exemplos de uso
- ✅ Testes interativos ("Try it out")
- ✅ Códigos de status HTTP
- ✅ Validações de DTOs

### Tags Organizadas

- **teams** - Gerenciamento de times
- **agents** - Gerenciamento de atendentes
- **tickets** - Gerenciamento de tickets
- **dashboard** - Estatísticas e resumos

---

## 🔌 WebSocket (Tempo Real)

### Conexão

```typescript
import io from 'socket.io-client';

const socket = io('http://localhost:3000/ws', {
  transports: ['websocket'],
  reconnection: true,
});

socket.on('connect', () => {
  console.log('Conectado ao WebSocket');
});
```

### Eventos Disponíveis

#### 1. ticket:created
**Quando:** Novo ticket criado
**Payload:**
```typescript
{
  ticket: TicketResponseDto,
  queuePosition?: number
}
```

#### 2. ticket:assigned
**Quando:** Ticket atribuído a atendente
**Payload:**
```typescript
{
  ticket: TicketResponseDto,
  agent: AgentResponseDto
}
```

#### 3. ticket:completed
**Quando:** Ticket finalizado
**Payload:**
```typescript
{
  ticket: TicketResponseDto,
  agent: AgentResponseDto
}
```

#### 4. queue:updated
**Quando:** Fila atualizada
**Payload:**
```typescript
{
  teamType: 'CARDS' | 'LOANS' | 'OTHER',
  queueSize: number
}
```

#### 5. agent:status-changed
**Quando:** Status do atendente mudou
**Payload:**
```typescript
{
  agent: AgentResponseDto,
  activeCount: number
}
```

#### 6. dashboard:stats
**Quando:** Estatísticas atualizadas
**Payload:**
```typescript
{
  totalTickets: number,
  inProgress: number,
  inQueue: number,
  completed: number,
  avgWaitTime: number
}
```

### Escutando Eventos

```typescript
socket.on('ticket:created', (data) => {
  console.log('Novo ticket:', data.ticket);
});

socket.on('ticket:assigned', (data) => {
  console.log(`Ticket ${data.ticket.id} atribuído para ${data.agent.name}`);
});

socket.on('queue:updated', (data) => {
  console.log(`Fila ${data.teamType}: ${data.queueSize} tickets`);
});
```

---

## 📊 Dashboard

### Acesso

🔗 **http://localhost:5173**

### Componentes

#### 1. Stats Cards
4 cards mostrando estatísticas principais:
- **Total de Tickets**
- **Em Atendimento** (status IN_PROGRESS)
- **Na Fila** (status WAITING)
- **Finalizados** (status COMPLETED)

#### 2. Team Overview
3 cards (um por time) mostrando:
- Nome do time
- Atendentes disponíveis / total
- Tickets em atendimento
- Tamanho da fila
- Barra de capacidade

#### 3. Queue Chart
Gráfico de linha com evolução da fila ao longo do tempo:
- 3 séries (uma por time)
- Últimos 20 pontos de dados
- Atualização em tempo real

#### 4. Agent Workload
Lista de atendentes mostrando:
- Nome e email
- Status online/offline
- Barra de progresso (0/3, 1/3, 2/3, 3/3)
- Time associado

#### 5. Recent Tickets
Tabela com últimos 10 tickets:
- Cliente
- Assunto
- Status (badge colorido)
- Atendente
- Tempo decorrido

#### 6. Real Time Indicator
Indicador visual de conexão WebSocket:
- 🟢 Conectado
- 🔴 Desconectado

### Layout Responsivo

#### Desktop (≥1024px)
```
┌────────────────────────────────────────┐
│ Header (Logo + Indicador WS)           │
├────────────────────────────────────────┤
│ [Card1] [Card2] [Card3] [Card4]        │ Stats
├────────────────────────────────────────┤
│ [Time Cartões] [Time Empr] [Time Out] │ Teams
├────────────────────────────────────────┤
│ [Queue Chart]  | [Agent Workload]      │ Charts
├────────────────────────────────────────┤
│ [Recent Tickets Table]                 │ Tickets
└────────────────────────────────────────┘
```

#### Mobile (<768px)
```
┌────────────────┐
│ Header         │
├────────────────┤
│ [Card1]        │
│ [Card2]        │
│ [Card3]        │
│ [Card4]        │
├────────────────┤
│ [Time Cartões] │
│ [Time Empr]    │
│ [Time Out]     │
├────────────────┤
│ [Queue Chart]  │
├────────────────┤
│ [Agent Work]   │
├────────────────┤
│ [Tickets]      │
└────────────────┘
```

---

## 🧪 Testes

### Backend

#### Testes Unitários
```bash
cd backend
npm test
```

**Cobertura:**
- QueueService (14 testes)
- Regras de negócio (roteamento, distribuição, FIFO)

#### Testes de Integração
```bash
npm test -- --config test/jest-integration.json
```

**Cobertura:**
- WebSocket (8 testes)
- Endpoints REST
- Fluxos completos

### Frontend

```bash
cd frontend
npm run lint        # ESLint
npm run type-check  # TypeScript
```

---

## 📁 Estrutura do Projeto

```
flowpay-support/
├── backend/
│   ├── src/
│   │   ├── main.ts                    # Bootstrap da aplicação
│   │   ├── app.module.ts              # Módulo raiz
│   │   ├── database/                  # Prisma Service
│   │   │   ├── database.module.ts
│   │   │   └── prisma.service.ts
│   │   ├── modules/
│   │   │   ├── teams/                 # CRUD Times
│   │   │   │   ├── teams.controller.ts
│   │   │   │   ├── teams.service.ts
│   │   │   │   └── dto/
│   │   │   ├── agents/                # CRUD Atendentes
│   │   │   │   ├── agents.controller.ts
│   │   │   │   ├── agents.service.ts
│   │   │   │   └── dto/
│   │   │   ├── tickets/               # CRUD Tickets + WebSocket
│   │   │   │   ├── tickets.controller.ts
│   │   │   │   ├── tickets.service.ts
│   │   │   │   ├── tickets.gateway.ts
│   │   │   │   └── dto/
│   │   │   ├── queue/                 # Sistema de Filas
│   │   │   │   ├── queue.module.ts
│   │   │   │   ├── queue.service.ts   # ← CORE BUSINESS LOGIC
│   │   │   │   └── queue.processor.ts
│   │   │   └── dashboard/             # Agregações
│   │   │       ├── dashboard.controller.ts
│   │   │       ├── dashboard.service.ts
│   │   │       └── dto/
│   │   └── common/                    # Shared
│   ├── prisma/
│   │   ├── schema.prisma              # Modelagem de dados
│   │   └── seed.ts                    # Seed inicial
│   ├── test/
│   │   ├── unit/                      # Testes unitários
│   │   └── integration/               # Testes E2E
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx                   # Entry point
│   │   ├── App.tsx                    # App principal
│   │   ├── components/
│   │   │   ├── ui/                    # Componentes base
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Badge.tsx
│   │   │   │   └── Skeleton.tsx
│   │   │   ├── layout/                # Layout
│   │   │   │   ├── Header.tsx
│   │   │   │   └── PageContainer.tsx
│   │   │   └── dashboard/             # Dashboard
│   │   │       ├── StatsCards.tsx
│   │   │       ├── TeamOverview.tsx
│   │   │       ├── QueueChart.tsx
│   │   │       ├── AgentWorkload.tsx
│   │   │       ├── RecentTickets.tsx
│   │   │       └── RealTimeIndicator.tsx
│   │   ├── hooks/
│   │   │   ├── useSocket.ts           # Hook WebSocket
│   │   │   └── useDashboard.ts        # Hook principal
│   │   ├── services/
│   │   │   └── api.service.ts         # API client
│   │   ├── lib/
│   │   │   ├── socket.ts              # Socket.IO config
│   │   │   └── axios.ts               # Axios config
│   │   └── types/
│   │       └── index.ts               # TypeScript types
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── README.md
│
├── docker-compose.yml                 # PostgreSQL + Redis
├── .env.example
├── PRD.md                             # Product Requirements
└── README.md                          # ← ESTE ARQUIVO
```

---

## 📜 Regras de Negócio

### 1. Roteamento Automático

| Assunto do Ticket | Time Designado |
|-------------------|----------------|
| `CARD_PROBLEM` | Time Cartões |
| `LOAN_REQUEST` | Time Empréstimos |
| `OTHER` | Time Outros Assuntos |

### 2. Limite de Atendimentos Simultâneos

- Cada atendente pode atender **no máximo 3 clientes simultaneamente**
- Configurável via campo `maxConcurrent` no banco de dados
- Default: 3 tickets

### 3. Balanceamento de Carga

Quando há múltiplos atendentes disponíveis:
1. Filtra apenas atendentes **online** (`isOnline = true`)
2. Filtra apenas atendentes com **menos de 3 tickets ativos**
3. **Seleciona o atendente com MENOR carga** (menos tickets ativos)
4. Em caso de empate, seleciona o primeiro encontrado

### 4. Fila FIFO (First In, First Out)

Quando todos os atendentes estão ocupados:
1. Ticket entra na **fila de espera**
2. Recebe `queuePosition` (posição na fila)
3. Status muda para `WAITING`
4. Quando um atendente finaliza um ticket:
   - Sistema **automaticamente** processa a fila
   - **Primeiro ticket da fila** (mais antigo por `createdAt`) é distribuído
   - Posições são recalculadas

### 5. Processamento Automático

Ao finalizar um ticket (`PATCH /tickets/:id/complete`):
1. Ticket marcado como `COMPLETED`
2. `completedAt` e `completedById` preenchidos
3. Agente libera 1 slot (pode receber novo ticket)
4. Sistema **automaticamente** processa a fila do time
5. **Loop**: enquanto houver agentes disponíveis E tickets na fila
   - Distribui próximo ticket da fila
   - Continua até que não haja mais agentes disponíveis OU fila vazia

### 6. Estados de Ticket

```
WAITING      → Aguardando distribuição ou na fila
IN_PROGRESS  → Em atendimento
COMPLETED    → Finalizado
```

### 7. BullMQ - Sistema de Filas

3 filas separadas (uma por time):
- `cards-queue` → Fila do Time Cartões
- `loans-queue` → Fila do Time Empréstimos
- `other-queue` → Fila do Time Outros Assuntos

**Benefícios:**
- ✅ Persistência (Redis)
- ✅ Retry automático
- ✅ Jobs não são perdidos se servidor reiniciar
- ✅ Processamento assíncrono

---

## 🤝 Contribuindo

### Fluxo de Desenvolvimento

1. **Fork** o projeto
2. Crie uma **branch** para sua feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** suas mudanças (`git commit -m 'Add: amazing feature'`)
4. **Push** para a branch (`git push origin feature/AmazingFeature`)
5. Abra um **Pull Request**

### Padrões de Código

- **ESLint** + **Prettier** configurados
- **TypeScript** strict mode
- **Conventional Commits**
- **Testes** obrigatórios para novas features

### Executar Testes Antes de Commit

```bash
# Backend
cd backend
npm run lint
npm test

# Frontend
cd frontend
npm run lint
npm run type-check
```
