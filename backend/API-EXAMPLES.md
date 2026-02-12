# Exemplos de Uso da API - FlowPay Support

Este documento contém exemplos práticos de uso de todos os endpoints da API.

## Base URL
```
http://localhost:3000/api
```

---

## 1. Teams (Times)

### 1.1 Listar todos os times

**Request:**
```http
GET /api/teams
```

**Response (200 OK):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Time Cartões",
    "type": "CARDS",
    "agentsCount": 3,
    "activeTicketsCount": 5,
    "queueSize": 0,
    "createdAt": "2026-02-11T10:00:00.000Z",
    "updatedAt": "2026-02-11T10:00:00.000Z"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "name": "Time Empréstimos",
    "type": "LOANS",
    "agentsCount": 3,
    "activeTicketsCount": 3,
    "queueSize": 0,
    "createdAt": "2026-02-11T10:00:00.000Z",
    "updatedAt": "2026-02-11T10:00:00.000Z"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "name": "Time Outros Assuntos",
    "type": "OTHER",
    "agentsCount": 3,
    "activeTicketsCount": 1,
    "queueSize": 0,
    "createdAt": "2026-02-11T10:00:00.000Z",
    "updatedAt": "2026-02-11T10:00:00.000Z"
  }
]
```

**cURL:**
```bash
curl http://localhost:3000/api/teams
```

---

### 1.2 Buscar time por ID

**Request:**
```http
GET /api/teams/550e8400-e29b-41d4-a716-446655440001
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Time Cartões",
  "type": "CARDS",
  "agentsCount": 3,
  "activeTicketsCount": 5,
  "queueSize": 0,
  "createdAt": "2026-02-11T10:00:00.000Z",
  "updatedAt": "2026-02-11T10:00:00.000Z"
}
```

**Response (404 Not Found):**
```json
{
  "statusCode": 404,
  "message": "Time com ID 00000000-0000-0000-0000-000000000000 não encontrado",
  "error": "Not Found"
}
```

**cURL:**
```bash
curl http://localhost:3000/api/teams/550e8400-e29b-41d4-a716-446655440001
```

---

## 2. Agents (Agentes)

### 2.1 Listar todos os agentes

**Request:**
```http
GET /api/agents
```

**Response (200 OK):**
```json
[
  {
    "id": "650e8400-e29b-41d4-a716-446655440001",
    "name": "João Silva",
    "email": "joao.silva@flowpay.com",
    "teamId": "550e8400-e29b-41d4-a716-446655440001",
    "team": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Time Cartões",
      "type": "CARDS"
    },
    "maxConcurrent": 3,
    "activeTicketsCount": 2,
    "isOnline": true,
    "createdAt": "2026-02-11T10:00:00.000Z",
    "updatedAt": "2026-02-11T10:00:00.000Z"
  },
  {
    "id": "650e8400-e29b-41d4-a716-446655440002",
    "name": "Maria Santos",
    "email": "maria.santos@flowpay.com",
    "teamId": "550e8400-e29b-41d4-a716-446655440001",
    "team": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Time Cartões",
      "type": "CARDS"
    },
    "maxConcurrent": 3,
    "activeTicketsCount": 3,
    "isOnline": true,
    "createdAt": "2026-02-11T10:00:00.000Z",
    "updatedAt": "2026-02-11T10:00:00.000Z"
  }
]
```

**cURL:**
```bash
curl http://localhost:3000/api/agents
```

---

### 2.2 Buscar agente por ID

**Request:**
```http
GET /api/agents/650e8400-e29b-41d4-a716-446655440001
```

**Response (200 OK):**
```json
{
  "id": "650e8400-e29b-41d4-a716-446655440001",
  "name": "João Silva",
  "email": "joao.silva@flowpay.com",
  "teamId": "550e8400-e29b-41d4-a716-446655440001",
  "team": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Time Cartões",
    "type": "CARDS"
  },
  "maxConcurrent": 3,
  "activeTicketsCount": 2,
  "isOnline": true,
  "createdAt": "2026-02-11T10:00:00.000Z",
  "updatedAt": "2026-02-11T10:00:00.000Z"
}
```

**cURL:**
```bash
curl http://localhost:3000/api/agents/650e8400-e29b-41d4-a716-446655440001
```

---

### 2.3 Atualizar status do agente

**Request:**
```http
PATCH /api/agents/650e8400-e29b-41d4-a716-446655440001/status
Content-Type: application/json

