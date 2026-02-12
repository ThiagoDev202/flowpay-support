# FlowPay Support - Quick Start Guide

## Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn
- Backend rodando em `localhost:3000`
- Docker Compose rodando (PostgreSQL + Redis)

---

## Instalação

```bash
cd /home/thiago-fernandes/Downloads/flowpay-support/frontend

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

O frontend estará disponível em: **http://localhost:5173**

---

## Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor Vite (localhost:5173)

# Build
npm run build            # Compila TypeScript e gera build de produção
npm run preview          # Preview do build de produção

# Type checking
npm run type-check       # Verifica tipos TypeScript sem emitir arquivos

# Linting
npm run lint             # ESLint com regras TypeScript
```

---

## Estrutura de Arquivos

```
frontend/
├── public/              # Arquivos estáticos
├── src/
│   ├── components/
│   │   ├── ui/         # Componentes UI base (Button, Card, Badge, Skeleton)
│   │   ├── layout/     # Layout (Header, PageContainer)
│   │   └── dashboard/  # Componentes do dashboard
│   │
│   ├── hooks/
│   │   ├── useDashboard.ts  # Hook principal
│   │   └── useSocket.ts     # Hook WebSocket
│   │
│   ├── services/
│   │   └── api.service.ts   # Client HTTP (Axios)
│   │
│   ├── lib/
│   │   ├── axios.ts         # Configuração Axios
│   │   ├── socket.ts        # Configuração Socket.IO
│   │   └── utils.ts         # Funções auxiliares
│   │
│   ├── types/
│   │   └── index.ts         # Tipos TypeScript
│   │
│   ├── App.tsx              # App principal
│   ├── main.tsx             # Entry point
│   └── index.css            # Estilos globais
│
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── DASHBOARD_IMPLEMENTATION.md  # Documentação completa
```

---

## Verificação de Funcionamento

### 1. Backend deve estar rodando

```bash
# Em outro terminal
cd /home/thiago-fernandes/Downloads/flowpay-support/backend
npm run start:dev
```

Verifique em: http://localhost:3000/api/docs (Swagger)

### 2. Docker Compose deve estar ativo

```bash
cd /home/thiago-fernandes/Downloads/flowpay-support
docker-compose up -d
```

Verifique:
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

### 3. Frontend deve conectar ao WebSocket

Ao abrir http://localhost:5173, você deve ver:
- 🟢 **Conectado** no header (bolinha verde)
- Indicador de conexão no topo do dashboard

Se estiver 🔴 **Desconectado**, verifique se o backend está rodando.

---

## Teste Rápido

### 1. Criar um ticket via Swagger

1. Acesse http://localhost:3000/api/docs
2. POST /api/tickets
3. Body:
   ```json
   {
     "customerName": "João Silva",
     "subject": "CARD_PROBLEM"
   }
   ```

4. Execute

### 2. Verifique no Dashboard

Você deve ver:
- ✅ Novo ticket aparecer em "Tickets Recentes"
- ✅ "Total de Tickets" incrementar
- ✅ "Na Fila" incrementar (se não há agente disponível)
- ✅ "Em Atendimento" incrementar (se há agente disponível)
- ✅ Gráfico "Evolução da Fila" atualizar

### 3. Completar um ticket

1. Swagger: PATCH /api/tickets/{id}/complete
2. Execute

Você deve ver:
- ✅ Status mudar para "Finalizado" (verde)
- ✅ "Em Atendimento" decrementar
- ✅ "Finalizados" incrementar
- ✅ Barra do agente atualizar (carga menor)

---

## Troubleshooting

### Frontend não conecta ao backend

**Problema:** 🔴 Desconectado no header

**Solução:**
1. Verifique se backend está rodando: `curl http://localhost:3000/api/health`
2. Verifique CORS no backend (`main.ts`):
   ```typescript
   app.enableCors({
     origin: ['http://localhost:5173', 'http://localhost:3000'],
     credentials: true,
   })
   ```
3. Verifique WebSocket Gateway:
   ```typescript
   @WebSocketGateway({
     namespace: '/ws',
     cors: {
       origin: ['http://localhost:5173', 'http://localhost:3000'],
     },
   })
   ```

### Erro: "Cannot find module"

**Problema:** TypeScript não reconhece imports com aliases

