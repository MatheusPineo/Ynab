# Registro de Alterações — Vault Finance OS (Changelog)

Todas as alterações notáveis, correções de bugs, novas funcionalidades e marcos estéticos aplicados ao **Vault Finance OS** são registrados de forma cronológica neste documento. Ele segue rigorosamente o padrão internacional do [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/) e adota o Versionamento Semântico (**SemVer**): `MAJOR.MINOR.PATCH`.

A linha do tempo abaixo foi sincronizada e mapeada diretamente a partir do histórico real de commits do Git para refletir a evolução fidedigna de nosso software.

---

## [1.3.0] — 2026-05-10

Esta versão foca em automação de reconciliação financeira para saldos iniciais de todas as contas (contas mestre e subcontas), na governança e privacidade dos dados do usuário com a funcionalidade de zerar dados, e na flexibilidade organizacional através da movimentação hierárquica dinâmica de contas e subcontas.

### Adicionado
* **Movimentação Hierárquica Dinâmica de Contas (Drag & Drop na Web):** Integração de um sistema avançado de Drag & Drop HTML5 nativo no componente `AccountAccordion.tsx`, permitindo ao usuário reestruturar toda a árvore financeira ao arrastar qualquer conta para dentro de outra para torná-la subconta, de forma extremamente reativa e fluida.
* **Ação e Modal Inteligente "Mover Conta" (Otimizado para Celular / App):** Nova ação dedicada no menu `AccountActions.tsx` que abre um modal interativo com seletor de contas pai elegíveis. O seletor calcula e filtra de forma recursiva a própria conta e todos os seus descendentes diretos ou indiretos, prevenindo loops cíclicos de recursão infinita e oferecendo uma usabilidade de toque perfeita para telas móveis.
* **Validação Ativa Anti-Loop no Backend (Django):** Inclusão de um algoritmo de validação no método `validate` do `AccountSerializer` que barra qualquer tentativa de mover uma conta para dentro de si mesma ou de seus próprios descendentes directos/indiretos, retornando o código de erro de integridade `400 BAD REQUEST` para blindar o cálculo dos saldos recursivos na árvore financeira.
* **Geração Automática de Receitas para Todas as Contas:** Implementação de regras de automação transacional no backend Django (`AccountViewSet`), de modo que, ao definir o Saldo Atual de qualquer conta (mestre ou subconta, seja na criação ou edição), o sistema gera automaticamente uma transação do tipo receita (em caso de aumento de saldo) ou despesa de ajuste (em caso de redução). As transações são marcadas como efetivadas (`status='realized'`) e aplicadas ao saldo (`is_applied_to_balance=True`) para fins históricos, eliminando qualquer dessincronização entre saldos e registros transacionais.
* **Migrações de Dados Retroativas de Saldos (0019 & 0020):** Criação das migrações de dados Django `0019_create_initial_balances_for_subaccounts` e `0020_create_initial_balances_for_master_accounts` para gerar retroativamente transações de receita com descrição "Saldo Inicial" para todas as subcontas e contas mestre com saldo positivo que ainda não possuíam histórico transacional, regularizando de forma limpa e automática as contas antigas no banco de dados após o deploy.
* **Endpoint de Reset Permanente de Dados Financeiros:** Nova APIView segura no backend `/auth/profile/reset-data/` restrita a usuários autenticados, que executa uma remoção atômica em bloco de todas as transações, contas, categorias, orçamentos, metas e dívidas vinculadas ao usuário logado, preservando sua conta de acesso, credenciais e perfil (idioma, 2FA, etc.).
* **Zona de Perigo com Dupla Confirmação nas Configurações:** Interface do usuário premium na aba "Dados" em `Settings.tsx` com uma seção visual estilizada de "Zona de Perigo" de alto impacto estético, integrada com um modal de dupla confirmação de segurança que exige do usuário digitar a palavra-chave "EXCLUIR" para prevenir ações destrutivas acidentais.
* **Novos Casos de Teste Automatizados (Backend):** Inclusão de testes robustos no Pytest em `test_accounts.py` (`test_automatic_income_on_account_creation`, `test_automatic_adjustment_on_account_balance_update`, `test_account_circular_dependency_prevention` e `test_profile_reset_data`) para auditar todas as novas regras de negócio, prevenção de ciclos cíclicos e garantir 100% de estabilidade e integridade funcional.

