# ✦ Vault Finance OS (v1.21.0) ✦

> **O Sistema Operacional Financeiro Definitivo.** Uma plataforma SaaS híbrida (Web & Mobile) de alta performance inspirada na metodologia YNAB (Orçamento Base-Zero), desenvolvida com arquitetura moderna e focada em escalabilidade extrema, segurança biométrica e sincronização em tempo real de múltiplas moedas.

---

## 🚀 Setup Rápido em 5 Minutos

Siga o passo a passo abaixo para levantar todo o ecossistema (Backend, Frontend e Mobile) em seu ambiente de desenvolvimento local.

### 📋 Pré-requisitos
Certifique-se de possuir instalado em sua máquina:
* **Node.js** (v20+ recomendado)
* **Python** (v3.14+)
* **Docker & Docker Compose** (opcional para rodar via containers)
* **Android Studio** ou **Xcode** (apenas se for buildar para Mobile)

---

### 1. Clonar e Inicializar o Repositório
```bash
git clone https://github.com/seu-usuario/PROJETO-YNAB.git
cd PROJETO-YNAB
```

---

### 2. Configurando o Backend (Django API)
Abra um terminal na pasta `/backend`:

```bash
cd backend

# Criar e ativar o ambiente virtual (venv)
python -m venv venv
# No Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# No Linux/macOS:
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Executar migrações do banco de dados
python manage.py migrate

# Iniciar o servidor local (rodará na porta 8000)
python manage.py runserver
```

---

### 3. Configurando o Frontend (React / Vite)
Abra um novo terminal na pasta `/Ynab` (Raiz do App React):

```bash
cd Ynab

# Instalar as dependências do Node
npm install

# Iniciar o servidor de desenvolvimento do Vite (rodará na porta 5173)
npm run dev
```

---

### 4. Rodando via Docker (Alternativa Rápida)
Se preferir levantar todo o sistema de uma só vez encapsulado em containers Docker, execute na raiz do projeto:

```bash
docker-compose up --build
```
* O **Frontend** estará acessível em `http://localhost:80`
* O **Backend API** estará acessível em `http://localhost:8000`

---

## 🔑 Variáveis de Ambiente Vitais (`.env`)

Configure os arquivos `.env` em suas respectivas pastas para garantir o correto funcionamento dos serviços externos (como Google OAuth2 e segurança).

### Backend (`/backend/.env`)
| Variável | Descrição | Exemplo / Padrão |
| :--- | :--- | :--- |
| `DEBUG` | Define o modo de depuração (ativado/desativado). | `True` (desenv) \| `False` (prod) |
| `SECRET_KEY` | Chave secreta única do Django para assinatura criptográfica. | `django-insecure-sua-chave...` |
| `GOOGLE_CLIENT_ID` | Identificador da aplicação no Google Cloud Console para Login Único. | `123456-abcde...apps.googleusercontent.com` |

### Frontend (`/Ynab/.env.local` ou `/Ynab/.env`)
| Variável | Descrição | Exemplo / Padrão |
| :--- | :--- | :--- |
| `VITE_API_URL` | Endereço base do servidor da API do Backend. | `http://localhost:8000` |
| `VITE_GOOGLE_CLIENT_ID` | Chave de cliente OAuth do Google para login na Web. | `123456-abcde...apps.googleusercontent.com` |

---

## 🛠️ Comandos de Desenvolvimento e Qualidade

Sempre valide suas alterações executando a suíte completa de testes antes de realizar novos deploys.

### 🧪 Executando Testes de Qualidade

#### **Backend (Pytest + Django)**
```bash
cd backend
# Com a venv ativa, execute:
pytest
```

#### **Frontend (Vitest + React Testing Library)**
```bash
cd Ynab
# Executa os testes em modo "single run" (ideal para pipelines de CI)
npm run test -- --run

# Executa em modo interativo de observação (watch mode)
npm run test:watch
```

---

### 📦 Deploy de Produção (Vercel)
O deploy do frontend é feito diretamente pelo terminal do desenvolvedor. Certifique-se de ter a CLI da Vercel instalada (`npm i -g vercel`).

```bash
# Na raiz do workspace ou da pasta Ynab, realize o deploy produtivo:
vercel --prod
```

---

## 📱 Compilação e Sincronização Mobile (Capacitor)

O Vault Finance OS utiliza o **Capacitor** da Ionic para compilar a base de código do React nativamente para dispositivos móveis Android e iOS.

### Fluxo de Build do Aplicativo Híbrido

Cada vez que alterar a interface e quiser testá-la no emulador ou dispositivo físico:

```bash
cd Ynab

# 1. Compilar a versão otimizada de produção do React
npm run build

# 2. Copiar os arquivos gerados e sincronizar plugins nativos
npx cap sync

# 3. Abrir o projeto no Android Studio (para rodar/gerar APK)
npx cap open android

# 4. Abrir o projeto no Xcode (para iOS)
npx cap open ios
```

> [!IMPORTANT]
> Para o correto funcionamento do Login do Google nativo no celular, certifique-se de configurar o arquivo `capacitor.config.ts` com as credenciais nativas de SHA-1 do keystore geradas pelo console do Firebase/Google Play Console.

---

## 🏛️ Visão da Arquitetura do Sistema

```mermaid
graph TD
    subgraph Cliente (Web / Mobile)
        A[React App / TypeScript] -->|Zustand| B[Gerenciamento de Estado]
        A -->|React Query| C[Cache & Chamadas de API]
        D[Capacitor Core] -->|Ponte Nativa| A
    end

    subgraph Servidor (Backend API)
        C -->|HTTPS / REST| E[Django REST Framework]
        E -->|JWT Auth + 2FA| F[SimpleJWT / pyotp]
        E -->|Lógica Financeira / OFX| G[Django Models]
    end

    subgraph Banco de Dados
        G -->|PostgreSQL / SQLite| H[(Database)]
    end
```

---

## 👥 Contribuição e Boas Práticas

1. **Testes Obrigatórios:** Toda alteração efetuada nos arquivos de regras de negócio ou de interface visual deve, obrigatoriamente, passar sem erros nos comandos `pytest` e `npm run test`.
2. **Localização Dinâmica:** Nunca insira strings de texto fixas no frontend. Sempre utilize o hook de tradução `const { t } = useTranslation();` e registre os textos no dicionário de traduções em `src/locales/`.
3. **Padrão de Commits:** Siga o padrão de commits semânticos (*Conventional Commits*) para manter o histórico claro de correções e novas funcionalidades.
