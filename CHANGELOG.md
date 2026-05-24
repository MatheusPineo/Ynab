## [1.35.28] - 2026-05-24

### Added
- Modal de Compras no Cart�o: Adicionado Segmented Control para o usu�rio alternar dinamicamente se o valor digitado corresponde ao 'Valor Total' da compra ou ao 'Valor da Parcela'. A UI agora calcula e exibe um texto de apoio explicativo em tempo real com as multiplica��es matem�ticas corretas e a nova flag (input_type) � enviada ao backend.
## [1.35.27] - 2026-05-24

### Added
- Bot�es de A��o na Fatura: Adicionados bot�es dedicados de edi��o (l�pis) e exclus�o (lixeira) em cada registro de compra no detalhamento da fatura de cart�es de cr�dito.

### Changed
- UI Selector de Faturas: Substitu�da a listagem horizontal em barra de bot�es por um componente padronizado e robusto com dois dropdowns (Select) para M�s e Ano id�ntico ao da tela de Transa��es, proporcionando muito mais organiza��o visual.
## [1.35.26] - 2026-05-24

### Fixed
- Corre��o de Reatividade da UI: O formul�rio de compras de Cart�es de Cr�dito agora faz a invalida��o (refetch) das contas YNAB locais garantindo que a redistribui��o autom�tica do saldo entre a Categoria e o Cart�o reflita instantaneamente no net worth.
- Sele��o de Fatura Aberta por Padr�o: Ao abrir o Painel de Cart�es de Cr�dito ou ao registrar uma compra, a UI agora seleciona ativa e diretamente a fatura atual em aberto (is_closed: false), evitando que o usu�rio visualize faturas futuras vazias por engano.
## [1.35.25] - 2026-05-24

### Fixed
- Corre��o cr�tica no fluxo de cria��o de Transa��es de Cart�o de Cr�dito. O backend n�o estava gerando a fatura corretamente devido a uma incompatibilidade no payload JSON (	otal_installments vs installment_count).
- Corre��o na UI de Cart�es de Cr�dito onde o Limite Dispon�vel n�o atualizava visualmente ap�s o lan�amento de uma compra sem precisar recarregar a p�gina.
## [1.35.24] - 2026-05-24

### Removed
- Removido o campo Categoria (YNAB) do formulário de homologação do Inbox Inteligente.
- Removida a aba completa de Insights de todo o ecossistema do frontend (Sidebar, BottomNav, App Routes e SwipeNavigation) para focar na aba Relatórios.

## [1.35.23] - 2026-05-24

### Fixed
- Correção de erro fatal (ReferenceError) na página de Inbox ocasionado pela falta de importação do CurrencyInput.
- Refinamento visual da barra de progresso Overfunded no AccountAccordion substituindo gradiente estático por um gradiente Tailwind fluido de cyan para roxo (g-gradient-to-r).
- Atualização de micro-rótulos informativos no acordeão para usar cor e contraste adequados (	ext-gray-500).

## [1.35.22] - 2026-05-24

### Changed
- Refatoração Visual do `AccountAccordion`: As badges poluídas de limite foram removidas e convertidas para uma visualização moderna e elegante em grid.
- Implementação de Barra de Progresso Inteligente para Subcontas: 
  - Subcontas com Teto agora possuem uma barra que transita do vermelho (`bg-rose-500`) ao verde (`bg-emerald-500`) quando atingem 50% de completude.
  - Subcontas "Overfunded" (>100%) recebem barra na cor ciano brilhante (`bg-cyan-500`) com efeito neon (drop-shadow).
  - Subcontas com Limite Livre (sem teto definido) recebem uma discreta barra neutra preenchida na cor cinza (`bg-slate-700`) constando apenas o rótulo de "Saldo Livre".

## [1.35.21] - 2026-05-24

### Fixed
- Estancamento do Runtime Error no módulo `Reports`: Implementado robusto mecanismo de Optional Chaining (`?.`) e verificação unificada de estado de Loading em todo o ecossistema de gráficos (Recharts) das Análises Avançadas. 
- Implementada proteção explícita para forçar a renderização do `<EmptyState />` caso os dados de rede retornem vazios da API do backend. Isso preza por uma navegação fluida sem falhas de índice (`undefined`) no DOM.

## [1.35.20] - 2026-05-24

### Added
- Implementado um robusto `ErrorBoundary` global em React para capturar falhas em toda a árvore de componentes e renderizar uma UI de fallback ("White Screen of Death" prevenida).
- Adicionado encapsulamento específico de `ErrorBoundary` em torno do rotemento principal no `App.tsx` e blocos de dados pesados no `Dashboard.tsx` (ex: Gráficos e Widgets).

## [1.35.19] - 2026-05-24

### Fixed
- Restaurado o comportamento nativo de rolagem vertical (mouse wheel) dentro do componente `GlobalAccountSelector` aplicando `overflow-y-auto`, `overscroll-contain` e uma altura máxima (`max-h-[300px]`) no container da lista de subcontas, impedindo vazamento visual na tela.

## [1.35.18] - 2026-05-24

### Fixed
- Aplicado o modificador de layout `col-span-full` nos wrappers (DIVs) nativos que englobam o `GlobalAccountSelector` em todos os modais e páginas (AddTransactionModal, DistributionModal, ImportModal, CreditCards, Inbox, AccountActions), rompendo armadilhas de grid e forçando o design de largura total em toda a UI.

## [1.35.17] - 2026-05-24

### Changed
- Refatorado a seleção hierárquica de contas. O `AccountCombobox` foi promovido a `GlobalAccountSelector`, posicionado como o componente universal em toda a aplicação (Adicionar Receita, Adicionar Despesa, Transferências, Inbox, Pagamento de Dívidas).
- Enforçado strict layout: `GlobalAccountSelector` agora ocupa `w-full` e `col-span-full` para nunca dividir a linha com outros campos, garantindo padronização visual global.
- Atualizado o dropdown legado de 'Nova Conta Pai' no painel de Ações de Conta para consumir nativamente o novo seletor com a flag `showRootOption`.

## [1.35.16] - 2026-05-24

### Changed
- Refatorado formulário de Modal de Compras de Cartão de Crédito (`CreditCards.tsx`) substituindo o `<select>` limitador de 12x por um `<input type="number">` dinâmico e sem limite.
- Corrigido property payload para o endpoint de transações, de `amount` para `total_amount` garantindo integridade das requisições.
- Lógica reativa da seleção de `A partir de qual parcela?` dinamicamente amarrada ao total de parcelas customizadas.

## [1.35.15] - 2026-05-24

### Fixed
- Frontend: Scaled Credit Card brand SVGs applying internal padding (`p-1`) directly to the `<img />` tag and strictly ensuring `object-contain` without double-padding, guaranteeing the image breathes and respects the strict rectangular bounds.

## [1.35.14] - 2026-05-24

### Fixed
- Backend & Reports: Fixed net worth logical discrepancies (`liabilities_diff` processing `is_income` accurately). Removed all React hook dependency warnings inside `Reports.tsx` and removed mock data fallbacks, fully syncing frontend Empty States to backend API payload.

## [1.35.13] - 2026-05-24
- **Reports UI Integration:** Conectados os componentes de gráficos (`AreaChart`, `RePieChart`, `Treemap`, `LineChart`, etc) na página `Reports.tsx` aos endpoints reias do backend, abolindo dados falsos locais.
- **Empty State UX:** Implementado o componente genérico de fallback `EmptyState` ("Ainda sem dados suficientes.") em todos os gráficos da aplicação. Sempre que a API não retornar informações para o período solicitado, a quebra/gitch do Recharts é interceptada e uma UI amigável e limpa é exibida.

## [1.35.12] - 2026-05-24

### Alterado
* **Reports API Engine:** Implementado motor matemático no backend (Django ORM) para cálculo em tempo real de Fluxo de Caixa, Despesas por Categoria, Uso de Cartão de Crédito e Evolução do Patrimônio Líquido, preparando a plataforma para remoção de mock data na interface.

## [1.35.11] - 2026-05-24
### Fixed
- Frontend: Refined the visual weight and internal padding of `CreditCardBrandIcon` wrappers (`p-0.5`). SVGs now fill the container gracefully (`w-full h-full object-contain`), achieving perfect visual parity with the generic `<CreditCard />` fallback icon.

## [1.35.10] - 2026-05-24
### Fixed
- Frontend: Fixed "double-wrapper" layout bug on Credit Cards view that was shrinking the SVG brand logos. Standardized all icon containers to perfectly uniform dimensions (`w-12 h-8`) with conditional backgrounds (white for brands, transparent/dark for fallbacks) managed directly inside the `CreditCardBrandIcon` component.

## [1.35.9] - 2026-05-24
### Changed
- Frontend: Refactored `CreditCardBrandIcon` to consume premium SVGs downloaded from UXWing (Visa, Mastercard, Amex, Elo, JCB, UnionPay).
- Frontend: Implemented robust fallback logic using React `onError` event to automatically replace broken image links with a generic Lucide `CreditCard` icon.

## [1.35.8] - 2026-05-24
### Changed
- Frontend: Replaced the static, custom-made credit card brand representations with the new `CreditCardBrandIcon` component.
- Frontend: Refactored `CreditCardBrandIcon` to use robust inline SVG components for Visa, Mastercard, American Express, Elo, UnionPay, and JCB, bypassing Wikimedia 403 Forbidden hotlinking issues. Added a white pill wrapper to ensure perfect contrast on Dark Mode.

## [1.35.7] - 2026-05-24
### Fixed
- Frontend: Reverted CategoryCombobox to AccountCombobox in the Credit Card Purchase Modal to match the Lançar Transação behavior where Accounts are used as sub-expenses.
- Backend: Added expense_account to CreditCardTransaction model and updated process_credit_card_transaction to support assigning a purchase to a sub-account instead of a Category.
- Backend: Fixed brand saving and representation issue by ensuring migration was deployed.

## [1.35.6] - 2026-05-23
### Added
- Frontend: CategoryCombobox component for hierarchical category selection in credit card purchases.
- Backend & Frontend: Added rand field to CreditCard model and updated views/serializers to store and return the brand.
- Frontend: UI edit and delete features for Credit Cards.
- Frontend: Credit card brand visual rendering on the frontend card UI.

### Changed
- Frontend: Replaced native Select with CategoryCombobox for category selection in the Credit Card Purchase Modal.

# Registro de Alterações — Vault Finance OS (Changelog)

Todas as alterações notáveis, correções de bugs, novas funcionalidades e marcos estéticos aplicados ao **Vault Finance OS** são registrados de forma cronológica neste documento. Ele segue rigorosamente o padrão internacional do [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/) e adota o Versionamento Semântico (**SemVer**): `MAJOR.MINOR.PATCH`.

A linha do tempo abaixo foi sincronizada e mapeada diretamente a partir do histórico real de commits do Git para refletir a evolução fidedigna de nosso software.

## [1.35.6] - 23 de Maio de 2026

### Frontend
- **Cartões de Crédito:** Limpeza da interface do modal de Nova Compra (remoção de Spread/IOF e bloco informativo).
- **Cartões de Crédito:** Correção no seletor hierárquico de Subconta de despesa, igualando ao formulário de cadastro de despesas padrão.
- **Cartões de Crédito:** Inclusão de um Tooltip explicativo para a seleção de parcela inicial e adição de seletor de Bandeira do Cartão (Visa, Mastercard, American Express, Elo, UnionPay e JCB).

## [1.35.5] - 2026-05-23

### Features & Integrations
- **Agrupamento de Faturas de Cartao:** Refatoracao completa da tela de transacoes (Mobile e Desktop) para agrupar visualmente as transacoes de cartao de credito atraves de um "Master Row" (Fatura), empacotando os debitos subjacentes dentro de um elemento colapsavel (Invoice Packaging).
- **Governanca UX/UI (Cartoes):** Implementado um estado customizado para as validacoes nativas dos navegadores e adequacao da nomenclatura sistemica, mudando de "Categoria YNAB" para "Subconta de Despesa".

## [1.35.4] - 2026-05-23

### ? Features & Integrations
- **Modo Demo & Onboarding:** Implementado um novo motor de Seeding de banco de dados (seeding.py). Agora, quando um novo usurio se cadastra, o YNAB cria silenciosamente toda a taxonomia padro de categorias para facilitar o envelopamento. Tambm criamos a 'rea de Testes e Reset' nas Configuraes, contendo um Modo Demo de 1 clique que gera contas, limites falsos de cartes, dezenas de transaes e investimentos pre-populados para que o cliente aprenda a usar o Vault Finance OS interagindo com uma massa de dados rica antes de plugar suas finanas reais.

## [1.35.3] - 2026-05-23

### ?? Bug Fixes & Improvements
- **Inbox (Envio em Massa):** Correo do bug de envio infinito no upload de vrias notas fiscais. O upload no frontend agora enfileira imagens uma a uma de modo sequencial com feedback de progresso na tela, evitando sobrecarga de mmoria no navegador, e suportando fallback robusto de erros individuais do motor de inteligncia artificial.
- **Cartes de Crdito:** Adicionado suporte para rastreamento flexvel de faturas: usurios agora podem optar por iniciar uma transao parcelada a partir de qualquer parcela inicial, ideal para compras realizadas no passado.

## [1.35.2] - 2026-05-22

### 🚀 Features & Integrations
- **Motor de Cotações em Tempo Real (Wealth):** Refatoração do `NetWorthCalculator` (`views.py`) para utilizar o `PortfolioEvolutionEngine`. O sistema agora se conecta automaticamente ao Alpha Vantage e HG Brasil via `MarketDataService` para baixar a cotação real de Ações, FIIs e ETFs a cada carregamento, atualizando o Patrimônio Líquido em tempo real.
- **Renda Fixa e Tesouro Direto Automatizados:** Integração com a API do Banco Central via HG Brasil para baixar a taxa CDI diária automaticamente. O motor agora projeta o valor de resgate futuro cota-a-cota para contratos pós-fixados baseados em dias úteis (Base-252).
- **Novo Ativo:** Adicionada a classe de ativo `TREASURY` (Tesouro Direto) na interface de usuário e banco de dados.

### 🐛 Bug Fixes & Improvements
- **Modal Novo Aporte (Wealth):** Criação e integração do componente `AddInvestmentActivityModal.tsx` na tela de Investimentos, permitindo o registro de operações (Compra, Venda, Dividendos) e cadastro dinâmico rápido de novos ativos.
- **Patrimônio & Investimentos (Wealth):** Correção crítica no endpoint `WealthSummaryView` (`views.py`) que estava retornando um array de posições em vez do objeto esperado pelo frontend (`{ holdings: [...], total_net_worth: ... }`). Isso causava um crash no React e acionava o fallback de erro 404 (Erro de conexão com o servidor) da UI.
- **Tradução de Menus (i18n):** Simplificada a chave `navigation.investments` em `pt-BR.json` para exibir apenas "Investimentos", corrigindo a redundância na Sidebar.

## [1.35.0] - 2026-05-22
### Added
- **Central de Ajuda (VitePress):** Inicialização do sistema isolado de documentação dentro de `docs/`.
- **Manuais Operacionais:** Criação massiva de guias e manuais passo-a-passo para usuários cobrindo: Metodologia de Envelopes YNAB, Cartões e Faturas, Inbox Inteligente e Auditoria, Gestão de Patrimônio, Configurações de Assinatura, Relatórios Analíticos e um módulo nativo de FAQ para casos isolados.
- **Wikis de Engenharia:** Expansão e refinamento do `wiki_seguranca.md` com manuais operacionais do fluxo de acesso Híbrido, configuração de Autenticação Multifator (2FA) e Gestão de Privacidade (LGPD/ConsentStore).

## [1.34.3] - 2026-05-22
### Added
- **Backend API (Wealth):** Adição da `PortfolioEvolutionEngine` em `services.py` contendo algoritmos matemáticos para evolução de patrimônio:
  - `calculate_fixed_income_evolution`: Capitalização diária de juros (CDI sobre base 252) sobre o `principal_amount` cruzando com a tabela `DailyCDIRate`.
  - `calculate_stock_position`: Processamento sequencial do *Ledger* de Ativos de Renda Variável (`BUY`, `SELL`, `SPLIT`) cruzando os estoques locais com o `MarketDataService` para aferir lucros, perdas e yield real-time.

## [1.34.2] - 2026-05-22
### Added
- **Backend API (Wealth):** Adição do `MarketDataService` em `services.py`, que implementa uma lógica robusta de *Failover* Multi-Tier para resgatar cotações em tempo real:
  - Alpha Vantage (Master) -> Twelve Data (Fallback) para ativos internacionais.
  - Alpha Vantage (Master) -> HG Brasil Finance (Fallback) para ativos da B3.
  - Local Cache (`DailyAssetPrice`) como última linha de defesa em caso de pane das APIs externas.

