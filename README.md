# Avalia Ninho

Plataforma para moradores de condomínio avaliarem prestadores de serviço (encanadores, eletricistas, etc.) com notas de 1 a 5 estrelas.

## Funcionalidades

- Cadastro e login por residência (ex: EJ06, AP12)
- Listagem de todos os prestadores com média de avaliações
- Busca de prestadores por nome ou telefone
- Avaliação com estrelas (1–5) e comentário opcional
- Visualização da sua nota pessoal em cada prestador
- Cadastro de novos prestadores

## Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Estilo | Tailwind CSS |
| Backend | Node.js + Express |
| Banco de dados | SQLite (better-sqlite3) |
| Autenticação | JWT (jsonwebtoken) |

## Estrutura do Projeto

```
AVALIACAO_PRESTADOR/
├── backend/
│   ├── server.js       # API REST (Express)
│   ├── database.js     # Configuração do SQLite
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   └── Search.tsx
│   │   └── components/
│   │       ├── ProviderCard.tsx
│   │       └── StarRating.tsx
│   └── package.json
└── start.sh
```

## Banco de Dados

```sql
users        (id, phone, residence UNIQUE, password_hash, created_at)
providers    (id, name, phone UNIQUE, specialty, created_at)
evaluations  (id, user_id, provider_id, stars 1-5, comment, created_at)
             UNIQUE(user_id, provider_id) -- uma avaliação por residente por prestador
```

## API Endpoints

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/api/auth/register` | — | Cadastrar residente |
| POST | `/api/auth/login` | — | Login |
| GET | `/api/providers` | JWT | Listar todos os prestadores com minha nota |
| GET | `/api/providers/search?q=` | JWT | Buscar prestadores |
| GET | `/api/providers/:id` | JWT | Detalhes + avaliações do prestador |
| GET | `/api/providers/:id/my-evaluation` | JWT | Minha avaliação do prestador |
| POST | `/api/providers` | JWT | Cadastrar prestador |
| POST | `/api/evaluations` | JWT | Criar ou atualizar avaliação |

## Como Rodar Localmente

### Pré-requisitos
- Node.js 18+

### Backend

```bash
cd backend
npm install
node server.js
# Rodando em http://localhost:3001
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Rodando em http://localhost:3000
```

> O Vite faz proxy de `/api` para `http://localhost:3001` automaticamente em desenvolvimento.

## Deploy (Gratuito)

### Backend → [Render.com](https://render.com)

1. New Web Service → conecte o repositório
2. **Root Directory:** `backend`
3. **Build Command:** `npm install`
4. **Start Command:** `node server.js`
5. **Variáveis de ambiente:**
   - `JWT_SECRET` = uma senha segura

### Frontend → [Vercel.com](https://vercel.com)

1. New Project → importe o repositório
2. **Root Directory:** `frontend`
3. **Framework:** Vite
4. **Variáveis de ambiente:**
   - `VITE_API_URL` = URL do Render (ex: `https://avalia-ninho.onrender.com`)

## Variáveis de Ambiente

### Backend
| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `PORT` | `3001` | Porta do servidor |
| `JWT_SECRET` | `avalia_ninho_secret_2024` | Chave de assinatura JWT |

### Frontend
| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `VITE_API_URL` | `""` (usa proxy local) | URL base da API em produção |
