# ✦ Vault Finance OS (v1.103.00 - Estabilização do Módulo de Empréstimos Concedidos) ✦

> **O Sistema Operacional Financeiro Definitivo.** Uma plataforma SaaS híbrida (Web & Mobile) de alta performance inspirada na metodologia YNAB (Orçamento Base-Zero), desenvolvida com arquitetura moderna e focada em escalabilidade extrema, segurança biométrica, sincronização em tempo real de múltiplas moedas, controle de investimentos via Smart Ledger manual simplificado, novo módulo de **Patrimônio Líquido & Ativos (Net Worth & Assets)** com termômetro de liquidez (financial runway), nova seção de **Simuladores Financeiros Dinâmicos** (Rumo ao Milhão e FIRE), integração automática de logos de instituições financeiras via **Google Favicon API**, nova **Central de Alertas Globais (Notification Bell)**, ferramenta de **Migração de Sub-contas para Categorias (YNAB)**, suporte a **Isolamento de Moeda (BRL/EUR) em Categorias** com rotina de restauração de valores históricos em BRL, **divisão da interface de Orçamento em quadros de moedas totalmente independentes (EUR e BRL) controlados por abas (Tabs) animadas e integradas com cockpit fixo de vidro de largura total (sticky top-0 w-full glassmorphism) permanente** com suporte para mover categorias entre moedas, **novo transplante de UI com animações de acordeão via Framer Motion no orçamento (Budget)**, **alinhamento perfeito em grade flexbox para linhas de categoria, cabeçalhos de grupos e cabeçalho global do orçamento**, **refatoração visual das linhas de categoria do orçamento para flexbox card moderno com salvamento automático no blur/Enter e sem botões de confirmação manual**, **novo agrupador expansível de categorias ( progressive disclosure cards) para evitar rolagem vertical infinita na listagem de envelopes**, **novo painel retrátil de Histórico de Receitas Processadas para economia de área de tela**, **nova interface de rateio de despesas dinâmico por item no modal de lançamento de transações (Split Bill)** com cadastros de sabão/mercado e divisão reativa por devedor em badges individuais, **gerenciamento visual completo via aba dedicada nas Configurações (Settings) para Regras de Rateio (Split Rules)**, **limpeza profunda de rotas legadas e arquivos do módulo de Dívidas**, **simplificação do cadastro de contas e subcontas alinhado aos princípios YNAB (remoção de teto e ícone manual e rebatismo para Conta de Acompanhamento)**, **higienização automática de valores absolutos no lançamento de transações no backend (amount = abs(amount)) para blindagem contábil contra estouros por dupla negação**, **suporte a contas de Empréstimo Concedido (LOAN_GIVEN) com badge "A Receber" e inversão visual de saldo positivo para negativo no display para melhor controle de ativos emprestados**, **atalho rápido "/loans" (Empréstimos) com ícone HandCoins inserido na navegação lateral (Sidebar)**, **nova página de Painel de Empréstimos Concedidos (LoansDashboard.tsx) que atua como assistente guiado para acompanhamento de devedores e amortização rápida de saldos a receber com injeção direta no orçamento principal**, **suporte a category_id no motor de transferências de transações para garantir a integridade do orçamento base-zero ao transferir recursos de contas no orçamento para contas de empréstimos concedidos fora do orçamento**, **o novo assistente guiado de divisão no formulário global de transações (AddTransactionModal.tsx) que gera transferências automáticas para contas de empréstimo (LOAN_GIVEN) preservando o orçamento base-zero**, **deleção física e remoção estrutural de tabelas, chaves estrangeiras e colunas obsoletas dos módulos de dívida e devedores no banco de dados para saneamento e otimização do ecossistema backend (SplitRule, SplitRuleItem, Debt, DebtPayment, DebtCharge, Debtor, DebtItem, Transaction.split_rule, Transaction.shared_amount, Asset.linked_debt)**, **estabilização e persistência de tipo de conta com suporte nativo de tipagem TypeScript para LOAN_GIVEN eliminando sumiços após recarregamento de página**, e **correção no cálculo de totais do Orçamento (Budget.tsx) para preservar o RTA desconsiderando contas de empréstimo concedidos**.



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
| `POSTHOG_API_KEY` | Chave de API do PostHog para observabilidade no backend. | `phc_suachaveaqui...` |
| `POSTHOG_HOST` | Endpoint do PostHog para envio de dados do backend. | `https://us.i.posthog.com` |
| `TESTING` | Desativa integrações externas de telemetria durante testes. | `True` (testes) \| `False` (padrão) |

### Frontend (`/Ynab/.env.local` ou `/Ynab/.env`)
| Variável | Descrição | Exemplo / Padrão |
| :--- | :--- | :--- |
| `VITE_API_URL` | Endereço base do servidor da API do Backend. | `http://localhost:8000` |
| `VITE_GOOGLE_CLIENT_ID` | Chave de cliente OAuth do Google para login na Web. | `123456-abcde...apps.googleusercontent.com` |
| `VITE_POSTHOG_KEY` | Chave pública do PostHog para observabilidade no frontend. | `phc_suachaveaqui...` |
| `VITE_POSTHOG_HOST` | Endpoint do PostHog para envio de dados do frontend. | `https://us.i.posthog.com` |

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
4. **Invariantes de Negócios:** Ao codificar lógicas de cálculo críticas (ex: divisões, taxas, conversões), utilize a função `assertBusinessLogic` de `@/shared/lib/businessInvariants` para monitorar desvios silenciosos em produção de forma assíncrona.