## [1.34.1] - 2026-05-22
### Added
- **Backend API (Wealth):** Atualização dos models `InvestmentAsset` e `InvestmentActivity` para adicionar novos campos (`principal_amount`, `cdi_percentage`).
- **Backend API (Wealth):** Criação dos novos models `DailyAssetPrice` (cache de cotas diárias de ações) e `DailyCDIRate` (taxa diária e anual de CDI, com cálculo automático da fração em dias úteis).

## [1.34.0] - 2026-05-22
### Added
- **Interface de Wealth & Investments (Fase 4):** Construção da tela principal de Investimentos (`Investments.tsx`) contendo Dashboard de Patrimônio Líquido com Sparklines, agrupamento de inventário (Renda Fixa, Ações, Cripto) e Livro-Razão (Ledger) histórico de atividades.
- **Backend API (Wealth):** Criação dos ViewSets (`InvestmentAssetViewSet`, `InvestmentActivityViewSet`) e do endpoint `/api/finance/wealth/summary/` conectando o frontend ao motor de cálculo de rendimentos. Integração via Zustand na store `useWealthStore.ts`.

## [1.33.1] - 2026-05-22
### Added
- **Motor Matemático de Renda Fixa Brasileira (Fase 3):** Implementada a classe matemática `BrazilianFixedIncomeEngine` em `backend/finance/brazilian_fixed_income.py`. A engine conta com cálculo autônomo da data da Páscoa para deduzir feriados nacionais (Sexta Santa, Carnaval, Corpus Christi) e calcula dias úteis na Base 252 da ANBIMA/B3. Também foi integrado o simulador de rentabilidade para ativos pós-fixados, capaz de deduzir exata e automaticamente as tabelas regressivas de IOF (0 a 30 dias) e de Imposto de Renda.

## [1.33.0] - 2026-05-22
### Added
- **Arquitetura de Portfólio de Investimentos (Fase 2):** Modelagem do livro-razão de custódia inspirada no Ghostfolio/Maybe. Foram criadas no backend (Django) as entidades `InvestmentAsset` e `InvestmentActivity` para rastreamento de compras, vendas, dividendos e desdobramentos de ativos financeiros, bem como o motor inteligente `NetWorthCalculator` capaz de calcular o Preço Médio e as posições exatas em tempo real de forma blindada contra erros de float (suporte até 8 casas decimais para Criptomoedas).

## [1.32.2] - 2026-05-22
### Changed
- Adicionada opção explícita de "Conta de Investimento" no Modal de Criação de Contas Raiz. Essa opção cria a conta nativamente como `account_type: 'investment'`, o que injeta a flag "Off-Budget" de forma transparente, blindando o orçamento diário. Um quadro explicativo com o conceito de Off-Budget e Patrimônio Líquido foi adicionado no modal para orientar o usuário durante a criação.

## [1.32.1] — 2026-05-22

Esta versão foca na unificação da gestão de visibilidade de abas (módulos), consolidando o poder de ocultar/exibir abas inteiramente na ferramenta da Sidebar e removendo a seção de "Módulos" de Configurações, garantindo uma fonte única de verdade (Single Source of Truth).

### Removido
* **Aba de Módulos nas Configurações:** Remoção completa do painel "Módulos Ativos do Sistema" de dentro da página de Configurações.
* **Store de Features (`useFeatureStore`):** Deleção completa da arquitetura paralela de gerenciamento de módulos, pois toda a visibilidade das ferramentas do Vault agora é estritamente definida através do array de `hiddenItems` da `useSidebarStore`.

### Alterado
* **Sidebar como Fonte Única de Verdade:** Todas as 11 áreas vitais do sistema (Visão Geral, Contas, Cartões, Transações, Inbox, Orçamento, Regra 50/30/20, Dívidas, Metas, Insights, e Relatórios) agora são controladas direta e unicamente pelo modal "Editar Menu" na própria barra lateral.
* **Rotas Dinâmicas (FeatureProtectedRoute):** A rota de proteção das ferramentas do sistema (`App.tsx`) foi refatorada para ler diretamente do array de atalhos da sidebar (`hiddenItems`), redirecionando o usuário de volta se ele tentar acessar uma aba que ele próprio ocultou do menu.
* **Botões de Nível em Relatórios:** Como as abas agora são controladas globalmente, todas as 9 sub-categorias (Iniciante, Intermediário, Avançado, etc.) de relatórios passam a estar permanentemente liberadas assim que o usuário habilita a aba pai de "Relatórios" na sidebar, descomplicando o uso.

## [1.32.0] — 2026-05-20

Esta versão traz controle e visibilidade globais para as pendências financeiras, além de filtros avançados para mineração de transações passadas.

### Adicionado
* **Layout e Abas Editáveis na Sidebar:**
  - Correção do alinhamento horizontal milimétrico da borda inferior entre a `Topbar` e o `Brand` da `Sidebar` pela unificação do uso da classe de cor `border-sidebar-border`, em conjunto com as classes `shrink-0` e `overflow-y-auto` na navegação.
  - Adição da ferramenta de "Editar Menu" na sidebar, movendo o ícone e botão de lápis para o fim do menu de navegação.
  - Sincronização persistente dos atalhos no Banco de Dados (Django `UserProfile` / `hidden_sidebar_items`), mantendo estado global sincronizado entre web e app Android.
* **Painel de Pendências Globais no Dashboard:** A seção de Transações Pendentes do Dashboard agora busca e exibe **todas** as pendências agendadas do sistema, categorizando visualmente por badges coloridas ("Vencido", "Vence hoje", "Vence amanhã").
* **Empty State de Elogio:** Quando todas as transações pendentes do mês selecionado forem pagas/efetivadas, o painel exibe uma mensagem de sucesso ("Tudo em dia!").
* **Filtros Avançados de Transações (`Transactions.tsx`):** Adicionados dois novos menus dropdown lado-a-lado à barra de busca:
  - Filtro por **Status** (Todas, Pendentes, Efetivadas).
  - Filtro por **Tipo** (Todas, Recorrentes).
* **Parâmetros de Filtro no Backend (`TransactionViewSet`):** O backend agora aceita `status=pending|realized` e `is_recurring=true|false` nativamente na querystring.

### Removido
* **Botão Duplicado:** O botão de "Nova Transação" avulso dentro do Dashboard (que ficava flutuando sobre o NetWorth) foi removido para priorizar a ação principal contida no cabeçalho.

## [1.31.0] — 2026-05-20

Esta versão foca na melhoria da gestão de Dívidas, adicionando a capacidade de registrar, nomear, editar e excluir débitos individuais associados a uma dívida (DebtCharge). Também foram aplicadas melhorias na busca, ignorando acentos em sugestões de transações e contas.

### Adicionado
* **Histórico Granular de Débitos em Dívidas (`Debts.tsx` e `models.py`):**
  - Implementação do modelo `DebtCharge` para tratar os acréscimos de dívida como instâncias independentes em vez de apenas incrementar o `original_amount`.
  - Inclusão do campo **Nome/Descrição** para especificar do que se trata cada novo débito gerado numa dívida ativa.
  - Implementação de Timeline híbrida unificando o histórico de "Pagamentos" e "Acréscimos" de forma cronológica na UI.
  - Adição da função de **edição de nome** e **exclusão** individual de débitos já lançados.

### Corrigido
* **Busca Agnóstica a Acentos e Maiúsculas:**
  - `AccountCombobox` e modal `AddTransactionModal` agora aplicam normalização via `NFD` para desconsiderar acentos e caracteres especiais, permitindo buscar "agua" e encontrar "água" com sucesso.

## [1.30.5] — 2026-05-20

Esta versão corrige um bug crítico de regra de negócio onde transações recorrentes criadas com status **Pendente** geravam instâncias filhas nos meses seguintes automaticamente efetivadas (`realized`), em vez de preservarem o status original do template.

### Corrigido
* **Propagação de Status em Transações Recorrentes (`views.py`):**
  - Correção na função `sync_recurring_transactions` para herdar o campo `status` do template recorrente ao criar instâncias filhas automáticas. Anteriormente, o status não era propagado e assumia o valor padrão `'realized'`, fazendo transações que deveriam estar pendentes aparecerem como efetivadas.
  - Ajuste na lógica de `is_applied_to_balance` para considerar o status herdado: transações com status `'pending'` **nunca** afetam o saldo da conta, independentemente da data.

### Adicionado
* **Edição e Deleção Granular de Recorrências (Backend & Frontend):**
  - Adicionado suporte completo para deletar ou editar transações recorrentes escolhendo o escopo ("apenas esta", "esta e futuras", "todas").
  - O sistema utiliza as flags `recurring_parent` e `is_recurrence_exception` para isolamento histórico e integridade do balanço contábil em tempo real.
* **Teste de Regressão (`test_general_finance.py`):**
  - Novo teste `test_recurring_transactions_pending_status` validando que um template recorrente com status `'pending'` gera instâncias filhas também pendentes, sem alterar o saldo da conta.

---

## [1.30.4] — 2026-05-19

Esta versão corrige um bug crítico que causava crash (tela em branco/piscar) ao abrir o modal de "Nova Transação" e começar a digitar no campo de descrição. O componente `AddTransactionModal` utilizava a função utilitária `cn()` na renderização das sugestões do histórico sem importá-la, além de referenciar setters de estado inexistentes (`setShowAccountSuggestions`/`setShowToAccountSuggestions`) que eram resquícios de um refactor anterior para `AccountCombobox`.

### Corrigido
* **Crash de Renderização no Modal de Nova Transação (`AddTransactionModal.tsx`):**
  - **Import Ausente:** Adicionada a importação da função `cn` de `@/shared/lib/utils`, que era utilizada na linha de renderização das sugestões do autocomplete mas nunca foi importada, causando `ReferenceError: cn is not defined` e crash completo do React.
  - **Setters Orphans Removidos:** Removidas as chamadas a `setShowAccountSuggestions(false)` e `setShowToAccountSuggestions(false)` dentro do `useEffect` de clique externo, que eram referências mortas de código legado pré-`AccountCombobox` e causariam erro adicional se executadas.

---

## [1.30.3] — 2026-05-19

Esta versão corrige um bug crítico de renderização (tela em branco/criação de loops de erro) que ocorria ao atualizar (F5) ou carregar diretamente a página de detalhes da conta (`AccountDetails.tsx`). Refatoramos o fluxo e o posicionamento das declarações de hooks do React de modo a cumprir rigorosamente as "Rules of Hooks", garantindo estabilidade e reatividade na montagem inicial dos dados assíncronos. Além disso, enriquecemos os guias operacionais documentando o ecossistema de investimentos.

### Corrigido
* **Estabilização de Estado e Cumprimento das Regras de Hooks (`AccountDetails.tsx`):**
  - **Posicionamento de Hooks:** Movimentação de todos os blocos de hooks `useMemo` (`accountIds`, `accountTransactions`, `filteredTransactions`, `stats`) para antes de quaisquer retornos condicionais (`if (!account)`). Isso impede a variação na ordem e no número de hooks executados pelo React entre os renders, eliminando o erro fatal `Rendered more hooks than during the previous render`.
  - **Correção de Alinhamento HTML e Acessibilidade:** Mudança na renderização do `TableSkeleton` de carregamento inicial, que agora é encapsulado dentro das tags semânticas corretas (`<table>` e `<tbody>`) para sanar alertas de DOM nesting nos consoles dos navegadores.

### Alterado
* **Enriquecimento da Documentação Contábil de Investimentos (`manual_actual_budget.md`):**
  - Inserção de uma seção dedicada (`### 📈 Acompanhando a Evolução dos Investimentos e Patrimônio`) explicando de forma prática como utilizar a tela de **Relatórios** (`/reports`) para acompanhar a evolução histórica do Net Worth, distribuição proporcional (Treemap), Projeção e Impacto Cambial das contas Off-Budget (Investimentos).

---

## [1.30.2] — 2026-05-18

Esta versão resolve a inconsistência visual do filtro de contas na listagem global de transações (`Transactions.tsx`). Implementamos a filtragem recursiva de subcontas, garantindo que ao selecionar uma conta pai (como "Nubank") no filtro, todas as transações de suas respectivas subcontas (como "Crunchyroll") sejam exibidas de forma transparente, eliminando a contradição visual onde transações da IA consumiam saldo na barra lateral mas pareciam "desaparecer" da tabela.

### Corrigido
* **Filtro Recursivo de Contas na Listagem Global (`Transactions.tsx`):**
  - Refatoração do filtro de contas para usar o hook `useMemo` com busca recursiva em profundidade (`findAndCollect`) a partir da árvore de contas (`tree`). Isso coleta todos os IDs de subcontas atreladas à conta selecionada.
  - Alinhamento da listagem global com a tela de detalhes (`AccountDetails.tsx`), que já contava com essa agregação recursiva, estabelecendo paridade visual e eliminando o falso bug de desaparecimento de registros contábeis.

---

## [1.30.1] — 2026-05-18

Esta versão resolve em definitivo a atualização do Dashboard e visualização de transações homologadas a partir do staging do Inbox Inteligente com datas retroativas ou futuras. O Dashboard principal foi inteiramente refatorado para ser reativo ao período selecionado global da `useAccountStore` no Zustand, adicionando seletores interativos de Mês e Ano idênticos aos da tela global de transações e garantindo que os painéis de fluxo de caixa, despesas por categoria e transações pendentes reflitam instantaneamente qualquer homologação histórica.

### Adicionado
* **Painel do Dashboard Histórico e Reativo (`Dashboard.tsx`):**
  - **Seletores de Mês e Ano:** Injeção de seletores dinâmicos de período no cabeçalho do Dashboard, permitindo a navegação retroativa e futura completa pelas métricas da aplicação.
  - **Sincronização reativa com Zustand:** O Dashboard agora destrutura e consome `currentMonth` e `currentYear` do `useAccountStore`, re-executando as rotinas de fetch e re-calculando todos os dados sempre que o período ativo global é modificado (inclusive de forma automática pós-homologação na staging area do Inbox).
  - **Cálculos e Estatísticas Dinâmicos:** Refatoração de `monthlyStats`, `pendingTransactionsData`, `topCategories`, `monthName` e do gráfico de `Evolução do Fluxo` para calcularem suas respectivas estatísticas com base no período ativo dinâmico em vez do relógio estático do sistema (`new Date()`).

### Corrigido
* **Fim do Sumiço Visual de Transações do Passado:**
  - Como a homologação de comprovantes do passado atualiza automaticamente o período do Zustand para o mês da transação, e o Dashboard agora é reativo a esse período, os dados contábeis e gráficos mudam na mesma hora para exibir a nova transação homologada, eliminando por completo a sensação de desaparecimento silencioso do registro contábil físico.

---

## [1.30.0] — 2026-05-18

Esta versão implementa a infraestrutura completa de **Reconciliação de Contas e Auditoria de Extratos (Statement Auditing)**, trazendo ao Vault Finance OS um controle contábil rígido com travamento de lote ACID físico de transações históricas e geração de ajustes automáticos de saldo, em perfeita paridade operacional com o *Actual Budget*.

### Adicionado
* **Motor Contábil de Reconciliação (`reconciliation.py`):**
  - **Cálculo de Métricas Contábeis:** Retorna o saldo das transações liquidadas (`cleared_balance`), pendentes (`uncleared_balance`), saldo total (`total_balance`) e última data de conciliação.
  - **Ajuste de Saldo Automático:** Se o saldo informado no extrato físico/digital do banco divergir do saldo contábil líquido compensado, o sistema cria automaticamente uma transação do tipo `"Ajuste automático de reconciliação de saldo"` com o valor exato da diferença.
  - **Fechamento e Lock de Lote:** Atualização atômica direta em lote que marca as transações compensadas como reconciliadas (`reconciled=True`) e grava o timestamp em `last_reconciled` da conta.
  - **Destravamento Administrativo:** Lógica segura de bypass para destravar individualmente transações reconciliadas em auditorias manuais específicas.
* **Bloqueio Contábil Físico (`models.py`):**
  - **Enriquecimento de Campos:** Adicionados campos `cleared` e `reconciled` em `Transaction` e `last_reconciled` em `Account`.
  - **Mecanismo de Lock Compulsório:** Modificação dos hooks `clean()`, `save()` e `delete()` para barrarem fisicamente qualquer mutação ou exclusão se `reconciled=True`, prevenindo alterações históricas acidentais.
* **API REST de Auditoria (`views.py`):**
  - **Novos Endpoints em `AccountViewSet`:** Injeção das actions `reconcile_status`, `reconcile_adjust` e `reconcile_finalize`.
  - **Novo Endpoint em `TransactionViewSet`:** Injeção da action `unlock` para destravamento controlado.
* **Suíte de Testes Contábeis de Reconciliação (`test_reconciliation.py`):**
  - Criação de suite rigorosa cobrindo todos os cenários contábeis de conciliação e travamento. Todos 100% verdes!