**Solução:**
1. Verifique `tsconfig.json`:
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@/*": ["./src/*"],
         "@components/*": ["./src/components/*"],
         "@hooks/*": ["./src/hooks/*"],
         "@services/*": ["./src/services/*"],
         "@lib/*": ["./src/lib/*"],
         "@types/*": ["./src/types/*"]
       }
     }
   }
   ```

2. Verifique `vite.config.ts`:
   ```typescript
   resolve: {
     alias: {
       '@': path.resolve(__dirname, './src'),
       '@components': path.resolve(__dirname, './src/components'),
       '@hooks': path.resolve(__dirname, './src/hooks'),
       '@services': path.resolve(__dirname, './src/services'),
       '@lib': path.resolve(__dirname, './src/lib'),
       '@types': path.resolve(__dirname, './src/types'),
     },
   }
   ```

### Dashboard mostra tela em branco

**Problema:** React renderiza tela branca

**Solução:**
1. Abra DevTools Console (F12)
2. Verifique erros JavaScript
3. Verifique se todas as dependências estão instaladas:
   ```bash
   npm install
   ```
4. Limpe cache do Vite:
   ```bash
   rm -rf node_modules/.vite
   npm run dev
   ```

### Gráfico não renderiza

**Problema:** QueueChart mostra área vazia

**Solução:**
1. Verifique se `recharts` está instalado:
   ```bash
   npm list recharts
   ```
2. Se não estiver, instale:
   ```bash
   npm install recharts
   ```
3. Aguarde alguns segundos - o gráfico precisa de dados (mínimo 2 pontos)

### Tabela PrimeReact não estilizada

**Problema:** RecentTickets aparece sem estilos

**Solução:**
1. Verifique se PrimeReact CSS está importado em `main.tsx`:
   ```typescript
   import 'primereact/resources/themes/lara-light-blue/theme.css'
   import 'primereact/resources/primereact.min.css'
   import 'primeicons/primeicons.css'
   ```
2. Se não estiver, adicione no topo do arquivo

---

## Performance Tips

### 1. React Query DevTools (Opcional)

Adicione devtools para debug:

```bash
npm install @tanstack/react-query-devtools
```

Em `main.tsx`:
```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// Dentro do QueryClientProvider
<ReactQueryDevtools initialIsOpen={false} />
```

### 2. WebSocket Debug

Habilite logs no console:

Em `hooks/useDashboard.ts`, os logs já estão habilitados:
```typescript
console.log('[useDashboard] ticket:created', event)
```

Para desabilitar em produção, use:
```typescript
if (import.meta.env.DEV) {
  console.log('[useDashboard] ticket:created', event)
}
```

### 3. Build de Produção

```bash
npm run build

# Output: dist/
# Serve com:
npm run preview
```

Deploy:
```bash
# Copie pasta dist/ para seu servidor
# Exemplo com nginx:
cp -r dist/* /var/www/html/
```

---

## Próximos Passos

### 1. Adicionar autenticação

```typescript
// src/hooks/useAuth.ts
export function useAuth() {
  // Implementar login/logout
  // JWT token no localStorage
  // Axios interceptor para Authorization header
}
```

### 2. Adicionar filtros

```typescript
// src/components/dashboard/TicketFilters.tsx
export function TicketFilters() {
  // Filtrar por status
  // Filtrar por time
  // Filtrar por data
  // Filtrar por agente
}
```

### 3. Adicionar notificações

```bash
npm install react-hot-toast
```

```typescript
// Em useDashboard.ts
import toast from 'react-hot-toast'

on<TicketCreatedEvent>('ticket:created', (event) => {
  toast.success(`Novo ticket: ${event.ticket.customerName}`)
})
```

### 4. Adicionar testes

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
```

```typescript
// src/components/ui/Button.test.tsx
import { render, screen } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })
})
```

---

## Suporte

**Documentação completa:**
- `/frontend/DASHBOARD_IMPLEMENTATION.md` - Implementação detalhada
- `/frontend/DASHBOARD_VISUAL.md` - Visualização do layout
- `/PRD.md` - Product Requirements Document

**Swagger API:**
- http://localhost:3000/api/docs

**Contato:**
- Email: dev@flowpay.com
- Slack: #flowpay-support

---

## Licença

Proprietary - FlowPay © 2026
