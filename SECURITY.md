# Política de Segurança e Divulgação de Vulnerabilidades — Vault Finance OS

Nós do **Vault Finance OS** levamos a segurança dos dados financeiros e a privacidade de nossos usuários extremamente a sério. Se você é um pesquisador de segurança, auditor de código ou membro da comunidade e descobriu uma vulnerabilidade em nosso sistema, agradecemos o seu esforço para relatar isso de forma privada e coordenada.

---

## 1. Versões Suportadas

Ativamente fornecemos correções de segurança para as seguintes ramificações do nosso ecossistema:

| Versão | Suportada | Patches de Segurança |
| :--- | :---: | :--- |
| **`v1.2.x` (Atual)** |  | Correções imediatas e prioritárias. |
| **`v1.1.x`** |  | Apenas correções de criticidade Alta ou Crítica. |
| **`v1.0.x`** | ❌ | Descontinuada. Recomendamos atualizar para a `v1.2.x`. |

---

## 2. O que deve ser Reportado?

Encorajamos o reporte privado de falhas como:

* Falhas de injeção de código (SQL Injection, Remote Code Execution).
* Bypass ou quebra de autenticação de dois fatores (2FA/TOTP).
* Vazamento ou desvio de dados financeiros sensíveis entre contas de diferentes inquilinos (Multi-tenant data isolation failure).
* Problemas de criptografia de senhas ou chaves simétricas de criptografia de banco.
* Falhas de falsificação de requisições cross-site (CSRF) em endpoints críticos de transferência de dinheiro.

---

## 3. Como Reportar uma Vulnerabilidade (Canal Privado)

**ATENÇÃO:** **NÃO abra uma issue pública no GitHub para relatar problemas de segurança.** Isso expõe ativamente o sistema e os usuários a potenciais explorações maliciosas.

Por favor, envie o relatório detalhado para o e-mail privado do nosso comitê de segurança:

📩 **seguranca@vaultfinance.os** (Simulado para fins de governança)

### O que incluir no seu relatório:
1. **Descrição da Vulnerabilidade:** Detalhamento do impacto e vetor de ataque.
2. **Passo a Passo de Reprodução (PoC):** Scripts, payloads ou capturas de tela demonstrando o exploit.
3. **Recomendações de Mitigação (Opcional):** Sugestões de correção no código (views, middlewares, serializadores).

---

## 4. Nosso SLA de Resposta e Correção (Service Level Agreement)

Nossa equipe técnica compromete-se a analisar e corrigir as falhas reportadas com base nos seguintes prazos máximos de severidade:

| Severidade | Prazo de Resposta Inicial | Prazo para Patch (Correção) | Exemplos de Vulnerabilidades |
| :--- | :--- | :--- | :--- |
| **Crítica** | 12 horas | **48 horas** | Execução remota de código, vazamento massivo de saldos. |
| **Alta** | 24 horas | **5 dias úteis** | Bypass do 2FA, quebra de isolamento de tenant. |
| **Média** | 48 horas | **15 dias úteis** | Desvio de permissões de visualização sem alteração de saldo. |
| **Baixa** | 5 dias úteis | **30 dias úteis** | Cabeçalhos de segurança ausentes em servidores estáticos. |

---

## 5. Divulgação Pública Coordenada

Adotamos a **Divulgação Coordenada de Vulnerabilidades (Coordinated Vulnerability Disclosure)**:
* Comprometemo-nos a manter o pesquisador atualizado sobre o progresso da correção.
* Uma vez que o patch de segurança for implantado com sucesso em produção, publicaremos os créditos e detalhes técnicos em nosso [CHANGELOG.md](file:///C:/Users/mathe/PROJETO-YNAB/CHANGELOG.md) ou em avisos de segurança no GitHub, caso acordado mútua e previamente.

## 6. Safe Harbor (Porto Seguro para Pesquisas)

Se você conduzir sua pesquisa de segurança de boa fé, de acordo com esta política:
* Não tomaremos medidas legais contra você.
* Não solicitaremos investigações criminais de suas atividades.
* Trabalharemos em colaboração técnica para resolver o problema rapidamente.