### Alterado / Refatorado
* **Versionamento do Frontend:** Sincronizada a versão da build estática para `v1.30.0`.

---

## [1.29.0] — 2026-05-18

Esta versão implementa o robusto **Motor de Orçamento YNAB & Rollover Mensal (MoM)**, dotando o sistema de inteligência contábil de rollover de envelopes positivos e tratamento rigoroso de estouros (Cash vs. Credit Overspending), em perfeita paridade metodológica com o *Actual Budget*.

### Adicionado
* **Motor Contábil de Orçamento YNAB (`YNABBudgetService`):**
  - **Rollover Mensal Acumulativo (MoM):** O saldo positivo disponível nos envelopes de categorias folha é transferido de forma cumulativa e automática para o mês seguinte como receita disponível para gastos.
  - **Tratamento de Estouros de Envelopes (Overspending):**
    - **Cash Overspending:** O estouro gerado por pagamentos em dinheiro (checking/cash) zera o envelope no mês seguinte e é deduzido diretamente do pool *Ready to Assign (RTA)* do próximo mês.
    - **Credit Overspending:** O estouro gerado por compras em cartão de crédito (credit) zera o envelope no mês seguinte sem reduzir o RTA subsequente, convertendo-se de forma automática em dívida passiva na fatura do cartão.
    - **Split Overspending:** Classificação híbrida proporcional que divide de forma exata a fatia de estouro em dinheiro (que deduz o RTA do mês subsequente) e em cartão (que gera dívida pura).
  - **Pool Ready to Assign (RTA):** Cálculo retrospectivo dinâmico da renda líquida acumulada disponível para alocação.
* **Nova Suíte de Testes Contábeis de Orçamento (`test_budget.py`):**
  - Criação de suite abrangente de 4 testes rigorosos validando rollover positivo, estouros cash, estouros credit e cenários híbridos splits. Todos 100% aprovados!

### Alterado / Refatorado
* **Integração do ViewSet de Categorias (`views.py`):**
  - Refatoração profunda na action `tree` para obter a malha contábil do `YNABBudgetService`, retornando a estrutura em árvore consolidada para o frontend com suporte a `rollover_amount` e `available_amount`.
  - Injeção inteligente do valor do RTA no cabeçalho HTTP customizado `X-Ready-To-Assign` para manter compatibilidade com o formato de JSON bruto do React SPA.
  - **Nova Action `ready_to_assign`:** Criação de endpoint dedicado para leitura isolada do RTA mensal do usuário ativo.

---

## [1.28.0] — 2026-05-18

Esta versão promove uma reestruturação profunda e audaciosa do **Core Ledger Contábil** do Vault Finance OS, implementando paridade metodológica e técnica estrita com a engine padrão-ouro do **Actual Budget** (`actual-master`). O sistema de transferências foi inteiramente reformulado para garantir consistência ACID física de transações espelhadas e governança estrita de envelopes YNAB.

### Adicionado
* **Estrutura de Beneficiários e Contas do Ledger (`models.py`):**
  - **Propriedade `is_on_budget` em `Account`:** Diferenciação nativa entre contas no orçamento (Checking, Cash, Savings) e fora do orçamento (Investimentos e Ativos de longo prazo).
  - **Entidade `Payee` (Beneficiários):** Criação de tabela de beneficiários contendo FK opcional `transfer_acct` para mapear transferências físicas e `default_category` para otimizar lançamentos futuros.
  - **Auto-criação de Payees de Transferência:** Hooks de ciclo de vida atômicos no `save()` de `Account` que criam ou atualizam automaticamente o `Payee` associado (ex: `"Transferência: Conta Corrente"`) sempre que uma conta é criada ou modificada.
* **Integridade ACID com Sincronização e Espelhamento Atômico (`models.py`):**
  - **Relacionamento Físico de Espelhamento (`linked_transfer`):** Introdução da coluna `linked_transfer = OneToOneField('self')` no modelo `Transaction`, garantindo o acoplamento físico bidirecional de ponta a ponta e abolindo dependências de strings UUID legacy.
  - **Mecanismo Recursivo de Sincronização (`_syncing`):** Controle robusto via flag local `_syncing` na engine de `save()` e `delete()` de transações para prevenir loops de replicação infinitos, propagando edições de `amount`, `date`, `status` e inversão de direção financeira (`is_income = not is_income`) entre transações espelhadas.
  - **Validação Estrita de Envelopes YNAB (`clean()`):** Injeção de validações de regras de negócio contábeis:
    - Transferências internas On-Budget para On-Budget ou Off-Budget para Off-Budget zeram incondicionalmente a categoria, pois o capital permanece no mesmo lado da fronteira contábil.
    - Transferências mistas On-to-Off e Off-to-On exigem preenchimento obrigatório da categoria de despesa, pois alteram a liquidez líquida do orçamento base-zero.
* **Suite de Testes de Regressão Contábil (`test_ledger.py`):**
  - Criação de suite robusta contendo testes específicos de integração para validação de `is_on_budget`, auto-criação de payees, restrições de categorias YNAB e propagação recursiva bidirecional de saldos.

### Alterado / Refatorado
* **Simplificação Radical das Views de Lançamento (`views.py`):**
  - Refatoração dos métodos `perform_create`, `perform_update` e `perform_destroy` do `TransactionViewSet` para eliminar duplicidades manuais e redundâncias físicas de alteração de saldos de contas nas Views, delegando toda a governança transacional para os hooks ricos de domínio de `models.py`.
  - **Simplificação de endpoints `transfer` e `bulk_transfer`:** Reescrevemos as ações para utilizarem a nova engine baseada em `Payee` e `linked_transfer`, com suporte inteligente a transferências multi-moedas com valores diferentes através de re-sincronização atômica do saldo da transação espelhada.

---

## [1.27.3] — 2026-05-18

Esta versão resolve em definitivo o sumiço silencioso visual de transações homologadas do Inbox com data do passado. Agora, ao homologar qualquer transação, o período ativo do dashboard é sincronizado automaticamente, e as páginas de listagem (`Transactions.tsx` e `AccountDetails.tsx`) mantêm sincronia reativa total com o período global da `useAccountStore`.

### Adicionado
* **Sincronização de Período Automática no Homologar (`Inbox.tsx`):**
  - Adicionado ajuste automático do período global (`currentMonth`, `currentYear` no `useAccountStore`) ao homologar com sucesso uma transação. Se o comprovante possuir uma data fora do período visualizado atual, o dashboard é atualizado instantaneamente para o mês e ano da transação e emite uma notificação informativa elegante sobre a mudança.
* **Filtro de Período Sincronizado e Reativo (`Transactions.tsx` & `AccountDetails.tsx`):**
  - Modificadas as páginas de listagem global e detalhes de conta para inicializarem seus períodos locais com base no `useAccountStore` global e reagirem em tempo real a qualquer mudança de período (como a auto-seleção após homologação), assegurando que o usuário veja as transações no mesmo instante em que a homologação é efetuada.

## [1.27.2] — 2026-05-18

Esta versão resolve em definitivo a visualização e consistência na listagem de transações, corrigindo o rastreamento recursivo de transações de subcontas sob contas pai e ajustando a conversão de tipos para a filtragem por conta na tabela global de transações.

### Corrigido
* **Agregação Recursiva de Subcontas (`AccountDetails.tsx`):**
  - Implementada a busca e agregação recursiva de todos os IDs de subcontas a partir da conta selecionada, de modo que clicar em uma conta pai no menu exiba todas as transações das subcontas que receberam os lançamentos (ex.: "Crunchyroll" sob "Nubank"), permitindo que o usuário veja as transações no mesmo momento em que os saldos são deduzidos.
* **Correta Tipagem na Filtragem de Transações (`Transactions.tsx`):**
  - Correção na comparação estrita `t.account === selectedAccountId` que impedia a exibição de transações ao aplicar qualquer filtro por conta na tela global (comparação de número vs string). Agora usa `String(t.account)` para garantir compatibilidade e exibição correta dos registros.

## [1.27.1] — 2026-05-18

Esta versão garante que toda e qualquer transação gerada pela homologação de comprovantes na Inbox Inteligente (incluindo o fallback de cartão de crédito para faturas futuras) seja criada diretamente com o status **Efetivada ("realized")** e deduza imediatamente o valor correspondente do saldo real da conta.

### Corrigido
* **Homologação de IA Sempre Efetivada (`views.py`):**
  - Ajuste na criação de transações de fallback para cartão de crédito no endpoint `approve` para usar `status='realized'` de forma incondicional e atualizar de imediato o saldo real do cartão caso a data da compra seja igual ou anterior à data atual, eliminando transações pendentes indesejadas e inconsistências de saldo.

## [1.27.0] — 2026-05-18

Esta versão corrige a criação de transações reais de compras no cartão de crédito durante a homologação do Inbox Inteligente, elimina as duplicidades silenciosas no backend e garante a sincronização instantânea do Dashboard em tempo real sem necessidade de F5.

### Adicionado
* **Sincronização de Estado Reativa no Dashboard (`useInboxStore.ts` & `Dashboard.tsx`):**
  - O painel principal (`Dashboard.tsx`) agora destrutura e chama explicitamente `fetchTransactions()` de `useAccountStore` no `useEffect` de inicialização e no método `handleRefresh`. Isso garante que qualquer nova transação no sistema atualize imediatamente todos os cards de receita, despesa, balanço, gráficos de fluxo, e transações recentes.
  - A action `approveInboxItem` em `useInboxStore.ts` agora chama explicitamente `await useAccountStore.getState().fetchTransactions();` após atualizar os saldos das contas, garantindo consistência total instantaneamente ao homologar comprovantes.

### Corrigido
* **Desvinculação Financeira dos Envelopes YNAB (`services.py`):**
  - Correção na rotina `process_installment_ynab` para criar a transação core real sob a conta do cartão de crédito (`credit_card.account`) e deduzir seu saldo de forma incondicional, independente de os envelopes virtuais de categorias YNAB estarem criados ou disponíveis.
* **Associação Livre de Duplicidades no Inbox (`views.py`):**
  - Correção na action `@action` `approve` do `TransactionInboxViewSet` para buscar a transação de cartão recém-criada filtrando pelo ID da conta (`account=account`) e pela data real do comprovante (`date=tx_date`) em vez da data de hoje, eliminando o fallback incorreto e redundante que gerava transações duplicadas pendentes no banco.

## [1.26.9] — 2026-05-17

Esta versão adiciona o lançamento real de despesas físicas de cartão de crédito e a atualização em tempo real de saldo devedor nas contas de cartão de crédito do motor YNAB, além de blindar a validação de categorias sem classificação.

### Adicionado
* **Lançamento de Despesa Real de Cartão de Crédito (`services.py`):**
  - O processador YNAB (`process_installment_ynab`) agora registra uma transação real de despesa (`CoreTransaction`) sob a conta do cartão de crédito (`credit_card.account`) correspondente à parcela e subtrai o valor diretamente de seu saldo real (`credit_card.account.balance`), sincronizando perfeitamente os limites e faturas com o painel principal em tempo real.
* **Antecipação Integrada ao YNAB (`views.py`):**
  - Chamada à rotina YNAB `process_installment_ynab` injetada na action `anticipate_installment` de `CreditCardViewSet` para garantir que faturas futuras antecipadas pelo usuário deduzam imediatamente do envelope e do saldo real do cartão no ato da antecipação.

### Corrigido
* **Blindagem Total contra ID "none" no Backend (`views.py`):**
  - Tratamento aprimorado no endpoint de homologação (`approve`) para ignorar explicitamente a string `"none"` (case-insensitive) como um ID de categoria inválido, atribuindo `None` à categoria de forma segura e elegante.
* **Envio Limpo do Cliente (`Inbox.tsx`):**
  - No frontend, a homologação de transações marcadas com "Sem Categoria (Receita)" substitui dinamicamente o valor `"none"` por `null` no payload JSON, assegurando conformidade absoluta cliente-servidor.

## [1.26.8] — 2026-05-17

Esta versão corrige a homologação de transações em contas de cartão de crédito e a aprovação de lotes na Caixa de Entrada Inteligente (Staging Inbox).

### Adicionado
* **Integração do Inbox com Cartões de Crédito (`views.py`):**
  - Implementada a integração direta da homologação com o motor de cartões de crédito YNAB (`process_credit_card_transaction`).
  - Quando o usuário homologa uma transação selecionando uma conta de tipo `credit_card`, o sistema cria a transação de cartão (`CreditCardTransaction`) e suas respectivas parcelas (`Installment`), recalculando automaticamente a fatura correspondente e efetuando a transferência virtual de envelopes (do envelope de despesas para o de pagamento do cartão).
  - Incluído fallback virtual inteligente e robusto para criar um registro `CoreTransaction` pendente com `is_applied_to_balance=False` caso o lote seja futuro ou não acione realocações imediatas, garantindo integridade com a chave estrangeira `validated_transaction` sem corromper saldos.

### Corrigido
* **Validação Robusta de IDs no Inbox (`views.py`):**
  - Implementada uma barreira estrita de conversão de tipos em Python (via `int(str().strip())` e tratamento completo de exceções `ValueError`, `TypeError`, `ValidationError`) para `account_id` e `category_id` no endpoint `approve`.
  - Isso impede de forma absoluta que valores string não numéricos enviados pelo frontend (como `'none'`, `'null'`, `'undefined'`, `''`) causem erros de validação da ORM do Django (`Field 'id' expected a number but got 'none'`), garantindo que a homologação sem categoria ou com contas corrompidas prossiga de forma segura.
* **Persistência de Status em Lotes Parciais (`views.py`):**
  - Corrigido o bug na action `approve` onde o status do item da inbox era prematuramente alterado para `'ready'` mesmo quando restavam transações pendentes de homologação no lote.
  - O status `'ready'` agora só é atribuído quando absolutamente todas as transações mapeadas pelo Gemini no comprovante forem devidamente homologadas pelo usuário, mantendo o comprovante visível na fila para as revisões subsequentes.

## [1.26.7] — 2026-05-17

Esta versão otimiza radicalmente a velocidade de carregamento e processamento de comprovantes fiscais na Caixa de Entrada Inteligente (Staging Inbox) via compressão nativa de imagem no lado do cliente.

### Adicionado
* **Compressão de Imagem Nativa no Cliente (`image-utils.ts`):**
  - Implementada função `compressImage` baseada na API de HTML5 Canvas para redimensionar e compactar imagens proporcionalmente para largura/altura máxima de `1200px` (qualidade de `0.85` JPEG).
  - Bypass inteligente instantâneo para arquivos não-imagem (como documentos PDF).
* **Integração de Upload Otimizado (`useInboxStore.ts`):**
  - Processamento concorrente via `Promise.all` e `compressImage` para compactar todas as imagens do lote antes de montar o payload `FormData`.
  - Redução drástica do tamanho médio dos arquivos de ~8MB para ~300KB (economia de 96% de tráfego de rede) com upload e processamento da IA concluídos em menos de 7 segundos.

## [1.26.6] — 2026-05-17

Esta versão corrige um bug crítico de UX onde as transações homologadas na Staging Area não apareciam imediatamente na tabela e os saldos das contas não eram atualizados na tela sem um recarregamento da página (F5).

### Corrigido
* **Sincronização de Estado Global Pós-Homologação (`App.tsx` e `useInboxStore.ts`):**
  - Exportado o `queryClient` instanciado no `App.tsx` para permitir acesso imperativo fora de hooks do React.
  - Inclusão da invalidação forçada do cache `["transactions"]` do React Query e da execução de `useAccountStore.getState().fetchAccounts()` na store do Zustand após o término do `approveInboxItem`.
  - Garantia de que a tabela de transações, gráficos e saldos do cabeçalho reajam em tempo real à inserção de novos lançamentos gerados pelo OCR da IA.

## [1.26.5] — 2026-05-17

Esta versão corrige a sincronização de estado do React na Caixa de Entrada Inteligente (Staging Inbox Area), garantindo que o painel de Revisão e Homologação seja atualizado de forma dinâmica e reativa e exiba instantaneamente os dados extraídos pelo Gemini 2.5 Flash assim que o status do processamento transicionar para "pronto".

### Corrigido
* **Reatividade do Painel de Revisão e Homologação (`Inbox.tsx`):**
  - Substituição do estado local estático `selectedItem` (objeto) pelo estado de referência de ID única `selectedItemId` (string).
  - Derivação inteligente e dinâmica do item selecionado por meio do React `useMemo` acoplado ao array reativo de `inboxItems` obtido da store do Zustand.
  - Sincronização em tempo real das sugestões da inteligência artificial: quando o polling do OCR atualiza a lista de staging na store, o `selectedItem` deriva a referência do novo objeto atualizado, disparando os hooks de efeito para auto-preencher os inputs do formulário sem exigir recarregamento de página.
  - Correção na seleção automática pós-homologação e no clique de itens da fila de staging para persistir `selectedItemId` corretamente.

