# Guia de Deployment, Infraestrutura e DevOps — Vault Finance OS

Este guia documenta as estratégias de orquestração, implantação, backups e publicação do ecossistema do **Vault Finance OS**. Ele serve de referência técnica para a orquestração do backend em produção, automação via CI/CD e compilação híbrida móvel.

---

## 1. Arquitetura de Produção Híbrida

O Vault Finance OS opera sob uma infraestrutura híbrida otimizada para latência, custo e escalabilidade:

```mermaid
flowchart TD
    subgraph Cliente ["Camada do Cliente"]
        Web["🌐 Web Client (Vercel CDN)"]
        Mobile["📱 Mobile App (Capacitor Nativo)"]
    end

    subgraph Cloud ["Provedores de Nuvem (Render / AWS / GCP)"]
        WS["🐳 Gunicorn / Django API Server"]
        Redis["⚡ Redis Cache & Rate Limiter"]
        DB["💾 PostgreSQL Database (Managed)"]
    end

    Web -->|HTTPS / REST API| WS
    Mobile -->|HTTPS / REST API| WS
    WS <-->|Saldos & Autenticação| DB
    WS <-->|Chaves OTP & Sincronização| Redis
```

---

## 2. Orquestração em Produção via Docker Compose

Para replicação de infraestrutura em qualquer servidor VPS (AWS EC2, DigitalOcean, Hetzner, etc.), o Vault Finance OS utiliza Docker Compose com isolamento de redes e volumes persistentes.

### Exemplo de Configuração de Produção (`docker-compose.prod.yml`)

```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    container_name: vault_postgres_prod
    restart: always
    volumes:
      - postgres_prod_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: ynab_prod
      POSTGRES_USER: vault_db_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    networks:
      - vault_prod_net

  redis:
    image: redis:7-alpine
    container_name: vault_redis_prod
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    networks:
      - vault_prod_net

  web:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: vault_backend_prod
    restart: always
    command: gunicorn ynab_backend.wsgi:application --bind 0.0.0.0:8000 --workers 3 --threads 2
    expose:
      - "8000"
    environment:
      - DATABASE_URL=postgres://vault_db_user:${DB_PASSWORD}@db:5432/ynab_prod
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379/0
      - SECRET_KEY=${DJANGO_SECRET_KEY}
      - DEBUG=False
      - ALLOWED_HOSTS=api.vaultfinance.os
    depends_on:
      - db
      - redis
    networks:
      - vault_prod_net

  nginx:
    image: nginx:alpine
    container_name: vault_nginx_prod
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/prod.conf:/etc/nginx/nginx.conf:ro
      - ./certbot/conf:/etc/letsencrypt:ro
    depends_on:
      - web
    networks:
      - vault_prod_net

volumes:
  postgres_prod_data:

networks:
  vault_prod_net:
    driver: bridge
```

---

## 3. Pipeline de CI/CD (GitHub Actions)

Implementamos uma barreira de integração contínua para testar, validar e implantar alterações automaticamente no repositório GitHub.

### Workflow de Integração Contínua (`.github/workflows/ci.yml`)

```yaml
name: Vault Finance OS - CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  backend-test:
    name: Backend Pytest Suite
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_DB: ynab_test
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3
    - name: Set up Python 3.11
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
        
    - name: Install dependencies
      run: |
        cd backend
        python -m pip install --upgrade pip
        pip install -r requirements.txt
        
    - name: Run Tests with Pytest
      env:
        DATABASE_URL: postgres://test_user:test_password@localhost:5432/ynab_test
        SECRET_KEY: test-secret-key-very-safe
        DEBUG: True
      run: |
        cd backend
        pytest --maxfail=1

  frontend-test:
    name: Frontend Vitest & Build Suite
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: 18
        cache: 'npm'
        cache-dependency-path: Ynab/package-lock.json

    - name: Install dependencies
      run: |
        cd Ynab
        npm ci

    - name: Run Unit Tests
      run: |
        cd Ynab
        npm run test -- --run

    - name: Compile Production Build
      run: |
        cd Ynab
        npm run build

  deploy:
    name: Deploy to Cloud (Render & Vercel)
    needs: [backend-test, frontend-test]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3
    - name: Deploy Frontend to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
        vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
        vercel-args: '--prod --yes'

    - name: Trigger Backend Deploy on Render
      run: |
        curl -X POST "${{ secrets.RENDER_DEPLOY_HOOK }}"
```

---

## 4. Estratégias de Backup do PostgreSQL

