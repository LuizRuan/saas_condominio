# Domus — SaaS de Gestão de Condomínios

## Sistema
Multi-tenant SaaS para gestão de condomínios com 4 perfis: **admin**, **subadmin**, **concierge** e **resident**.
Cada condomínio é um tenant isolado por `condominiumId` em todos os modelos.
Existe modo **demo** (`isDemo: true` no User) para teste sem dados reais.

## Stack
- **Backend:** Node.js + Express + TypeScript + MongoDB (Mongoose) + JWT
- **Frontend:** React + TypeScript + Vite + React Router + React Query + Axios

## Comandos

```bash
# Backend (porta 5000 por padrão)
cd backend
npm run dev          # desenvolvimento com hot reload (tsx watch)
npm run build        # compila TypeScript
npm run seed         # seed básico
npm run seed:demo    # seed com dados demo

# Frontend (porta 5173 por padrão)
cd frontend
npm run dev          # desenvolvimento
npm run build        # build de produção
```

## Variáveis de ambiente — backend (.env)
```
MONGODB_URI=
JWT_SECRET=
PORT=
```

## Estrutura principal
```
backend/src/
  controllers/   # lógica de negócio (18 controllers)
  models/        # schemas Mongoose (13 modelos)
  routes/        # roteamento Express
  middlewares/   # auth JWT, rate limit
  utils/         # seed, helpers

frontend/src/
  pages/admin/   # dashboard e módulos do admin
  pages/resident/# área do morador
  contexts/      # AuthContext, DemoContext
  services/api.ts# instância Axios com interceptor JWT
  components/layout/RouteGuards.tsx  # proteção por role
```

## Módulos da API (`/api/...`)
`/auth` `/condominiums` `/units` `/residents` `/users`
`/charges` `/expenses` `/finance` `/announcements`
`/issues` `/reservations` `/packages` `/notifications`
`/audit` `/dashboard` `/import` `/access`

## Regras importantes
- Nunca remover a flag `isDemo` do modelo User — usada para limpar/recriar dados demo.
- Todo controller deve filtrar por `condominiumId` do usuário autenticado.
- Rotas financeiras (`/cobrancas`, `/despesas`, `/caixa`, `/relatorios`) são restritas a `admin` via `FinanceRoute`.
- O módulo `/access` (portaria) ainda não foi commitado — arquivos em `accessController.ts`, `Access.ts`, `accessRoutes.ts`.
- Frontend usa React Query para cache; não duplicar estado local com `useState` quando há query ativa.

## Arquivos mais importantes
| Arquivo | Papel |
|---------|-------|
| `backend/src/routes/index.ts` | Registro de todas as rotas |
| `backend/src/models/User.ts` | Modelo central com roles e tenancy |
| `backend/src/controllers/authController.ts` | Login, JWT, demo, convite |
| `frontend/src/App.tsx` | Rotas e guards do frontend |
| `frontend/src/contexts/AuthContext.tsx` | Estado global de autenticação |
| `frontend/src/services/api.ts` | Axios + interceptor de token |
| `frontend/src/components/layout/RouteGuards.tsx` | Proteção por role |