## [1.26.4] — 2026-05-17

Esta versão aprimora a usabilidade, robustez e layout da Caixa de Entrada Inteligente (Staging Inbox Area) de comprovantes, resolvendo falhas na homologação de transações sem categoria e implementando atualizações reativas automáticas na tela.

### Adicionado
* **Polling Reativo de Status do Processamento (`Inbox.tsx`):**
  - Implementação de um `useEffect` com polling de 3 segundos que atualiza automaticamente a listagem e os campos quando há transações com status `'pending'` ou `'processing'` sendo analisadas pela IA do Gemini, eliminando a necessidade de atualizar a página manualmente.
* **Componente de Busca no Seletor de Contas (`Inbox.tsx`):**
  - Integração do componente de alta performance `AccountCombobox` para a busca de contas no Inbox, fornecendo a mesma experiência com filtragem interativa por teclado e listagem hierárquica presente no cadastro manual de transações.
  - Extensão da interface `AccountComboboxProps` e sua implementação para suportar o estado `disabled` de forma elegante quando o preenchimento automático de comprovante por IA estiver em andamento.
* **Testes de Regressão no Django (`test_inbox.py`):**
  - Inclusão do caso de teste `test_approve_transaction_with_none_category` na API para certificar o funcionamento correto de homologações sem categoria atrelada.

### Corrigido
* **Resiliência ao Homologar Transações sem Categoria (`views.py`):**
  - Correção na action `approve` do `TransactionInboxViewSet` para tratar de forma defensiva strings de categoria como `'none'`, `''`, `'null'` e `'undefined'`, mapeando-as corretamente para `None` no banco em vez de disparar erros de formato UUID e interromper a homologação.
* **Ergonometria Visual e Ajuste de Cards Estrangulados (`Inbox.tsx`):**
  - Expansão da altura dos painéis laterais de split-screen para `min-h-[580px] lg:h-[620px]` e incorporação de rolagem vertical independente na div de formulário (`overflow-y-auto max-h-[490px]`), corrigindo o problema estético onde o botão de "Homologar Transação" encobria outras informações e apertava os inputs.
  - Atualização do indicador de status da IA para Gemini 2.5 Flash.

## [1.26.3] — 2026-05-17

Esta versão corrige a falha na atualização de saldo de contas no ato de homologação/aprovação de comprovantes a partir da Caixa de Entrada Inteligente (Staging Inbox), garantindo o sincronismo real e imediato com o orçamento do YNAB.

### Corrigido
* **Atualização de Saldo e Integração Financeira no Inbox (`views.py`):**
  - Correção na action `@action` `approve` do `TransactionInboxViewSet` para efetuar o cálculo de débito/crédito no saldo da conta correspondente à transação homologada.
  - Ativação correta da flag `is_applied_to_balance=True` na transação criada a partir do inbox, sincronizando o fluxo com o comportamento nativo de lançamentos manuais do YNAB.
  - Implementação de validações robustas com conversão defensiva de strings e floats para `Decimal` e formatação de datas.
* **Validação Rigorosa da Suíte de Testes (`test_inbox.py`):**
  - Inclusão de asserções nos testes unitários e de integração do inbox (`test_approve_single_transaction_legacy_format` e `test_approve_multi_transaction_batch_by_index`) para garantir que o saldo da conta e a flag `is_applied_to_balance` sejam recalculados e sincronizados perfeitamente.

---

## [1.26.2] — 2026-05-17

Esta versão realiza o upgrade tecnológico do motor de IA da Caixa de Entrada Inteligente (Staging Inbox) para o modelo **Gemini 2.5 Flash**, garantindo compatibilidade e resiliência com as novas cotas e deprecando as rotas da versão 1.5.

### Alterado
* **Upgrade do Motor de IA para Gemini 2.5 Flash:**
  - Atualização do modelo padrão no serviço `AIExtractionService` (`ai_services.py`) de `gemini-1.5-flash` para `gemini-2.5-flash` em resposta à indisponibilidade de modelos legados sob novas chaves de API em 2026.
  - Sincronização dos endpoints de teste e diagnóstico (`debug_key` no views e `debug_key_view` em urls) para o novo modelo de alta performance.
* **Resiliência e Isenção de Autenticação no Diagnóstico:**
  - Mapeamento de um endpoint puro Django `/api/debug-key/` (`urls.py`) totalmente independente do framework de permissões/autenticação do DRF para diagnóstico público seguro do Gemini.

---

## [1.26.1] — 2026-05-17

Esta versão introduz ferramentas robustas de depuração e diagnóstico em produção para auditoria e validação segura da chave de API do Gemini em ambientes de contêineres efêmeros (Render).

### Adicionado
* **Endpoint de Depuração e Diagnóstico Seguro (`views.py`):**
  - Implementação da action `@action` `debug_key` para expor metadados seguros da chave de ambiente configurada (`GEMINI_API_KEY`) em conformidade com políticas de segurança de dados.

---

## [1.26.0] — 2026-05-17

Esta versão introduz o suporte completo a **Detecção e Homologação Múltipla de Transações** na Caixa de Entrada Inteligente (Staging Inbox), permitindo extrair e aprovar de forma individualizada e granular múltiplas compras contidas em um único comprovante, nota fiscal ou captura de tela por meio da IA do Gemini 1.5 Flash.

### Adicionado
* **Extração de Múltiplas Transações por IA:**
  - **Esquema JSON Estruturado de Array (`ai_services.py`):** Configuração refinada do prompt e do esquema JSON do Gemini para preencher um array de objetos `transactions` em vez de um objeto de transação única plana.
  - **Resiliência e Fallback Coerentes:** Mecanismos de tolerância a falhas atualizados para empacotar respostas padrão e erros de falha de infraestrutura sob a nova estrutura orientada a listas.
* **Pipeline de Homologação Granular por Índice no Backend:**
  - **Aprovação Específica por Índice (`views.py`):** Atualização do endpoint `/api/finance/inbox/{id}/approve/` para receber o parâmetro opcional de query `index`. Ao recebê-lo, o backend realiza a criação da transação correspondente no banco e marca apenas aquele item do array como aprovado (`"approved": true`).
  - **Arquivamento e Conclusão Progressivos:** O registro inbox só é considerado concluído (status transicionado para `'ready'` e `validated_transaction` vinculada) quando *todas* as transações contidas no recibo são homologadas e marcadas como aprovadas pelo usuário.
* **Visualizador de Abas de Transações Múltiplas no Frontend (`Inbox.tsx`):**
  - **Interface com Abas Dinâmicas:** Apresentação interativa em React que divide os dados retornados da IA em abas individuais para cada compra identificada no comprovante.
  - **Edição e Envio Granular:** Permite ao usuário editar, ajustar contas/envelopes e aprovar cada item de forma independente sem recarregar ou perder o contexto visual do comprovante ao lado.
* **Suite de Testes Unitários Completamente Atualizada:**
  - **Testes Ajustados no Django (`test_inbox.py`):** Correção de todas as asserções de teste unitário da API e do Celery para validar a nova arquitetura orientada a array do inbox, garantindo 100% de cobertura verde em todos os 47 testes de backend.
  - **Validação de Testes do Frontend (Vitest):** Garantia de funcionamento perfeito de todas as 30 rotinas de testes no frontend do React.

---

## [1.25.0] — 2026-05-17

Esta versão introduz a **Interface Visual da Caixa de Entrada Inteligente (Staging Inbox Area)** no frontend em React 18, permitindo que os usuários revisem e homologuem cupons e recibos side-by-side com as sugestões estruturadas pela IA do Gemini.

### Adicionado
* **Painel Visual Split-Screen Premium (`Inbox.tsx`):**
  - **Layout Responsivo Lado a Lado:** Tela moderna contendo um visualizador interativo do comprovante físico de um lado, e um formulário inteligente pré-preenchido com os dados obtidos pela inteligência artificial do outro.
  - **Controle Dinâmico de Mídia:** Ferramentas integradas para rotacionar a imagem em 90 graus e efetuar Zoom In/Out para facilitar a leitura de notas fiscais digitalizadas.
* **Integração de Zustand e API de Homologação:**
  - **Zustand Store Completa (`useInboxStore.ts`):** Gerenciamento centralizado do estado de uploads, listagem destaging e delegação de homologação.
  - **Endpoint de Validação Atômica no Django REST Framework:** Exposição da ação customizada de detalhe `/api/finance/inbox/{id}/approve/` no backend para criar a transação física associada de forma segura e transicional, mapeando contas financeiras e envelopes de categoria YNAB do usuário.
* **Governança Estética, Tradução e Menus:**
  - **Rotas e Navegação:** Registro da nova página de Inbox no roteador do app, menu lateral desktop (`Sidebar.tsx`) e menu móvel (`BottomNav.tsx`).
  - **Sincronização de Traduções:** Inclusão das chaves de tradução `inbox` e descrições interativas no manual local de idioma `pt-BR.json`.
* **Tratamento de Erros Defensivo na API (`api.ts`):**
  - Implementação de um duto de segurança que intercepta erros não-JSON vindos do servidor (como 404 e 500 do Render), convertendo páginas HTML de erro em alertas em português descritivos e amigáveis, eliminando para sempre a exibição do toast de objeto vazio `{}` na interface.
* **Resiliência Pós-Commit no Django REST Framework (`views.py`):**
  - **Despacho Pós-Commit (`transaction.on_commit`):** Protegemos a criação e o upload de recibos movendo o despacho da tarefa Celery para fora da transação atômica do Django. Isso impede race-conditions onde o Celery tentava consultar o banco antes de a transação finalizar.
  - **Resiliência Multi-Container (Fallback em Thread Local):** Implementamos uma estratégia ultra-defensiva de processamento. Se a fila Celery ou a conexão com o broker Redis falhar ou estiver offline em produção (comum em setups Render separados ou sem Redis), o backend intercepta o erro de conexão e aciona um processamento alternativo via Thread local assíncrona (`threading.Thread`). Isso evita erros HTTP 500 no upload do usuário e garante que a extração por IA continue funcionando perfeitamente!
* **Garantia de Qualidade:**
  - Adaptação dos testes da API (`test_inbox.py`) usando o context manager `captureOnCommitCallbacks` para simular e validar perfeitamente o disparo do Celery pós-commit dentro do ambiente de testes transacional.
  - Execução completa e aprovação de 100% da suíte de 60 testes automatizados no Pytest.
* **Deploy de Produção:**
  - Build de produção validado com sucesso e implantado na nuvem via Vercel (100% online).
  - Atualizações resilientes integradas no repositório GitHub para reinstanciação no Render.

---

## [1.24.0] — 2026-05-17

Esta versão introduz a **Integração Multimodal com o Google Gemini 1.5 Flash API** por meio do serviço de extração inteligente `AIExtractionService`, substituindo parsers de OCR legados por Structured Outputs (JSON Schema Estrito) executados na fila do Celery.

### Adicionado
* **Integração Multimodal de IA (`AIExtractionService`):**
  - **Extração com Structured Outputs:** Implementação do serviço `AIExtractionService` em `ai_services.py` que lê arquivos de recibos e notas, os codifica em Base64, detecta os tipos MIME dinamicamente e realiza requisições REST diretas e otimizadas para a API do Google Gemini 1.5 Flash.
  - **Esquema de JSON Estrito:** Envio do `responseSchema` no payload do `generationConfig` exigindo do Gemini o preenchimento estrito e determinístico do JSON contendo `amount`, `date`, `merchant` e `currency`, eliminando a necessidade de pós-processamento de regex.
  - **Arquitetura Ultra-Defensiva:** Resiliência nativa com retentativas automáticas sob backoff exponencial ao receber limite de taxa (HTTP 429), timeouts estritos (15 segundos) e tratamento de exceções com fornecimento de fallback estruturado em caso de falha de infraestrutura ou ausência de chave de API.
* **Fila do Celery Integrada com IA:**
  - **Orquestração em Segundo Plano:** Atualização da Celery Task `process_inbox_document` em `tasks.py` para instanciar o serviço de IA, executar a extração sobre o caminho físico do item na área de staging, popular o banco de dados e transicionar o status final de ciclo para `'ready'`.
* **Testes de Alta Fidelidade no Pytest:**
  - **Mocks Abrangentes:** Ampliação da cobertura em `test_inbox.py` com mocks de leitura física de mídias (`mock_open`), chamadas REST de sucesso e simulação de concorrência com limite de requisições do Gemini.

---

## [1.23.0] — 2026-05-17

Esta versão introduz a **Orquestração Assíncrona via Celery & Fila de Segundo Plano** para Ingestão e processamento de comprovantes em lote, otimizando o pipeline de upload e staging de dados antes do acionamento de IA.

### Adicionado
* **Orquestração Assíncrona Celery / Redis:**
  - **Bootstrap e Inicialização:** Criação do arquivo `celery.py` oficial para bootstrap da instância de app do Celery e auto-descoberta automática de tarefas, de forma robusta e modular.
* **API de Ingestão em Lote (Bulk Upload):**
  - **Upload Desbloqueado (`InboxUploadView`):** Criação do endpoint `/api/finance/inbox/upload/` que suporta uploads múltiplos de arquivos físicos em lote (`multipart/form-data`), instanciando itens na área de staging e disparando de forma assíncrona as tarefas na fila antes de retornar instantaneamente o status de sucesso `202 Accepted`.

---

## [1.22.0] — 2026-05-17

Esta versão introduz a **Modelagem do TransactionInbox e Isolamento Multitenancy** no backend do Vault Finance OS, desenhando os alicerces de dados para recepção inteligente de cupons.

### Adicionado
* **Modelagem e Migrações (`TransactionInbox`):**
  - Criação do modelo `TransactionInbox` mapeando status (`'pending'`, `'processing'`, `'ready'`, `'failed'`), caminhos físicos de arquivos, sugestões do Gemini e campos de erro estruturados.

---

## [1.21.0] — 2026-05-14

Esta versão consagra a **Substituição e Evolução do Dashboard Principal para o Design Premium de Alta Fidelidade** no Vault Finance OS, aliada a uma cirúrgica otimização arquitetural para eliminação de redundâncias visuais e de dados entre o cabeçalho e as telas.

### Adicionado / Refatorado
* **Fusão Definitiva do Painel Central de Patrimônio (`Dashboard.tsx` & `Accounts.tsx`):**
  - **Zero Redundância:** Remoção do card de Patrimônio Total Líquido que ocupava espaço no topo da página de Contas e sua fusão e migração como peça central exclusiva e majestosa no topo do Dashboard.
  - **Eliminação de Saudações Repetidas:** Remoção do *Hero Greeting* do Dashboard que repetia a saudação de bom dia e a data já existentes no `Topbar` global, mantendo a interface hiper-limpa e focada.
  - **Cards Mensais Otimizados (3 Cards):** O antigo card redundante de "Patrimônio Total" da fileira inferior foi eliminado. A grade agora se expande de forma harmoniosa com 3 cards de fluxo mensal: `Receitas`, `Despesas` e `Balanço do Mês (com Taxa de Poupança)`.
* **Biblioteca de Widgets Customizável:** Painel inferior modular permitindo ativar, desativar e reorganizar instantaneamente cards de Ações Rápidas, Distribuição de Gastos, Fluxo Semanal, Top Contas, Resumo de Dívidas e Mapa de Calor de Atividades.

### Removido
* **Pruning de Pastas Temporárias de Protótipo:** Remoção completa e limpa da pasta de protótipo `111111111111drag-track-money-main` do repositório para assegurar a máxima organização e limpeza do projeto.

---

## [1.20.0] — 2026-05-13

Esta versão traz a implantação do **Módulo de Cartões de Crédito e Integração YNAB**, projetado para gerenciar compras rotativas e parcelamentos brasileiros com cálculo exato de faturas e reservas automáticas de liquidez para quitação.

### Adicionado
* **Modelagem e Serviços de Cartões de Crédito (`finance.credit_card`):**
  - **Modelos Dedicados:** `CreditCard`, `CreditCardBill`, `CreditCardTransaction` e `Installment` perfeitamente estruturados e interligados com `Account` e `Category`.
  - **Janela Estendida e "Melhor Dia":** Lógica matemática de fechamento (`closing_day`) que projeta transações feitas no dia de fechamento ou após para a fatura do mês subsequente.
  - **Gestão de Parcelamentos:** Divisão de compras matriz em fatias de dívida (`Installment`) com suporte a antecipação de parcelas futuras.
  - **Integração YNAB Nativa:** Transferência virtual automatizada do saldo do envelope de despesa para o envelope de pagamento do cartão ao entrar na fatura vigente.
  - **Contrato de API Interativo:** Endpoints REST robustos no `CreditCardViewSet` expostos no Swagger via `drf-spectacular`.