{
  "isOnline": false
}
```

**Response (200 OK):**
```json
{
  "id": "650e8400-e29b-41d4-a716-446655440001",
  "name": "João Silva",
  "email": "joao.silva@flowpay.com",
  "teamId": "550e8400-e29b-41d4-a716-446655440001",
  "team": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Time Cartões",
    "type": "CARDS"
  },
  "maxConcurrent": 3,
  "activeTicketsCount": 2,
  "isOnline": false,
  "createdAt": "2026-02-11T10:00:00.000Z",
  "updatedAt": "2026-02-11T10:30:00.000Z"
}
```

**Response (400 Bad Request) - Validação:**
```json
{
  "statusCode": 400,
  "message": [
    "isOnline deve ser um valor booleano"
  ],
  "error": "Bad Request"
}
```

**cURL - Colocar offline:**
```bash
curl -X PATCH http://localhost:3000/api/agents/650e8400-e29b-41d4-a716-446655440001/status \
  -H "Content-Type: application/json" \
  -d '{"isOnline":false}'
```

**cURL - Colocar online:**
```bash
curl -X PATCH http://localhost:3000/api/agents/650e8400-e29b-41d4-a716-446655440001/status \
  -H "Content-Type: application/json" \
  -d '{"isOnline":true}'
```

---

## 3. Tickets

### 3.1 Criar novo ticket

**Request:**
```http
POST /api/tickets
Content-Type: application/json

