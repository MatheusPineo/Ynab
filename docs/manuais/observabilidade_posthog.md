# 🔍 Diagnóstico e Estabilidade (Integração PostHog)

Para garantir que a sua experiência no **Vault Finance OS** seja sempre fluida, segura e livre de travamentos, implementamos um sistema moderno de telemetria e diagnóstico automatizado de falhas através da integração com o **PostHog**.

Este manual explica como esse recurso funciona para manter o aplicativo estável e como você pode gerenciar essa funcionalidade.

---

## 🚀 Como Funciona a Estabilidade do Sistema?

O monitoramento do PostHog atua em duas frentes silenciosas para proteger seu fluxo de trabalho financeiro:

### 1. Detecção Preventiva de Erros (Backend)
Quando ocorre alguma falha inesperada nos servidores (como falhas temporárias ao processar um arquivo de transações ou erros de conexão de banco de dados), o sistema registra automaticamente os detalhes técnicos essenciais do problema.
- **Resolução ágil:** Nossa equipe de engenharia é notificada instantaneamente, permitindo corrigir bugs em minutos, frequentemente antes mesmo que você perceba a falha.
- **Proteção em testes:** Durante simulações de desenvolvimento ou execuções de testes automatizados, o rastreamento é completamente desabilitado para não poluir os dados da plataforma.

### 2. Otimização de Performance e Usabilidade (Frontend)
Na versão Web e Mobile, o aplicativo acompanha o tempo que as páginas levam para carregar e identifica se há alguma lentidão ao criar orçamentos ou transferir valores entre envelopes.
- **Gravação de Sessão:** Permite a análise visual de erros de layout ou de comportamento no aplicativo de forma segura, garantindo que a equipe de suporte entenda o exato fluxo de ações que causou um travamento.
- **Privacidade total:** Nenhuma informação pessoal confidencial (como senhas ou números de documentos confidenciais) é registrada.

### 3. Rastreamento de Anomalias de Cálculo (Invariantes de Negócio)
Para evitar "erros silenciosos" (quando o aplicativo não trava, mas realiza uma conta errada por falha interna de arredondamento de centavos, por exemplo), o sistema verifica a exatidão das contas matematicamente em tempo real.
- **Verificação Invisível:** Se a divisão de uma receita compartilhada (como no Smart Income Splitter) apresentar uma diferença de soma, o sistema envia discretamente um alerta de anomalia para nossa equipe de engenharia investigar, sem atrapalhar a sua navegação ou interromper o uso do app.
- **Precisão Garantida:** Esses alertas garantem que qualquer "bug matemático" seja pego antes mesmo de afetar a consistência do seu orçamento histórico.

### 4. Resolução Nítida de Nomes de Erros (Desofuscação)
Em sistemas de produção, o código geralmente é compactado (minificado) para carregar mais rápido, o que bagunça os nomes originais de funções e telas durante um erro (exibindo siglas como `aOe` ou `ao`).
- **Nomes Preservados:** Nosso sistema de build foi ajustado para preservar o nome real das funções e classes (`keepNames`), além de publicar mapas de código (*Source Maps*).
- **Resolução de Alta Fidelidade:** Isso permite que a telemetria do PostHog traduza automaticamente a sigla obfuscada de volta para o nome correto da tela ou componente do código, acelerando consideravelmente o diagnóstico do time de suporte.

---

## 🔑 Configuração das Variáveis de Telemetria

Caso você esteja hospedando sua própria instância do Vault Finance OS ou queira configurar chaves de rastreamento personalizadas, utilize as seguintes variáveis em seus arquivos de configuração `.env`:

### No Servidor (Backend):
- `POSTHOG_API_KEY`: A chave secreta do seu projeto no PostHog.
- `POSTHOG_HOST`: O endereço do servidor PostHog (Padrão: `https://us.i.posthog.com`).
- `TESTING`: Quando definida como `True`, desativa completamente a telemetria (ideal para o ambiente de testes local).

### No Aplicativo (Frontend):
- `VITE_POSTHOG_KEY`: A chave pública do seu projeto no PostHog.
- `VITE_POSTHOG_HOST`: O endereço do servidor de envio de métricas (Padrão: `https://us.i.posthog.com`).

---

## 🛡️ Segurança e Privacidade dos Dados

A privacidade dos seus dados financeiros é a nossa maior prioridade. O sistema de telemetria é projetado sob conformidade estrita da LGPD/GDPR:
1. **Anonimização:** Usuários não autenticados enviam dados sob uma identidade anônima geral.
2. **Dados Mascarados:** Valores exatos de orçamentos e transações não são capturados de forma legível por ferramentas de marketing.
3. **Foco Técnico:** O sistema armazena apenas dados de depuração de software, caminhos de navegação e metadados de requisições HTTP (como o tipo do erro e a rota acessada).