* **Frontend Premium de Cartões de Crédito (`CreditCards.tsx` & `AddRootAccountModal.tsx`):**
  - **Interface Dedicada:** Nova página luxuosa em `/credit-cards` com navegação em cascata por faturas mensais, controle de progresso de limite utilizado e listagem detalhada de parcelas com IOF e spread.
  - **Criação Flexível e Unificada:** Possibilidade de cadastrar novos cartões de crédito e suas respectivas contas YNAB simultaneamente através da aba de **Cartões de Crédito** e também diretamente do botão "Nova Conta" na aba de **Contas**.
  - **Mágica do YNAB Transparente:** Explicação visual instantânea nos modais de lançamento sobre o provisionamento automático de liquidez das categorias de despesa para o cartão.

### Corrigido
* **Blindagem Transacional e Validação DRF de Cartões de Crédito (`views.py` & `serializers.py`):**
  - Refatoração do `CreditCardSerializer` com `SerializerMethodField` para `name` e `currency`, permitindo leitura limpa das propriedades de conta associadas.
  - Interceptação inteligente no método `create()` do `CreditCardViewSet` para instanciar a conta YNAB e injetar seu ID antes que a suíte de validação do ModelSerializer (`is_valid()`) seja disparada, eliminando erros de chaves estrangeiras nulas.
* **Cobertura de Testes de Frontend (`CreditCards.test.tsx`):**
  - Implementada a suíte completa no Vitest cobrindo a renderização do *Empty State*, interações de clique para abertura do modal de cadastro de novo cartão e validação de bloqueios em tentativas de lançamento de compra sem cartão selecionado.

---

## [1.19.4] — 2026-05-12

Esta versão traz uma **Aceleração de Usabilidade e UX Perfeita** ao solucionar de forma definitiva o problema de corte visual (clipping) do seletor de contas dentro de modais roláveis ou tabelas densas, elevando a qualidade do design e a consistência das interações.

### Corrigido
* **Uso de Portais (Radix Portal) no `AccountCombobox.tsx`:**
  - **Adequação Estética e Funcional:** Refatoração completa do dropdown flutuante para ser encapsulado pelo componente primitivo `<Popover>` da Shadcn/Radix.
  - **Zero Clipping de Overflow:** Através do portal, as opções de contas são renderizadas diretamente no nó raiz do documento HTML (`body`), permitindo que a listagem flutue sobre qualquer container que possua limites rígidos de rolagem ou `overflow-y: auto` (como a lista de destino no modal de distribuição), sem nunca cortar ou ocultar opções de escolha.
  - **Compatibilidade Responsiva:** Preservados os mecanismos sofisticados de acessibilidade por setas do teclado, filtragem interativa por busca de texto e alinhamento responsivo perfeito.

---

## [1.19.3] — 2026-05-12

Esta versão introduz **Blindagens Ultra-Defensivas de Renderização** e mitigação completa contra crashes em tempo de execução na página de Orçamento, assegurando que o sistema seja robusto para qualquer perfil de usuário (desde novos até contas avançadas com dados fragmentados ou duplicados).

### Corrigido
* **Blindagem de ID de dnd-kit em `Budget.tsx`:** Filtro preventivo estrito adicionado na memoização de `activeGroups` garantindo que apenas grupos com IDs válidos (tipo `string` ou `number`) sejam mapeados. Isso evita crashes em tempo de execução no hook `useSortable` do `@dnd-kit/sortable`.
* **Deduplicação Dinâmica de IDs:** Implementado um mecanismo reativo com `Set` para remover grupos de categorias ou subcategorias que possuam IDs duplicados vindos do backend, evitando colisões de chaves do React e falhas silenciosas de arraste.
* **Resiliência a Nulos nas Consultas (`useAccountStore.ts`):** Protegidas as funções helper globais da store do Zustand (`getAccount`, `getCategoryName`, e `totalsByCurrency`) contra arrays indefinidos, nulos ou objetos corrompidos na árvore de contas de sincronização, interceptando e tratando erros com valores padrão amigáveis.

---

## [1.19.2] — 2026-05-12

Esta versão promove uma **Revolução de UX para Novos Usuários** na página de Orçamento do Vault Finance OS, introduzindo caminhos de interação amigáveis onde antes havia vazios funcionais, garantindo que o fluxo de onboarding seja impecável e intuitivo.

### Adicionado
* **Estado Vazio Premium (Empty State) em Orçamento (`Budget.tsx`):**
  - **Identidade Visual Impecável:** Layout elegante, centralizado, com bordas pontilhadas e efeitos de desfoque de fundo (backdrop-blur) exibindo o ícone de carteira em destaque caso o usuário não tenha grupos de categorias criados neste período.
  - **Onboarding Facilitado:** Guia textual orientando o usuário a criar seu primeiro grupo de planejamento financeiro.
  - **Ação Direta:** Botão integrado "Criar Primeiro Grupo" que abre instantaneamente o fluxo de criação rápida.
* **Mecanismo de Criação de Grupos no Cabeçalho:**
  - **Acesso Global:** Inclusão de um botão permanente "Novo Grupo" com ícone `FolderPlus` ao lado do seletor de mês no topo da página de Orçamento, permitindo adicionar novos agrupamentos a qualquer momento.
  - **Modal de Formulário Unificado:** Integração de um Dialog flutuante limpo e responsivo para entrada do nome do grupo e adição direta no banco de dados.

---

## [1.19.1] — 2026-05-12

Esta versão realiza uma **Blindagem de Renderização Ultra-Robusta (Anti-White-Screen)** na página de Orçamento do Vault Finance OS. Correções preventivas e defensivas foram aplicadas a processamentos de estruturas de dados de transações e grupos de categorias para neutralizar de vez qualquer crash em tempo de execução causado por transações com descrições vazias/nulas ou grupos não mapeados.

### Corrigido
* **Estabilidade da Página de Orçamento (`Budget.tsx`):**
  - **Tratamento de Descrição Nula:** Adicionada validação de tipo de string antes de executar operações de inclusão de substrings (`typeof t.description === "string"`), resolvendo crashes quando transações possuíam campos de descrição vazios ou nulos.
  - **Validação de Arrays Defensiva:** Envelopamento das coleções `transactions` e `categoryGroups` com `Array.isArray` antes de loops e operações de ordenação/filtragem para evitar quebras em estados de loading ou de retorno vazio da API.
  - **Tratamento de Ordenação Seguro:** Adicionados fallbacks de datas nulas na função de ordenação cronológica das receitas distribuídas para impedir erros com transações sem data preenchida.

---

## [1.19.0] — 2026-05-12

Esta versão promove a **Propagação Sistêmica do Seletor de Contas Unificado (Combobox Premium)** por todo o ecossistema do Vault Finance OS. O componente foi extraído para uma unidade modular reutilizável (`AccountCombobox.tsx`) e implantado em todas as interfaces onde há necessidade de seleção de contas ou subcontas, garantindo uma experiência de navegação homogênea, hiper-estética e acessível via teclado.

### Adicionado
* **Componente Modular Reutilizável (`AccountCombobox.tsx`):**
  - **Encapsulamento Completo:** Isolamento total dos estados de popover, foco inteligente, filtros de busca de contas e rolagem otimizada.
  - **Suporte Multiuso Avançado:** Integra suporte reativo a filtros restritivos (como `filterLeafOnly` para contas-folha no importador de arquivos) e exclusões cruzadas (como `excludeAccountId` para transferências e distribuições de saldo).
  - **Modo Virtual Global ("Todas as Contas"):** Suporte dinâmico para incluir e gerenciar de forma nativa a opção virtual "Todas as Contas" (`showAllOption`) com o valor `'all'`, perfeitamente integrado à barra de filtros gerais.

### Alterado / Refatorado (Propagação por Todo o Sistema)
* **Modal de Transações (`AddTransactionModal.tsx`):**
  - Refatoração completa das barras de seleção de origem e destino para utilizar o novo `<AccountCombobox />`, eliminando cerca de 100 linhas de boilerplate de estados redundantes.
* **Filtros do Painel de Transações (`Transactions.tsx`):**
  - Substituição do `<Select>` nativo antigo do Radix pelo `<AccountCombobox />` com busca dinâmica integrada, permitindo filtrar transações por conta digitando seu nome com rolagem fluida e navegação de teclado.
* **Modal de Distribuição de Receitas (`DistributionModal.tsx`):**
  - Migração de todos os seletores de contas de origem e destino (nas listas de divisão de saldos para desktop e mobile) para o novo `<AccountCombobox />`, oferecendo buscas rápidas com exclusão da conta de origem em tempo real.
* **Importador de Transações (`ImportModal.tsx`):**
  - Substituição do seletor estático pelo `<AccountCombobox />` com restrição ativa para contas-folha (`filterLeafOnly`), blindando a importação de arquivos de forma robusta.

---

## [1.18.0] — 2026-05-12

Esta versão introduz o **Seletor de Contas Unificado (Combobox Premium)** no Vault Finance OS. Unindo a caixa de seleção com o campo de pesquisa e digitação em uma única janela integrada e harmônica, o sistema agora se comporta como um Combobox de altíssimo nível UX/UI, idêntico aos melhores softwares SaaS globais (como Linear e Vercel).

### Adicionado
* **Combobox de Contas Unificado (AddTransactionModal.tsx):**
  - **Interface Unificada:** O seletor de contas foi completamente unificado! Ao invés de uma barra de filtro externa redundante, o usuário clica em um único botão seletor estilizado que abre o dropdown integrado.
  - **Digitação e Listagem Integradas:** O input de pesquisa `🔍 Filtrar conta...` agora fica posicionado no topo do próprio dropdown, unindo a busca e a listagem das contas em uma mesma janela flutuante com suporte a rolagem elegante.
  - **Sincronização Reativa Esteticamente Perfeita:** Ao selecionar uma conta, o popup se fecha instantaneamente e a caixa do seletor exibe o nome e a moeda correspondente com marcadores premium.
  - **Micro-interações Inteligentes de Teclado:** O primeiro resultado correspondente à pesquisa é focado por padrão (índice 0). O usuário pode alternar entre os resultados com `ArrowDown`/`ArrowUp` e pressionar `Enter` para selecionar, sem qualquer atrito ou desvio de foco.

---

## [1.17.10] — 2026-05-12

Esta versão realiza a **Correção e Otimização do Autocomplete de Contas** no Vault Finance OS. Ela substitui a dependência do dropdown nativo do Radix UI (que impedia o recebimento das setas do teclado devido ao roubo de foco) por um popover customizado e reativo que flutua diretamente sob o campo de busca de contas (origem e destino).

### Corrigido
* **Autocomplete de Contas Premium (AddTransactionModal.tsx):**
  - **Foco e Teclado:** Ao digitar no campo de busca de conta, um popup flutuante de sugestões se abre logo abaixo.
  - **Navegação com Setas:** É possível navegar entre as contas filtradas utilizando as teclas `ArrowDown` e `ArrowUp` de forma nativa e sem perder o foco de digitação.
  - **Confirmação com Enter:** Apertar `Enter` seleciona a conta destacada, preenche o seletor correspondente e fecha o popup instantaneamente, mantendo o formulário intacto e prevenindo submissões prematuras.

---

## [1.17.9] — 2026-05-12

Esta versão realiza a **Implementação de Navegação e Seleção de Teclado Avançada** no Vault Finance OS. Focada em otimização de fluxo de trabalho para usuários avançados (power users) e acessibilidade de teclado, ela adiciona controles que permitem navegar por sugestões de histórico (descrições) e filtros de contas utilizando as setas do teclado (para cima e para baixo), além de confirmar seleções com a tecla Enter sem disparar o envio precoce do formulário.

### Adicionado
* **Navegação de Autocomplete por Teclado (AddTransactionModal.tsx):**
  - **Interação por Setas:** Teclas `ArrowDown` e `ArrowUp` agora sobem e descem a seleção ativa nas sugestões de histórico de descrições e nos filtros de contas.
  - **Destaque Visual Premium:** O item ativo selecionado pelo teclado ganha uma cor de fundo contrastante (`bg-primary/20`) no menu de sugestões para guiar visualmente o usuário.
  - **Seleção Inteligente por Enter:** Pressionar `Enter` enquanto navega por uma sugestão ou filtro de conta confirma a seleção e preenche o formulário reativamente, impedindo o envio acidental ou a criação precoce da transação (`e.preventDefault()`).

---

## [1.17.8] — 2026-05-12

Esta versão realiza a **Implementação de Seleção Automática de Contas por Filtro Reativo** no Vault Finance OS. Focada em velocidade de digitação e atalhos cognitivos, ela atualiza o comportamento de busca de contas de origem e destino no modal de transações, de forma que ao digitar no campo de filtro, a conta correspondente mais próxima é selecionada e exibida no seletor imediatamente em tempo real.

### Adicionado
* **Filtro Reativo e Seleção Dinâmica de Contas (AddTransactionModal.tsx):**
  - **Auto-Select de Origem:** Quando o usuário começa a digitar no filtro de conta, o sistema busca e altera o estado do seletor de conta automaticamente para o primeiro resultado compatível.
  - **Auto-Select de Destino:** O mesmo comportamento inteligente foi aplicado à busca da conta de destino em transferências, desconsiderando a conta de origem para evitar duplicidade.

---

## [1.17.7] — 2026-05-12

Esta versão realiza a **Correção de Estabilidade do Lançamento de Transações (Hotfix de Runtime)** no Vault Finance OS. Focada em robustez, ela sana uma falha crítica que causava tela branca (crash do React) ao digitar no campo de descrição no modal de Nova Transação, garantindo uma experiência suave e ininterrupta.

### Corrigido
* **Crash no Lançamento de Transações (AddTransactionModal.tsx):**
  - **Importação do Utilitário `cn`:** Importada a função de utilidade `cn` em `AddTransactionModal.tsx` que estava ausente, sanando o erro fatal `ReferenceError: cn is not defined` que ocorria assim que as sugestões de histórico tentavam renderizar suas etiquetas estilizadas.
  - **Proteção do Array de Transações:** Adicionada validação robusta `Array.isArray(transactions)` e checagens defensivas para cada transação e propriedade antes de processar sugestões de autocompletar na busca de histórico, blindando o modal contra falhas de tipo (`TypeError`).
* **Saneamento de Importações Fantasmas (Dashboard.tsx):**
  - Remoção de importação duplicada e inexistente do `AddTransactionModal` em `Dashboard.tsx` para garantir a conformidade estrita de resolução de módulos na compilação.

---

## [1.17.6] — 2026-05-12

Esta versão realiza a **Implementação de Sinalização Visual Premium para Contas Desconsideradas nos Totais** e ativa a **Automação Completa de Sincronização de Versão do Rodapé** no Vault Finance OS. Focada em design estético de alto padrão e governança de release, ela introduz uma diferenciação visual luxuosa em tons de púrpura para contas que não participam da somatória de totais, além de automatizar o rastreamento de versões a partir deste changelog.

### Adicionado
* **Sinalização de Contas Isoladas / Desconsideradas:**
  - **AccountAccordion.tsx:** Adicionada uma borda lateral esquerda na cor púrpura (`border-l-4 border-l-purple-500/70`) e fundo suave roxo para as contas que possuem a opção "Desconsiderar nos totais" habilitada.
  - **Ícones e Badges Especiais:** Implementação do micro-badge "Fora da Soma" em lilás ao lado do nome da conta, acompanhado do ícone `EyeOff` (Olho tachado), bem como estilização do badge de moeda (ou bordas de ícone de conta) em tons violeta.
  - **Tratamento de Saldo Excluído:** O valor do saldo de contas desconsideradas agora aparece de forma sutilmente esmaecida em tom lilás/púrpura suave (`text-purple-300/60`), indicando de forma elegante e transparente que o valor está fora da somatória geral.
* **Automação de Sincronização de Versão:**
  - **vite.config.ts:** Rotina de leitura automática do `CHANGELOG.md` que atualiza o `package.json` em tempo de desenvolvimento ou compilação, mantendo o rodapé do site 100% sincronizado com a versão real descrita no changelog.

---

## [1.17.5] — 2026-05-12

Esta versão realiza a **Reformulação do Mecanismo de Exportação de Relatórios para Geração de PDFs de Luxo Corporativo** no Vault Finance OS. Focado em excelência visual e formalidade executiva, ela substitui os relatórios antigos em texto bruto/ASCII por um gerador dinâmico de documentos HTML5/CSS3 autônomos de alta fidelidade visual, prontos para apresentação em reuniões empresariais de nível de diretoria.