{
  "customerName": "Carlos Pereira",
  "subject": "CARD_PROBLEM"
}
```

**Response (201 Created):**
```json
{
  "id": "750e8400-e29b-41d4-a716-446655440001",
  "customerName": "Carlos Pereira",
  "subject": "CARD_PROBLEM",
  "status": "IN_PROGRESS",
  "agentId": "650e8400-e29b-41d4-a716-446655440001",
  "agent": {
    "id": "650e8400-e29b-41d4-a716-446655440001",
    "name": "João Silva"
  },
  "queuePosition": null,
  "startedAt": "2026-02-11T10:30:01.000Z",
  "completedAt": null,
  "createdAt": "2026-02-11T10:30:00.000Z",
  "updatedAt": "2026-02-11T10:30:00.000Z"
}
```

> Observação: ao criar um ticket, o sistema tenta atribuir imediatamente a um agente disponível.  
> Se o time estiver lotado, o retorno virá com `status: WAITING`, `agent: null` e `queuePosition` preenchido.

**Response (400 Bad Request) - Validação:**
```json
{
  "statusCode": 400,
  "message": [
    "Nome do cliente é obrigatório",
    "Nome do cliente deve ser uma string",
    "Nome do cliente deve ter pelo menos 3 caracteres",
    "Assunto é obrigatório",
    "Assunto deve ser um dos valores: CARD_PROBLEM, LOAN_REQUEST, OTHER"
  ],
  "error": "Bad Request"
}
```

**cURL - Problema com Cartão:**
```bash
curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{"customerName":"Carlos Pereira","subject":"CARD_PROBLEM"}'
```

**cURL - Empréstimo:**
```bash
curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{"customerName":"Ana Costa","subject":"LOAN_REQUEST"}'
```

**cURL - Outros:**
```bash
curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{"customerName":"Pedro Lima","subject":"OTHER"}'
```

---

### 3.2 Listar tickets

**Request (sem filtros):**
```http
GET /api/tickets
```

**Request (com filtros):**
```http
GET /api/tickets?status=WAITING&limit=10&offset=0
```

**Response (200 OK):**
```json
[
  {
    "id": "750e8400-e29b-41d4-a716-446655440001",
    "customerName": "Carlos Pereira",
    "subject": "CARD_PROBLEM",
    "status": "WAITING",
    "agentId": null,
    "agent": null,
    "queuePosition": null,
    "startedAt": null,
    "completedAt": null,
    "createdAt": "2026-02-11T10:30:00.000Z",
    "updatedAt": "2026-02-11T10:30:00.000Z"
  },
  {
    "id": "750e8400-e29b-41d4-a716-446655440002",
    "customerName": "Ana Costa",
    "subject": "LOAN_REQUEST",
    "status": "IN_PROGRESS",
    "agentId": "650e8400-e29b-41d4-a716-446655440004",
    "agent": {
      "id": "650e8400-e29b-41d4-a716-446655440004",
      "name": "Fernanda Alves"
    },
    "queuePosition": null,
    "startedAt": "2026-02-11T10:25:00.000Z",
    "completedAt": null,
    "createdAt": "2026-02-11T10:20:00.000Z",
    "updatedAt": "2026-02-11T10:25:00.000Z"
  }
]
```

**Query Parameters:**
- `status`: WAITING, IN_PROGRESS, COMPLETED
- `subject`: CARD_PROBLEM, LOAN_REQUEST, OTHER
- `agentId`: UUID do agente
- `limit`: Número (padrão: 50)
- `offset`: Número (padrão: 0)

**cURL - Listar todos:**
```bash
curl http://localhost:3000/api/tickets
```

**cURL - Filtrar por status:**
```bash
curl "http://localhost:3000/api/tickets?status=WAITING"
```

**cURL - Filtrar por assunto:**
```bash
curl "http://localhost:3000/api/tickets?subject=CARD_PROBLEM"
```

**cURL - Filtrar por agente:**
```bash
curl "http://localhost:3000/api/tickets?agentId=650e8400-e29b-41d4-a716-446655440001"
```

**cURL - Com paginação:**
```bash
curl "http://localhost:3000/api/tickets?limit=5&offset=10"
```

**cURL - Múltiplos filtros:**
```bash
curl "http://localhost:3000/api/tickets?status=IN_PROGRESS&subject=CARD_PROBLEM&limit=20"
```

---

### 3.3 Buscar ticket por ID

**Request:**
```http
GET /api/tickets/750e8400-e29b-41d4-a716-446655440001
```

**Response (200 OK):**
```json
{
  "id": "750e8400-e29b-41d4-a716-446655440001",
  "customerName": "Carlos Pereira",
  "subject": "CARD_PROBLEM",
  "status": "WAITING",
  "agentId": null,
  "agent": null,
  "queuePosition": null,
  "startedAt": null,
  "completedAt": null,
  "createdAt": "2026-02-11T10:30:00.000Z",
  "updatedAt": "2026-02-11T10:30:00.000Z"
}
```

**cURL:**
```bash
curl http://localhost:3000/api/tickets/750e8400-e29b-41d4-a716-446655440001
```

---

### 3.4 Completar ticket

**Request:**
```http
PATCH /api/tickets/750e8400-e29b-41d4-a716-446655440001/complete
```

**Response (200 OK):**
```json
{
  "id": "750e8400-e29b-41d4-a716-446655440001",
  "customerName": "Carlos Pereira",
  "subject": "CARD_PROBLEM",
  "status": "COMPLETED",
  "agentId": "650e8400-e29b-41d4-a716-446655440001",
  "agent": {
    "id": "650e8400-e29b-41d4-a716-446655440001",
    "name": "João Silva"
  },
  "queuePosition": null,
  "startedAt": "2026-02-11T10:30:01.000Z",
  "completedAt": "2026-02-11T10:45:00.000Z",
  "createdAt": "2026-02-11T10:30:00.000Z",
  "updatedAt": "2026-02-11T10:45:00.000Z"
}
```

**cURL:**
```bash
curl -X PATCH http://localhost:3000/api/tickets/750e8400-e29b-41d4-a716-446655440001/complete
```

---

## 4. Dashboard e Health

### 4.1 Estatísticas gerais

```http
GET /api/dashboard/stats
```

**Response (200 OK):**
```json
{
  "totalTickets": 13,
  "inProgress": 11,
  "inQueue": 1,
  "completed": 1,
  "avgWaitTime": 0
}
```

### 4.2 Resumo por times

```http
GET /api/dashboard/teams
```

**Response (200 OK):**
```json
[
  {
    "teamId": "613a2db0-ba96-41a3-895d-76a3b1ada05e",
    "teamName": "Time Cartões",
    "teamType": "CARDS",
    "activeTickets": 9,
    "queueSize": 1,
    "availableAgents": 0,
    "totalAgents": 3
  }
]
```

### 4.3 Health check

```http
GET /api/health
```

**Response (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2026-02-12T20:00:00.000Z"
}
```

