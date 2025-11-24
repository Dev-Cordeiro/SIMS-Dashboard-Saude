# Dashboard TCC - Sistema Integrado de Monitoramento em Saúde

Sistema de dashboard para visualização de dados de saúde, incluindo internações e óbitos por diversos critérios (CID-10, sexo, faixa etária, raça, estado civil, local de ocorrência).

## 🚀 Tecnologias

### Frontend
- React 18
- Vite
- Recharts (gráficos)
- Leaflet (mapas)
- Axios (requisições HTTP)
- React Toastify (notificações)

### Backend
- FastAPI
- PostgreSQL
- Supabase (autenticação)
- Psycopg2 (driver PostgreSQL)

## 📁 Estrutura do Projeto

```
DashBoard TCC/
├── frontend/          # Aplicação React
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── services/      # Serviços (API)
│   │   ├── contexts/      # Contextos React
│   │   └── utils/         # Utilitários
│   └── package.json
├── backend/           # API FastAPI
│   ├── app/
│   │   ├── main.py        # Endpoints da API
│   │   ├── db.py          # Conexão com banco
│   │   └── supabase_client.py
│   └── requirements.txt
└── .gitignore
```

## 🔧 Instalação

### Backend

1. Navegue até a pasta backend:
```bash
cd backend
```

2. Crie um ambiente virtual:
```bash
python -m venv .venv
```

3. Ative o ambiente virtual:
```bash
# Windows
.venv\Scripts\activate

# Linux/Mac
source .venv/bin/activate
```

4. Instale as dependências:
```bash
pip install -r requirements.txt
```

5. Crie um arquivo `.env` na pasta backend com:
```
DATABASE_URL=postgresql://usuario:senha@host:porta/database
SUPABASE_URL=sua_url_supabase
SUPABASE_KEY=sua_chave_supabase
```

6. Inicie o servidor:
```bash
uvicorn app.main:app --reload --port 8000
```

### Frontend

1. Navegue até a pasta frontend:
```bash
cd frontend
```

2. Instale as dependências:
```bash
npm install
```

3. Crie um arquivo `.env` na pasta frontend com:
```
VITE_API_URL=http://localhost:8000
```

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

## 📦 Deploy

### Frontend (Vercel)

1. Instale a CLI da Vercel:
```bash
npm i -g vercel
```

2. Na pasta `frontend`, execute:
```bash
vercel
```

3. Configure as variáveis de ambiente na Vercel:
   - `VITE_API_URL`: URL da sua API backend (ex: `https://seu-backend.railway.app`)

### Backend (Railway)

1. Acesse [railway.app](https://railway.app) e faça login
2. Crie um novo projeto e conecte seu repositório GitHub
3. **IMPORTANTE**: Configure o **Root Directory** para `backend`:
   - Vá em Settings → Source → Root Directory
   - Defina como `backend`
4. Adicione as variáveis de ambiente:
   - `DATABASE_URL`: String de conexão PostgreSQL
   - `SUPABASE_URL`: URL do projeto Supabase
   - `SUPABASE_KEY`: Chave de API do Supabase
5. O Railway detectará automaticamente que é um projeto Python e fará o build
6. Após o deploy, copie a URL gerada (ex: `https://seu-projeto.railway.app`) e use no frontend

**Arquivos de configuração criados:**
- `Procfile` - Define como iniciar a aplicação
- `nixpacks.toml` - Configuração do build para Railway
- `backend/railway.json` - Configuração específica do Railway

## 🔐 Variáveis de Ambiente

### Backend (.env)
- `DATABASE_URL`: String de conexão PostgreSQL
- `SUPABASE_URL`: URL do projeto Supabase
- `SUPABASE_KEY`: Chave de API do Supabase

### Frontend (.env)
- `VITE_API_URL`: URL da API backend

## 📊 Funcionalidades

- Dashboard com visão geral dos dados
- Gráficos interativos (Recharts)
- Mapas geográficos (Leaflet)
- Filtros por município, ano, mês
- Exportação de gráficos (PNG/CSV)
- Autenticação de usuários (Supabase)
- Cache de dados no localStorage
- Design responsivo

## 🗄️ Banco de Dados

O projeto utiliza PostgreSQL com as seguintes tabelas principais:
- `fato_saude_mensal`: Tabela fato com dados agregados
- `dim_tempo`: Dimensão de tempo
- `dim_localidade`: Dimensão de localização
- `dim_cid10_capitulo`: Dimensão de capítulos CID-10
- E outras tabelas de dimensão

## 📝 Licença

Este projeto foi desenvolvido para fins acadêmicos (TCC).