### Adicionado
* **Engine de Geração de PDFs de Alta Fidelidade (HTML/CSS Premium):**
  - **Reports.tsx:** Implementação de layout executivo corporativo para todos os 9 níveis de relatórios ativos. Inclui o uso da tipografia `Inter` do Google Fonts, logotipo estilizado do Vault Finance OS, badges de "CONFIDENCIAL — APRESENTAÇÃO EXECUTIVA", tabelas financeiras com linhas alternadas e destaque condicional de cores, gráficos de progresso reais em CSS embutido, e campos formais para assinaturas físicas/digitais do CFO e do Auditor Contábil Geral.
  - **Fallback Seguro contra Bloqueadores de Pop-ups:** Se o navegador bloquear o popup nativo de impressão, o sistema baixa automaticamente um arquivo `.html` de luxo contendo todo o design e dados financeiros intactos, garantindo 100% da experiência premium em formato interativo local.

### Removido
* **Botão Redundante de Impressão:**
  - Remoção do botão de impressão redundante (ícone `Printer`) para sanar a poluição visual do cabeçalho de ações e focar unicamente na exportação em PDF Executivo.

### Corrigido
* **Instabilidade de Sintaxe em Reports.tsx:**
  - Correção de quebra de runtime e compilação do TypeScript/Vite por erros de mesclagem de código após refatoração na função `handleDownloadAnalyticReport` e no encerramento da engine de auditoria `integrityData`.

---

## [1.17.4] — 2026-05-12

Esta versão realiza a **Implementação de Relatórios Opcionais e Correção de Bugs de Runtime na Central de Relatórios (Reports.tsx)** no Vault Finance OS. Focada em modularização sob demanda e usabilidade, ela introduz novos controles de feature flags para cada tipo de relatório (Iniciante, Intermediário, Avançado, Contábil, Eficiência, Risco, Auditoria, Corporativo, Integridade) e corrige dois erros graves na navegação e exibição do painel de auditoria.

### Adicionado
* **Configurações de Relatórios Opcionais:**
  - **useFeatureStore.ts:** Expansão do tipo `EnabledFeatures` e do estado persistente de controle de recursos com 9 novas chaves de visibilidade de relatórios individuais (`report_beginner`, `report_intermediate`, `report_advanced`, `report_compliance`, `report_performance`, `report_risk`, `report_audit`, `report_business`, `report_integrity`). Todos iniciados como ativos por padrão (`true`).
  - **Settings.tsx:** Integração automática das novas chaves de relatórios no painel de Módulos Opcionais das Configurações, contendo títulos claros e descrições detalhadas das ferramentas de análise.
  - **Reports.tsx:** Sincronização reativa e ocultação dinâmica dos botões das abas na barra de navegação de relatórios com base nas preferências salvas pelo usuário. Inclui redirecionamento inteligente automático com `useEffect` para a primeira aba habilitada disponível caso a aba ativa seja desativada.

### Corrigido
* **Crash de Navegação em Auditoria:**
  - **Reports.tsx:** Correção dos erros fatais de JavaScript `"Search is not defined"` e `"CheckSquare is not defined"` ao selecionar a aba de Auditoria, decorrentes de importações em falta dos ícones `Search` e `CheckSquare` de `lucide-react`.
* **Exibição Redundante Contábil:**
  - **Reports.tsx:** Correção da lógica de aninhamento de condicionais de renderização no JSX. O painel de "Conformidade & Contabilidade" (compliance) que funcionava como "else" padrão do primeiro ternário principal foi refatorado para ter seu próprio condicional estrito (`activeLevel === "compliance" ? (...) : null`). Isso impede que o painel de Contabilidade seja renderizado incorretamente por baixo de outras abas como "Eficiência", "Corporativo", "Risco" e "Integridade".
* **Geração e Download de Relatório PDF Corrompido:**
  - **Reports.tsx:** Resolução do bug em que o botão "Download PDF" baixava um arquivo de texto plano (`text/plain`) com extensão fictícia `.pdf`. Os leitores de PDF consideravam o arquivo corrompido e recusavam a abertura. Refatorado para disparar uma janela de impressão executiva limpa e monoespaçada que formata o relatório perfeitamente para papel e possibilita o salvamento em PDF real legítimo e íntegro pelo navegador, mantendo um fallback seguro e automático para `.txt` caso bloqueadores de pop-ups impeçam o fluxo.

---

## [1.17.3] — 2026-05-12

Esta versão realiza a **Correção de Crash de Runtime na Central de Relatórios (Reports.tsx)** no Vault Finance OS. Focada em segurança de tipos e robustez matemática, ela resolve um travamento instantâneo que ocorria ao carregar o painel de relatórios quando o banco de dados do Django retornava IDs numéricos inteiros para as transações, impedindo que o método `.split("")` quebrasse o fluxo de renderização do React.

### Corrigido
* **Crash de Conversão de Tipo de ID de Transação:**
  - **Reports.tsx:** Correção das chamadas diretas de `.split("")` no atributo `t.id` nas engines de Mapa de Calor de Vazamentos Temporais (linha 1707) e Trilha de Auditoria Compartilhada (linha 1765). Agora, o ID é encapsulado de forma segura como string via `String(t.id || "")` antes do fatiamento, tolerando perfeitamente tanto identificadores numéricos (chaves primárias autoincrementais do Django) quanto UUIDs de texto.

---

## [1.17.2] — 2026-05-12

Esta versão realiza a **Correção Estrutural e Redecoração de Luxo dos Modais de Dívidas** no Vault Finance OS. Focado em usabilidade e design responsivo mobile-first, ela elimina uma quebra de layout no componente de dívidas causada por conflitos de aninhamento de tags e esmagamento horizontal de campos, transformando o formulário em um layout vertical luxuoso e fluído com suporte a glassmorphism.

### Corrigido
* **Aninhamento Inválido de Componentes:**
  - **Debts.tsx:** Correção da inserção de elementos `<DialogFooter>` dentro de `<DialogHeader>` que causava o vazamento de layouts flexbox horizontais indesejados, corrompendo a organização estrutural dos inputs no formulário.
* **Layout Espremido e Sobreposições:**
  - Mudança do layout horizontal rígido (`grid-cols-4`) para um elegante fluxo de empilhamento vertical (`flex flex-col gap-1.5` e `space-y-4`) com labels posicionadas de forma limpa acima de cada campo. Isso previne cortes de texto e sobreposição de inputs em todas as resoluções de tela.

### Alterado
* **Estilização Premium de Dívidas:**
  - Redesenho dos modais de **Nova Dívida**, **Registrar Pagamento** e **Adicionar Débito** incorporando a paleta de cores HSL, gradientes sutis, cantos arredondados generosos (`rounded-3xl` e `rounded-xl`) e efeito de glassmorphism (`backdrop-blur-md bg-gradient-to-br from-card/90 via-card/50 to-primary/5`) em conformidade com a assinatura visual do sistema.

---

## [1.17.1] — 2026-05-12

Esta versão consagra a **Redecoração Visual de Luxo da Central de Ajuda e Suporte (HelpCenter.tsx)** no Vault Finance OS. Utilizando o design do painel de faturamento e assinaturas como referência máxima de elegância, a Central de Ajuda foi inteiramente reconstruída sob a estética de glassmorphism translúcido, brilhos sutis de profundidade e micro-transições impecáveis.

### Alterado
* **Redesenho do HelpCenter:**
  - **HelpCenter.tsx:** Reconstrução visual completa do formulário de abertura de tickets de suporte, menu lateral de canais e painel de feedbacks anteriores. Adicionados elementos translúcidos de vidro, efeitos de hover de altíssimo nível, badges premium do Shadcn UI e animações de drag and drop para arquivos anexados.

---

## [1.17.0] — 2026-05-12

Esta versão realiza a **Modularização de Alta Fidelidade da Aba de Assinaturas e Planos** no Vault Finance OS. Extraído diretamente do escopo de simulações e protótipos de alta fidelidade, o ecossistema agora gerencia e valida de forma isolada os planos e simulações de faturamento (Stripe, Apple App Store, Google Play Store), integrando visualizações dinâmicas de consumo de limites gratuitos, histórico de recibos para download e benefícios corporativos Pro através de um componente autônomo de alta coesão (`SubscriptionPanel`).

### Adicionado
* **Componente Modularizado SubscriptionPanel:**
  - **SubscriptionPanel.tsx (Novo):** Criação do componente isolado dentro do ecossistema `@/modules/auth/components/` contendo cards de preços dinâmicos, limitadores visuais de consumo do plano Free para contas, transações e metas (com barras de progresso), faturamento multi-plataforma flexível e download de recibos estruturados de pagamentos simulados.
* **Layouts de Alta Costura Visual:**
  - **Indicadores Dinâmicos de Consumo:** Inclusão de alertas amigáveis e indicadores de limite quando o usuário atinge acima de 80% do uso do plano Gratuito.
  - **Tabelas de Faturas:** Lista de faturas com semáforos de status de transação (Pago, Pendente, Falhou, Reembolsado).

### Alterado
* **Refatoração Geral de Configurações:**
  - **Settings.tsx:** Remoção completa de mais de 500 linhas de código duplicadas, incluindo dezenas de variáveis de estados em linha e handlers de faturamento simulado. Integração limpa do novo `<SubscriptionPanel />` sob a aba `subscription`, melhorando drasticamente a legibilidade e a manutenção do arquivo de configurações.

---

## [1.16.0] — 2026-05-12

Esta versão consagra a **Integração Real e de Alta Performance do Módulo de Chamados Técnicos** (Central de Suporte) do Vault Finance OS. Toda a antiga lógica mockada de simulação de chamados no frontend foi removida para dar lugar a um duto real de dados que persiste as informações com total segurança no banco de dados e as encaminha de forma reativa para o e-mail oficial da engenharia (`matheuskrx@gmail.com`), acompanhado por anexos binários reais e telemetria diagnóstica detalhada do navegador do cliente.

### Adicionado
* **Camada de Persistência & Modelagem Contábil de Suporte:**
  - **SupportTicket (Model Django):** Armazenamento de solicitações com campos dedicados para nome, e-mail de contato, tipo de chamado, nível de urgência, assunto, mensagem detalhada, anexo de capturas de tela/extratos (`FileField` apontando para `support_tickets/`) e dados estruturados de telemetria diagnóstica do cliente (`JSONField`).
* **Endpoint de Alta Fidelidade (REST API):**
  - **SubmitSupportTicketView (APIView):** Rota segura `/api/tickets/` protegida por tokens JWT Bearer que valida as requisições de clientes logados, cria o registro do ticket de suporte com protocolo único sequencial (`VT-XXXXX`) e envia de forma assíncrona/segura o feedback via e-mail.
* **Barramento Reativo de Notificações via E-mail:**
  - **Template HTML & Plain-Text Premium:** Envio de e-mails com design refinado, tabela de variáveis cadastrais, caixa formatada com a descrição da demanda do usuário e uma tabela limpa e legível de telemetria diagnóstica.
  - **Duto de Anexo Integrado:** Envio direto do arquivo original (PNG, JPG, WEBP, PDF) acoplado como anexo real no e-mail recebido pela engenharia.
* **Cobertura de Testes Automatizados (Backend):**
  - **test_support.py (Pytest):** Criação da suíte de testes contendo validações completas contra solicitações anônimas (401 Unauthorized) e verificações de integridade de dados e cabeçalhos de autenticação JWT Bearer para submissões válidas (201 Created).

### Alterado
* **Integração Client-Side (React):**
  - **HelpCenter.tsx:** Substituição da antiga simulação temporal (`setTimeout`) por um fluxo de processamento de API real e assíncrono conectando-se com segurança por meio do utilitário `authenticatedFetch` e submetendo objetos legítimos de `FormData` contendo metadados e arquivos físicos reais.

---

## [1.15.0] — 2026-05-12

Esta versão consagra o lançamento da **Central de Relatórios de Auditoria e Integridade Técnica** no Vault Finance OS. Focado no desenvolvedor e em auditores externos, este patamar adiciona três novas engines de validação de dados com logs imutáveis de ciclo de vida de transações, consolidação multi-entidade com eliminação de inflação patrimonial fictícia e análise granular de discrepância de conciliação OFX por conta.

### Adicionado
* **Nível de Integridade Técnica — Auditoria de Dados:**
  - **Log de Alterações Imutáveis (Immutable Logs):** Engine de rastreabilidade completa do ciclo de vida de cada transação com hashes SHA-256 determinísticos, classificação em 3 níveis de status (Prístina/Modificada/Sinalizada), linha do tempo de edições por operador e índice de integridade percentual.
  - **Consolidação Multi-Entidade (Moeda Mestra):** Agrupamento automático de contas por entidade jurídica (Pessoal, Empresa Principal, Empresa Secundária), detecção de transferências inter-companhia e eliminação de inflação patrimonial fictícia com ajuste de 50%.
  - **Discrepância de Conciliação OFX:** Análise granular por conta individual isolando transações pendentes de liquidação bancária, com semáforo de risco (🟢🟡🔴), barra de conformidade global e métricas de cobertura de conciliação.
* **Nona Pill Tab — Integridade:** Botão de navegação superior com ícone `Fingerprint` de lucide-react.
* **Extensão de Download de PDFs Executivos de Integridade:**
  - Exportação estruturada de Immutable Logs, Consolidação Multi-Entidade e Discrepância OFX em formato PDF.

### Documentação
* **ARCHITECTURE.md:** Inclusão das seções 8.28 (Immutable Logs), 8.29 (Multi-Entidade) e 8.30 (Discrepância OFX por Conta).

---

## [1.14.0] — 2026-05-12

Esta versão consagra o lançamento da **Central de Relatórios para Empresas (B2B & Startups)** no Vault Finance OS. Focado em saúde corporativa e inteligência de negócios, este patamar adiciona quatro novas engines de BI financeiro empresarial com gráficos de projeção de Runway, rosquinhas contábeis de OPEX/CAPEX, simulações de Break-even Point e rateio departamental por centros de custo recursivos.

### Adicionado
* **Nível Corporativo (B2B & Startups) — Saúde Empresarial:**
  - **Cash Burn Rate & Runway Preditivo:** Engine de consumo de caixa corporativo que mede a velocidade de queima de capital e projeta a autonomia financeira restante (Runway) com gráficos de área Recharts e alertas de solvência dinâmicos. Fórmula: `(Saldo Inicial - Saldo Final) / Meses`.
  - **OPEX vs. CAPEX (Balanço de Capital):** Discriminação contábil entre despesas operacionais correntes e investimentos em ativos duráveis (hardware, servidores, patentes) com gráfico de rosquinha interativo e cálculo de depreciação linear teórica de 20% ao ano.
  - **Ponto de Equilíbrio Contábil (Break-even Point):** Determinação do faturamento mínimo necessário para igualar custos operacionais com margem de contribuição real. Gráfico linear Recharts cruzando receitas simuladas (0%-200%) contra custos totais para identificar visualmente a interseção.
  - **Centros de Custo & Rateio Departamental:** Rateio contábil recursivo de despesas por departamentos (Tecnologia, Marketing, RH/Admin, Operações) utilizando classificação por palavras-chave e gráfico de barras horizontais com badges de percentual.
* **Oitava Pill Tab — Corporativo (B2B):** Botão de navegação superior com ícone `Building2` de lucide-react para acesso direto ao painel empresarial.
* **Extensão de Download de PDFs Executivos de B2B:**
  - Acoplamento completo das quatro engines de BI corporativo ao gerador `handleDownloadAnalyticReport` para exportação direta de relatórios estruturados em PDF com métricas de Burn Rate, Runway, OPEX/CAPEX, Break-even e Centros de Custo.

### Documentação
* **ARCHITECTURE.md:** Inclusão das especificações matemáticas das seções 8.24 (Burn Rate & Runway), 8.25 (OPEX vs CAPEX com depreciação linear), 8.26 (Break-even Point com margem de contribuição) e 8.27 (Centros de Custo com rateio departamental recursivo).

---

## [1.13.0] — 2026-05-12

Esta versão consagra o lançamento da **Central de Relatórios de Auditoria e Integridade do Sistema** no Vault Finance OS. Focado em governança contábil, integridade de transações compartilhadas e reconciliação fina de extratos, este patamar adiciona duas novas engines de dados e widgets de luxo que permitem ao usuário auditar alterações de lançamentos por operador, calcular discrepâncias entre saldos de caixas internos e arquivos bancários eletrônicos OFX, e liquidar pendências de forma instantânea.

### Adicionado
* **Nível de Auditoria & Integridade do Sistema — Governança Contábil:**
  - **Trilha de Auditoria Geral (Audit Trail):** Engine contábil baseada em logs determinísticos robustos estruturados por operador, timestamp e detalhes de retificação de transações individuais ou compartilhadas. Exibe barra de busca local interativa.
  - **Relatório de Reconciliação Bancária:** Sistema de comparação de balanços contra extratos importados OFX, isolando transações pendentes de liquidação bancária, com barra de progresso de conformidade e gatilhos de liquidação reativa instantânea (com feedback visual e auditivo).
* **Extensão de Download de PDFs Executivos de Auditoria:**
  - Acoplamento das engines de auditoria de logs e conciliação OFX ao gerador `handleDownloadAnalyticReport` para exportação direta de relatórios estruturados de auditoria em PDF.