---
## 5. Cenários de Uso Completos

### Cenário 1: Criar ticket e verificar status

```bash
# 1. Criar ticket
TICKET_ID=$(curl -s -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{"customerName":"João Silva","subject":"CARD_PROBLEM"}' \
  | jq -r '.id')

echo "Ticket criado: $TICKET_ID"

# 2. Buscar ticket criado
curl http://localhost:3000/api/tickets/$TICKET_ID | jq

# 3. Listar tickets em espera
curl "http://localhost:3000/api/tickets?status=WAITING" | jq
```

### Cenário 2: Verificar times e agentes disponíveis

```bash
# 1. Listar todos os times
curl http://localhost:3000/api/teams | jq

# 2. Pegar ID do Time Cartões
TEAM_ID=$(curl -s http://localhost:3000/api/teams | jq -r '.[0].id')

# 3. Buscar detalhes do time
curl http://localhost:3000/api/teams/$TEAM_ID | jq

# 4. Listar agentes
curl http://localhost:3000/api/agents | jq

# 5. Filtrar agentes online
curl http://localhost:3000/api/agents | jq '[.[] | select(.isOnline == true)]'
```

### Cenário 3: Alternar status de agente

```bash
# 1. Pegar ID do primeiro agente
AGENT_ID=$(curl -s http://localhost:3000/api/agents | jq -r '.[0].id')

echo "Agent ID: $AGENT_ID"

# 2. Colocar offline
curl -X PATCH http://localhost:3000/api/agents/$AGENT_ID/status \
  -H "Content-Type: application/json" \
  -d '{"isOnline":false}' | jq

# 3. Verificar status
curl http://localhost:3000/api/agents/$AGENT_ID | jq '.isOnline'

# 4. Colocar online novamente
curl -X PATCH http://localhost:3000/api/agents/$AGENT_ID/status \
  -H "Content-Type: application/json" \
  -d '{"isOnline":true}' | jq
```

### Cenário 4: Criar múltiplos tickets

```bash
# Criar 3 tickets de diferentes tipos
for subject in CARD_PROBLEM LOAN_REQUEST OTHER; do
  curl -X POST http://localhost:3000/api/tickets \
    -H "Content-Type: application/json" \
    -d "{\"customerName\":\"Cliente $subject\",\"subject\":\"$subject\"}" \
    | jq
  echo "---"
done

# Verificar total de tickets
curl http://localhost:3000/api/tickets | jq 'length'
```

---

## 6. Casos de Erro

### Erro 1: Nome do cliente muito curto

