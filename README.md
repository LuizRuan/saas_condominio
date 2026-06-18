# 🏢 Domus

**Organize cobranças, moradores, comunicados e solicitações do condomínio em um só lugar.**

Sistema web completo para síndicos de condomínios pequenos e médios organizarem a gestão condominial de forma simples, moderna e profissional.

---

## 🚀 Tecnologias

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Router DOM
- Axios
- Context API
- Lucide Icons
- React Hot Toast

### Backend
- Node.js + TypeScript
- Express
- MongoDB (Mongoose)
- JWT (jsonwebtoken)
- bcryptjs
- Helmet + CORS + Rate Limit

### Infraestrutura
- **Frontend**: Vercel
- **Backend**: Render
- **Banco**: MongoDB Atlas

---

## 📁 Estrutura de Pastas

```
condominio-em-dia/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/          # Button, Input, Modal, etc.
│   │   │   ├── layout/      # Sidebar, Header, RouteGuards
│   │   │   └── dashboard/   # DashboardCard
│   │   ├── pages/
│   │   │   ├── auth/        # Login, Register
│   │   │   ├── admin/       # Dashboard, Units, Charges, etc.
│   │   │   └── resident/    # ResidentDashboard, MyCharges, etc.
│   │   ├── services/        # api.ts (Axios)
│   │   ├── contexts/        # AuthContext
│   │   ├── utils/           # helpers, whatsapp
│   │   ├── types/           # TypeScript interfaces
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── backend/
│   ├── src/
│   │   ├── config/          # database.ts
│   │   ├── controllers/     # 8 controllers
│   │   ├── middlewares/     # auth, role, errorHandler
│   │   ├── models/          # 8 Mongoose models
│   │   ├── routes/          # 9 route files + index
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

---

## ⚙️ Como rodar localmente

### 1. Pré-requisitos
- Node.js 20.19+
- npm ou yarn
- Conta no [MongoDB Atlas](https://www.mongodb.com/atlas)

### 2. Clonar o projeto
```bash
git clone <url-do-repositorio>
cd condominio-em-dia
```

### 3. Configurar Backend
```bash
cd backend
cp .env.example .env
# Edite o .env com suas credenciais
npm install
npm run dev
```

**Variáveis do .env:**
```
NODE_ENV=development
PORT=5000
HOST=0.0.0.0
MONGO_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/condominio-em-dia
JWT_SECRET=troque_por_uma_chave_aleatoria_com_32_caracteres
CLIENT_URL=http://localhost:5173
```

Sem uma `MONGO_URI` válida, o backend usa MongoDB em memória apenas em
desenvolvimento e mantém os usuários de teste:

- `sindico@teste.com` / `123456`
- `morador@teste.com` / `123456`

### 4. Configurar Frontend
```bash
cd frontend
cp .env.example .env
# O padrão já aponta para localhost:5000
npm install
npm run dev
```

**Variáveis do .env:**
```
VITE_API_URL=http://localhost:5000/api
```

### 5. Testar
- Frontend: http://localhost:5173
- Backend: http://localhost:5000/api/health

---

## 🗃️ Configurar MongoDB Atlas

1. Acesse [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Crie um cluster gratuito (Free Tier)
3. Crie um usuário de banco
4. Em "Network Access", adicione `0.0.0.0/0`
5. Copie a connection string e cole no `.env` do backend

---

## 🌐 Deploy

### Backend no Render

1. Acesse [render.com](https://render.com)
2. Crie um novo **Web Service**
3. Conecte seu repositório GitHub
4. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm ci --include=dev && npm run build`
   - **Start Command**: `npm start`
5. Adicione as variáveis de ambiente:
   - `NODE_ENV=production`
   - `NODE_VERSION=20.19.0`
   - `MONGO_URI=...`
   - `JWT_SECRET=...` (mínimo de 32 caracteres)
   - `CLIENT_URL=https://seu-frontend.vercel.app`

Também é possível criar o serviço pelo Blueprint da raiz usando `render.yaml`.

### Frontend na Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Importe o repositório
3. Configure:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Adicione a variável de ambiente:
   - `VITE_API_URL=https://seu-backend.onrender.com/api`

O arquivo `frontend/vercel.json` já configura o fallback das rotas do React
Router para `index.html`.

---

## 🧪 Testar a API

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Registrar
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Síndico",
    "email": "joao@email.com",
    "password": "123456",
    "condominiumName": "Residencial Aurora"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@email.com",
    "password": "123456"
  }'
```

---

## 👥 Usuários e Permissões

| Perfil | Pode fazer |
|--------|-----------|
| **Síndico (admin)** | Gerenciar tudo: condomínio, unidades, moradores, cobranças, comunicados, ocorrências, reservas |
| **Morador (resident)** | Ver cobranças, comunicados, abrir ocorrências, solicitar reservas |

**Isolamento**: Cada síndico só vê dados do próprio condomínio. Cada morador só vê dados da própria unidade.

---

## 🔮 Próximas Funcionalidades

- [ ] Pix automático (API Pix)
- [ ] Upload de comprovante de pagamento
- [ ] Boleto bancário
- [ ] Envio automático por WhatsApp Business API
- [ ] Prestação de contas mensal
- [ ] Assembleia online
- [ ] Votação digital
- [ ] Documentos do condomínio (atas, regulamentos)
- [ ] Controle de visitantes
- [ ] App mobile (React Native)
- [ ] Notificações push
- [ ] Relatórios financeiros avançados
- [ ] Dashboard com gráficos
- [ ] Exportação para Excel/PDF
- [ ] Multi-idioma

---

## 📝 Licença

Este projeto é privado e de uso proprietário.

---

Feito com ❤️ para síndicos que querem menos planilha e mais organização.