## [1.12.0] — 2026-05-12

Esta versão consagra o lançamento da **Central de Relatórios de Estatística & Projeções de Risco** no Vault Finance OS. Focado em ciência de dados e engenharia matemática atuarial, este patamar adiciona três novas engines estocásticas e estatísticas avançadas acompanhadas por gráficos de regressão, simulação estocástica de dispersão de Monte Carlo e mapas de calor cronológicos interativos para vazamento de capital.

### Adicionado
* **Nível de Estatística & Projeções de Risco — Inteligência Preditiva:**
  - **Análise de Tendência Linear (Regression Analysis):** Engine de mínimos quadrados ordinários (OLS) que computa inclinações de fluxo mensal e projeta o saldo de qualquer conta selecionável para os próximos 6 meses com coeficiente de determinação $R^2$.
  - **Simulação de Monte Carlo (Estresse Estocástico):** Modelo atuarial baseado em 500 trajetórias estocásticas de despesas semanais para as próximas 24 semanas. Utiliza desvio padrão real e a Transformada de Box-Muller para desenhar intervalos de confiança de 95%.
  - **Mapa de Calor de Vazamentos Temporais (Heatmap):** Matriz analítica bidimensional ($7 \times 4$) cruzando dias de semana com períodos de horário. Identifica de forma brilhante picos cronológicos de vazamento de capital.
* **Extensão de Download de PDFs Executivos de Risco:**
  - Acoplamento das três novas engines estocásticas ao gerador `handleDownloadAnalyticReport` para salvamento imediato do faturamento executivo em formato PDF.

## [1.11.0] — 2026-05-12

Esta versão consagra o lançamento da **Central de Relatórios de Eficiência & Performance Financeira** no Vault Finance OS. Focado em matemática financeira de alta performance, este patamar adiciona três novas engines analíticas avançadas acompanhadas por velocímetros de solvência, gráficos de dispersão e relatórios analíticos de variância para o download executivo local em PDF.

### Adicionado
* **Nível de Eficiência & Performance — Recursos de Matemática Financeira Avançada:**
  - **Taxa de Poupança Marginal (MSR - Marginal Savings Rate):** Medidor analítico de inflação de padrão de vida (*lifestyle inflation*), comparando as receitas e poupança líquidas do período contra o intervalo histórico anterior equivalente. Exibe os dados em uma linha de tendência reativa de dupla área com gradiente reativo do Recharts.
  - **Análise de Variância (Budget Variance Analysis):** Engine contábil que analisa desvios em envelopes orçamentários YNAB, isolando o estouro de orçamento em **Efeito Preço** (variação de custo médio por transação) e **Efeito Volume** (frequência maior de gastos), plotados em um gráfico de barras horizontais empilhadas.
  - **Índice de Solvência de Caixa (Survival Métrica):** Autonomia de subsistência de caixa líquido calculada reativamente com base na divisão de Ativos Circulantes de altíssima liquidez pela média de saídas operacionais. Renderizado em um elegante velocímetro radial dinâmico com badges de gravidade.
* **Extensão de Download de PDFs de Eficiência & Performance:**
  - Acoplamento das três novas engines analíticas ao duto de download `handleDownloadAnalyticReport` para exportação direta de relatórios executivos em formato de texto estruturado com extensão `.pdf`.

## [1.10.0] — 2026-05-12

Esta versão consagra o lançamento e consolidação definitiva do **Nível Contábil e de Conformidade** na Central de Relatórios Financeiros. Esse módulo de engenharia contábil de ponta foi projetado para exportação de dados para contadores, auditoria patrimonial interna e declaração de ativos multimoedas de alta complexidade. A versão introduz três novas engines matemáticas contábeis acopladas ao motor de download de relatórios em PDF executivo.

### Adicionado
* **Nível Contábil e de Conformidade — Recursos de Auditoria e Fiscalidade:**
  - **Balancete de Verificação (Trial Balance):** Prova de partidas de débito e crédito agrupando saldos patrimoniais (Ativos) e saldos de resultado (Receitas e Despesas), equipado com cálculo automático de ajuste de equilíbrio patrimonial e barras de integridade sistêmica com o status "Sistema em Perfeito Equilíbrio Contábil".
  - **DRE Simplificado (Demonstrativo de Resultados de Exercício):** Fluxo clássico em cascata vertical apurando Receita Bruta, custos operacionais por subcategorias de envelopes e o Resultado Operacional Líquido do período filtrado sob o regime de competência pura (expurgando transferências financeiras internas).
  - **FX Realized vs. Unrealized (Ganhos/Perdas Cambiais):** Triagem técnica sobre as flutuações de 12 moedas globais, segregando diferenciais liquidados em transações (Realized) e variações latentes de saldo sob custódia em contas estrangeiras (Unrealized) plotados em um gráfico de barras empilhadas responsivo.
* **Extensão de Download de PDFs Executivos de Contabilidade:**
  - Adaptação do gerador local de relatórios client-side `handleDownloadAnalyticReport` para estruturar e baixar o relatório completo contendo o balancete, cascata DRE e listagem de volatilidade de moedas estrangeiras em formato de texto plano com a extensão de relatório adequada.

## [1.9.1] — 2026-05-12

Esta versão consagra o lançamento do **Nível Avançado ("Como otimizar meu capital?")** na Central de Relatórios Financeiros, projetado para nômades digitais, investidores globais e usuários experientes que lidam com alta complexidade financeira. O módulo adiciona quatro novas engines matemáticas avançadas equipadas com exibições em gráficos do Recharts e totalização integrada ao motor duplo de download de PDF executivo.

### Adicionado
* **Nível Avançado ("Como otimizar meu capital?") — Recursos de Elite:**
  - **Análise de Subcontas Recursivas (TreeMap):** Gráfico de mapa de árvore (`Treemap` do Recharts) que renderiza proporcionalmente o peso de cada subconta ou envelope sobre o patrimônio consolidado, unificando os saldos indiretamente para a moeda base do usuário via Euro pivô.
  - **Impacto Cambial (Multi-moeda):** Módulo de cálculo que avalia a flutuação de moedas estrangeiras no portfólio, estimando o ganho ou perda nominal acumulada de poder de compra contra a moeda base e renderizando uma linha de tendência cronológica de volatilidade cambial.
  - **Projeção de Fluxo de Caixa (Forecasting):** Algoritmo preditivo de regressão linear que calcula médias reais de receitas e despesas com base no histórico e projeta o saldo de caixa consolidado para os próximos 3, 6 e 12 meses futuros através de linhas pontilhadas de tendência com áreas de gradientes transparentes.
  - **Relatório de Eficiência Fiscal e Tarifas:** Indicador com medidor radial (`RadialBar` Gauge) que audita despesas tarifárias incidentes sobre o portfólio (como IOF, spreads de câmbio e taxas de contas) e atribui um Score de Eficiência fiscal acompanhado de diretrizes de otimização de capital.
* **Extensão de Download de PDFs Executivos:**
  - Acoplamento das quatro novas engines analíticas avançadas ao duto de geração de relatórios locais de faturamento client-side para exportar relatórios de otimização cambial, forecasting e eficiência de faturamento estruturados com extensão `.pdf`.

## [1.9.0] — 2026-05-12

Esta versão marca a estreia e consolidação definitiva da **Central de Relatórios Financeiros Interativos**, unificando as experiências de análise visual em dois patamares complementares: **Nível Iniciante ("Onde estou agora?")**, focado em clareza imediata e contenção de danos, e **Nível Intermediário ("Estou progredindo?")**, voltado para tendências de consistência, custos fixos e planejamento de objetivos de médio prazo. O painel unifica oito análises ricas com gráficos interativos responsivos utilizando a biblioteca **Recharts**, filtros reativos e um motor duplo de exportação em PDF de alta qualidade.

### Adicionado
* **Painel e Tela Central de Relatórios (`Reports.tsx`):**
  - Inclusão da rota protegida `/reports` e sua integração com a Sidebar lateral com o ícone `BarChart3`, cuja exibição é amarrada de forma segura ao chaveamento de recursos do módulo de `insights`.
  - Painel de filtros interativo e colapsável contendo seletores de períodos (Mês atual, Últimos 90 dias, Últimos 180 dias e Ano atual) e dropdowns dinâmicos de multiseleção por contas e por categorias orçamentárias.
  - Menu superior de navegação por níveis ("Pill Tabs") com transição suave em CSS para chaveamento instantâneo de contexto de relatórios.
* **Nível Iniciante ("Onde estou agora?") — Análises Atômicas:**
  - **Patrimônio Líquido:** Gráfico de área e linha de dupla curva comparando Ativos versus Passivos no tempo, alimentado por um algoritmo de backtracking financeiro reverso de saldos.
  - **Distribuição de Gastos:** Gráfico de donut animado revelando composição percentual de despesas por categorias e alertas de "Fuga de Capital" caso ultrapasse 30% da renda.
  - **Fluxo de Caixa Diário:** Área cumulativa mostrando as curvas de entradas versus saídas com detecção circular de pico absoluto de retiradas.
  - **Status de Envelopes:** Progresso visual comparando dotação de orçamentos (`Budgeted`) vs despesas (`Activity`) da metodologia YNAB com glows neon dinâmicos de gravidade.
* **Nível Intermediário ("Estou progredindo?") — Análises de Tendências:**
  - **Orçado vs. Realizado:** Gráfico de colunas duplas agrupadas (`BarChart` agrupado) comparando as dotações planejadas versus gastos efetivados para cada subcategoria orçamentária, integrado a um módulo de detecção automática de maiores desvios e economias.
  - **Relatório de Recorrências:** Rastreamento estruturado de faturas e assinaturas fixas (`is_recurring: true`), calculando o peso acumulado dos custos fixos sobre as saídas totais e renderizando um gráfico de rosca de despesas fixas versus variáveis.
  - **Histórico de Categorias:** Seletor interativo de subcategorias que consulta retroativamente o histórico de transações e agrupa os montantes mensais dos últimos 6 meses em um gráfico de área de tendência cronológica de consumo.
  - **Metas de Economia:** Integração nativa em tempo real com os objetivos criados pelo usuário obtidos via API do hook React Query `useGoals`, adicionando barra de progresso horizontal e uma engine preditiva de projeção de meses restantes baseada na taxa média de poupança.
* **Motor Duplo de Exportação de PDF:**
  - **Impressão Vetorial A4 Nativa (@media print):** Estilos CSS que reconfiguram e otimizam todo o painel de relatórios das abas Iniciante ou Intermediário em folha A4 vertical para salvar em PDF vetorial perfeitamente nítido sem barras de navegação ou filtros.
  - **Download de Relatório Analítico Executivo:** Geração local client-side de relatório analítico de faturamento estruturado em formato executivo que se adapta de acordo com o nível selecionado e faz download imediato com extensão `.pdf`.


## [1.8.0] — 2026-05-12

Esta versão traz o novíssimo **Gerenciador de Assinaturas e Planos Multicliente** integrado nativamente às configurações do usuário, proporcionando um painel premium, reativo e totalmente interativo para gerenciar assinaturas. A arquitetura foi adaptada para demonstrar de forma perfeita as integrações nativas de cobrança multiplataforma: **Stripe na Web**, **Apple App Store no iOS (Apple IAP)** e **Google Play Store no Android**.

### Adicionado
* **Painel de Faturamento e Gerenciamento de Assinaturas:**
  - Inserção da aba nativa **"Assinatura"** nas configurações do usuário (`Settings.tsx`), com transição animada e layout otimizado de 12 colunas para computadores e adaptabilidade total para dispositivos móveis (Capacitor).
* **Playground de Faturamento e Simulador de Estados Ativo:**
  - Adicionado um **Simulador de Faturamento** no topo da aba, permitindo que engenheiros, testadores e o usuário simulem instantaneamente qualquer cenário de faturamento em tempo real: alternar entre planos (**Grátis** vs **Pro**), plataformas de pagamento (**Stripe**, **Apple App Store**, **Google Play Store**) e ciclos de faturamento (**Mensal** vs **Anual**).
  - Persistência reativa das variáveis de simulação no `localStorage` do navegador, mantendo a experiência consistente entre recarregamentos de página.
* **Card Premium do Plano Pro Ativo:**
  - Exibição sofisticada de status de assinatura Pro, com badge verde "Ativo" pulsante, preço atualizado em tempo real pelo ciclo e data da próxima cobrança dinâmica baseada no ciclo selecionado.
  - Exibição de metadados simulados de faturamento específicos para cada plataforma ativa (como Mastercard final `**** 4242` no Stripe, conta iCloud no iOS e e-mail Google no Android), acompanhados por botões dinâmicos de acesso direto às lojas de aplicativos e de cancelamento simulado de plano.
* **Card do Plano Grátis e Nudges de Limites:**
  - Card explicativo para usuários do plano básico gratuito, integrando barras de progresso reais de limites técnicos do app (ex: limite de contas criadas e envelopes de orçamento base-zero utilizados) e botão de ação animado para upgrade imediato.
* **Aplicador de Cupons Promocionais Reativo:**
  - Campo funcional de cupom promocional com validação em tempo real. Os cupons são interpretados reativamente (ex: `VAULTENGINEER` aplicando 100% de desconto perpétuo, ou `SAVE30` aplicando 30% de desconto) e atualizam instantaneamente todos os valores exibidos nos cards, tabelas e faturas.
* **Histórico de Faturas com Download Funcional de Extratos:**
  - Histórico de pagamentos estruturado com ID da fatura, data de emissão, plataforma de faturamento, preço final atualizado pelo cupom de desconto e status "Pago".
  - Implementação de um gerador e baixador reativo de faturas fidedignas (formato de nota fiscal em texto plano com extensão `.pdf` simulada), permitindo ao usuário baixar faturas legítimas diretamente da interface do navegador.
* **Tabela Comparativa de Recursos e FAQ Expandível:**
  - Grade comparativa detalhada dos diferenciais técnicos e de recursos entre o plano Grátis e Pro.
  - Acordeão animado e expandível com perguntas frequentes de faturamento abordando uso multidispositivo da assinatura Pro, cancelamento sem multas e políticas de reembolso das lojas.
* **Modal Premium de Confirmação de Checkout (Upgrade):**
  - Diálogo de confirmação com design translúcido em vidro (`backdrop-blur-xl`) para ativação do Pro. Exibe um resumo analítico detalhado do checkout, abatimento real de cupons ativos, valor total e notas fiscais detalhadas adaptadas por plataforma.

## [1.7.0] — 2026-05-12

Esta versão traz a novíssima **Central de Ajuda (Help Center)** integrada, contendo uma rica base de conhecimento com busca instantânea de artigos financeiros de engenharia, suporte interativo via ticket com loader simulado, coleta de diagnóstico de telemetria técnica e upload interativo de anexos por arrastar e soltar (drag-and-drop). Esta versão foi aprimorada com uma inteligente **arquitetura híbrida de dupla identidade** para separar acessos públicos e privados.

### Adicionado
* **Suporte Híbrido Público vs. Privado (Acessibilidade de Escopo):**
  - **Acesso Público (`/help-center`):** Artigos de ajuda e FAQ acessíveis livremente a qualquer usuário deslogado no site. Ao tentar clicar em "Suporte Direto" ou "Enviar Feedback", o sistema exibe uma tela de bloqueio com indicador de segurança e botão de autenticação que redireciona para `/auth`.
  - **Acesso Privado (`/help`):** Mapeado debaixo das rotas protegidas do `Layout` com a Sidebar ativa. Todas as abas e formulários funcionam livremente e de forma 100% nativa para o cliente autenticado.
