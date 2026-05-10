# ✦ Wiki — Pipeline de Segurança & Autenticação JWT + 2FA

Este documento descreve detalhadamente a arquitetura de segurança, criptografia e controle de acesso implementada no **Vault Finance OS**. Ele serve como especificação técnica dos fluxos de autenticação em dois fatores (2FA) e do gerenciamento do ciclo de vida de tokens JWT.

---

## 1. Visão Geral da Arquitetura de Segurança

O Vault Finance OS implementa uma estratégia de **Segurança em Múltiplas Camadas (Defense in Depth)** para proteger as informações financeiras dos usuários, consistindo em:

* **Autenticação Híbrida:** Suporte a credenciais tradicionais (Usuário/Senha) e Login Social (Google OAuth2).
* **Autenticação Multifator (MFA/2FA):** Proteção baseada no protocolo TOTP (Time-Based One-Time Password).
* **Autorização sem Estado (Stateless):** Emissão de tokens JWT assinalados criptograficamente.
* **Criptografia de Dados em Trânsito:** Comunicação blindada de ponta a ponta via protocolo HTTPS com cifras SSL/TLS.

---

## 2. Fluxo Geral de Autenticação Híbrida

O processo de autenticação é executado em duas fases caso o usuário possua a autenticação de dois fatores ativada em seu perfil.

```mermaid
sequenceDiagram
    autonumber
    actor User as Usuário
    participant FE as Frontend (React)
    participant API as Django REST API (SimpleJWT)
    participant DB as Banco de Dados
    
    User->>FE: Digita Usuário/Senha (ou Google Sign-in)
    FE->>API: Envia credenciais (POST /api/token/ ou /api/auth/google/)
    API->>DB: Autentica credenciais e consulta perfil (UserProfile)
    
    alt Credenciais Inválidas
        API-->>FE: Retorna HTTP 401 Unauthorized
        FE-->>User: Exibe mensagem de erro de login
    else Credenciais Válidas
        alt 2FA está DESATIVADO
            API-->>FE: Retorna tokens JWT {"access": "...", "refresh": "..."}
            FE->>FE: Armazena tokens e autoriza acesso ao Dashboard
        else 2FA está ATIVADO
            API-->>FE: Retorna status especial {"2fa_required": true, "user_id": 123}
            FE->>User: Exibe interface de inserção de código OTP (6 dígitos)
            User->>FE: Digita o código de 6 dígitos do Authenticator
            FE->>API: POST /api/2fa/login/ {"user_id": 123, "code": "987654"}
            API->>DB: Valida código TOTP com o segredo criptografado do usuário
            alt Código OTP Inválido
                API-->>FE: Retorna HTTP 400 Bad Request {"error": "Código inválido"}
                FE-->>User: Exibe alerta vermelho de código incorreto
            else Código OTP Válido
                API-->>FE: Retorna tokens JWT {"access": "...", "refresh": "..."}
                FE->>FE: Armazena tokens e autoriza acesso ao Dashboard
            end
        end
    end
```

---

## 3. O Segundo Fator: Algoritmo TOTP (RFC 6238)

A validação de dois fatores do Vault Finance OS baseia-se no algoritmo **TOTP (Time-Based One-Time Password)** especificado pela RFC 6238.

### Funcionamento Matemático
O OTP gerado pelo aplicativo autenticador do usuário (ex: Google Authenticator) baseia-se na chave secreta simétrica compartilhada em Base32 ($K$) e no tempo do sistema ($T$):

1. **Obtenção do Contador Temporal ($C$):**
   $$C = \lfloor \frac{\text{Timestamp Atual} - T_0}{X} \rfloor$$
   * Onde $T_0 = 0$ (Epoch Unix) e $X = 30$ segundos (janela de validade do código).

2. **Geração do Hash HMAC-SHA1:**
   $$H = \text{HMAC-SHA1}(K, C)$$

3. **Truncamento Dinâmico (Dynamic Truncation):**
   Extrai-se uma sequência numérica de 4 bytes a partir do hash $H$ e calcula-se o módulo matemático por $10^6$ para gerar o código numérico final de 6 dígitos apresentado na tela do celular.

### Sincronização e Tolerância Visando Latência
Como o tempo do servidor e do celular do usuário podem sofrer pequenas variações (dessincronização de relógio), o backend do Django utiliza a biblioteca `pyotp` configurada com uma tolerância de **1 janela temporal anterior e 1 posterior (±30 segundos)**. Isso impede que o usuário seja bloqueado devido a pequenos atrasos na rede ou diferenças de milissegundos no dispositivo.

---

## 4. Ciclo de Vida do JWT (JSON Web Token)

O acesso aos endpoints protegidos da API financeira utiliza o padrão de autenticação `Bearer Token` do SimpleJWT.

### Matriz de Atributos dos Tokens

| Tipo de Token | Tempo de Vida | Destino de Armazenamento | Propósito |
| :--- | :--- | :--- | :--- |
| **Access Token** | 15 minutos | Memória volátil (React State) | Assinar requisições HTTP adicionando o cabeçalho `Authorization: Bearer <token>`. |
| **Refresh Token** | 7 dias | `SecureStorage` (Mobile) / `localStorage` (Web) | Obter novos Access Tokens de forma silenciosa e transparente sem forçar novo login. |

---

## 5. Middleware de Rotação Silenciosa e Interceptadores (Frontend)

Para evitar que a sessão do usuário expire repentinamente a cada 15 minutos, o cliente frontend implementa um padrão de interceptor de requisições de rede (via Axios ou Fetch Wrapper).

### Diagrama de Rotação de Tokens em Runtime

```mermaid
sequenceDiagram
    autonumber
    participant App as Frontend (React App)
    participant API as Django Backend API
    
    App->>API: GET /api/accounts/ (com Access Token expirado)
    API-->>App: Retorna HTTP 401 Unauthorized (Token Expirado)
    
    Note over App: O Interceptor captura o erro 401 e pausa as requisições na fila!
    
    App->>API: POST /api/token/refresh/ (com Refresh Token)
    
    alt Refresh Token Válido
        API-->>App: Retorna Novo Access Token
        App->>App: Atualiza Access Token na memória do app
        App->>API: Executa novamente requisição pausada: GET /api/accounts/ (com novo Access Token)
        API-->>App: Retorna HTTP 200 OK com os dados das contas
    else Refresh Token Expirado ou Inválido
        API-->>App: Retorna HTTP 401 (Sessão Expirada)
        App->>App: Limpa credenciais locais e redireciona usuário para a tela de Login
    end
```

---

## 6. Boas Práticas de Proteção de Segredos no Banco de Dados

* **Armazenamento de Senhas:** O Django armazena as senhas utilizando o algoritmo de hashing unidirecional **PBKDF2** com salt individual por usuário e rotações de chave SHA256, inviabilizando ataques de dicionário (*Rainbow Tables*).
* **Segredos 2FA:** A chave secreta base32 gerada pela view `TwoFactorSetupView` é mantida de forma privada no banco de dados e nunca deve ser compartilhada com outros usuários ou exposta em endpoints que não sejam o de inicialização de segurança de autoria do próprio usuário logado.