Para garantir a integridade dos dados e proteção contra falhas catastróficas, o banco de dados deve possuir rotinas automatizadas de dump diário armazenadas de forma externa (como AWS S3).

### Script de Backup Automatizado (`backup_postgres.sh`)

```bash
#!/bin/bash
# Script de Backup Vault Finance OS
# Rodar sob uma tarefa diária no Cron: 0 2 * * * /app/scripts/backup_postgres.sh

BACKUP_DIR="/var/backups/vault_finance"
DATE=$(date +%Y-%m-%d_%H%M%S)
DB_CONTAINER="vault_postgres_prod"
DB_USER="vault_db_user"
DB_NAME="ynab_prod"
S3_BUCKET="s3://vault-finance-backups"

mkdir -p $BACKUP_DIR

# 1. Executa o Dump
docker exec -t $DB_CONTAINER pg_dump -U $DB_USER -F c $DB_NAME > "$BACKUP_DIR/backup_$DATE.dump"

# 2. Compacta o arquivo
gzip "$BACKUP_DIR/backup_$DATE.dump"

# 3. Envia para o S3
aws s3 cp "$BACKUP_DIR/backup_$DATE.dump.gz" "$S3_BUCKET/backup_$DATE.dump.gz"

# 4. Remove backups locais com mais de 7 dias para poupar espaço
find $BACKUP_DIR -type f -mtime +7 -name "*.dump.gz" -exec rm -f {} \;
```

---

## 5. Compilação Híbrida Nativa com Capacitor (Mobile)

O frontend do Vault Finance OS utiliza o **Capacitor** para injetar a SPA React diretamente em WebViews de alto desempenho no Android e iOS, integrando chaves e interfaces nativas.

```mermaid
graph LR
    SPA["💻 SPA React (Vite Build)"] -->|Capacitor CLI| Assets["📦 Native Assets (dist/)"]
    Assets -->|npx cap sync| Android["🤖 Android Studio Project"]
    Assets -->|npx cap sync| iOS["🍏 Xcode Project"]
```

### Guia Passo a Passo de Compilação

#### Requisitos Iniciais
* **Android:** Instalar o Java Development Kit (JDK 17) e o Android Studio (com Android SDK e Gradle).
* **iOS:** Instalar o MacOS, Xcode e as dependências do Cocoapods.

#### Passo 1: Preparar os arquivos do Frontend
Gere os arquivos estáticos de produção do React:
```bash
cd Ynab
npm run build
```

#### Passo 2: Sincronizar Recursos com os Projetos Nativos
Sincronize o código de compilação do Vite com as pastas nativas Android e iOS:
```bash
npx cap sync
```

---

### A. Compilação para Google Play Store (Android)

1. **Abra o projeto no Android Studio:**
   ```bash
   npx cap open android
   ```
2. **Configurar Chaves SHA-1 para Login do Google:**
   * No Firebase Console ou Google Cloud Console, associe a chave SHA-1 da sua assinatura ao aplicativo Android cadastrado.
3. **Gerar Versão de Produção Assinada:**
   * No menu do Android Studio, vá em **Build > Generate Signed Bundle / APK...**
   * Selecione **Android App Bundle (AAB)** (padrão obrigatório para envio à Play Store).
   * Escolha ou crie o seu arquivo de chave `.jks` (*Keystore*) e digite as senhas seguras.
   * Selecione a variante de build `release` e clique em **Create**.
4. **Enviar para a Play Store:**
   * O arquivo `.aab` gerado em `android/app/release/app-release.aab` está pronto para upload no painel do Google Play Console.

---

### B. Compilação para Apple App Store (iOS)

1. **Abra o projeto no Xcode:**
   ```bash
   npx cap open ios
   ```
2. **Configurações de Assinatura (Signing):**
   * No Xcode, selecione o projeto raiz no menu lateral esquerdo.
   * Vá até a aba **Signing & Capabilities**.
   * Marque a opção **Automatically manage signing**.
   * Selecione o seu **Apple Developer Team** associado à sua conta de desenvolvedor paga da Apple.
3. **Gerar Build de Arquivamento:**
   * Certifique-se de selecionar **Any iOS Device (arm64)** como dispositivo alvo na barra superior.
   * No menu do topo do MacOS, clique em **Product > Archive**.
   * O Xcode compilará o aplicativo e abrirá o assistente de distribuição.
4. **Submeter à App Store Connect:**
   * No assistente, selecione **Distribute App > App Store Connect > Upload** e siga as etapas para publicação e validação automática do TestFlight.