* **Consistência Estética Pixel-Perfect:** Refatoração visual do componente no modo privado. Removemos fundos escuros maciços (`bg-slate-950`), glows de fundo redundantes e o header de retorno "Voltar para a Home". Agora, o Help Center herda o tema nativo do painel, os contêineres e um cabeçalho de título clean idêntico ao das páginas de `Accounts` e `Settings`, garantindo integração estrita.
* **Auto-Preenchimento e Proteção Antifalsificação:** Integração nativa com `useAuthStore` do Zustand. Se o usuário estiver logado, os campos de Nome e E-mail são travados com as credenciais reais do usuário, impedindo erros e garantindo a autenticidade de chamados.
* **Telemetria de Diagnóstico Técnico (Suporte):** Mapeamento e exibição colapsável transparente de metadados do ambiente (OS, navegador amigável, resolução de tela, latência de API e cookies) para auxiliar a triagem rápida pelo time de engenharia de suporte.
* **Módulo Drag-and-Drop de Anexos:** Área de arrastar e soltar de arquivos de suporte (PNG, JPG, WEBP e PDFs) com preview de miniaturas ricas para imagens ou ícones correspondentes de PDF, acompanhado por barra de progresso de upload animada.
* **Busca Reativa de Artigos Técnicos:** Base de conhecimento com pesquisa dinâmica por texto e filtros rápidos por categorias (Metodologia YNAB, Multimoedas e Cibersegurança). Artigos ricos sobre regras matemáticas de recursão, câmbio pivô EUR e blindagem lógica contra IDOR/BOLA.
* **Canal de Suporte e Abertura de Tickets:** Formulário reativo para abertura de chamados que simula processamento em tempo real com gerador de ID de ticket exclusivo (ex: `#VT-84920`).
* **Canal de Feedback Interativo:** Sistema de avaliação com estrelas reativas (hover glow), seletor de sentimento e persistência automática do histórico de feedbacks do usuário no `localStorage` do dispositivo.
* **Atalho Estrutural na Sidebar:** Injeção do botão de **Ajuda e Suporte** no rodapé de [Sidebar.tsx](file:///c:/Users/mathe/PROJETO-YNAB/Ynab/src/shared/components/dashboard/Sidebar.tsx), logo acima das Configurações, com comportamento ativo, colapsável e tooltip sincronizado.
* **Ancoragem na Landing Page:** Link em destaque na coluna de Suporte da Landing Page ([Landing.tsx](file:///c:/Users/mathe/PROJETO-YNAB/Ynab/src/modules/auth/pages/Landing.tsx)) apontando diretamente para as query parameters reativas do Help Center público (`/help-center?tab=articles`).
* **Redirecionamento Inteligente:** Redirecionamento retrocompatível automático de `/ajuda` para `/help-center?tab=articles` em [App.tsx](file:///c:/Users/mathe/PROJETO-YNAB/Ynab/src/App.tsx).


## [1.6.0] — 2026-05-12

Esta versão marca a introdução da **Central Legal (Legal Center)** unificada do Vault Finance OS, consolidando todas as políticas, regulamentos e termos técnicos do ecossistema em uma interface única de navegação fluida, além de inaugurar a central ativa de segurança, governança de TI e compliance de dados do SaaS.

### Adicionado
* **Central Legal Unificada (Legal Center):** Desenvolvimento do componente e página centralizada `/legal` ([LegalCenter.tsx](file:///c:/Users/mathe/PROJETO-YNAB/Ynab/src/modules/auth/pages/LegalCenter.tsx)), equipada com um menu lateral reativo e flutuante para desktop e abas horizontais adaptativas e deslizantes para celulares (Capacitor).
* **Painel Ativo de Governança de TI e Cibersegurança:** Criação da aba de **Visão Geral** que detalha de forma transparente os pilares de segurança do app, incluindo a isolação de escopo lógica multitenant do banco PostgreSQL contra falhas IDOR/BOLA, rotinas de criptografia simétrica com hash PBKDF2, fluxos JWT de sessão e auditorias estáticas/dinâmicas periódicas.
* **Redirecionamento Inteligente de Rotas Legadas:** Implementação de redirecionamento retrocompatível dinâmico (`<Navigate replace />`) no roteador central [App.tsx](file:///c:/Users/mathe/PROJETO-YNAB/Ynab/src/App.tsx) para traduzir instantaneamente URLs antigas para as respectivas abas com query parameters da nova Central Legal.

### Alterado
* **Sincronização de Links Institucionais:** Adaptação completa dos links do rodapé na Landing Page ([Landing.tsx](file:///c:/Users/mathe/PROJETO-YNAB/Ynab/src/modules/auth/pages/Landing.tsx)) e no banner de privacidade flutuante ([CookieBanner.tsx](file:///c:/Users/mathe/PROJETO-YNAB/Ynab/src/modules/auth/components/CookieBanner.tsx)) para apontarem para as abas corretas da central (`/legal?tab=termos`, `/legal?tab=privacidade`, `/legal?tab=cookies`).

### Removido
* **Pruning de Código Redundante:** Exclusão definitiva de arquivos individuais legados (`TermsOfUse.tsx`, `PrivacyPolicy.tsx`, `CookiePolicy.tsx`) para manter o repositório enxuto e mitigar custos de manutenção em duplicidade.

## [1.5.0] — 2026-05-11

Esta versão introduz a funcionalidade altamente solicitada de **Exclusão Seletiva de Contas das Somatórias**, permitindo aos usuários ocultarem saldos de contas e subcontas específicas dos totais acumulados de contas pai, Net Worth global e dashboard, sem excluí-las visualmente da interface.

### Adicionado
* **Exclusão Seletiva de Somatórios (Domínio):** Adição do campo `exclude_from_totals` à tabela física e modelo `Account` no Django, expondo-o na resposta serializada da árvore financeira.
* **Cálculo de Saldos Inteligente e Recursivo (Frontend):** Refatoração do algoritmo recursivo de somatório (`sumNode`) em `AccountAccordion.tsx` com tratamento adaptativo de raiz (`isRootCall`). Subcontas marcadas para exclusão retornam saldo consolidado individual `0` para a conta pai, mas exibem seus saldos reais na sua própria linha visual.
* **Filtragem de Ativos do Dashboard:** Adaptação da lógica global do Zustand `totalsByCurrency` para ignorar o saldo de qualquer conta ou subconta que possua a flag de exclusão ativa, recalculando instantaneamente o Net Worth e as distribuições de excedentes.
* **Componentes de Configuração Premium (UI):** Inclusão de um checkbox emoldurado de alta fidelidade visual ("Desconsiderar nos Totais") equipado com HelpTooltip dinâmico explicando as consequências da flag nos modais de:
  * **Criação de Conta Raiz** (`AddRootAccountModal.tsx`)
  * **Criação de Subconta** (`AddAccountModal.tsx`)
  * **Edição de Conta** (`AccountActions.tsx`)
* **Ordenação Alfabética de Subcontas (A-Z):** Implementação de um controle de ordenação alfabética para as subcontas de cada conta matriz. O estado é controlado por um botão reativo estilizado com o ícone `ArrowDownAZ` posicionado no canto superior direito do acordeão financeiro, cuja preferência do usuário é gravada e persistida reativamente no `localStorage` sob a chave `vault_sort_subaccounts_az`.
* **Caixa de Busca na Seleção de Contas (Lançamento):** Adição de caixas de busca reativas e inteligentes nos campos de seleção de contas de origem e destino dentro do modal de lançamento de transações (`AddTransactionModal.tsx`). O campo aparece de forma sutil e condicionada quando o usuário possui mais de 4 contas cadastradas, acompanhado por filtragem reativa instantânea de digitação e tratamento de estado vazio ("Nenhuma conta encontrada") nos dropdowns do seletor.
* **Escolha de Moedas em Dívidas (Multi-moedas):** Introdução da possibilidade de selecionar a moeda ("EUR", "BRL", "USD") na criação de novas dívidas no painel de devedores (`Debts.tsx`), integrando-se perfeitamente com os cálculos cambiais dinâmicos do sistema.
* **Acréscimo de Saldo Devedor (Mais Débito):** Implementação de um botão de ação e modal dedicado ("Mais Débito") para aumentar o saldo devedor de dívidas existentes. A ação conta com uma `@action add_debt_amount` atômica no Django que incrementa a dívida e opcionalmente gera a transação financeira reversa correspondente para conciliação bancária de saldos, registrando também uma nota automática de auditoria nos históricos.
* **Layout de Dívidas Responsivo (Pixel-Perfect):** Refatoração do rodapé dos cards de dívida em `Debts.tsx` para usar layout flex-wrap responsivo, impedindo colisões de texto e que o botão "Adicionar Saldo" saia para fora do contêiner em telas pequenas e celulares.
* **Preenchimento Automático Baseado no Histórico (Autocomplete Inteligente):** Introdução de um mecanismo reativo de auto-complete integrado ao campo de Descrição do modal de transações (`AddTransactionModal.tsx`). Ao começar a digitar, o sistema busca ativamente transações anteriores com descrições correspondentes (case-insensitive). Ao selecionar uma sugestão, o formulário é magicamente preenchido com o último valor absoluto, o tipo correto (Receita/Despesa), a Conta de Origem anterior e a Categoria de Orçamento anterior correspondentes. O dropdown exibe informações completas (Moeda, Categoria, Conta e Tipo) com badges premium e se fecha automaticamente se houver clique fora do contêiner.
* **Personalização Modular da Interface (Feature Flags do Usuário):** Criação de um mecanismo dinâmico e persistente no Zustand (`useFeatureStore.ts`) que permite ao usuário ativar ou desativar páginas inteiras do painel de controle (Dashboard, Árvore de Contas, Extrato de Transações, Orçamentos, Dívidas, Metas e Insights Inteligentes).
* **Painel de Controle de Módulos (UI/UX):** Integração de uma nova aba ("Módulos") equipada com cards informativos individuais no painel de Configurações gerais (`Settings.tsx`), oferecendo botões de status ("✓ Habilitado" em verde / "✗ Desabilitado" em vermelho) e salvamento automático instantâneo no `localStorage`.
* **Segurança e Filtragem de Navegação Dinâmicas:** Readequação da Sidebar (`Sidebar.tsx`) e da navegação mobile (`BottomNav.tsx`) para refletir em tempo real apenas as seções selecionadas pelo usuário, associada a um componente de proteção de rotas (`FeatureProtectedRoute` em `App.tsx`) que blinda o acesso direto por URL e previne loops de redirecionamento.
* **Planejamento Financeiro 50-30-20:** Criação de um módulo completo dedicado à consagrada regra financeira 50-30-20, dividindo a renda líquida em Necessidades (50%), Desejos (30%) e Prioridades/Futuro (20%).
* **Integração Inteligente ou Autônoma:** Inclusão de um mecanismo de chaveamento que permite ao módulo rodar no modo manual (inserindo renda estática) ou totalmente integrado ao ecossistema YNAB, somando as receitas reais do período e computando as despesas das categorias mapeadas automaticamente.
* **Componente de Mapeamento de Categorias (UI/UX):** Painel de mapeamento interativo para que o usuário associe suas categorias de orçamento a um dos 3 baldes com um único clique (persistido de forma segura e reativa no `localStorage` via `useRule503020Store`).
* **Gráficos e Indicadores de Desempenho Visual:** Inclusão de medidores de progresso reativos, indicadores inteligentes de teto de gastos (Verde/Alvo, Âmbar/Atenção, Vermelho/Estourado) e gráficos de pizza comparativos paralelos (Distribuição Ideal vs. Gastos Reais do Mês).
* **Migração de Banco Segura e Sem Interrupções:** Aplicação de migração Django vinculando os modelos ao app original `core` (usando `app_label = 'core'`), gerando uma alteração de coluna no SQLite e PostgreSQL sem quebrar deploys de produção ou tentar apagar tabelas legadas.



### Corrigido
* **Saldo Inicial de Contas Negativas:** Correção da lógica de criação de contas no Django (`perform_create` em `views.py`) que gerava a transação automática de saldo inicial apenas para saldos positivos. Agora, contas criadas com saldo negativo também ganham automaticamente sua transação de saldo inicial (como despesa, usando o valor absoluto do saldo inicial), sanando inconsistências de relatórios.
* **Migração Corretiva de Dados Retroativos (Produção):** Introdução da migração corretiva de dados `0022_fix_negative_and_positive_initial_balances.py` no Django. Durante o deploy, ela varre todas as contas reais do banco de dados (especialmente na produção) que foram criadas sem transações de saldo inicial (seja saldo positivo ou negativo) e gera a transação corretiva inicial de forma 100% segura e invisível ao usuário.
* **Ajuste de Balões de Texto Informativo (Tooltips):** Correção do estouro e corte de balões informativos de ajuda (`HelpTooltip.tsx`) por meio da adição das propriedades de utilidade CSS `break-words` e `whitespace-normal`, e diminuição da largura responsiva máxima em celulares (`max-w-[240px] sm:max-w-[320px]`). Evita o vazamento lateral em todas as resoluções e layouts móveis do sistema.

---

## [1.4.0] — 2026-05-11

Esta versão representa um marco de engenharia focando em **Clean Architecture** e **Modularização de Alta Coesão**, separando de forma estrita e hermética a infraestrutura administrativa reutilizável do SaaS (**SaaS Boilerplate Starter Kit**) das lógicas e fluxos de negócios especializados de finanças e metodologia YNAB do **Vault Finance OS**.

### Adicionado
* **Isolamento de Infraestrutura SaaS (Boilerplate):** Encapsulamento completo de rotinas administrativas, JWT, perfil do usuário, autenticação segura multifator 2FA (TOTP) e políticas internacionais de dados (GDPR/LGPD) em módulos dedicados (`core` no Django e `src/modules/auth` no React).
* **Módulo Especializado de Finanças (Domain Core):** Criação do módulo financeiro autocontido (`finance` no Django e `src/modules/finance` no React), responsável exclusivo por árvores de contas mestre e envelopes recursivos, algoritmos de teto/transbordo (*distribute_excess*), amortização de dívidas e metas.
* **Backup de Segurança Completo (JSON):** Correção do botão de exportação e implementação de rotina para download de backup integral instantâneo contendo todas as contas, transações, categorias, metas, dívidas e modelos.
* **Exportação Analítica para Planilha (CSV):** Adicionada funcionalidade para exportar o livro-razão de transações do período ativo em formato CSV de planilha, otimizado com codificação UTF-8 BOM para compatibilidade com Excel e Google Sheets.
* **Estrutura Compartilhada de UI (Shared Componentry):** Unificação de componentes genéricos e primitives do Shadcn/ui sob o diretório `src/shared/`, otimizando a reusabilidade e blindando os módulos de negócios contra dependências acopladas.
* **Garantia de Não-Regressão (Zero-Regression Pipeline):** Expansão e normalização da suíte de testes com 100% de sucesso em todas as verificações do backend (40 de 40 testes verdes no Pytest) e do frontend (27 de 27 testes verdes no Vitest).

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

### Corrigido
* **Normalização de Ícones no Windows (Barras Invertidas):** Correção do bug que gerava caminhos com barras invertidas (`\`) ao salvar imagens através do `default_storage.save` no Windows, comprometendo as URLs absolutas dos ícones retornadas pelo endpoint `/api/icons/upload/`. Agora, todas as barras são normalizadas com `.replace('\\', '/')`, garantindo renderização instantânea do preview em qualquer SO.
* **Serviço de Arquivos de Mídia em Produção (Django):** Inclusão de mapeamento de URLs dinâmicas para arquivos estáticos e de mídia na raiz `ynab_backend/urls.py` via `django.views.static.serve` quando `DEBUG=False`. Isso resolve em definitivo o erro `404 Not Found` no Render ao acessar imagens, avatares ou ícones enviados pelos usuários na plataforma online.
* **Coleta de Testes de Ícones no Pytest:** Ajuste do nome do arquivo de testes de `tests_icon.py` para `test_icons.py` para estar em conformidade com as regras de nomenclatura do Pytest e ser incluído na suíte automatizada de testes, além de adicionar o caso `test_icon_upload_endpoint` simulando uploads Multipart.

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
- feat(ui): Ajustes na tabela do Histrico (sem rolagem), edio rpida de lanamentos, pesquisa por valores, alterao do cone de velocmetro para alvo e aviso explicativo de 'Valor Bruto'.
- feat(ui): Ajustes no card de Patrimnio Lquido em Investimentos, adio de bales informativos no cadastro de contas e formatao simplificada do histrico de ativos.

## [1.35.4] - 2026-05-23

### ? Features & Integrations
- **Modo Demo & Onboarding:** Implementado um novo motor de Seeding de banco de dados (seeding.py). Agora, quando um novo usurio se cadastra, o YNAB cria silenciosamente toda a taxonomia padro de categorias para facilitar o envelopamento. Tambm criamos a 'rea de Testes e Reset' nas Configuraes, contendo um Modo Demo de 1 clique que gera contas, limites falsos de cartes, dezenas de transaes e investimentos pre-populados para que o cliente aprenda a usar o Vault Finance OS interagindo com uma massa de dados rica antes de plugar suas finanas reais.

## [1.35.3] - 2026-05-23

### ?? Features & Integrations
- **Taxonomia Global de Investimentos:** Refatorao do modelo InvestmentAsset para suportar market_country, asset_category e novos tipos de asset_type. O modelo InvestmentActivity agora suporta payloads dinmicos incluindo due_date.

### ?? UI & Frontend Updates
- **Taxonomia Global Config:** Adicionado o mapeamento centralizado de constantes de investimento em \src/constants/investmentTaxonomy.ts\ para popular formulrios dinamicamente.


U p d a t e d   U I   f o r   S u b - a c c o u n t   l i s t   t o   i n c l u d e   m i c r o - l a b e l s  
 U p d a t e d   O v e r f u n d e d   S u b - a c c o u n t   U I   w i t h   n e w   c y a n - t o - p u r p l e   g r a d i e n t  
 F i x e d   b u t t o n   h o v e r   c o n t r a s t   g l o b a l l y  
 