```bash
curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{"customerName":"Jo","subject":"CARD_PROBLEM"}'

# Response:
# {
#   "statusCode": 400,
#   "message": ["Nome do cliente deve ter pelo menos 3 caracteres"],
#   "error": "Bad Request"
# }
```

### Erro 2: Assunto inválido

```bash
curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{"customerName":"João Silva","subject":"INVALID"}'

# Response:
# {
#   "statusCode": 400,
#   "message": ["Assunto deve ser um dos valores: CARD_PROBLEM, LOAN_REQUEST, OTHER"],
#   "error": "Bad Request"
# }
```

### Erro 3: Status não é booleano

```bash
curl -X PATCH http://localhost:3000/api/agents/650e8400-e29b-41d4-a716-446655440001/status \
  -H "Content-Type: application/json" \
  -d '{"isOnline":"true"}'

# Response:
# {
#   "statusCode": 400,
#   "message": ["isOnline deve ser um valor booleano"],
#   "error": "Bad Request"
# }
```

### Erro 4: Recurso não encontrado

```bash
curl http://localhost:3000/api/teams/00000000-0000-0000-0000-000000000000

# Response:
# {
#   "statusCode": 404,
#   "message": "Time com ID 00000000-0000-0000-0000-000000000000 não encontrado",
#   "error": "Not Found"
# }
```

---

## 7. Testes com Postman

### Importar Collection

Crie um arquivo `flowpay-support.postman_collection.json`:

```json
{
  "info": {
    "name": "FlowPay Support API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000/api"
    }
  ],
  "item": [
    {
      "name": "Teams",
      "item": [
        {
          "name": "List Teams",
          "request": {
            "method": "GET",
            "url": "{{baseUrl}}/teams"
          }
        },
        {
          "name": "Get Team",
          "request": {
            "method": "GET",
            "url": "{{baseUrl}}/teams/:id"
          }
        }
      ]
    },
    {
      "name": "Agents",
      "item": [
        {
          "name": "List Agents",
          "request": {
            "method": "GET",
            "url": "{{baseUrl}}/agents"
          }
        },
        {
          "name": "Get Agent",
          "request": {
            "method": "GET",
            "url": "{{baseUrl}}/agents/:id"
          }
        },
        {
          "name": "Update Agent Status",
          "request": {
            "method": "PATCH",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"isOnline\": false\n}"
            },
            "url": "{{baseUrl}}/agents/:id/status"
          }
        }
      ]
    },
    {
      "name": "Tickets",
      "item": [
        {
          "name": "Create Ticket",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"customerName\": \"João Silva\",\n  \"subject\": \"CARD_PROBLEM\"\n}"
            },
            "url": "{{baseUrl}}/tickets"
          }
        },
        {
          "name": "List Tickets",
          "request": {
            "method": "GET",
            "url": "{{baseUrl}}/tickets"
          }
        },
        {
          "name": "Get Ticket",
          "request": {
            "method": "GET",
            "url": "{{baseUrl}}/tickets/:id"
          }
        }
      ]
    }
  ]
}
```

---

## 7. Testes com JavaScript (Fetch API)

```javascript
// Base URL
const API_URL = 'http://localhost:3000/api';

// Listar times
async function getTeams() {
  const response = await fetch(`${API_URL}/teams`);
  const teams = await response.json();
  console.log(teams);
  return teams;
}

// Criar ticket
async function createTicket(customerName, subject) {
  const response = await fetch(`${API_URL}/tickets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ customerName, subject }),
  });
  const ticket = await response.json();
  console.log(ticket);
  return ticket;
}

// Atualizar status do agente
async function updateAgentStatus(agentId, isOnline) {
  const response = await fetch(`${API_URL}/agents/${agentId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ isOnline }),
  });
  const agent = await response.json();
  console.log(agent);
  return agent;
}

// Uso:
getTeams();
createTicket('João Silva', 'CARD_PROBLEM');
updateAgentStatus('agent-id-aqui', false);
```

---