### Alterado
* **Refatoração Visual Premium dos Badges de Teto de Contas:** Separação do indicador de limite/teto das contas em dois pills independentes, de cantos perfeitamente arredondados (`rounded-full`) e responsivos: o primeiro contendo o ícone de medidor (`Gauge`) acompanhado do valor do limite monetário, e o segundo exibindo a porcentagem consumida. O tamanho da fonte foi ampliado para `text-[13px]` para harmonizar elegantemente com a escala de tamanho do nome da conta, aprimorando significativamente o equilíbrio visual e a legibilidade das métricas de teto em telas desktop e mobile.

---

## [1.2.0] — 2026-05-10

Esta versão marca a consolidação completa da infraestrutura de governança, conformidade legal internacional com LGPD e GDPR, segurança ativa contra IDOR/BOLA e documentação exaustiva de negócios e matemática do ecossistema.

### Adicionado
* **Sincronização Bidirecional Automatizada de Idioma:** Sincronização inteligente e automática entre o idioma selecionado na Landing Page/Site e o idioma ativo na aplicação logada, persistindo as preferências diretamente no banco de dados através da rota `/auth/profile/update/` e utilizando uma flag local `vault_lang_explicit` para preservar a escolha do usuário sem perda de dados em novos dispositivos.
* **Compliance de Privacidade (LGPD & GDPR):** Criação das páginas institucionais [TermsOfUse.tsx](file:///C:/Users/mathe/PROJETO-YNAB/Ynab/src/pages/TermsOfUse.tsx) (Termos de Uso), [PrivacyPolicy.tsx](file:///C:/Users/mathe/PROJETO-YNAB/Ynab/src/pages/PrivacyPolicy.tsx) (Política de Privacidade) e [CookiePolicy.tsx](file:///C:/Users/mathe/PROJETO-YNAB/Ynab/src/pages/CookiePolicy.tsx) (Política de Cookies).
* **Políticas Corporativas de SLA e Pentests:** Integração formal de metas de uptime de 99.9% com reembolso em créditos na mensalidade, RTO de 4h/RPO de 1h, e garantias de blindagem contra ataques de quebra de escopo por IDOR (testes de intrusão anuais) nas páginas de políticas legais.
* **Banner Dinâmico de Cookies e Consentimento:** Implementação da store Zustand `useConsentStore` e do componente flutuante multilíngue adaptativo `CookieBanner` integrado ao hook `useConsentTracker` para ativação reativa de scripts de rastreamento de marketing/analytics somente sob opt-in explícito.
* **Rodapé Premium Multi-Colunas:** Novo rodapé completo na Landing Page, com layout dark mode de alta definição, alinhamento vertical rigoroso de pixel e dados institucionais/DPO completos.
* **[NEW] [SECURITY.md](file:///C:/Users/mathe/PROJETO-YNAB/SECURITY.md):** Manual de divulgação coordenada de vulnerabilidades e SLAs ágeis para patches de segurança.
* **[NEW] [CONTRIBUTING.md](file:///C:/Users/mathe/PROJETO-YNAB/CONTRIBUTING.md):** Guia prático de governança, convenções de commits, guias de estilo PEP 8 e ESLint/Prettier e fluxos de Pull Requests.
* **[NEW] [DEPLOYMENT.md](file:///C:/Users/mathe/PROJETO-YNAB/DEPLOYMENT.md):** Guia prático de orquestração com Docker Compose, pipelines automatizadas via GitHub Actions, rotinas de backups automatizados do PostgreSQL no AWS S3 e compilação do Capacitor Mobile para Android e iOS.
* **[NEW] [TESTING.md](file:///C:/Users/mathe/PROJETO-YNAB/TESTING.md):** Estratégia de QA, testes relacionais de recursividade financeira com Pytest e mocks de chamadas HTTP no frontend com Vitest.
* **Wikis e Páginas de Conhecimento:** Criação de guias matemáticos e conceituais do ecossistema ([wiki_recursividade_infinita.md](file:///C:/Users/mathe/PROJETO-YNAB/docs/wiki_recursividade_infinita.md), [wiki_multimoedas.md](file:///C:/Users/mathe/PROJETO-YNAB/docs/wiki_multimoedas.md) e [wiki_seguranca.md](file:///C:/Users/mathe/PROJETO-YNAB/docs/wiki_seguranca.md)).

### Corrigido
* **Alinhamento de Botões dos Planos na Landing Page:** Ajuste de posicionamento vertical dos botões "Começar de Graça" e "Assinar o Pro" adotando um contêiner flexível com altura mínima uniforme de `min-h-[200px] sm:min-h-[180px]` para os blocos superiores de preços e títulos, garantindo alinhamento pixel-perfect mesmo se as descrições ou preços quebrarem linha em telas menores.
* **Menu de Configurações e Unificação Funcional da Sidebar:** Refatoração completa do `NavLink` do botão de configurações em [Sidebar.tsx](file:///C:/Users/mathe/PROJETO-YNAB/Ynab/src/components/dashboard/Sidebar.tsx) para adotar a exata mesma estrutura funcional baseada em children baseadas em `isActive` das demais rotas, incorporando o indicador ativo vertical reativo na esquerda, controle de truncagem e duração de transição idênticos.
* **Rigidez de Layout da Sidebar (Prevenção de Esmagamento):** Inclusão da diretiva `shrink-0` (ou `flex-shrink-0`) no contêiner `<aside>` da [Sidebar.tsx](file:///C:/Users/mathe/PROJETO-YNAB/Ynab/src/components/dashboard/Sidebar.tsx) e na div wrapper do [Layout.tsx](file:///C:/Users/mathe/PROJETO-YNAB/Ynab/src/components/dashboard/Layout.tsx), impedindo que o motor de renderização flexbox do navegador esprema a barra lateral em janelas estreitas e mantendo os itens sempre alinhados na horizontal.
* **Bordas do Layout Geral (Sidebar e Header):** Ajuste fino de posicionamento no `Topbar.tsx` e `Sidebar.tsx` estabelecendo altura rígida de `h-16` para alinhar de forma milimétrica as bordas e divisores verticais e horizontais.

---

## [1.1.0] — 2026-05-09

Esta versão foca em acessibilidade global, experiência estética premium, suporte multi-idiomas nativo e inteligência de distribuição de limites orçamentários.

### Adicionado
* **Suporte Multi-idioma de Alta Fidelidade (i18n):** Tradução completa da landing page e do app financeiro para **12 idiomas globais** (`pt-BR`, `en`, `es`, `fr`, `de`, `it`, `nl`, `pl`, `zh`, `ja`, `ar`, `hi`) via `react-i18next` com suporte a orientação RTL.
* **Suporte a 160+ Moedas Globais:** Motor dinâmico de formatação financeira usando a API Intl do navegador e seletor de moedas rápido com busca por texto.
* **Controle de Teto de Contas (Ceilings):** Adicionada a propriedade opcional `ceiling` para estabelecer limites de saldo em contas e envelopes.
* **Algoritmo de Distribuição de Excessos (*distribute_excess*):** Lógica matemática inteligente para redistribuir saldos excedentes ao teto para subcontas filhas e reservas, operando sob o algoritmo de preenchimento de água (*water-filling algorithm*).
* **Estratégia de Cobertura de Gastos Excessivos (*cover_overspending*):** Cobertura automática de saldos negativos distribuindo a pendência entre contas irmãs.
* **Página de Gestão de Dívidas:** Nova interface [Debts.tsx](file:///C:/Users/mathe/PROJETO-YNAB/Ynab/src/pages/Debts.tsx) com a store `useDebtStore` para amortização progressiva de passivos.
* **Gestos e Pull-to-Refresh Mobile:** Adicionados gestos nativos de swipe para Android/iOS e gesto de puxar para atualizar saldos na tela.
* **Suíte Completa de Testes Automatizados (100% Pass):** Implementação massiva de testes para persistência de limites de teto, árvores de agregação recursiva e segurança no backend e frontend.

### Alterado
* **Pruning de Código Legado:** Exclusão definitiva de arquivos não-utilizados e pacotes órfãos do antigo protótipo React Native para aliviar o bundle.
* **Remoção de Idiomas Redundantes:** Remoção do `pt-PT` para unificar todos os termos em língua portuguesa sob o Português do Brasil (`pt-BR`).

---

## [1.0.0] — 2026-05-05 - 2026-05-08

Esta versão representa o lançamento estável inicial de produção do **Vault Finance OS**, consolidando os apps mobile nativos e a sincronização offline de dados.

### Adicionado
* **Compilação Mobile Nativa com Capacitor v8:** Estruturação dos aplicativos Android e iOS utilizando o Capacitor com suporte nativo a biometria, armazenamento seguro e controle de hardware.
* **Autenticação Nativa com Google Sign-In:** Integração nativa usando o plugin `@codetrix-studio/capacitor-google-auth` e comunicação segura com endpoints sociais do Django REST Framework.
* **Processador de Sincronização Offline-First:** Arquitetura de persistência local de transações com sincronização em segundo plano assim que a conectividade for restabelecida.
* **Mecanismo de Transações Pendentes e Efetivadas:** Distinção de saldos líquidos em tempo real baseada no status (`pending` e `realized`) e agendamentos futuros.
* **Floating Action Button (FAB):** Adicionado botão de atalho flutuante de '+' na interface móvel, ocultando menus redundantes do desktop no mobile.

---

## [0.9.0] — 2026-05-04

Foco em BI (Business Intelligence), metas patrimoniais de longo prazo e algoritmos de distribuição sistemática de receitas.

### Adicionado
* **Dashboard de BI Integrado:** Gráficos interativos em Modo Escuro de evolução patrimonial líquida (*Net Worth*) e fatiamento de despesas em formato de rosca por categorias.
* **Sistema de Metas Patrimoniais (Goals):** Criação de alvos financeiros flexíveis com suporte a múltiplos ativos e moedas.
* **Templates Modulares de Distribuição:** Gestão de regras predefinidas para recebimento de receitas líquidas, com alocações percentuais fixas ou dinâmicas para categorias orçamentárias.

---

## [0.8.0] — 2026-05-02 - 2026-05-03

Segurança multifator, persistência cambial de taxas e visualização detalhada de portfólio.

### Adicionado
* **Autenticação em Duas Etapas (2FA):** Lógica integrada ao backend (Django) e frontend (React) usando o algoritmo de código dinâmico TOTP (RFC 6238) via `pyotp`.
* **Dashboard Detalhado de Conta:** Interface com macro e micro visualizações, filtros temporais dinâmicos e design baseado em glassmorphism de alta fidelidade.
* **Sincronização Cambial Automática:** Atualização em segundo plano das taxas de conversão de moedas estrangeiras via banco de dados Supabase (PostgreSQL).

---

## [0.7.0] — 2026-04-26 - 2026-05-01

Infraestrutura de nuvem, controle de sessões e fluxos sociais web.

### Adicionado
* **Autenticação Social Web:** Fluxo funcional do Google OAuth2 integrado ao frontend SPA React.
* **Sincronização por Tarefas Cron:** Criação do endpoint de `/ping` de baixo custo computacional no Django para manter ativas e aquecidas as instâncias gratuitas do Render e Supabase.
* **Registro Flexível de Novos Usuários:** Rota de cadastro no DRF mapeando dinamicamente campos de perfil e preferências.
* **Deploy Integrado Multicloud:** Configuração de arquivos `vercel.json` para suporte a rotas SPA, orquestração Docker para Oracle Cloud e build scripts automatizados no Render.

---

## [0.6.0] — 2026-04-25

Consolidação da lógica financeira recursiva e de categorização.

### Adicionado
* **Lógica Orçamentária Recursiva (Base-Zero):** Agregação inteligente de saldos em sub-envelopes recursivos de forma infinita.
* **Importador de Extratos Bancários OFX:** Upload e processamento automático de arquivos de transação financeira OFX nativo do backend.
* **Refatoração completa para TanStack Query:** Migração de toda a camada de sincronização assíncrona do frontend para React Query, mitigando problemas de concorrência.
* **Adoção Global de Dark Mode Premium:** Estilização de todo o ecossistema com paletas escuras de alto contraste.

---

## [0.5.0] — 2026-04-21 - 2026-04-22

Nascimento do Vault Finance OS.

### Adicionado
* **Estrutura Base Multirepositório:** Configuração inicial do Django REST Framework (Backend) e do React + Vite + TypeScript + TailwindCSS (Frontend).
* **Autenticação Baseada em JSON Web Tokens (JWT):** Implementação inicial de fluxo seguro de tokens com SimpleJWT (Access e Refresh tokens).
* **Initial Commit:** Envio inicial do repositório contendo as bases lógicas para o modelo relacional de transações.
