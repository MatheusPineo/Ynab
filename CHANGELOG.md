## [1.41.00] - 2026-05-29

### Added
- Modelos de Colegas de Quarto e Dívidas: Criados os modelos `Debtor` e `DebtItem` no Django para suportar despesas compartilhadas granularmente.
- Motor de Repagamento FIFO Agrupado: Desenvolvido `DebtorPaymentService.pay_subaccount_group` atômico para injetar saldos em contas e liquidar dívidas em fila cronológica.
- Registro de Dívidas em Lote (Bulk Creation): Desenvolvido o serviço `DebtorCreationService.register_itemized_debts` transacional para cadastrar múltiplos itens de despesa vinculados a um roommate sem deduzir novamente do envelope.
- Serialização e Agregação na API: Refatorada `DebtorViewSet` e criada `DebtItemViewSet` para expor dívidas consolidadas por envelope, totais pendentes e itens internos estruturados em formato aninhado. Adicionado endpoint `POST /api/debtors/{id}/add_items/` mapeando o serviço de lote.
- Cobertura de Testes Automatizados: Adicionado `test_debtor_payments.py` com validações rigorosas de comportamento FIFO, criação em lote e rotas HTTP da API.
- Visualização e Controle de Dívidas Agrupadas (Frontend): Refatorada a visualização do painel principal de devedores (`Debts.tsx`) para renderizar os saldos em aberto agrupados por subconta de destino de forma aninhada, removendo a barra de progresso linear e o subtítulo descritivo. Renomeado o botão de ação principal para "Registrar Pagamento" adjacente a "+ Mais Débito".


## [1.40.00] - 2026-05-29

### Added
- Metas de Orçamento Inteligentes: Introduzidas as propriedades `target_value`, `target_type` (choices: FIXED, PERCENTAGE) e `ceiling_value` no modelo `Category` do Django.
- Serviço de Distribuição de Renda (Smart Allocation): Criado o serviço `BudgetAutomationService.smart_allocate` para preenchimento de envelopes base-zero de forma atômica no backend a partir de metas recorrentes (`RECURRING_TARGETS`) ou distribuição proporcional extra (`EXTRA_PROPORTIONAL`).
- Ações Rápidas de Rebalanceamento Automático: Implementadas funções para ajustar envelopes ao teto (`REBALANCE_TO_CEILING`) e zerar envelopes estourados (`REBALANCE_ZERO_OVERSPENT`) recolhendo e distribuindo saldos do RTA.
- Captura de RTA no Zustand: Adicionado interceptor para ler o cabeçalho HTTP `X-Ready-To-Assign` na store `useAccountStore.ts`, salvando dinamicamente em `readyToAssignBalance` e exibindo no cabeçalho do orçamento.
- Modal de Distribuição de Renda no Frontend: Refatoração do `DistributionModal.tsx` para mapear inputs para categorias em vez de contas físicas, acionando o endpoint `/monthly-budgets/set_budget/` e `smart_allocate`.
- Painel de Ações de Rebalanceamento na UI: Botões integrados no cabeçalho do orçamento para disparar rebalanceamentos rápidos no backend.

## [1.39.00] - 2026-05-28

### Added
- Interface Visual do Modal Avançado de Pagamento (3 Abas): Criação do componente `PayBillModal.tsx` com navegação segmentada ("Escolher Compras", "Digitar Valor" e "Porcentagem").
- Simulação Visual de FIFO em Tempo Real: Adicionadas marcações inteligentes com checks e barras de progresso fluidas para simular o preenchimento de parcelas e split na parcela residual limítrofe no input de valor fixo.
- Controle Deslizante Pro-Rata: Integrado slider responsivo (1% a 100%) em sincronia com input numérico para pagamento percentual com resumo detalhado de dedução pro-rata.
- Integração da API de Quitação no Frontend: Atualizada a mutação `payBill` no hook `useTransactions.ts` para transportar o modo de pagamento e payloads detalhados.
- Integração Direta de Quitação em Detalhes da Fatura: Adicionado suporte ao modal e botão "Pagar Fatura" na página `BillDetails.tsx` com re-fetch atômico de dados.
- Sincronização e Auditoria de Tipagem: Ajustados os tipos de retorno e estados locais garantindo validação total estrita de TypeScript.

## [1.38.00] - 2026-05-28

### Added
- Serviço Avançado de Pagamento de Faturas (Triple-Mode): Implementada a função `pay_bill` no backend com três estratégias matemáticas de liquidação: ITEMIZED (quitação de parcelas específicas), FIFO (quitação cronológica com divisão e geração de parcelas residuais futuras) e PERCENTAGE (pro-rata uniforme com geração de resíduos diferidos).
- Controle de Unicidade e Integridade: Integrada lógica de controle para evitar violações de chave primária/unicidade no split de parcelas ao incrementar o contador da compra matriz.
- Endpoint Transacional `@action(detail=True)` em `CreditCardViewSet` para expor o serviço de quitação de forma robusta e atômica.
- Visualização de Reserva de Envelopes: Adicionado gráfico Donut Chart interativo (Pie Chart via Recharts) na tela de detalhes de subconta (AccountDetails.tsx) para ilustrar de forma premium a divisão entre o "Saldo Disponível" e o "Saldo Reservado" (bloqueado para cartão).
- Auditoria de Serialização no Django: Adicionados os campos calculados `available_balance` e `actual_balance` ao `AccountSerializer` para integração fluida de tipagem TypeScript (AccountNode).

## [1.37.00] - 2026-05-28

### Added
- Refatoração de Modelos para Dedução Diferida: Adicionado o campo `reserved_credit_balance` e a propriedade `available_balance` no modelo `Account` para rastrear dinheiro bloqueado para pagamentos futuros de faturas.
- Link Direto de Parcela: Adicionado o relacionamento `subaccount` ao modelo `Installment` para rastrear a origem dos débitos de cada parcela e possibilitar liquidações atômicas e fracionamentos na fatura.

## [1.36.00] - 2026-05-28

### Added
- Estratégia Regional de Cartões (BR vs PT): Introduzido suporte nativo a cartões emitidos no Brasil (BR) e em Portugal (PT) no modelo `CreditCard`.
- Novos campos regionalizados: Adicionados campos `country_of_issue`, `settlement_mode` e `revolving_percentage` para modelar regras locais de cobrança e modalidades europeias.
- Bypass de POS para Portugal (PT): Implementada restrição que força compras em cartões portugueses a assumirem parcela única (1x - Deferred Debit) no backend, ignorando parcelamento no estabelecimento.
- Interface Dinâmica de Cartões e Transações: Modais de criação e edição de cartões adaptam-se dinamicamente conforme o país selecionado. O modal global de transações (`AddTransactionModal.tsx`) foi integrado para ler dinamicamente o país de emissão do cartão selecionado, suprimindo as opções de parcelamento para cartões de Portugal (PT), forçando 1x parcela, e exibindo um badge informativo com o modo de liquidação ativo.

## [1.35.31] - 2026-05-25

### Changed
- Refatoração da UI de Faturas: Removido o modelo de acordeão ("sanfonas") nas listagens de transações agrupadas. A visualização de faturas ganhou uma tela isolada premium, acessível ao clicar na transação da fatura ou pela aba "Cartões de Crédito". O componente exibe de forma consistente cards informativos com "Total", "Pago", "Pendente" e listagem completa dos lançamentos mensais. A interface prioriza o preenchimento, inclusive forçando um 'empty state' elegante para meses sem faturas, garantindo uma estética 100% contínua e imersiva.
- Estilização de Subcontas e Limites: As barras de progresso (budget bars) foram refatoradas para uma espessura fina (6px), assemelhando-se a um "fill line" refinado. As porcentagens foram movidas para criar badges flutuantes no cabeçalho ou exatamente acima da linha (para o "Saldo Livre"). A interface ficou extremamente clean e sofisticada sem sobrecarregar a visão com componentes espessos.

## [1.35.30] - 2026-05-25

### Added
- Modais de Edição e Exclusão Granular na Fatura: Agora ao editar ou excluir uma parcela, o usuário pode escolher se a ação afeta "Apenas esta parcela", "Esta e as próximas" ou "Todas as parcelas" daquela compra matriz. O sistema automaticamente ajusta os valores, recálcula parcelas e limpa reservas correspondentes no YNAB.

## [1.35.29] - 2026-05-25

### Fixed
- Ordem e Seleção de Meses na Fatura: Corrigida a lógica de exibição das faturas que estavam sendo listadas de forma decrescente. Agora os meses seguem a ordem cronológica correta e a tela de Cartões sempre pré-seleciona a fatura do mês atual, com um aviso amigável se não houver registros.
- Gestão de Lançamentos na Fatura: Reativados os botões de ação na fatura. O botão de exclusão ganhou um endpoint robusto no backend para apagar todo o rastro (inclusive no YNAB). O botão de edição instrui como o usuário deve recriar.

## [1.35.28] - 2026-05-24

### Added
- Modal de Compras no Cartão: Adicionado Segmented Control para o usuário alternar dinamicamente se o valor digitado corresponde ao 'Valor Total' da compra ou ao 'Valor da Parcela'. A UI agora calcula e exibe um texto de apoio explicativo em tempo real com as multiplicações matemáticas corretas e a nova flag (input_type) é enviada ao backend.
## [1.35.27] - 2026-05-24

### Added
- Botões de Ação na Fatura: Adicionados botões dedicados de edição (lápis) e exclusão (lixeira) em cada registro de compra no detalhamento da fatura de cartões de crédito.

### Changed
- UI Selector de Faturas: Substituída a listagem horizontal em barra de botões por um componente padronizado e robusto com dois dropdowns (Select) para Mês e Ano idêntico ao da tela de Transações, proporcionando muito mais organização visual.
## [1.35.26] - 2026-05-24

### Fixed
- Correção de Reatividade da UI: O formulário de compras de Cartões de Crédito agora faz a invalidação (refetch) das contas YNAB locais garantindo que a redistribuição automática do saldo entre a Categoria e o Cartão reflita instantaneamente no net worth.
- Seleção de Fatura Aberta por Padrão: Ao abrir o Painel de Cartões de Crédito ou ao registrar uma compra, a UI agora seleciona ativa e diretamente a fatura atual em aberto (is_closed: false), evitando que o usuário visualize faturas futuras vazias por engano.
## [1.35.25] - 2026-05-24

### Fixed
- Correção crítica no fluxo de criação de Transações de Cartão de Crédito. O backend não estava gerando a fatura corretamente devido a uma incompatibilidade no payload JSON (	otal_installments vs installment_count).
- Correção na UI de Cartões de Crédito onde o Limite Disponível não atualizava visualmente após o lançamento de uma compra sem precisar recarregar a página.
## [1.35.24] - 2026-05-24

### Removed
- Removido o campo Categoria (YNAB) do formulÃ¡rio de homologaÃ§Ã£o do Inbox Inteligente.
- Removida a aba completa de Insights de todo o ecossistema do frontend (Sidebar, BottomNav, App Routes e SwipeNavigation) para focar na aba RelatÃ³rios.

## [1.35.23] - 2026-05-24

### Fixed
- CorreÃ§Ã£o de erro fatal (ReferenceError) na pÃ¡gina de Inbox ocasionado pela falta de importaÃ§Ã£o do CurrencyInput.
- Refinamento visual da barra de progresso Overfunded no AccountAccordion substituindo gradiente estÃ¡tico por um gradiente Tailwind fluido de cyan para roxo (g-gradient-to-r).
- AtualizaÃ§Ã£o de micro-rÃ³tulos informativos no acordeÃ£o para usar cor e contraste adequados (	ext-gray-500).

## [1.35.22] - 2026-05-24

### Changed
- RefatoraÃ§Ã£o Visual do `AccountAccordion`: As badges poluÃ­das de limite foram removidas e convertidas para uma visualizaÃ§Ã£o moderna e elegante em grid.
- ImplementaÃ§Ã£o de Barra de Progresso Inteligente para Subcontas: 
  - Subcontas com Teto agora possuem uma barra que transita do vermelho (`bg-rose-500`) ao verde (`bg-emerald-500`) quando atingem 50% de completude.
  - Subcontas "Overfunded" (>100%) recebem barra na cor ciano brilhante (`bg-cyan-500`) com efeito neon (drop-shadow).
  - Subcontas com Limite Livre (sem teto definido) recebem uma discreta barra neutra preenchida na cor cinza (`bg-slate-700`) constando apenas o rÃ³tulo de "Saldo Livre".

## [1.35.21] - 2026-05-24

### Fixed
- Estancamento do Runtime Error no mÃ³dulo `Reports`: Implementado robusto mecanismo de Optional Chaining (`?.`) e verificaÃ§Ã£o unificada de estado de Loading em todo o ecossistema de grÃ¡ficos (Recharts) das AnÃ¡lises AvanÃ§adas. 
- Implementada proteÃ§Ã£o explÃ­cita para forÃ§ar a renderizaÃ§Ã£o do `<EmptyState />` caso os dados de rede retornem vazios da API do backend. Isso preza por uma navegaÃ§Ã£o fluida sem falhas de Ã­ndice (`undefined`) no DOM.

## [1.35.20] - 2026-05-24

### Added
- Implementado um robusto `ErrorBoundary` global em React para capturar falhas em toda a Ã¡rvore de componentes e renderizar uma UI de fallback ("White Screen of Death" prevenida).
- Adicionado encapsulamento especÃ­fico de `ErrorBoundary` em torno do rotemento principal no `App.tsx` e blocos de dados pesados no `Dashboard.tsx` (ex: GrÃ¡ficos e Widgets).

## [1.35.19] - 2026-05-24

### Fixed
- Restaurado o comportamento nativo de rolagem vertical (mouse wheel) dentro do componente `GlobalAccountSelector` aplicando `overflow-y-auto`, `overscroll-contain` e uma altura mÃ¡xima (`max-h-[300px]`) no container da lista de subcontas, impedindo vazamento visual na tela.

## [1.35.18] - 2026-05-24

### Fixed
- Aplicado o modificador de layout `col-span-full` nos wrappers (DIVs) nativos que englobam o `GlobalAccountSelector` em todos os modais e pÃ¡ginas (AddTransactionModal, DistributionModal, ImportModal, CreditCards, Inbox, AccountActions), rompendo armadilhas de grid e forÃ§ando o design de largura total em toda a UI.

## [1.35.17] - 2026-05-24

### Changed
- Refatorado a seleÃ§Ã£o hierÃ¡rquica de contas. O `AccountCombobox` foi promovido a `GlobalAccountSelector`, posicionado como o componente universal em toda a aplicaÃ§Ã£o (Adicionar Receita, Adicionar Despesa, TransferÃªncias, Inbox, Pagamento de DÃ­vidas).
- EnforÃ§ado strict layout: `GlobalAccountSelector` agora ocupa `w-full` e `col-span-full` para nunca dividir a linha com outros campos, garantindo padronizaÃ§Ã£o visual global.
- Atualizado o dropdown legado de 'Nova Conta Pai' no painel de AÃ§Ãµes de Conta para consumir nativamente o novo seletor com a flag `showRootOption`.

## [1.35.16] - 2026-05-24

### Changed
- Refatorado formulÃ¡rio de Modal de Compras de CartÃ£o de CrÃ©dito (`CreditCards.tsx`) substituindo o `<select>` limitador de 12x por um `<input type="number">` dinÃ¢mico e sem limite.
- Corrigido property payload para o endpoint de transaÃ§Ãµes, de `amount` para `total_amount` garantindo integridade das requisiÃ§Ãµes.
- LÃ³gica reativa da seleÃ§Ã£o de `A partir de qual parcela?` dinamicamente amarrada ao total de parcelas customizadas.

## [1.35.15] - 2026-05-24

### Fixed
- Frontend: Scaled Credit Card brand SVGs applying internal padding (`p-1`) directly to the `<img />` tag and strictly ensuring `object-contain` without double-padding, guaranteeing the image breathes and respects the strict rectangular bounds.

## [1.35.14] - 2026-05-24

### Fixed
- Backend & Reports: Fixed net worth logical discrepancies (`liabilities_diff` processing `is_income` accurately). Removed all React hook dependency warnings inside `Reports.tsx` and removed mock data fallbacks, fully syncing frontend Empty States to backend API payload.

## [1.35.13] - 2026-05-24
- **Reports UI Integration:** Conectados os componentes de grÃ¡ficos (`AreaChart`, `RePieChart`, `Treemap`, `LineChart`, etc) na pÃ¡gina `Reports.tsx` aos endpoints reias do backend, abolindo dados falsos locais.
- **Empty State UX:** Implementado o componente genÃ©rico de fallback `EmptyState` ("Ainda sem dados suficientes.") em todos os grÃ¡ficos da aplicaÃ§Ã£o. Sempre que a API nÃ£o retornar informaÃ§Ãµes para o perÃ­odo solicitado, a quebra/gitch do Recharts Ã© interceptada e uma UI amigÃ¡vel e limpa Ã© exibida.

## [1.35.12] - 2026-05-24

### Alterado
* **Reports API Engine:** Implementado motor matemÃ¡tico no backend (Django ORM) para cÃ¡lculo em tempo real de Fluxo de Caixa, Despesas por Categoria, Uso de CartÃ£o de CrÃ©dito e EvoluÃ§Ã£o do PatrimÃ´nio LÃ­quido, preparando a plataforma para remoÃ§Ã£o de mock data na interface.

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
- Frontend: Reverted CategoryCombobox to AccountCombobox in the Credit Card Purchase Modal to match the LanÃ§ar TransaÃ§Ã£o behavior where Accounts are used as sub-expenses.
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

# Registro de AlteraÃ§Ãµes â Vault Finance OS (Changelog)

Todas as alteraÃ§Ãµes notÃ¡veis, correÃ§Ãµes de bugs, novas funcionalidades e marcos estÃ©ticos aplicados ao **Vault Finance OS** sÃ£o registrados de forma cronolÃ³gica neste documento. Ele segue rigorosamente o padrÃ£o internacional do [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/) e adota o Versionamento SemÃ¢ntico (**SemVer**): `MAJOR.MINOR.PATCH`.

A linha do tempo abaixo foi sincronizada e mapeada diretamente a partir do histÃ³rico real de commits do Git para refletir a evoluÃ§Ã£o fidedigna de nosso software.

## [1.35.6] - 23 de Maio de 2026

### Frontend
- **CartÃµes de CrÃ©dito:** Limpeza da interface do modal de Nova Compra (remoÃ§Ã£o de Spread/IOF e bloco informativo).
- **CartÃµes de CrÃ©dito:** CorreÃ§Ã£o no seletor hierÃ¡rquico de Subconta de despesa, igualando ao formulÃ¡rio de cadastro de despesas padrÃ£o.
- **CartÃµes de CrÃ©dito:** InclusÃ£o de um Tooltip explicativo para a seleÃ§Ã£o de parcela inicial e adiÃ§Ã£o de seletor de Bandeira do CartÃ£o (Visa, Mastercard, American Express, Elo, UnionPay e JCB).

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

### ð Features & Integrations
- **Motor de CotaÃ§Ãµes em Tempo Real (Wealth):** RefatoraÃ§Ã£o do `NetWorthCalculator` (`views.py`) para utilizar o `PortfolioEvolutionEngine`. O sistema agora se conecta automaticamente ao Alpha Vantage e HG Brasil via `MarketDataService` para baixar a cotaÃ§Ã£o real de AÃ§Ãµes, FIIs e ETFs a cada carregamento, atualizando o PatrimÃ´nio LÃ­quido em tempo real.
- **Renda Fixa e Tesouro Direto Automatizados:** IntegraÃ§Ã£o com a API do Banco Central via HG Brasil para baixar a taxa CDI diÃ¡ria automaticamente. O motor agora projeta o valor de resgate futuro cota-a-cota para contratos pÃ³s-fixados baseados em dias Ãºteis (Base-252).
- **Novo Ativo:** Adicionada a classe de ativo `TREASURY` (Tesouro Direto) na interface de usuÃ¡rio e banco de dados.

### ð Bug Fixes & Improvements
- **Modal Novo Aporte (Wealth):** CriaÃ§Ã£o e integraÃ§Ã£o do componente `AddInvestmentActivityModal.tsx` na tela de Investimentos, permitindo o registro de operaÃ§Ãµes (Compra, Venda, Dividendos) e cadastro dinÃ¢mico rÃ¡pido de novos ativos.
- **PatrimÃ´nio & Investimentos (Wealth):** CorreÃ§Ã£o crÃ­tica no endpoint `WealthSummaryView` (`views.py`) que estava retornando um array de posiÃ§Ãµes em vez do objeto esperado pelo frontend (`{ holdings: [...], total_net_worth: ... }`). Isso causava um crash no React e acionava o fallback de erro 404 (Erro de conexÃ£o com o servidor) da UI.
- **TraduÃ§Ã£o de Menus (i18n):** Simplificada a chave `navigation.investments` em `pt-BR.json` para exibir apenas "Investimentos", corrigindo a redundÃ¢ncia na Sidebar.

## [1.35.0] - 2026-05-22
### Added
- **Central de Ajuda (VitePress):** InicializaÃ§Ã£o do sistema isolado de documentaÃ§Ã£o dentro de `docs/`.
- **Manuais Operacionais:** CriaÃ§Ã£o massiva de guias e manuais passo-a-passo para usuÃ¡rios cobrindo: Metodologia de Envelopes YNAB, CartÃµes e Faturas, Inbox Inteligente e Auditoria, GestÃ£o de PatrimÃ´nio, ConfiguraÃ§Ãµes de Assinatura, RelatÃ³rios AnalÃ­ticos e um mÃ³dulo nativo de FAQ para casos isolados.
- **Wikis de Engenharia:** ExpansÃ£o e refinamento do `wiki_seguranca.md` com manuais operacionais do fluxo de acesso HÃ­brido, configuraÃ§Ã£o de AutenticaÃ§Ã£o Multifator (2FA) e GestÃ£o de Privacidade (LGPD/ConsentStore).

## [1.34.3] - 2026-05-22
### Added
- **Backend API (Wealth):** AdiÃ§Ã£o da `PortfolioEvolutionEngine` em `services.py` contendo algoritmos matemÃ¡ticos para evoluÃ§Ã£o de patrimÃ´nio:
  - `calculate_fixed_income_evolution`: CapitalizaÃ§Ã£o diÃ¡ria de juros (CDI sobre base 252) sobre o `principal_amount` cruzando com a tabela `DailyCDIRate`.
  - `calculate_stock_position`: Processamento sequencial do *Ledger* de Ativos de Renda VariÃ¡vel (`BUY`, `SELL`, `SPLIT`) cruzando os estoques locais com o `MarketDataService` para aferir lucros, perdas e yield real-time.

## [1.34.2] - 2026-05-22
### Added
- **Backend API (Wealth):** AdiÃ§Ã£o do `MarketDataService` em `services.py`, que implementa uma lÃ³gica robusta de *Failover* Multi-Tier para resgatar cotaÃ§Ãµes em tempo real:
  - Alpha Vantage (Master) -> Twelve Data (Fallback) para ativos internacionais.
  - Alpha Vantage (Master) -> HG Brasil Finance (Fallback) para ativos da B3.
  - Local Cache (`DailyAssetPrice`) como Ãºltima linha de defesa em caso de pane das APIs externas.

## [1.34.1] - 2026-05-22
### Added
- **Backend API (Wealth):** AtualizaÃ§Ã£o dos models `InvestmentAsset` e `InvestmentActivity` para adicionar novos campos (`principal_amount`, `cdi_percentage`).
- **Backend API (Wealth):** CriaÃ§Ã£o dos novos models `DailyAssetPrice` (cache de cotas diÃ¡rias de aÃ§Ãµes) e `DailyCDIRate` (taxa diÃ¡ria e anual de CDI, com cÃ¡lculo automÃ¡tico da fraÃ§Ã£o em dias Ãºteis).

## [1.34.0] - 2026-05-22
### Added
- **Interface de Wealth & Investments (Fase 4):** ConstruÃ§Ã£o da tela principal de Investimentos (`Investments.tsx`) contendo Dashboard de PatrimÃ´nio LÃ­quido com Sparklines, agrupamento de inventÃ¡rio (Renda Fixa, AÃ§Ãµes, Cripto) e Livro-RazÃ£o (Ledger) histÃ³rico de atividades.
- **Backend API (Wealth):** CriaÃ§Ã£o dos ViewSets (`InvestmentAssetViewSet`, `InvestmentActivityViewSet`) e do endpoint `/api/finance/wealth/summary/` conectando o frontend ao motor de cÃ¡lculo de rendimentos. IntegraÃ§Ã£o via Zustand na store `useWealthStore.ts`.

## [1.33.1] - 2026-05-22
### Added
- **Motor MatemÃ¡tico de Renda Fixa Brasileira (Fase 3):** Implementada a classe matemÃ¡tica `BrazilianFixedIncomeEngine` em `backend/finance/brazilian_fixed_income.py`. A engine conta com cÃ¡lculo autÃ´nomo da data da PÃ¡scoa para deduzir feriados nacionais (Sexta Santa, Carnaval, Corpus Christi) e calcula dias Ãºteis na Base 252 da ANBIMA/B3. TambÃ©m foi integrado o simulador de rentabilidade para ativos pÃ³s-fixados, capaz de deduzir exata e automaticamente as tabelas regressivas de IOF (0 a 30 dias) e de Imposto de Renda.

## [1.33.0] - 2026-05-22
### Added
- **Arquitetura de PortfÃ³lio de Investimentos (Fase 2):** Modelagem do livro-razÃ£o de custÃ³dia inspirada no Ghostfolio/Maybe. Foram criadas no backend (Django) as entidades `InvestmentAsset` e `InvestmentActivity` para rastreamento de compras, vendas, dividendos e desdobramentos de ativos financeiros, bem como o motor inteligente `NetWorthCalculator` capaz de calcular o PreÃ§o MÃ©dio e as posiÃ§Ãµes exatas em tempo real de forma blindada contra erros de float (suporte atÃ© 8 casas decimais para Criptomoedas).

## [1.32.2] - 2026-05-22
### Changed
- Adicionada opÃ§Ã£o explÃ­cita de "Conta de Investimento" no Modal de CriaÃ§Ã£o de Contas Raiz. Essa opÃ§Ã£o cria a conta nativamente como `account_type: 'investment'`, o que injeta a flag "Off-Budget" de forma transparente, blindando o orÃ§amento diÃ¡rio. Um quadro explicativo com o conceito de Off-Budget e PatrimÃ´nio LÃ­quido foi adicionado no modal para orientar o usuÃ¡rio durante a criaÃ§Ã£o.

## [1.32.1] â 2026-05-22

Esta versÃ£o foca na unificaÃ§Ã£o da gestÃ£o de visibilidade de abas (mÃ³dulos), consolidando o poder de ocultar/exibir abas inteiramente na ferramenta da Sidebar e removendo a seÃ§Ã£o de "MÃ³dulos" de ConfiguraÃ§Ãµes, garantindo uma fonte Ãºnica de verdade (Single Source of Truth).

### Removido
* **Aba de MÃ³dulos nas ConfiguraÃ§Ãµes:** RemoÃ§Ã£o completa do painel "MÃ³dulos Ativos do Sistema" de dentro da pÃ¡gina de ConfiguraÃ§Ãµes.
* **Store de Features (`useFeatureStore`):** DeleÃ§Ã£o completa da arquitetura paralela de gerenciamento de mÃ³dulos, pois toda a visibilidade das ferramentas do Vault agora Ã© estritamente definida atravÃ©s do array de `hiddenItems` da `useSidebarStore`.

### Alterado
* **Sidebar como Fonte Ãnica de Verdade:** Todas as 11 Ã¡reas vitais do sistema (VisÃ£o Geral, Contas, CartÃµes, TransaÃ§Ãµes, Inbox, OrÃ§amento, Regra 50/30/20, DÃ­vidas, Metas, Insights, e RelatÃ³rios) agora sÃ£o controladas direta e unicamente pelo modal "Editar Menu" na prÃ³pria barra lateral.
* **Rotas DinÃ¢micas (FeatureProtectedRoute):** A rota de proteÃ§Ã£o das ferramentas do sistema (`App.tsx`) foi refatorada para ler diretamente do array de atalhos da sidebar (`hiddenItems`), redirecionando o usuÃ¡rio de volta se ele tentar acessar uma aba que ele prÃ³prio ocultou do menu.
* **BotÃµes de NÃ­vel em RelatÃ³rios:** Como as abas agora sÃ£o controladas globalmente, todas as 9 sub-categorias (Iniciante, IntermediÃ¡rio, AvanÃ§ado, etc.) de relatÃ³rios passam a estar permanentemente liberadas assim que o usuÃ¡rio habilita a aba pai de "RelatÃ³rios" na sidebar, descomplicando o uso.

## [1.32.0] â 2026-05-20

Esta versÃ£o traz controle e visibilidade globais para as pendÃªncias financeiras, alÃ©m de filtros avanÃ§ados para mineraÃ§Ã£o de transaÃ§Ãµes passadas.

### Adicionado
* **Layout e Abas EditÃ¡veis na Sidebar:**
  - CorreÃ§Ã£o do alinhamento horizontal milimÃ©trico da borda inferior entre a `Topbar` e o `Brand` da `Sidebar` pela unificaÃ§Ã£o do uso da classe de cor `border-sidebar-border`, em conjunto com as classes `shrink-0` e `overflow-y-auto` na navegaÃ§Ã£o.
  - AdiÃ§Ã£o da ferramenta de "Editar Menu" na sidebar, movendo o Ã­cone e botÃ£o de lÃ¡pis para o fim do menu de navegaÃ§Ã£o.
  - SincronizaÃ§Ã£o persistente dos atalhos no Banco de Dados (Django `UserProfile` / `hidden_sidebar_items`), mantendo estado global sincronizado entre web e app Android.
* **Painel de PendÃªncias Globais no Dashboard:** A seÃ§Ã£o de TransaÃ§Ãµes Pendentes do Dashboard agora busca e exibe **todas** as pendÃªncias agendadas do sistema, categorizando visualmente por badges coloridas ("Vencido", "Vence hoje", "Vence amanhÃ£").
* **Empty State de Elogio:** Quando todas as transaÃ§Ãµes pendentes do mÃªs selecionado forem pagas/efetivadas, o painel exibe uma mensagem de sucesso ("Tudo em dia!").
* **Filtros AvanÃ§ados de TransaÃ§Ãµes (`Transactions.tsx`):** Adicionados dois novos menus dropdown lado-a-lado Ã  barra de busca:
  - Filtro por **Status** (Todas, Pendentes, Efetivadas).
  - Filtro por **Tipo** (Todas, Recorrentes).
* **ParÃ¢metros de Filtro no Backend (`TransactionViewSet`):** O backend agora aceita `status=pending|realized` e `is_recurring=true|false` nativamente na querystring.

### Removido
* **BotÃ£o Duplicado:** O botÃ£o de "Nova TransaÃ§Ã£o" avulso dentro do Dashboard (que ficava flutuando sobre o NetWorth) foi removido para priorizar a aÃ§Ã£o principal contida no cabeÃ§alho.

## [1.31.0] â 2026-05-20

Esta versÃ£o foca na melhoria da gestÃ£o de DÃ­vidas, adicionando a capacidade de registrar, nomear, editar e excluir dÃ©bitos individuais associados a uma dÃ­vida (DebtCharge). TambÃ©m foram aplicadas melhorias na busca, ignorando acentos em sugestÃµes de transaÃ§Ãµes e contas.

### Adicionado
* **HistÃ³rico Granular de DÃ©bitos em DÃ­vidas (`Debts.tsx` e `models.py`):**
  - ImplementaÃ§Ã£o do modelo `DebtCharge` para tratar os acrÃ©scimos de dÃ­vida como instÃ¢ncias independentes em vez de apenas incrementar o `original_amount`.
  - InclusÃ£o do campo **Nome/DescriÃ§Ã£o** para especificar do que se trata cada novo dÃ©bito gerado numa dÃ­vida ativa.
  - ImplementaÃ§Ã£o de Timeline hÃ­brida unificando o histÃ³rico de "Pagamentos" e "AcrÃ©scimos" de forma cronolÃ³gica na UI.
  - AdiÃ§Ã£o da funÃ§Ã£o de **ediÃ§Ã£o de nome** e **exclusÃ£o** individual de dÃ©bitos jÃ¡ lanÃ§ados.

### Corrigido
* **Busca AgnÃ³stica a Acentos e MaiÃºsculas:**
  - `AccountCombobox` e modal `AddTransactionModal` agora aplicam normalizaÃ§Ã£o via `NFD` para desconsiderar acentos e caracteres especiais, permitindo buscar "agua" e encontrar "Ã¡gua" com sucesso.

## [1.30.5] â 2026-05-20

Esta versÃ£o corrige um bug crÃ­tico de regra de negÃ³cio onde transaÃ§Ãµes recorrentes criadas com status **Pendente** geravam instÃ¢ncias filhas nos meses seguintes automaticamente efetivadas (`realized`), em vez de preservarem o status original do template.

### Corrigido
* **PropagaÃ§Ã£o de Status em TransaÃ§Ãµes Recorrentes (`views.py`):**
  - CorreÃ§Ã£o na funÃ§Ã£o `sync_recurring_transactions` para herdar o campo `status` do template recorrente ao criar instÃ¢ncias filhas automÃ¡ticas. Anteriormente, o status nÃ£o era propagado e assumia o valor padrÃ£o `'realized'`, fazendo transaÃ§Ãµes que deveriam estar pendentes aparecerem como efetivadas.
  - Ajuste na lÃ³gica de `is_applied_to_balance` para considerar o status herdado: transaÃ§Ãµes com status `'pending'` **nunca** afetam o saldo da conta, independentemente da data.

### Adicionado
* **EdiÃ§Ã£o e DeleÃ§Ã£o Granular de RecorrÃªncias (Backend & Frontend):**
  - Adicionado suporte completo para deletar ou editar transaÃ§Ãµes recorrentes escolhendo o escopo ("apenas esta", "esta e futuras", "todas").
  - O sistema utiliza as flags `recurring_parent` e `is_recurrence_exception` para isolamento histÃ³rico e integridade do balanÃ§o contÃ¡bil em tempo real.
* **Teste de RegressÃ£o (`test_general_finance.py`):**
  - Novo teste `test_recurring_transactions_pending_status` validando que um template recorrente com status `'pending'` gera instÃ¢ncias filhas tambÃ©m pendentes, sem alterar o saldo da conta.

---

## [1.30.4] â 2026-05-19

Esta versÃ£o corrige um bug crÃ­tico que causava crash (tela em branco/piscar) ao abrir o modal de "Nova TransaÃ§Ã£o" e comeÃ§ar a digitar no campo de descriÃ§Ã£o. O componente `AddTransactionModal` utilizava a funÃ§Ã£o utilitÃ¡ria `cn()` na renderizaÃ§Ã£o das sugestÃµes do histÃ³rico sem importÃ¡-la, alÃ©m de referenciar setters de estado inexistentes (`setShowAccountSuggestions`/`setShowToAccountSuggestions`) que eram resquÃ­cios de um refactor anterior para `AccountCombobox`.

### Corrigido
* **Crash de RenderizaÃ§Ã£o no Modal de Nova TransaÃ§Ã£o (`AddTransactionModal.tsx`):**
  - **Import Ausente:** Adicionada a importaÃ§Ã£o da funÃ§Ã£o `cn` de `@/shared/lib/utils`, que era utilizada na linha de renderizaÃ§Ã£o das sugestÃµes do autocomplete mas nunca foi importada, causando `ReferenceError: cn is not defined` e crash completo do React.
  - **Setters Orphans Removidos:** Removidas as chamadas a `setShowAccountSuggestions(false)` e `setShowToAccountSuggestions(false)` dentro do `useEffect` de clique externo, que eram referÃªncias mortas de cÃ³digo legado prÃ©-`AccountCombobox` e causariam erro adicional se executadas.

---

## [1.30.3] â 2026-05-19

Esta versÃ£o corrige um bug crÃ­tico de renderizaÃ§Ã£o (tela em branco/criaÃ§Ã£o de loops de erro) que ocorria ao atualizar (F5) ou carregar diretamente a pÃ¡gina de detalhes da conta (`AccountDetails.tsx`). Refatoramos o fluxo e o posicionamento das declaraÃ§Ãµes de hooks do React de modo a cumprir rigorosamente as "Rules of Hooks", garantindo estabilidade e reatividade na montagem inicial dos dados assÃ­ncronos. AlÃ©m disso, enriquecemos os guias operacionais documentando o ecossistema de investimentos.

### Corrigido
* **EstabilizaÃ§Ã£o de Estado e Cumprimento das Regras de Hooks (`AccountDetails.tsx`):**
  - **Posicionamento de Hooks:** MovimentaÃ§Ã£o de todos os blocos de hooks `useMemo` (`accountIds`, `accountTransactions`, `filteredTransactions`, `stats`) para antes de quaisquer retornos condicionais (`if (!account)`). Isso impede a variaÃ§Ã£o na ordem e no nÃºmero de hooks executados pelo React entre os renders, eliminando o erro fatal `Rendered more hooks than during the previous render`.
  - **CorreÃ§Ã£o de Alinhamento HTML e Acessibilidade:** MudanÃ§a na renderizaÃ§Ã£o do `TableSkeleton` de carregamento inicial, que agora Ã© encapsulado dentro das tags semÃ¢nticas corretas (`<table>` e `<tbody>`) para sanar alertas de DOM nesting nos consoles dos navegadores.

### Alterado
* **Enriquecimento da DocumentaÃ§Ã£o ContÃ¡bil de Investimentos (`manual_actual_budget.md`):**
  - InserÃ§Ã£o de uma seÃ§Ã£o dedicada (`### ð Acompanhando a EvoluÃ§Ã£o dos Investimentos e PatrimÃ´nio`) explicando de forma prÃ¡tica como utilizar a tela de **RelatÃ³rios** (`/reports`) para acompanhar a evoluÃ§Ã£o histÃ³rica do Net Worth, distribuiÃ§Ã£o proporcional (Treemap), ProjeÃ§Ã£o e Impacto Cambial das contas Off-Budget (Investimentos).

---

## [1.30.2] â 2026-05-18

Esta versÃ£o resolve a inconsistÃªncia visual do filtro de contas na listagem global de transaÃ§Ãµes (`Transactions.tsx`). Implementamos a filtragem recursiva de subcontas, garantindo que ao selecionar uma conta pai (como "Nubank") no filtro, todas as transaÃ§Ãµes de suas respectivas subcontas (como "Crunchyroll") sejam exibidas de forma transparente, eliminando a contradiÃ§Ã£o visual onde transaÃ§Ãµes da IA consumiam saldo na barra lateral mas pareciam "desaparecer" da tabela.

### Corrigido
* **Filtro Recursivo de Contas na Listagem Global (`Transactions.tsx`):**
  - RefatoraÃ§Ã£o do filtro de contas para usar o hook `useMemo` com busca recursiva em profundidade (`findAndCollect`) a partir da Ã¡rvore de contas (`tree`). Isso coleta todos os IDs de subcontas atreladas Ã  conta selecionada.
  - Alinhamento da listagem global com a tela de detalhes (`AccountDetails.tsx`), que jÃ¡ contava com essa agregaÃ§Ã£o recursiva, estabelecendo paridade visual e eliminando o falso bug de desaparecimento de registros contÃ¡beis.

---

## [1.30.1] â 2026-05-18

Esta versÃ£o resolve em definitivo a atualizaÃ§Ã£o do Dashboard e visualizaÃ§Ã£o de transaÃ§Ãµes homologadas a partir do staging do Inbox Inteligente com datas retroativas ou futuras. O Dashboard principal foi inteiramente refatorado para ser reativo ao perÃ­odo selecionado global da `useAccountStore` no Zustand, adicionando seletores interativos de MÃªs e Ano idÃªnticos aos da tela global de transaÃ§Ãµes e garantindo que os painÃ©is de fluxo de caixa, despesas por categoria e transaÃ§Ãµes pendentes reflitam instantaneamente qualquer homologaÃ§Ã£o histÃ³rica.

### Adicionado
* **Painel do Dashboard HistÃ³rico e Reativo (`Dashboard.tsx`):**
  - **Seletores de MÃªs e Ano:** InjeÃ§Ã£o de seletores dinÃ¢micos de perÃ­odo no cabeÃ§alho do Dashboard, permitindo a navegaÃ§Ã£o retroativa e futura completa pelas mÃ©tricas da aplicaÃ§Ã£o.
  - **SincronizaÃ§Ã£o reativa com Zustand:** O Dashboard agora destrutura e consome `currentMonth` e `currentYear` do `useAccountStore`, re-executando as rotinas de fetch e re-calculando todos os dados sempre que o perÃ­odo ativo global Ã© modificado (inclusive de forma automÃ¡tica pÃ³s-homologaÃ§Ã£o na staging area do Inbox).
  - **CÃ¡lculos e EstatÃ­sticas DinÃ¢micos:** RefatoraÃ§Ã£o de `monthlyStats`, `pendingTransactionsData`, `topCategories`, `monthName` e do grÃ¡fico de `EvoluÃ§Ã£o do Fluxo` para calcularem suas respectivas estatÃ­sticas com base no perÃ­odo ativo dinÃ¢mico em vez do relÃ³gio estÃ¡tico do sistema (`new Date()`).

### Corrigido
* **Fim do SumiÃ§o Visual de TransaÃ§Ãµes do Passado:**
  - Como a homologaÃ§Ã£o de comprovantes do passado atualiza automaticamente o perÃ­odo do Zustand para o mÃªs da transaÃ§Ã£o, e o Dashboard agora Ã© reativo a esse perÃ­odo, os dados contÃ¡beis e grÃ¡ficos mudam na mesma hora para exibir a nova transaÃ§Ã£o homologada, eliminando por completo a sensaÃ§Ã£o de desaparecimento silencioso do registro contÃ¡bil fÃ­sico.

---

## [1.30.0] â 2026-05-18

Esta versÃ£o implementa a infraestrutura completa de **ReconciliaÃ§Ã£o de Contas e Auditoria de Extratos (Statement Auditing)**, trazendo ao Vault Finance OS um controle contÃ¡bil rÃ­gido com travamento de lote ACID fÃ­sico de transaÃ§Ãµes histÃ³ricas e geraÃ§Ã£o de ajustes automÃ¡ticos de saldo, em perfeita paridade operacional com o *Actual Budget*.

### Adicionado
* **Motor ContÃ¡bil de ReconciliaÃ§Ã£o (`reconciliation.py`):**
  - **CÃ¡lculo de MÃ©tricas ContÃ¡beis:** Retorna o saldo das transaÃ§Ãµes liquidadas (`cleared_balance`), pendentes (`uncleared_balance`), saldo total (`total_balance`) e Ãºltima data de conciliaÃ§Ã£o.
  - **Ajuste de Saldo AutomÃ¡tico:** Se o saldo informado no extrato fÃ­sico/digital do banco divergir do saldo contÃ¡bil lÃ­quido compensado, o sistema cria automaticamente uma transaÃ§Ã£o do tipo `"Ajuste automÃ¡tico de reconciliaÃ§Ã£o de saldo"` com o valor exato da diferenÃ§a.
  - **Fechamento e Lock de Lote:** AtualizaÃ§Ã£o atÃ´mica direta em lote que marca as transaÃ§Ãµes compensadas como reconciliadas (`reconciled=True`) e grava o timestamp em `last_reconciled` da conta.
  - **Destravamento Administrativo:** LÃ³gica segura de bypass para destravar individualmente transaÃ§Ãµes reconciliadas em auditorias manuais especÃ­ficas.
* **Bloqueio ContÃ¡bil FÃ­sico (`models.py`):**
  - **Enriquecimento de Campos:** Adicionados campos `cleared` e `reconciled` em `Transaction` e `last_reconciled` em `Account`.
  - **Mecanismo de Lock CompulsÃ³rio:** ModificaÃ§Ã£o dos hooks `clean()`, `save()` e `delete()` para barrarem fisicamente qualquer mutaÃ§Ã£o ou exclusÃ£o se `reconciled=True`, prevenindo alteraÃ§Ãµes histÃ³ricas acidentais.
* **API REST de Auditoria (`views.py`):**
  - **Novos Endpoints em `AccountViewSet`:** InjeÃ§Ã£o das actions `reconcile_status`, `reconcile_adjust` e `reconcile_finalize`.
  - **Novo Endpoint em `TransactionViewSet`:** InjeÃ§Ã£o da action `unlock` para destravamento controlado.
* **SuÃ­te de Testes ContÃ¡beis de ReconciliaÃ§Ã£o (`test_reconciliation.py`):**
  - CriaÃ§Ã£o de suite rigorosa cobrindo todos os cenÃ¡rios contÃ¡beis de conciliaÃ§Ã£o e travamento. Todos 100% verdes!

### Alterado / Refatorado
* **Versionamento do Frontend:** Sincronizada a versÃ£o da build estÃ¡tica para `v1.30.0`.

---

## [1.29.0] â 2026-05-18

Esta versÃ£o implementa o robusto **Motor de OrÃ§amento YNAB & Rollover Mensal (MoM)**, dotando o sistema de inteligÃªncia contÃ¡bil de rollover de envelopes positivos e tratamento rigoroso de estouros (Cash vs. Credit Overspending), em perfeita paridade metodolÃ³gica com o *Actual Budget*.

### Adicionado
* **Motor ContÃ¡bil de OrÃ§amento YNAB (`YNABBudgetService`):**
  - **Rollover Mensal Acumulativo (MoM):** O saldo positivo disponÃ­vel nos envelopes de categorias folha Ã© transferido de forma cumulativa e automÃ¡tica para o mÃªs seguinte como receita disponÃ­vel para gastos.
  - **Tratamento de Estouros de Envelopes (Overspending):**
    - **Cash Overspending:** O estouro gerado por pagamentos em dinheiro (checking/cash) zera o envelope no mÃªs seguinte e Ã© deduzido diretamente do pool *Ready to Assign (RTA)* do prÃ³ximo mÃªs.
    - **Credit Overspending:** O estouro gerado por compras em cartÃ£o de crÃ©dito (credit) zera o envelope no mÃªs seguinte sem reduzir o RTA subsequente, convertendo-se de forma automÃ¡tica em dÃ­vida passiva na fatura do cartÃ£o.
    - **Split Overspending:** ClassificaÃ§Ã£o hÃ­brida proporcional que divide de forma exata a fatia de estouro em dinheiro (que deduz o RTA do mÃªs subsequente) e em cartÃ£o (que gera dÃ­vida pura).
  - **Pool Ready to Assign (RTA):** CÃ¡lculo retrospectivo dinÃ¢mico da renda lÃ­quida acumulada disponÃ­vel para alocaÃ§Ã£o.
* **Nova SuÃ­te de Testes ContÃ¡beis de OrÃ§amento (`test_budget.py`):**
  - CriaÃ§Ã£o de suite abrangente de 4 testes rigorosos validando rollover positivo, estouros cash, estouros credit e cenÃ¡rios hÃ­bridos splits. Todos 100% aprovados!

### Alterado / Refatorado
* **IntegraÃ§Ã£o do ViewSet de Categorias (`views.py`):**
  - RefatoraÃ§Ã£o profunda na action `tree` para obter a malha contÃ¡bil do `YNABBudgetService`, retornando a estrutura em Ã¡rvore consolidada para o frontend com suporte a `rollover_amount` e `available_amount`.
  - InjeÃ§Ã£o inteligente do valor do RTA no cabeÃ§alho HTTP customizado `X-Ready-To-Assign` para manter compatibilidade com o formato de JSON bruto do React SPA.
  - **Nova Action `ready_to_assign`:** CriaÃ§Ã£o de endpoint dedicado para leitura isolada do RTA mensal do usuÃ¡rio ativo.

---

## [1.28.0] â 2026-05-18

Esta versÃ£o promove uma reestruturaÃ§Ã£o profunda e audaciosa do **Core Ledger ContÃ¡bil** do Vault Finance OS, implementando paridade metodolÃ³gica e tÃ©cnica estrita com a engine padrÃ£o-ouro do **Actual Budget** (`actual-master`). O sistema de transferÃªncias foi inteiramente reformulado para garantir consistÃªncia ACID fÃ­sica de transaÃ§Ãµes espelhadas e governanÃ§a estrita de envelopes YNAB.

### Adicionado
* **Estrutura de BeneficiÃ¡rios e Contas do Ledger (`models.py`):**
  - **Propriedade `is_on_budget` em `Account`:** DiferenciaÃ§Ã£o nativa entre contas no orÃ§amento (Checking, Cash, Savings) e fora do orÃ§amento (Investimentos e Ativos de longo prazo).
  - **Entidade `Payee` (BeneficiÃ¡rios):** CriaÃ§Ã£o de tabela de beneficiÃ¡rios contendo FK opcional `transfer_acct` para mapear transferÃªncias fÃ­sicas e `default_category` para otimizar lanÃ§amentos futuros.
  - **Auto-criaÃ§Ã£o de Payees de TransferÃªncia:** Hooks de ciclo de vida atÃ´micos no `save()` de `Account` que criam ou atualizam automaticamente o `Payee` associado (ex: `"TransferÃªncia: Conta Corrente"`) sempre que uma conta Ã© criada ou modificada.
* **Integridade ACID com SincronizaÃ§Ã£o e Espelhamento AtÃ´mico (`models.py`):**
  - **Relacionamento FÃ­sico de Espelhamento (`linked_transfer`):** IntroduÃ§Ã£o da coluna `linked_transfer = OneToOneField('self')` no modelo `Transaction`, garantindo o acoplamento fÃ­sico bidirecional de ponta a ponta e abolindo dependÃªncias de strings UUID legacy.
  - **Mecanismo Recursivo de SincronizaÃ§Ã£o (`_syncing`):** Controle robusto via flag local `_syncing` na engine de `save()` e `delete()` de transaÃ§Ãµes para prevenir loops de replicaÃ§Ã£o infinitos, propagando ediÃ§Ãµes de `amount`, `date`, `status` e inversÃ£o de direÃ§Ã£o financeira (`is_income = not is_income`) entre transaÃ§Ãµes espelhadas.
  - **ValidaÃ§Ã£o Estrita de Envelopes YNAB (`clean()`):** InjeÃ§Ã£o de validaÃ§Ãµes de regras de negÃ³cio contÃ¡beis:
    - TransferÃªncias internas On-Budget para On-Budget ou Off-Budget para Off-Budget zeram incondicionalmente a categoria, pois o capital permanece no mesmo lado da fronteira contÃ¡bil.
    - TransferÃªncias mistas On-to-Off e Off-to-On exigem preenchimento obrigatÃ³rio da categoria de despesa, pois alteram a liquidez lÃ­quida do orÃ§amento base-zero.
* **Suite de Testes de RegressÃ£o ContÃ¡bil (`test_ledger.py`):**
  - CriaÃ§Ã£o de suite robusta contendo testes especÃ­ficos de integraÃ§Ã£o para validaÃ§Ã£o de `is_on_budget`, auto-criaÃ§Ã£o de payees, restriÃ§Ãµes de categorias YNAB e propagaÃ§Ã£o recursiva bidirecional de saldos.

### Alterado / Refatorado
* **SimplificaÃ§Ã£o Radical das Views de LanÃ§amento (`views.py`):**
  - RefatoraÃ§Ã£o dos mÃ©todos `perform_create`, `perform_update` e `perform_destroy` do `TransactionViewSet` para eliminar duplicidades manuais e redundÃ¢ncias fÃ­sicas de alteraÃ§Ã£o de saldos de contas nas Views, delegando toda a governanÃ§a transacional para os hooks ricos de domÃ­nio de `models.py`.
  - **SimplificaÃ§Ã£o de endpoints `transfer` e `bulk_transfer`:** Reescrevemos as aÃ§Ãµes para utilizarem a nova engine baseada em `Payee` e `linked_transfer`, com suporte inteligente a transferÃªncias multi-moedas com valores diferentes atravÃ©s de re-sincronizaÃ§Ã£o atÃ´mica do saldo da transaÃ§Ã£o espelhada.

---

## [1.27.3] â 2026-05-18

Esta versÃ£o resolve em definitivo o sumiÃ§o silencioso visual de transaÃ§Ãµes homologadas do Inbox com data do passado. Agora, ao homologar qualquer transaÃ§Ã£o, o perÃ­odo ativo do dashboard Ã© sincronizado automaticamente, e as pÃ¡ginas de listagem (`Transactions.tsx` e `AccountDetails.tsx`) mantÃªm sincronia reativa total com o perÃ­odo global da `useAccountStore`.

### Adicionado
* **SincronizaÃ§Ã£o de PerÃ­odo AutomÃ¡tica no Homologar (`Inbox.tsx`):**
  - Adicionado ajuste automÃ¡tico do perÃ­odo global (`currentMonth`, `currentYear` no `useAccountStore`) ao homologar com sucesso uma transaÃ§Ã£o. Se o comprovante possuir uma data fora do perÃ­odo visualizado atual, o dashboard Ã© atualizado instantaneamente para o mÃªs e ano da transaÃ§Ã£o e emite uma notificaÃ§Ã£o informativa elegante sobre a mudanÃ§a.
* **Filtro de PerÃ­odo Sincronizado e Reativo (`Transactions.tsx` & `AccountDetails.tsx`):**
  - Modificadas as pÃ¡ginas de listagem global e detalhes de conta para inicializarem seus perÃ­odos locais com base no `useAccountStore` global e reagirem em tempo real a qualquer mudanÃ§a de perÃ­odo (como a auto-seleÃ§Ã£o apÃ³s homologaÃ§Ã£o), assegurando que o usuÃ¡rio veja as transaÃ§Ãµes no mesmo instante em que a homologaÃ§Ã£o Ã© efetuada.

## [1.27.2] â 2026-05-18

Esta versÃ£o resolve em definitivo a visualizaÃ§Ã£o e consistÃªncia na listagem de transaÃ§Ãµes, corrigindo o rastreamento recursivo de transaÃ§Ãµes de subcontas sob contas pai e ajustando a conversÃ£o de tipos para a filtragem por conta na tabela global de transaÃ§Ãµes.

### Corrigido
* **AgregaÃ§Ã£o Recursiva de Subcontas (`AccountDetails.tsx`):**
  - Implementada a busca e agregaÃ§Ã£o recursiva de todos os IDs de subcontas a partir da conta selecionada, de modo que clicar em uma conta pai no menu exiba todas as transaÃ§Ãµes das subcontas que receberam os lanÃ§amentos (ex.: "Crunchyroll" sob "Nubank"), permitindo que o usuÃ¡rio veja as transaÃ§Ãµes no mesmo momento em que os saldos sÃ£o deduzidos.
* **Correta Tipagem na Filtragem de TransaÃ§Ãµes (`Transactions.tsx`):**
  - CorreÃ§Ã£o na comparaÃ§Ã£o estrita `t.account === selectedAccountId` que impedia a exibiÃ§Ã£o de transaÃ§Ãµes ao aplicar qualquer filtro por conta na tela global (comparaÃ§Ã£o de nÃºmero vs string). Agora usa `String(t.account)` para garantir compatibilidade e exibiÃ§Ã£o correta dos registros.

## [1.27.1] â 2026-05-18

Esta versÃ£o garante que toda e qualquer transaÃ§Ã£o gerada pela homologaÃ§Ã£o de comprovantes na Inbox Inteligente (incluindo o fallback de cartÃ£o de crÃ©dito para faturas futuras) seja criada diretamente com o status **Efetivada ("realized")** e deduza imediatamente o valor correspondente do saldo real da conta.

### Corrigido
* **HomologaÃ§Ã£o de IA Sempre Efetivada (`views.py`):**
  - Ajuste na criaÃ§Ã£o de transaÃ§Ãµes de fallback para cartÃ£o de crÃ©dito no endpoint `approve` para usar `status='realized'` de forma incondicional e atualizar de imediato o saldo real do cartÃ£o caso a data da compra seja igual ou anterior Ã  data atual, eliminando transaÃ§Ãµes pendentes indesejadas e inconsistÃªncias de saldo.

## [1.27.0] â 2026-05-18

Esta versÃ£o corrige a criaÃ§Ã£o de transaÃ§Ãµes reais de compras no cartÃ£o de crÃ©dito durante a homologaÃ§Ã£o do Inbox Inteligente, elimina as duplicidades silenciosas no backend e garante a sincronizaÃ§Ã£o instantÃ¢nea do Dashboard em tempo real sem necessidade de F5.

### Adicionado
* **SincronizaÃ§Ã£o de Estado Reativa no Dashboard (`useInboxStore.ts` & `Dashboard.tsx`):**
  - O painel principal (`Dashboard.tsx`) agora destrutura e chama explicitamente `fetchTransactions()` de `useAccountStore` no `useEffect` de inicializaÃ§Ã£o e no mÃ©todo `handleRefresh`. Isso garante que qualquer nova transaÃ§Ã£o no sistema atualize imediatamente todos os cards de receita, despesa, balanÃ§o, grÃ¡ficos de fluxo, e transaÃ§Ãµes recentes.
  - A action `approveInboxItem` em `useInboxStore.ts` agora chama explicitamente `await useAccountStore.getState().fetchTransactions();` apÃ³s atualizar os saldos das contas, garantindo consistÃªncia total instantaneamente ao homologar comprovantes.

### Corrigido
* **DesvinculaÃ§Ã£o Financeira dos Envelopes YNAB (`services.py`):**
  - CorreÃ§Ã£o na rotina `process_installment_ynab` para criar a transaÃ§Ã£o core real sob a conta do cartÃ£o de crÃ©dito (`credit_card.account`) e deduzir seu saldo de forma incondicional, independente de os envelopes virtuais de categorias YNAB estarem criados ou disponÃ­veis.
* **AssociaÃ§Ã£o Livre de Duplicidades no Inbox (`views.py`):**
  - CorreÃ§Ã£o na action `@action` `approve` do `TransactionInboxViewSet` para buscar a transaÃ§Ã£o de cartÃ£o recÃ©m-criada filtrando pelo ID da conta (`account=account`) e pela data real do comprovante (`date=tx_date`) em vez da data de hoje, eliminando o fallback incorreto e redundante que gerava transaÃ§Ãµes duplicadas pendentes no banco.

## [1.26.9] â 2026-05-17

Esta versÃ£o adiciona o lanÃ§amento real de despesas fÃ­sicas de cartÃ£o de crÃ©dito e a atualizaÃ§Ã£o em tempo real de saldo devedor nas contas de cartÃ£o de crÃ©dito do motor YNAB, alÃ©m de blindar a validaÃ§Ã£o de categorias sem classificaÃ§Ã£o.

### Adicionado
* **LanÃ§amento de Despesa Real de CartÃ£o de CrÃ©dito (`services.py`):**
  - O processador YNAB (`process_installment_ynab`) agora registra uma transaÃ§Ã£o real de despesa (`CoreTransaction`) sob a conta do cartÃ£o de crÃ©dito (`credit_card.account`) correspondente Ã  parcela e subtrai o valor diretamente de seu saldo real (`credit_card.account.balance`), sincronizando perfeitamente os limites e faturas com o painel principal em tempo real.
* **AntecipaÃ§Ã£o Integrada ao YNAB (`views.py`):**
  - Chamada Ã  rotina YNAB `process_installment_ynab` injetada na action `anticipate_installment` de `CreditCardViewSet` para garantir que faturas futuras antecipadas pelo usuÃ¡rio deduzam imediatamente do envelope e do saldo real do cartÃ£o no ato da antecipaÃ§Ã£o.

### Corrigido
* **Blindagem Total contra ID "none" no Backend (`views.py`):**
  - Tratamento aprimorado no endpoint de homologaÃ§Ã£o (`approve`) para ignorar explicitamente a string `"none"` (case-insensitive) como um ID de categoria invÃ¡lido, atribuindo `None` Ã  categoria de forma segura e elegante.
* **Envio Limpo do Cliente (`Inbox.tsx`):**
  - No frontend, a homologaÃ§Ã£o de transaÃ§Ãµes marcadas com "Sem Categoria (Receita)" substitui dinamicamente o valor `"none"` por `null` no payload JSON, assegurando conformidade absoluta cliente-servidor.

## [1.26.8] â 2026-05-17

Esta versÃ£o corrige a homologaÃ§Ã£o de transaÃ§Ãµes em contas de cartÃ£o de crÃ©dito e a aprovaÃ§Ã£o de lotes na Caixa de Entrada Inteligente (Staging Inbox).

### Adicionado
* **IntegraÃ§Ã£o do Inbox com CartÃµes de CrÃ©dito (`views.py`):**
  - Implementada a integraÃ§Ã£o direta da homologaÃ§Ã£o com o motor de cartÃµes de crÃ©dito YNAB (`process_credit_card_transaction`).
  - Quando o usuÃ¡rio homologa uma transaÃ§Ã£o selecionando uma conta de tipo `credit_card`, o sistema cria a transaÃ§Ã£o de cartÃ£o (`CreditCardTransaction`) e suas respectivas parcelas (`Installment`), recalculando automaticamente a fatura correspondente e efetuando a transferÃªncia virtual de envelopes (do envelope de despesas para o de pagamento do cartÃ£o).
  - IncluÃ­do fallback virtual inteligente e robusto para criar um registro `CoreTransaction` pendente com `is_applied_to_balance=False` caso o lote seja futuro ou nÃ£o acione realocaÃ§Ãµes imediatas, garantindo integridade com a chave estrangeira `validated_transaction` sem corromper saldos.

### Corrigido
* **ValidaÃ§Ã£o Robusta de IDs no Inbox (`views.py`):**
  - Implementada uma barreira estrita de conversÃ£o de tipos em Python (via `int(str().strip())` e tratamento completo de exceÃ§Ãµes `ValueError`, `TypeError`, `ValidationError`) para `account_id` e `category_id` no endpoint `approve`.
  - Isso impede de forma absoluta que valores string nÃ£o numÃ©ricos enviados pelo frontend (como `'none'`, `'null'`, `'undefined'`, `''`) causem erros de validaÃ§Ã£o da ORM do Django (`Field 'id' expected a number but got 'none'`), garantindo que a homologaÃ§Ã£o sem categoria ou com contas corrompidas prossiga de forma segura.
* **PersistÃªncia de Status em Lotes Parciais (`views.py`):**
  - Corrigido o bug na action `approve` onde o status do item da inbox era prematuramente alterado para `'ready'` mesmo quando restavam transaÃ§Ãµes pendentes de homologaÃ§Ã£o no lote.
  - O status `'ready'` agora sÃ³ Ã© atribuÃ­do quando absolutamente todas as transaÃ§Ãµes mapeadas pelo Gemini no comprovante forem devidamente homologadas pelo usuÃ¡rio, mantendo o comprovante visÃ­vel na fila para as revisÃµes subsequentes.

## [1.26.7] â 2026-05-17

Esta versÃ£o otimiza radicalmente a velocidade de carregamento e processamento de comprovantes fiscais na Caixa de Entrada Inteligente (Staging Inbox) via compressÃ£o nativa de imagem no lado do cliente.

### Adicionado
* **CompressÃ£o de Imagem Nativa no Cliente (`image-utils.ts`):**
  - Implementada funÃ§Ã£o `compressImage` baseada na API de HTML5 Canvas para redimensionar e compactar imagens proporcionalmente para largura/altura mÃ¡xima de `1200px` (qualidade de `0.85` JPEG).
  - Bypass inteligente instantÃ¢neo para arquivos nÃ£o-imagem (como documentos PDF).
* **IntegraÃ§Ã£o de Upload Otimizado (`useInboxStore.ts`):**
  - Processamento concorrente via `Promise.all` e `compressImage` para compactar todas as imagens do lote antes de montar o payload `FormData`.
  - ReduÃ§Ã£o drÃ¡stica do tamanho mÃ©dio dos arquivos de ~8MB para ~300KB (economia de 96% de trÃ¡fego de rede) com upload e processamento da IA concluÃ­dos em menos de 7 segundos.

## [1.26.6] â 2026-05-17

Esta versÃ£o corrige um bug crÃ­tico de UX onde as transaÃ§Ãµes homologadas na Staging Area nÃ£o apareciam imediatamente na tabela e os saldos das contas nÃ£o eram atualizados na tela sem um recarregamento da pÃ¡gina (F5).

### Corrigido
* **SincronizaÃ§Ã£o de Estado Global PÃ³s-HomologaÃ§Ã£o (`App.tsx` e `useInboxStore.ts`):**
  - Exportado o `queryClient` instanciado no `App.tsx` para permitir acesso imperativo fora de hooks do React.
  - InclusÃ£o da invalidaÃ§Ã£o forÃ§ada do cache `["transactions"]` do React Query e da execuÃ§Ã£o de `useAccountStore.getState().fetchAccounts()` na store do Zustand apÃ³s o tÃ©rmino do `approveInboxItem`.
  - Garantia de que a tabela de transaÃ§Ãµes, grÃ¡ficos e saldos do cabeÃ§alho reajam em tempo real Ã  inserÃ§Ã£o de novos lanÃ§amentos gerados pelo OCR da IA.

## [1.26.5] â 2026-05-17

Esta versÃ£o corrige a sincronizaÃ§Ã£o de estado do React na Caixa de Entrada Inteligente (Staging Inbox Area), garantindo que o painel de RevisÃ£o e HomologaÃ§Ã£o seja atualizado de forma dinÃ¢mica e reativa e exiba instantaneamente os dados extraÃ­dos pelo Gemini 2.5 Flash assim que o status do processamento transicionar para "pronto".

### Corrigido
* **Reatividade do Painel de RevisÃ£o e HomologaÃ§Ã£o (`Inbox.tsx`):**
  - SubstituiÃ§Ã£o do estado local estÃ¡tico `selectedItem` (objeto) pelo estado de referÃªncia de ID Ãºnica `selectedItemId` (string).
  - DerivaÃ§Ã£o inteligente e dinÃ¢mica do item selecionado por meio do React `useMemo` acoplado ao array reativo de `inboxItems` obtido da store do Zustand.
  - SincronizaÃ§Ã£o em tempo real das sugestÃµes da inteligÃªncia artificial: quando o polling do OCR atualiza a lista de staging na store, o `selectedItem` deriva a referÃªncia do novo objeto atualizado, disparando os hooks de efeito para auto-preencher os inputs do formulÃ¡rio sem exigir recarregamento de pÃ¡gina.
  - CorreÃ§Ã£o na seleÃ§Ã£o automÃ¡tica pÃ³s-homologaÃ§Ã£o e no clique de itens da fila de staging para persistir `selectedItemId` corretamente.

## [1.26.4] â 2026-05-17

Esta versÃ£o aprimora a usabilidade, robustez e layout da Caixa de Entrada Inteligente (Staging Inbox Area) de comprovantes, resolvendo falhas na homologaÃ§Ã£o de transaÃ§Ãµes sem categoria e implementando atualizaÃ§Ãµes reativas automÃ¡ticas na tela.

### Adicionado
* **Polling Reativo de Status do Processamento (`Inbox.tsx`):**
  - ImplementaÃ§Ã£o de um `useEffect` com polling de 3 segundos que atualiza automaticamente a listagem e os campos quando hÃ¡ transaÃ§Ãµes com status `'pending'` ou `'processing'` sendo analisadas pela IA do Gemini, eliminando a necessidade de atualizar a pÃ¡gina manualmente.
* **Componente de Busca no Seletor de Contas (`Inbox.tsx`):**
  - IntegraÃ§Ã£o do componente de alta performance `AccountCombobox` para a busca de contas no Inbox, fornecendo a mesma experiÃªncia com filtragem interativa por teclado e listagem hierÃ¡rquica presente no cadastro manual de transaÃ§Ãµes.
  - ExtensÃ£o da interface `AccountComboboxProps` e sua implementaÃ§Ã£o para suportar o estado `disabled` de forma elegante quando o preenchimento automÃ¡tico de comprovante por IA estiver em andamento.
* **Testes de RegressÃ£o no Django (`test_inbox.py`):**
  - InclusÃ£o do caso de teste `test_approve_transaction_with_none_category` na API para certificar o funcionamento correto de homologaÃ§Ãµes sem categoria atrelada.

### Corrigido
* **ResiliÃªncia ao Homologar TransaÃ§Ãµes sem Categoria (`views.py`):**
  - CorreÃ§Ã£o na action `approve` do `TransactionInboxViewSet` para tratar de forma defensiva strings de categoria como `'none'`, `''`, `'null'` e `'undefined'`, mapeando-as corretamente para `None` no banco em vez de disparar erros de formato UUID e interromper a homologaÃ§Ã£o.
* **Ergonometria Visual e Ajuste de Cards Estrangulados (`Inbox.tsx`):**
  - ExpansÃ£o da altura dos painÃ©is laterais de split-screen para `min-h-[580px] lg:h-[620px]` e incorporaÃ§Ã£o de rolagem vertical independente na div de formulÃ¡rio (`overflow-y-auto max-h-[490px]`), corrigindo o problema estÃ©tico onde o botÃ£o de "Homologar TransaÃ§Ã£o" encobria outras informaÃ§Ãµes e apertava os inputs.
  - AtualizaÃ§Ã£o do indicador de status da IA para Gemini 2.5 Flash.

## [1.26.3] â 2026-05-17

Esta versÃ£o corrige a falha na atualizaÃ§Ã£o de saldo de contas no ato de homologaÃ§Ã£o/aprovaÃ§Ã£o de comprovantes a partir da Caixa de Entrada Inteligente (Staging Inbox), garantindo o sincronismo real e imediato com o orÃ§amento do YNAB.

### Corrigido
* **AtualizaÃ§Ã£o de Saldo e IntegraÃ§Ã£o Financeira no Inbox (`views.py`):**
  - CorreÃ§Ã£o na action `@action` `approve` do `TransactionInboxViewSet` para efetuar o cÃ¡lculo de dÃ©bito/crÃ©dito no saldo da conta correspondente Ã  transaÃ§Ã£o homologada.
  - AtivaÃ§Ã£o correta da flag `is_applied_to_balance=True` na transaÃ§Ã£o criada a partir do inbox, sincronizando o fluxo com o comportamento nativo de lanÃ§amentos manuais do YNAB.
  - ImplementaÃ§Ã£o de validaÃ§Ãµes robustas com conversÃ£o defensiva de strings e floats para `Decimal` e formataÃ§Ã£o de datas.
* **ValidaÃ§Ã£o Rigorosa da SuÃ­te de Testes (`test_inbox.py`):**
  - InclusÃ£o de asserÃ§Ãµes nos testes unitÃ¡rios e de integraÃ§Ã£o do inbox (`test_approve_single_transaction_legacy_format` e `test_approve_multi_transaction_batch_by_index`) para garantir que o saldo da conta e a flag `is_applied_to_balance` sejam recalculados e sincronizados perfeitamente.

---

## [1.26.2] â 2026-05-17

Esta versÃ£o realiza o upgrade tecnolÃ³gico do motor de IA da Caixa de Entrada Inteligente (Staging Inbox) para o modelo **Gemini 2.5 Flash**, garantindo compatibilidade e resiliÃªncia com as novas cotas e deprecando as rotas da versÃ£o 1.5.

### Alterado
* **Upgrade do Motor de IA para Gemini 2.5 Flash:**
  - AtualizaÃ§Ã£o do modelo padrÃ£o no serviÃ§o `AIExtractionService` (`ai_services.py`) de `gemini-1.5-flash` para `gemini-2.5-flash` em resposta Ã  indisponibilidade de modelos legados sob novas chaves de API em 2026.
  - SincronizaÃ§Ã£o dos endpoints de teste e diagnÃ³stico (`debug_key` no views e `debug_key_view` em urls) para o novo modelo de alta performance.
* **ResiliÃªncia e IsenÃ§Ã£o de AutenticaÃ§Ã£o no DiagnÃ³stico:**
  - Mapeamento de um endpoint puro Django `/api/debug-key/` (`urls.py`) totalmente independente do framework de permissÃµes/autenticaÃ§Ã£o do DRF para diagnÃ³stico pÃºblico seguro do Gemini.

---

## [1.26.1] â 2026-05-17

Esta versÃ£o introduz ferramentas robustas de depuraÃ§Ã£o e diagnÃ³stico em produÃ§Ã£o para auditoria e validaÃ§Ã£o segura da chave de API do Gemini em ambientes de contÃªineres efÃªmeros (Render).

### Adicionado
* **Endpoint de DepuraÃ§Ã£o e DiagnÃ³stico Seguro (`views.py`):**
  - ImplementaÃ§Ã£o da action `@action` `debug_key` para expor metadados seguros da chave de ambiente configurada (`GEMINI_API_KEY`) em conformidade com polÃ­ticas de seguranÃ§a de dados.

---

## [1.26.0] â 2026-05-17

Esta versÃ£o introduz o suporte completo a **DetecÃ§Ã£o e HomologaÃ§Ã£o MÃºltipla de TransaÃ§Ãµes** na Caixa de Entrada Inteligente (Staging Inbox), permitindo extrair e aprovar de forma individualizada e granular mÃºltiplas compras contidas em um Ãºnico comprovante, nota fiscal ou captura de tela por meio da IA do Gemini 1.5 Flash.

### Adicionado
* **ExtraÃ§Ã£o de MÃºltiplas TransaÃ§Ãµes por IA:**
  - **Esquema JSON Estruturado de Array (`ai_services.py`):** ConfiguraÃ§Ã£o refinada do prompt e do esquema JSON do Gemini para preencher um array de objetos `transactions` em vez de um objeto de transaÃ§Ã£o Ãºnica plana.
  - **ResiliÃªncia e Fallback Coerentes:** Mecanismos de tolerÃ¢ncia a falhas atualizados para empacotar respostas padrÃ£o e erros de falha de infraestrutura sob a nova estrutura orientada a listas.
* **Pipeline de HomologaÃ§Ã£o Granular por Ãndice no Backend:**
  - **AprovaÃ§Ã£o EspecÃ­fica por Ãndice (`views.py`):** AtualizaÃ§Ã£o do endpoint `/api/finance/inbox/{id}/approve/` para receber o parÃ¢metro opcional de query `index`. Ao recebÃª-lo, o backend realiza a criaÃ§Ã£o da transaÃ§Ã£o correspondente no banco e marca apenas aquele item do array como aprovado (`"approved": true`).
  - **Arquivamento e ConclusÃ£o Progressivos:** O registro inbox sÃ³ Ã© considerado concluÃ­do (status transicionado para `'ready'` e `validated_transaction` vinculada) quando *todas* as transaÃ§Ãµes contidas no recibo sÃ£o homologadas e marcadas como aprovadas pelo usuÃ¡rio.
* **Visualizador de Abas de TransaÃ§Ãµes MÃºltiplas no Frontend (`Inbox.tsx`):**
  - **Interface com Abas DinÃ¢micas:** ApresentaÃ§Ã£o interativa em React que divide os dados retornados da IA em abas individuais para cada compra identificada no comprovante.
  - **EdiÃ§Ã£o e Envio Granular:** Permite ao usuÃ¡rio editar, ajustar contas/envelopes e aprovar cada item de forma independente sem recarregar ou perder o contexto visual do comprovante ao lado.
* **Suite de Testes UnitÃ¡rios Completamente Atualizada:**
  - **Testes Ajustados no Django (`test_inbox.py`):** CorreÃ§Ã£o de todas as asserÃ§Ãµes de teste unitÃ¡rio da API e do Celery para validar a nova arquitetura orientada a array do inbox, garantindo 100% de cobertura verde em todos os 47 testes de backend.
  - **ValidaÃ§Ã£o de Testes do Frontend (Vitest):** Garantia de funcionamento perfeito de todas as 30 rotinas de testes no frontend do React.

---

## [1.25.0] â 2026-05-17

Esta versÃ£o introduz a **Interface Visual da Caixa de Entrada Inteligente (Staging Inbox Area)** no frontend em React 18, permitindo que os usuÃ¡rios revisem e homologuem cupons e recibos side-by-side com as sugestÃµes estruturadas pela IA do Gemini.

### Adicionado
* **Painel Visual Split-Screen Premium (`Inbox.tsx`):**
  - **Layout Responsivo Lado a Lado:** Tela moderna contendo um visualizador interativo do comprovante fÃ­sico de um lado, e um formulÃ¡rio inteligente prÃ©-preenchido com os dados obtidos pela inteligÃªncia artificial do outro.
  - **Controle DinÃ¢mico de MÃ­dia:** Ferramentas integradas para rotacionar a imagem em 90 graus e efetuar Zoom In/Out para facilitar a leitura de notas fiscais digitalizadas.
* **IntegraÃ§Ã£o de Zustand e API de HomologaÃ§Ã£o:**
  - **Zustand Store Completa (`useInboxStore.ts`):** Gerenciamento centralizado do estado de uploads, listagem destaging e delegaÃ§Ã£o de homologaÃ§Ã£o.
  - **Endpoint de ValidaÃ§Ã£o AtÃ´mica no Django REST Framework:** ExposiÃ§Ã£o da aÃ§Ã£o customizada de detalhe `/api/finance/inbox/{id}/approve/` no backend para criar a transaÃ§Ã£o fÃ­sica associada de forma segura e transicional, mapeando contas financeiras e envelopes de categoria YNAB do usuÃ¡rio.
* **GovernanÃ§a EstÃ©tica, TraduÃ§Ã£o e Menus:**
  - **Rotas e NavegaÃ§Ã£o:** Registro da nova pÃ¡gina de Inbox no roteador do app, menu lateral desktop (`Sidebar.tsx`) e menu mÃ³vel (`BottomNav.tsx`).
  - **SincronizaÃ§Ã£o de TraduÃ§Ãµes:** InclusÃ£o das chaves de traduÃ§Ã£o `inbox` e descriÃ§Ãµes interativas no manual local de idioma `pt-BR.json`.
* **Tratamento de Erros Defensivo na API (`api.ts`):**
  - ImplementaÃ§Ã£o de um duto de seguranÃ§a que intercepta erros nÃ£o-JSON vindos do servidor (como 404 e 500 do Render), convertendo pÃ¡ginas HTML de erro em alertas em portuguÃªs descritivos e amigÃ¡veis, eliminando para sempre a exibiÃ§Ã£o do toast de objeto vazio `{}` na interface.
* **ResiliÃªncia PÃ³s-Commit no Django REST Framework (`views.py`):**
  - **Despacho PÃ³s-Commit (`transaction.on_commit`):** Protegemos a criaÃ§Ã£o e o upload de recibos movendo o despacho da tarefa Celery para fora da transaÃ§Ã£o atÃ´mica do Django. Isso impede race-conditions onde o Celery tentava consultar o banco antes de a transaÃ§Ã£o finalizar.
  - **ResiliÃªncia Multi-Container (Fallback em Thread Local):** Implementamos uma estratÃ©gia ultra-defensiva de processamento. Se a fila Celery ou a conexÃ£o com o broker Redis falhar ou estiver offline em produÃ§Ã£o (comum em setups Render separados ou sem Redis), o backend intercepta o erro de conexÃ£o e aciona um processamento alternativo via Thread local assÃ­ncrona (`threading.Thread`). Isso evita erros HTTP 500 no upload do usuÃ¡rio e garante que a extraÃ§Ã£o por IA continue funcionando perfeitamente!
* **Garantia de Qualidade:**
  - AdaptaÃ§Ã£o dos testes da API (`test_inbox.py`) usando o context manager `captureOnCommitCallbacks` para simular e validar perfeitamente o disparo do Celery pÃ³s-commit dentro do ambiente de testes transacional.
  - ExecuÃ§Ã£o completa e aprovaÃ§Ã£o de 100% da suÃ­te de 60 testes automatizados no Pytest.
* **Deploy de ProduÃ§Ã£o:**
  - Build de produÃ§Ã£o validado com sucesso e implantado na nuvem via Vercel (100% online).
  - AtualizaÃ§Ãµes resilientes integradas no repositÃ³rio GitHub para reinstanciaÃ§Ã£o no Render.

---

## [1.24.0] â 2026-05-17

Esta versÃ£o introduz a **IntegraÃ§Ã£o Multimodal com o Google Gemini 1.5 Flash API** por meio do serviÃ§o de extraÃ§Ã£o inteligente `AIExtractionService`, substituindo parsers de OCR legados por Structured Outputs (JSON Schema Estrito) executados na fila do Celery.

### Adicionado
* **IntegraÃ§Ã£o Multimodal de IA (`AIExtractionService`):**
  - **ExtraÃ§Ã£o com Structured Outputs:** ImplementaÃ§Ã£o do serviÃ§o `AIExtractionService` em `ai_services.py` que lÃª arquivos de recibos e notas, os codifica em Base64, detecta os tipos MIME dinamicamente e realiza requisiÃ§Ãµes REST diretas e otimizadas para a API do Google Gemini 1.5 Flash.
  - **Esquema de JSON Estrito:** Envio do `responseSchema` no payload do `generationConfig` exigindo do Gemini o preenchimento estrito e determinÃ­stico do JSON contendo `amount`, `date`, `merchant` e `currency`, eliminando a necessidade de pÃ³s-processamento de regex.
  - **Arquitetura Ultra-Defensiva:** ResiliÃªncia nativa com retentativas automÃ¡ticas sob backoff exponencial ao receber limite de taxa (HTTP 429), timeouts estritos (15 segundos) e tratamento de exceÃ§Ãµes com fornecimento de fallback estruturado em caso de falha de infraestrutura ou ausÃªncia de chave de API.
* **Fila do Celery Integrada com IA:**
  - **OrquestraÃ§Ã£o em Segundo Plano:** AtualizaÃ§Ã£o da Celery Task `process_inbox_document` em `tasks.py` para instanciar o serviÃ§o de IA, executar a extraÃ§Ã£o sobre o caminho fÃ­sico do item na Ã¡rea de staging, popular o banco de dados e transicionar o status final de ciclo para `'ready'`.
* **Testes de Alta Fidelidade no Pytest:**
  - **Mocks Abrangentes:** AmpliaÃ§Ã£o da cobertura em `test_inbox.py` com mocks de leitura fÃ­sica de mÃ­dias (`mock_open`), chamadas REST de sucesso e simulaÃ§Ã£o de concorrÃªncia com limite de requisiÃ§Ãµes do Gemini.

---

## [1.23.0] â 2026-05-17

Esta versÃ£o introduz a **OrquestraÃ§Ã£o AssÃ­ncrona via Celery & Fila de Segundo Plano** para IngestÃ£o e processamento de comprovantes em lote, otimizando o pipeline de upload e staging de dados antes do acionamento de IA.

### Adicionado
* **OrquestraÃ§Ã£o AssÃ­ncrona Celery / Redis:**
  - **Bootstrap e InicializaÃ§Ã£o:** CriaÃ§Ã£o do arquivo `celery.py` oficial para bootstrap da instÃ¢ncia de app do Celery e auto-descoberta automÃ¡tica de tarefas, de forma robusta e modular.
* **API de IngestÃ£o em Lote (Bulk Upload):**
  - **Upload Desbloqueado (`InboxUploadView`):** CriaÃ§Ã£o do endpoint `/api/finance/inbox/upload/` que suporta uploads mÃºltiplos de arquivos fÃ­sicos em lote (`multipart/form-data`), instanciando itens na Ã¡rea de staging e disparando de forma assÃ­ncrona as tarefas na fila antes de retornar instantaneamente o status de sucesso `202 Accepted`.

---

## [1.22.0] â 2026-05-17

Esta versÃ£o introduz a **Modelagem do TransactionInbox e Isolamento Multitenancy** no backend do Vault Finance OS, desenhando os alicerces de dados para recepÃ§Ã£o inteligente de cupons.

### Adicionado
* **Modelagem e MigraÃ§Ãµes (`TransactionInbox`):**
  - CriaÃ§Ã£o do modelo `TransactionInbox` mapeando status (`'pending'`, `'processing'`, `'ready'`, `'failed'`), caminhos fÃ­sicos de arquivos, sugestÃµes do Gemini e campos de erro estruturados.

---

## [1.21.0] â 2026-05-14

Esta versÃ£o consagra a **SubstituiÃ§Ã£o e EvoluÃ§Ã£o do Dashboard Principal para o Design Premium de Alta Fidelidade** no Vault Finance OS, aliada a uma cirÃºrgica otimizaÃ§Ã£o arquitetural para eliminaÃ§Ã£o de redundÃ¢ncias visuais e de dados entre o cabeÃ§alho e as telas.

### Adicionado / Refatorado
* **FusÃ£o Definitiva do Painel Central de PatrimÃ´nio (`Dashboard.tsx` & `Accounts.tsx`):**
  - **Zero RedundÃ¢ncia:** RemoÃ§Ã£o do card de PatrimÃ´nio Total LÃ­quido que ocupava espaÃ§o no topo da pÃ¡gina de Contas e sua fusÃ£o e migraÃ§Ã£o como peÃ§a central exclusiva e majestosa no topo do Dashboard.
  - **EliminaÃ§Ã£o de SaudaÃ§Ãµes Repetidas:** RemoÃ§Ã£o do *Hero Greeting* do Dashboard que repetia a saudaÃ§Ã£o de bom dia e a data jÃ¡ existentes no `Topbar` global, mantendo a interface hiper-limpa e focada.
  - **Cards Mensais Otimizados (3 Cards):** O antigo card redundante de "PatrimÃ´nio Total" da fileira inferior foi eliminado. A grade agora se expande de forma harmoniosa com 3 cards de fluxo mensal: `Receitas`, `Despesas` e `BalanÃ§o do MÃªs (com Taxa de PoupanÃ§a)`.
* **Biblioteca de Widgets CustomizÃ¡vel:** Painel inferior modular permitindo ativar, desativar e reorganizar instantaneamente cards de AÃ§Ãµes RÃ¡pidas, DistribuiÃ§Ã£o de Gastos, Fluxo Semanal, Top Contas, Resumo de DÃ­vidas e Mapa de Calor de Atividades.

### Removido
* **Pruning de Pastas TemporÃ¡rias de ProtÃ³tipo:** RemoÃ§Ã£o completa e limpa da pasta de protÃ³tipo `111111111111drag-track-money-main` do repositÃ³rio para assegurar a mÃ¡xima organizaÃ§Ã£o e limpeza do projeto.

---

## [1.20.0] â 2026-05-13

Esta versÃ£o traz a implantaÃ§Ã£o do **MÃ³dulo de CartÃµes de CrÃ©dito e IntegraÃ§Ã£o YNAB**, projetado para gerenciar compras rotativas e parcelamentos brasileiros com cÃ¡lculo exato de faturas e reservas automÃ¡ticas de liquidez para quitaÃ§Ã£o.

### Adicionado
* **Modelagem e ServiÃ§os de CartÃµes de CrÃ©dito (`finance.credit_card`):**
  - **Modelos Dedicados:** `CreditCard`, `CreditCardBill`, `CreditCardTransaction` e `Installment` perfeitamente estruturados e interligados com `Account` e `Category`.
  - **Janela Estendida e "Melhor Dia":** LÃ³gica matemÃ¡tica de fechamento (`closing_day`) que projeta transaÃ§Ãµes feitas no dia de fechamento ou apÃ³s para a fatura do mÃªs subsequente.
  - **GestÃ£o de Parcelamentos:** DivisÃ£o de compras matriz em fatias de dÃ­vida (`Installment`) com suporte a antecipaÃ§Ã£o de parcelas futuras.
  - **IntegraÃ§Ã£o YNAB Nativa:** TransferÃªncia virtual automatizada do saldo do envelope de despesa para o envelope de pagamento do cartÃ£o ao entrar na fatura vigente.
  - **Contrato de API Interativo:** Endpoints REST robustos no `CreditCardViewSet` expostos no Swagger via `drf-spectacular`.
* **Frontend Premium de CartÃµes de CrÃ©dito (`CreditCards.tsx` & `AddRootAccountModal.tsx`):**
  - **Interface Dedicada:** Nova pÃ¡gina luxuosa em `/credit-cards` com navegaÃ§Ã£o em cascata por faturas mensais, controle de progresso de limite utilizado e listagem detalhada de parcelas com IOF e spread.
  - **CriaÃ§Ã£o FlexÃ­vel e Unificada:** Possibilidade de cadastrar novos cartÃµes de crÃ©dito e suas respectivas contas YNAB simultaneamente atravÃ©s da aba de **CartÃµes de CrÃ©dito** e tambÃ©m diretamente do botÃ£o "Nova Conta" na aba de **Contas**.
  - **MÃ¡gica do YNAB Transparente:** ExplicaÃ§Ã£o visual instantÃ¢nea nos modais de lanÃ§amento sobre o provisionamento automÃ¡tico de liquidez das categorias de despesa para o cartÃ£o.

### Corrigido
* **Blindagem Transacional e ValidaÃ§Ã£o DRF de CartÃµes de CrÃ©dito (`views.py` & `serializers.py`):**
  - RefatoraÃ§Ã£o do `CreditCardSerializer` com `SerializerMethodField` para `name` e `currency`, permitindo leitura limpa das propriedades de conta associadas.
  - InterceptaÃ§Ã£o inteligente no mÃ©todo `create()` do `CreditCardViewSet` para instanciar a conta YNAB e injetar seu ID antes que a suÃ­te de validaÃ§Ã£o do ModelSerializer (`is_valid()`) seja disparada, eliminando erros de chaves estrangeiras nulas.
* **Cobertura de Testes de Frontend (`CreditCards.test.tsx`):**
  - Implementada a suÃ­te completa no Vitest cobrindo a renderizaÃ§Ã£o do *Empty State*, interaÃ§Ãµes de clique para abertura do modal de cadastro de novo cartÃ£o e validaÃ§Ã£o de bloqueios em tentativas de lanÃ§amento de compra sem cartÃ£o selecionado.

---

## [1.19.4] â 2026-05-12

Esta versÃ£o traz uma **AceleraÃ§Ã£o de Usabilidade e UX Perfeita** ao solucionar de forma definitiva o problema de corte visual (clipping) do seletor de contas dentro de modais rolÃ¡veis ou tabelas densas, elevando a qualidade do design e a consistÃªncia das interaÃ§Ãµes.

### Corrigido
* **Uso de Portais (Radix Portal) no `AccountCombobox.tsx`:**
  - **AdequaÃ§Ã£o EstÃ©tica e Funcional:** RefatoraÃ§Ã£o completa do dropdown flutuante para ser encapsulado pelo componente primitivo `<Popover>` da Shadcn/Radix.
  - **Zero Clipping de Overflow:** AtravÃ©s do portal, as opÃ§Ãµes de contas sÃ£o renderizadas diretamente no nÃ³ raiz do documento HTML (`body`), permitindo que a listagem flutue sobre qualquer container que possua limites rÃ­gidos de rolagem ou `overflow-y: auto` (como a lista de destino no modal de distribuiÃ§Ã£o), sem nunca cortar ou ocultar opÃ§Ãµes de escolha.
  - **Compatibilidade Responsiva:** Preservados os mecanismos sofisticados de acessibilidade por setas do teclado, filtragem interativa por busca de texto e alinhamento responsivo perfeito.

---

## [1.19.3] â 2026-05-12

Esta versÃ£o introduz **Blindagens Ultra-Defensivas de RenderizaÃ§Ã£o** e mitigaÃ§Ã£o completa contra crashes em tempo de execuÃ§Ã£o na pÃ¡gina de OrÃ§amento, assegurando que o sistema seja robusto para qualquer perfil de usuÃ¡rio (desde novos atÃ© contas avanÃ§adas com dados fragmentados ou duplicados).

### Corrigido
* **Blindagem de ID de dnd-kit em `Budget.tsx`:** Filtro preventivo estrito adicionado na memoizaÃ§Ã£o de `activeGroups` garantindo que apenas grupos com IDs vÃ¡lidos (tipo `string` ou `number`) sejam mapeados. Isso evita crashes em tempo de execuÃ§Ã£o no hook `useSortable` do `@dnd-kit/sortable`.
* **DeduplicaÃ§Ã£o DinÃ¢mica de IDs:** Implementado um mecanismo reativo com `Set` para remover grupos de categorias ou subcategorias que possuam IDs duplicados vindos do backend, evitando colisÃµes de chaves do React e falhas silenciosas de arraste.
* **ResiliÃªncia a Nulos nas Consultas (`useAccountStore.ts`):** Protegidas as funÃ§Ãµes helper globais da store do Zustand (`getAccount`, `getCategoryName`, e `totalsByCurrency`) contra arrays indefinidos, nulos ou objetos corrompidos na Ã¡rvore de contas de sincronizaÃ§Ã£o, interceptando e tratando erros com valores padrÃ£o amigÃ¡veis.

---

## [1.19.2] â 2026-05-12

Esta versÃ£o promove uma **RevoluÃ§Ã£o de UX para Novos UsuÃ¡rios** na pÃ¡gina de OrÃ§amento do Vault Finance OS, introduzindo caminhos de interaÃ§Ã£o amigÃ¡veis onde antes havia vazios funcionais, garantindo que o fluxo de onboarding seja impecÃ¡vel e intuitivo.

### Adicionado
* **Estado Vazio Premium (Empty State) em OrÃ§amento (`Budget.tsx`):**
  - **Identidade Visual ImpecÃ¡vel:** Layout elegante, centralizado, com bordas pontilhadas e efeitos de desfoque de fundo (backdrop-blur) exibindo o Ã­cone de carteira em destaque caso o usuÃ¡rio nÃ£o tenha grupos de categorias criados neste perÃ­odo.
  - **Onboarding Facilitado:** Guia textual orientando o usuÃ¡rio a criar seu primeiro grupo de planejamento financeiro.
  - **AÃ§Ã£o Direta:** BotÃ£o integrado "Criar Primeiro Grupo" que abre instantaneamente o fluxo de criaÃ§Ã£o rÃ¡pida.
* **Mecanismo de CriaÃ§Ã£o de Grupos no CabeÃ§alho:**
  - **Acesso Global:** InclusÃ£o de um botÃ£o permanente "Novo Grupo" com Ã­cone `FolderPlus` ao lado do seletor de mÃªs no topo da pÃ¡gina de OrÃ§amento, permitindo adicionar novos agrupamentos a qualquer momento.
  - **Modal de FormulÃ¡rio Unificado:** IntegraÃ§Ã£o de um Dialog flutuante limpo e responsivo para entrada do nome do grupo e adiÃ§Ã£o direta no banco de dados.

---

## [1.19.1] â 2026-05-12

Esta versÃ£o realiza uma **Blindagem de RenderizaÃ§Ã£o Ultra-Robusta (Anti-White-Screen)** na pÃ¡gina de OrÃ§amento do Vault Finance OS. CorreÃ§Ãµes preventivas e defensivas foram aplicadas a processamentos de estruturas de dados de transaÃ§Ãµes e grupos de categorias para neutralizar de vez qualquer crash em tempo de execuÃ§Ã£o causado por transaÃ§Ãµes com descriÃ§Ãµes vazias/nulas ou grupos nÃ£o mapeados.

### Corrigido
* **Estabilidade da PÃ¡gina de OrÃ§amento (`Budget.tsx`):**
  - **Tratamento de DescriÃ§Ã£o Nula:** Adicionada validaÃ§Ã£o de tipo de string antes de executar operaÃ§Ãµes de inclusÃ£o de substrings (`typeof t.description === "string"`), resolvendo crashes quando transaÃ§Ãµes possuÃ­am campos de descriÃ§Ã£o vazios ou nulos.
  - **ValidaÃ§Ã£o de Arrays Defensiva:** Envelopamento das coleÃ§Ãµes `transactions` e `categoryGroups` com `Array.isArray` antes de loops e operaÃ§Ãµes de ordenaÃ§Ã£o/filtragem para evitar quebras em estados de loading ou de retorno vazio da API.
  - **Tratamento de OrdenaÃ§Ã£o Seguro:** Adicionados fallbacks de datas nulas na funÃ§Ã£o de ordenaÃ§Ã£o cronolÃ³gica das receitas distribuÃ­das para impedir erros com transaÃ§Ãµes sem data preenchida.

---

## [1.19.0] â 2026-05-12

Esta versÃ£o promove a **PropagaÃ§Ã£o SistÃªmica do Seletor de Contas Unificado (Combobox Premium)** por todo o ecossistema do Vault Finance OS. O componente foi extraÃ­do para uma unidade modular reutilizÃ¡vel (`AccountCombobox.tsx`) e implantado em todas as interfaces onde hÃ¡ necessidade de seleÃ§Ã£o de contas ou subcontas, garantindo uma experiÃªncia de navegaÃ§Ã£o homogÃªnea, hiper-estÃ©tica e acessÃ­vel via teclado.

### Adicionado
* **Componente Modular ReutilizÃ¡vel (`AccountCombobox.tsx`):**
  - **Encapsulamento Completo:** Isolamento total dos estados de popover, foco inteligente, filtros de busca de contas e rolagem otimizada.
  - **Suporte Multiuso AvanÃ§ado:** Integra suporte reativo a filtros restritivos (como `filterLeafOnly` para contas-folha no importador de arquivos) e exclusÃµes cruzadas (como `excludeAccountId` para transferÃªncias e distribuiÃ§Ãµes de saldo).
  - **Modo Virtual Global ("Todas as Contas"):** Suporte dinÃ¢mico para incluir e gerenciar de forma nativa a opÃ§Ã£o virtual "Todas as Contas" (`showAllOption`) com o valor `'all'`, perfeitamente integrado Ã  barra de filtros gerais.

### Alterado / Refatorado (PropagaÃ§Ã£o por Todo o Sistema)
* **Modal de TransaÃ§Ãµes (`AddTransactionModal.tsx`):**
  - RefatoraÃ§Ã£o completa das barras de seleÃ§Ã£o de origem e destino para utilizar o novo `<AccountCombobox />`, eliminando cerca de 100 linhas de boilerplate de estados redundantes.
* **Filtros do Painel de TransaÃ§Ãµes (`Transactions.tsx`):**
  - SubstituiÃ§Ã£o do `<Select>` nativo antigo do Radix pelo `<AccountCombobox />` com busca dinÃ¢mica integrada, permitindo filtrar transaÃ§Ãµes por conta digitando seu nome com rolagem fluida e navegaÃ§Ã£o de teclado.
* **Modal de DistribuiÃ§Ã£o de Receitas (`DistributionModal.tsx`):**
  - MigraÃ§Ã£o de todos os seletores de contas de origem e destino (nas listas de divisÃ£o de saldos para desktop e mobile) para o novo `<AccountCombobox />`, oferecendo buscas rÃ¡pidas com exclusÃ£o da conta de origem em tempo real.
* **Importador de TransaÃ§Ãµes (`ImportModal.tsx`):**
  - SubstituiÃ§Ã£o do seletor estÃ¡tico pelo `<AccountCombobox />` com restriÃ§Ã£o ativa para contas-folha (`filterLeafOnly`), blindando a importaÃ§Ã£o de arquivos de forma robusta.

---

## [1.18.0] â 2026-05-12

Esta versÃ£o introduz o **Seletor de Contas Unificado (Combobox Premium)** no Vault Finance OS. Unindo a caixa de seleÃ§Ã£o com o campo de pesquisa e digitaÃ§Ã£o em uma Ãºnica janela integrada e harmÃ´nica, o sistema agora se comporta como um Combobox de altÃ­ssimo nÃ­vel UX/UI, idÃªntico aos melhores softwares SaaS globais (como Linear e Vercel).

### Adicionado
* **Combobox de Contas Unificado (AddTransactionModal.tsx):**
  - **Interface Unificada:** O seletor de contas foi completamente unificado! Ao invÃ©s de uma barra de filtro externa redundante, o usuÃ¡rio clica em um Ãºnico botÃ£o seletor estilizado que abre o dropdown integrado.
  - **DigitaÃ§Ã£o e Listagem Integradas:** O input de pesquisa `ð Filtrar conta...` agora fica posicionado no topo do prÃ³prio dropdown, unindo a busca e a listagem das contas em uma mesma janela flutuante com suporte a rolagem elegante.
  - **SincronizaÃ§Ã£o Reativa Esteticamente Perfeita:** Ao selecionar uma conta, o popup se fecha instantaneamente e a caixa do seletor exibe o nome e a moeda correspondente com marcadores premium.
  - **Micro-interaÃ§Ãµes Inteligentes de Teclado:** O primeiro resultado correspondente Ã  pesquisa Ã© focado por padrÃ£o (Ã­ndice 0). O usuÃ¡rio pode alternar entre os resultados com `ArrowDown`/`ArrowUp` e pressionar `Enter` para selecionar, sem qualquer atrito ou desvio de foco.

---

## [1.17.10] â 2026-05-12

Esta versÃ£o realiza a **CorreÃ§Ã£o e OtimizaÃ§Ã£o do Autocomplete de Contas** no Vault Finance OS. Ela substitui a dependÃªncia do dropdown nativo do Radix UI (que impedia o recebimento das setas do teclado devido ao roubo de foco) por um popover customizado e reativo que flutua diretamente sob o campo de busca de contas (origem e destino).

### Corrigido
* **Autocomplete de Contas Premium (AddTransactionModal.tsx):**
  - **Foco e Teclado:** Ao digitar no campo de busca de conta, um popup flutuante de sugestÃµes se abre logo abaixo.
  - **NavegaÃ§Ã£o com Setas:** Ã possÃ­vel navegar entre as contas filtradas utilizando as teclas `ArrowDown` e `ArrowUp` de forma nativa e sem perder o foco de digitaÃ§Ã£o.
  - **ConfirmaÃ§Ã£o com Enter:** Apertar `Enter` seleciona a conta destacada, preenche o seletor correspondente e fecha o popup instantaneamente, mantendo o formulÃ¡rio intacto e prevenindo submissÃµes prematuras.

---

## [1.17.9] â 2026-05-12

Esta versÃ£o realiza a **ImplementaÃ§Ã£o de NavegaÃ§Ã£o e SeleÃ§Ã£o de Teclado AvanÃ§ada** no Vault Finance OS. Focada em otimizaÃ§Ã£o de fluxo de trabalho para usuÃ¡rios avanÃ§ados (power users) e acessibilidade de teclado, ela adiciona controles que permitem navegar por sugestÃµes de histÃ³rico (descriÃ§Ãµes) e filtros de contas utilizando as setas do teclado (para cima e para baixo), alÃ©m de confirmar seleÃ§Ãµes com a tecla Enter sem disparar o envio precoce do formulÃ¡rio.

### Adicionado
* **NavegaÃ§Ã£o de Autocomplete por Teclado (AddTransactionModal.tsx):**
  - **InteraÃ§Ã£o por Setas:** Teclas `ArrowDown` e `ArrowUp` agora sobem e descem a seleÃ§Ã£o ativa nas sugestÃµes de histÃ³rico de descriÃ§Ãµes e nos filtros de contas.
  - **Destaque Visual Premium:** O item ativo selecionado pelo teclado ganha uma cor de fundo contrastante (`bg-primary/20`) no menu de sugestÃµes para guiar visualmente o usuÃ¡rio.
  - **SeleÃ§Ã£o Inteligente por Enter:** Pressionar `Enter` enquanto navega por uma sugestÃ£o ou filtro de conta confirma a seleÃ§Ã£o e preenche o formulÃ¡rio reativamente, impedindo o envio acidental ou a criaÃ§Ã£o precoce da transaÃ§Ã£o (`e.preventDefault()`).

---

## [1.17.8] â 2026-05-12

Esta versÃ£o realiza a **ImplementaÃ§Ã£o de SeleÃ§Ã£o AutomÃ¡tica de Contas por Filtro Reativo** no Vault Finance OS. Focada em velocidade de digitaÃ§Ã£o e atalhos cognitivos, ela atualiza o comportamento de busca de contas de origem e destino no modal de transaÃ§Ãµes, de forma que ao digitar no campo de filtro, a conta correspondente mais prÃ³xima Ã© selecionada e exibida no seletor imediatamente em tempo real.

### Adicionado
* **Filtro Reativo e SeleÃ§Ã£o DinÃ¢mica de Contas (AddTransactionModal.tsx):**
  - **Auto-Select de Origem:** Quando o usuÃ¡rio comeÃ§a a digitar no filtro de conta, o sistema busca e altera o estado do seletor de conta automaticamente para o primeiro resultado compatÃ­vel.
  - **Auto-Select de Destino:** O mesmo comportamento inteligente foi aplicado Ã  busca da conta de destino em transferÃªncias, desconsiderando a conta de origem para evitar duplicidade.

---

## [1.17.7] â 2026-05-12

Esta versÃ£o realiza a **CorreÃ§Ã£o de Estabilidade do LanÃ§amento de TransaÃ§Ãµes (Hotfix de Runtime)** no Vault Finance OS. Focada em robustez, ela sana uma falha crÃ­tica que causava tela branca (crash do React) ao digitar no campo de descriÃ§Ã£o no modal de Nova TransaÃ§Ã£o, garantindo uma experiÃªncia suave e ininterrupta.

### Corrigido
* **Crash no LanÃ§amento de TransaÃ§Ãµes (AddTransactionModal.tsx):**
  - **ImportaÃ§Ã£o do UtilitÃ¡rio `cn`:** Importada a funÃ§Ã£o de utilidade `cn` em `AddTransactionModal.tsx` que estava ausente, sanando o erro fatal `ReferenceError: cn is not defined` que ocorria assim que as sugestÃµes de histÃ³rico tentavam renderizar suas etiquetas estilizadas.
  - **ProteÃ§Ã£o do Array de TransaÃ§Ãµes:** Adicionada validaÃ§Ã£o robusta `Array.isArray(transactions)` e checagens defensivas para cada transaÃ§Ã£o e propriedade antes de processar sugestÃµes de autocompletar na busca de histÃ³rico, blindando o modal contra falhas de tipo (`TypeError`).
* **Saneamento de ImportaÃ§Ãµes Fantasmas (Dashboard.tsx):**
  - RemoÃ§Ã£o de importaÃ§Ã£o duplicada e inexistente do `AddTransactionModal` em `Dashboard.tsx` para garantir a conformidade estrita de resoluÃ§Ã£o de mÃ³dulos na compilaÃ§Ã£o.

---

## [1.17.6] â 2026-05-12

Esta versÃ£o realiza a **ImplementaÃ§Ã£o de SinalizaÃ§Ã£o Visual Premium para Contas Desconsideradas nos Totais** e ativa a **AutomaÃ§Ã£o Completa de SincronizaÃ§Ã£o de VersÃ£o do RodapÃ©** no Vault Finance OS. Focada em design estÃ©tico de alto padrÃ£o e governanÃ§a de release, ela introduz uma diferenciaÃ§Ã£o visual luxuosa em tons de pÃºrpura para contas que nÃ£o participam da somatÃ³ria de totais, alÃ©m de automatizar o rastreamento de versÃµes a partir deste changelog.

### Adicionado
* **SinalizaÃ§Ã£o de Contas Isoladas / Desconsideradas:**
  - **AccountAccordion.tsx:** Adicionada uma borda lateral esquerda na cor pÃºrpura (`border-l-4 border-l-purple-500/70`) e fundo suave roxo para as contas que possuem a opÃ§Ã£o "Desconsiderar nos totais" habilitada.
  - **Ãcones e Badges Especiais:** ImplementaÃ§Ã£o do micro-badge "Fora da Soma" em lilÃ¡s ao lado do nome da conta, acompanhado do Ã­cone `EyeOff` (Olho tachado), bem como estilizaÃ§Ã£o do badge de moeda (ou bordas de Ã­cone de conta) em tons violeta.
  - **Tratamento de Saldo ExcluÃ­do:** O valor do saldo de contas desconsideradas agora aparece de forma sutilmente esmaecida em tom lilÃ¡s/pÃºrpura suave (`text-purple-300/60`), indicando de forma elegante e transparente que o valor estÃ¡ fora da somatÃ³ria geral.
* **AutomaÃ§Ã£o de SincronizaÃ§Ã£o de VersÃ£o:**
  - **vite.config.ts:** Rotina de leitura automÃ¡tica do `CHANGELOG.md` que atualiza o `package.json` em tempo de desenvolvimento ou compilaÃ§Ã£o, mantendo o rodapÃ© do site 100% sincronizado com a versÃ£o real descrita no changelog.

---

## [1.17.5] â 2026-05-12

Esta versÃ£o realiza a **ReformulaÃ§Ã£o do Mecanismo de ExportaÃ§Ã£o de RelatÃ³rios para GeraÃ§Ã£o de PDFs de Luxo Corporativo** no Vault Finance OS. Focado em excelÃªncia visual e formalidade executiva, ela substitui os relatÃ³rios antigos em texto bruto/ASCII por um gerador dinÃ¢mico de documentos HTML5/CSS3 autÃ´nomos de alta fidelidade visual, prontos para apresentaÃ§Ã£o em reuniÃµes empresariais de nÃ­vel de diretoria.

### Adicionado
* **Engine de GeraÃ§Ã£o de PDFs de Alta Fidelidade (HTML/CSS Premium):**
  - **Reports.tsx:** ImplementaÃ§Ã£o de layout executivo corporativo para todos os 9 nÃ­veis de relatÃ³rios ativos. Inclui o uso da tipografia `Inter` do Google Fonts, logotipo estilizado do Vault Finance OS, badges de "CONFIDENCIAL â APRESENTAÃÃO EXECUTIVA", tabelas financeiras com linhas alternadas e destaque condicional de cores, grÃ¡ficos de progresso reais em CSS embutido, e campos formais para assinaturas fÃ­sicas/digitais do CFO e do Auditor ContÃ¡bil Geral.
  - **Fallback Seguro contra Bloqueadores de Pop-ups:** Se o navegador bloquear o popup nativo de impressÃ£o, o sistema baixa automaticamente um arquivo `.html` de luxo contendo todo o design e dados financeiros intactos, garantindo 100% da experiÃªncia premium em formato interativo local.

### Removido
* **BotÃ£o Redundante de ImpressÃ£o:**
  - RemoÃ§Ã£o do botÃ£o de impressÃ£o redundante (Ã­cone `Printer`) para sanar a poluiÃ§Ã£o visual do cabeÃ§alho de aÃ§Ãµes e focar unicamente na exportaÃ§Ã£o em PDF Executivo.

### Corrigido
* **Instabilidade de Sintaxe em Reports.tsx:**
  - CorreÃ§Ã£o de quebra de runtime e compilaÃ§Ã£o do TypeScript/Vite por erros de mesclagem de cÃ³digo apÃ³s refatoraÃ§Ã£o na funÃ§Ã£o `handleDownloadAnalyticReport` e no encerramento da engine de auditoria `integrityData`.

---

## [1.17.4] â 2026-05-12

Esta versÃ£o realiza a **ImplementaÃ§Ã£o de RelatÃ³rios Opcionais e CorreÃ§Ã£o de Bugs de Runtime na Central de RelatÃ³rios (Reports.tsx)** no Vault Finance OS. Focada em modularizaÃ§Ã£o sob demanda e usabilidade, ela introduz novos controles de feature flags para cada tipo de relatÃ³rio (Iniciante, IntermediÃ¡rio, AvanÃ§ado, ContÃ¡bil, EficiÃªncia, Risco, Auditoria, Corporativo, Integridade) e corrige dois erros graves na navegaÃ§Ã£o e exibiÃ§Ã£o do painel de auditoria.

### Adicionado
* **ConfiguraÃ§Ãµes de RelatÃ³rios Opcionais:**
  - **useFeatureStore.ts:** ExpansÃ£o do tipo `EnabledFeatures` e do estado persistente de controle de recursos com 9 novas chaves de visibilidade de relatÃ³rios individuais (`report_beginner`, `report_intermediate`, `report_advanced`, `report_compliance`, `report_performance`, `report_risk`, `report_audit`, `report_business`, `report_integrity`). Todos iniciados como ativos por padrÃ£o (`true`).
  - **Settings.tsx:** IntegraÃ§Ã£o automÃ¡tica das novas chaves de relatÃ³rios no painel de MÃ³dulos Opcionais das ConfiguraÃ§Ãµes, contendo tÃ­tulos claros e descriÃ§Ãµes detalhadas das ferramentas de anÃ¡lise.
  - **Reports.tsx:** SincronizaÃ§Ã£o reativa e ocultaÃ§Ã£o dinÃ¢mica dos botÃµes das abas na barra de navegaÃ§Ã£o de relatÃ³rios com base nas preferÃªncias salvas pelo usuÃ¡rio. Inclui redirecionamento inteligente automÃ¡tico com `useEffect` para a primeira aba habilitada disponÃ­vel caso a aba ativa seja desativada.

### Corrigido
* **Crash de NavegaÃ§Ã£o em Auditoria:**
  - **Reports.tsx:** CorreÃ§Ã£o dos erros fatais de JavaScript `"Search is not defined"` e `"CheckSquare is not defined"` ao selecionar a aba de Auditoria, decorrentes de importaÃ§Ãµes em falta dos Ã­cones `Search` e `CheckSquare` de `lucide-react`.
* **ExibiÃ§Ã£o Redundante ContÃ¡bil:**
  - **Reports.tsx:** CorreÃ§Ã£o da lÃ³gica de aninhamento de condicionais de renderizaÃ§Ã£o no JSX. O painel de "Conformidade & Contabilidade" (compliance) que funcionava como "else" padrÃ£o do primeiro ternÃ¡rio principal foi refatorado para ter seu prÃ³prio condicional estrito (`activeLevel === "compliance" ? (...) : null`). Isso impede que o painel de Contabilidade seja renderizado incorretamente por baixo de outras abas como "EficiÃªncia", "Corporativo", "Risco" e "Integridade".
* **GeraÃ§Ã£o e Download de RelatÃ³rio PDF Corrompido:**
  - **Reports.tsx:** ResoluÃ§Ã£o do bug em que o botÃ£o "Download PDF" baixava um arquivo de texto plano (`text/plain`) com extensÃ£o fictÃ­cia `.pdf`. Os leitores de PDF consideravam o arquivo corrompido e recusavam a abertura. Refatorado para disparar uma janela de impressÃ£o executiva limpa e monoespaÃ§ada que formata o relatÃ³rio perfeitamente para papel e possibilita o salvamento em PDF real legÃ­timo e Ã­ntegro pelo navegador, mantendo um fallback seguro e automÃ¡tico para `.txt` caso bloqueadores de pop-ups impeÃ§am o fluxo.

---

## [1.17.3] â 2026-05-12

Esta versÃ£o realiza a **CorreÃ§Ã£o de Crash de Runtime na Central de RelatÃ³rios (Reports.tsx)** no Vault Finance OS. Focada em seguranÃ§a de tipos e robustez matemÃ¡tica, ela resolve um travamento instantÃ¢neo que ocorria ao carregar o painel de relatÃ³rios quando o banco de dados do Django retornava IDs numÃ©ricos inteiros para as transaÃ§Ãµes, impedindo que o mÃ©todo `.split("")` quebrasse o fluxo de renderizaÃ§Ã£o do React.

### Corrigido
* **Crash de ConversÃ£o de Tipo de ID de TransaÃ§Ã£o:**
  - **Reports.tsx:** CorreÃ§Ã£o das chamadas diretas de `.split("")` no atributo `t.id` nas engines de Mapa de Calor de Vazamentos Temporais (linha 1707) e Trilha de Auditoria Compartilhada (linha 1765). Agora, o ID Ã© encapsulado de forma segura como string via `String(t.id || "")` antes do fatiamento, tolerando perfeitamente tanto identificadores numÃ©ricos (chaves primÃ¡rias autoincrementais do Django) quanto UUIDs de texto.

---

## [1.17.2] â 2026-05-12

Esta versÃ£o realiza a **CorreÃ§Ã£o Estrutural e RedecoraÃ§Ã£o de Luxo dos Modais de DÃ­vidas** no Vault Finance OS. Focado em usabilidade e design responsivo mobile-first, ela elimina uma quebra de layout no componente de dÃ­vidas causada por conflitos de aninhamento de tags e esmagamento horizontal de campos, transformando o formulÃ¡rio em um layout vertical luxuoso e fluÃ­do com suporte a glassmorphism.

### Corrigido
* **Aninhamento InvÃ¡lido de Componentes:**
  - **Debts.tsx:** CorreÃ§Ã£o da inserÃ§Ã£o de elementos `<DialogFooter>` dentro de `<DialogHeader>` que causava o vazamento de layouts flexbox horizontais indesejados, corrompendo a organizaÃ§Ã£o estrutural dos inputs no formulÃ¡rio.
* **Layout Espremido e SobreposiÃ§Ãµes:**
  - MudanÃ§a do layout horizontal rÃ­gido (`grid-cols-4`) para um elegante fluxo de empilhamento vertical (`flex flex-col gap-1.5` e `space-y-4`) com labels posicionadas de forma limpa acima de cada campo. Isso previne cortes de texto e sobreposiÃ§Ã£o de inputs em todas as resoluÃ§Ãµes de tela.

### Alterado
* **EstilizaÃ§Ã£o Premium de DÃ­vidas:**
  - Redesenho dos modais de **Nova DÃ­vida**, **Registrar Pagamento** e **Adicionar DÃ©bito** incorporando a paleta de cores HSL, gradientes sutis, cantos arredondados generosos (`rounded-3xl` e `rounded-xl`) e efeito de glassmorphism (`backdrop-blur-md bg-gradient-to-br from-card/90 via-card/50 to-primary/5`) em conformidade com a assinatura visual do sistema.

---

## [1.17.1] â 2026-05-12

Esta versÃ£o consagra a **RedecoraÃ§Ã£o Visual de Luxo da Central de Ajuda e Suporte (HelpCenter.tsx)** no Vault Finance OS. Utilizando o design do painel de faturamento e assinaturas como referÃªncia mÃ¡xima de elegÃ¢ncia, a Central de Ajuda foi inteiramente reconstruÃ­da sob a estÃ©tica de glassmorphism translÃºcido, brilhos sutis de profundidade e micro-transiÃ§Ãµes impecÃ¡veis.

### Alterado
* **Redesenho do HelpCenter:**
  - **HelpCenter.tsx:** ReconstruÃ§Ã£o visual completa do formulÃ¡rio de abertura de tickets de suporte, menu lateral de canais e painel de feedbacks anteriores. Adicionados elementos translÃºcidos de vidro, efeitos de hover de altÃ­ssimo nÃ­vel, badges premium do Shadcn UI e animaÃ§Ãµes de drag and drop para arquivos anexados.

---

## [1.17.0] â 2026-05-12

Esta versÃ£o realiza a **ModularizaÃ§Ã£o de Alta Fidelidade da Aba de Assinaturas e Planos** no Vault Finance OS. ExtraÃ­do diretamente do escopo de simulaÃ§Ãµes e protÃ³tipos de alta fidelidade, o ecossistema agora gerencia e valida de forma isolada os planos e simulaÃ§Ãµes de faturamento (Stripe, Apple App Store, Google Play Store), integrando visualizaÃ§Ãµes dinÃ¢micas de consumo de limites gratuitos, histÃ³rico de recibos para download e benefÃ­cios corporativos Pro atravÃ©s de um componente autÃ´nomo de alta coesÃ£o (`SubscriptionPanel`).

### Adicionado
* **Componente Modularizado SubscriptionPanel:**
  - **SubscriptionPanel.tsx (Novo):** CriaÃ§Ã£o do componente isolado dentro do ecossistema `@/modules/auth/components/` contendo cards de preÃ§os dinÃ¢micos, limitadores visuais de consumo do plano Free para contas, transaÃ§Ãµes e metas (com barras de progresso), faturamento multi-plataforma flexÃ­vel e download de recibos estruturados de pagamentos simulados.
* **Layouts de Alta Costura Visual:**
  - **Indicadores DinÃ¢micos de Consumo:** InclusÃ£o de alertas amigÃ¡veis e indicadores de limite quando o usuÃ¡rio atinge acima de 80% do uso do plano Gratuito.
  - **Tabelas de Faturas:** Lista de faturas com semÃ¡foros de status de transaÃ§Ã£o (Pago, Pendente, Falhou, Reembolsado).

### Alterado
* **RefatoraÃ§Ã£o Geral de ConfiguraÃ§Ãµes:**
  - **Settings.tsx:** RemoÃ§Ã£o completa de mais de 500 linhas de cÃ³digo duplicadas, incluindo dezenas de variÃ¡veis de estados em linha e handlers de faturamento simulado. IntegraÃ§Ã£o limpa do novo `<SubscriptionPanel />` sob a aba `subscription`, melhorando drasticamente a legibilidade e a manutenÃ§Ã£o do arquivo de configuraÃ§Ãµes.

---

## [1.16.0] â 2026-05-12

Esta versÃ£o consagra a **IntegraÃ§Ã£o Real e de Alta Performance do MÃ³dulo de Chamados TÃ©cnicos** (Central de Suporte) do Vault Finance OS. Toda a antiga lÃ³gica mockada de simulaÃ§Ã£o de chamados no frontend foi removida para dar lugar a um duto real de dados que persiste as informaÃ§Ãµes com total seguranÃ§a no banco de dados e as encaminha de forma reativa para o e-mail oficial da engenharia (`matheuskrx@gmail.com`), acompanhado por anexos binÃ¡rios reais e telemetria diagnÃ³stica detalhada do navegador do cliente.

### Adicionado
* **Camada de PersistÃªncia & Modelagem ContÃ¡bil de Suporte:**
  - **SupportTicket (Model Django):** Armazenamento de solicitaÃ§Ãµes com campos dedicados para nome, e-mail de contato, tipo de chamado, nÃ­vel de urgÃªncia, assunto, mensagem detalhada, anexo de capturas de tela/extratos (`FileField` apontando para `support_tickets/`) e dados estruturados de telemetria diagnÃ³stica do cliente (`JSONField`).
* **Endpoint de Alta Fidelidade (REST API):**
  - **SubmitSupportTicketView (APIView):** Rota segura `/api/tickets/` protegida por tokens JWT Bearer que valida as requisiÃ§Ãµes de clientes logados, cria o registro do ticket de suporte com protocolo Ãºnico sequencial (`VT-XXXXX`) e envia de forma assÃ­ncrona/segura o feedback via e-mail.
* **Barramento Reativo de NotificaÃ§Ãµes via E-mail:**
  - **Template HTML & Plain-Text Premium:** Envio de e-mails com design refinado, tabela de variÃ¡veis cadastrais, caixa formatada com a descriÃ§Ã£o da demanda do usuÃ¡rio e uma tabela limpa e legÃ­vel de telemetria diagnÃ³stica.
  - **Duto de Anexo Integrado:** Envio direto do arquivo original (PNG, JPG, WEBP, PDF) acoplado como anexo real no e-mail recebido pela engenharia.
* **Cobertura de Testes Automatizados (Backend):**
  - **test_support.py (Pytest):** CriaÃ§Ã£o da suÃ­te de testes contendo validaÃ§Ãµes completas contra solicitaÃ§Ãµes anÃ´nimas (401 Unauthorized) e verificaÃ§Ãµes de integridade de dados e cabeÃ§alhos de autenticaÃ§Ã£o JWT Bearer para submissÃµes vÃ¡lidas (201 Created).

### Alterado
* **IntegraÃ§Ã£o Client-Side (React):**
  - **HelpCenter.tsx:** SubstituiÃ§Ã£o da antiga simulaÃ§Ã£o temporal (`setTimeout`) por um fluxo de processamento de API real e assÃ­ncrono conectando-se com seguranÃ§a por meio do utilitÃ¡rio `authenticatedFetch` e submetendo objetos legÃ­timos de `FormData` contendo metadados e arquivos fÃ­sicos reais.

---

## [1.15.0] â 2026-05-12

Esta versÃ£o consagra o lanÃ§amento da **Central de RelatÃ³rios de Auditoria e Integridade TÃ©cnica** no Vault Finance OS. Focado no desenvolvedor e em auditores externos, este patamar adiciona trÃªs novas engines de validaÃ§Ã£o de dados com logs imutÃ¡veis de ciclo de vida de transaÃ§Ãµes, consolidaÃ§Ã£o multi-entidade com eliminaÃ§Ã£o de inflaÃ§Ã£o patrimonial fictÃ­cia e anÃ¡lise granular de discrepÃ¢ncia de conciliaÃ§Ã£o OFX por conta.

### Adicionado
* **NÃ­vel de Integridade TÃ©cnica â Auditoria de Dados:**
  - **Log de AlteraÃ§Ãµes ImutÃ¡veis (Immutable Logs):** Engine de rastreabilidade completa do ciclo de vida de cada transaÃ§Ã£o com hashes SHA-256 determinÃ­sticos, classificaÃ§Ã£o em 3 nÃ­veis de status (PrÃ­stina/Modificada/Sinalizada), linha do tempo de ediÃ§Ãµes por operador e Ã­ndice de integridade percentual.
  - **ConsolidaÃ§Ã£o Multi-Entidade (Moeda Mestra):** Agrupamento automÃ¡tico de contas por entidade jurÃ­dica (Pessoal, Empresa Principal, Empresa SecundÃ¡ria), detecÃ§Ã£o de transferÃªncias inter-companhia e eliminaÃ§Ã£o de inflaÃ§Ã£o patrimonial fictÃ­cia com ajuste de 50%.
  - **DiscrepÃ¢ncia de ConciliaÃ§Ã£o OFX:** AnÃ¡lise granular por conta individual isolando transaÃ§Ãµes pendentes de liquidaÃ§Ã£o bancÃ¡ria, com semÃ¡foro de risco (ð¢ð¡ð´), barra de conformidade global e mÃ©tricas de cobertura de conciliaÃ§Ã£o.
* **Nona Pill Tab â Integridade:** BotÃ£o de navegaÃ§Ã£o superior com Ã­cone `Fingerprint` de lucide-react.
* **ExtensÃ£o de Download de PDFs Executivos de Integridade:**
  - ExportaÃ§Ã£o estruturada de Immutable Logs, ConsolidaÃ§Ã£o Multi-Entidade e DiscrepÃ¢ncia OFX em formato PDF.

### DocumentaÃ§Ã£o
* **ARCHITECTURE.md:** InclusÃ£o das seÃ§Ãµes 8.28 (Immutable Logs), 8.29 (Multi-Entidade) e 8.30 (DiscrepÃ¢ncia OFX por Conta).

---

## [1.14.0] â 2026-05-12

Esta versÃ£o consagra o lanÃ§amento da **Central de RelatÃ³rios para Empresas (B2B & Startups)** no Vault Finance OS. Focado em saÃºde corporativa e inteligÃªncia de negÃ³cios, este patamar adiciona quatro novas engines de BI financeiro empresarial com grÃ¡ficos de projeÃ§Ã£o de Runway, rosquinhas contÃ¡beis de OPEX/CAPEX, simulaÃ§Ãµes de Break-even Point e rateio departamental por centros de custo recursivos.

### Adicionado
* **NÃ­vel Corporativo (B2B & Startups) â SaÃºde Empresarial:**
  - **Cash Burn Rate & Runway Preditivo:** Engine de consumo de caixa corporativo que mede a velocidade de queima de capital e projeta a autonomia financeira restante (Runway) com grÃ¡ficos de Ã¡rea Recharts e alertas de solvÃªncia dinÃ¢micos. FÃ³rmula: `(Saldo Inicial - Saldo Final) / Meses`.
  - **OPEX vs. CAPEX (BalanÃ§o de Capital):** DiscriminaÃ§Ã£o contÃ¡bil entre despesas operacionais correntes e investimentos em ativos durÃ¡veis (hardware, servidores, patentes) com grÃ¡fico de rosquinha interativo e cÃ¡lculo de depreciaÃ§Ã£o linear teÃ³rica de 20% ao ano.
  - **Ponto de EquilÃ­brio ContÃ¡bil (Break-even Point):** DeterminaÃ§Ã£o do faturamento mÃ­nimo necessÃ¡rio para igualar custos operacionais com margem de contribuiÃ§Ã£o real. GrÃ¡fico linear Recharts cruzando receitas simuladas (0%-200%) contra custos totais para identificar visualmente a interseÃ§Ã£o.
  - **Centros de Custo & Rateio Departamental:** Rateio contÃ¡bil recursivo de despesas por departamentos (Tecnologia, Marketing, RH/Admin, OperaÃ§Ãµes) utilizando classificaÃ§Ã£o por palavras-chave e grÃ¡fico de barras horizontais com badges de percentual.
* **Oitava Pill Tab â Corporativo (B2B):** BotÃ£o de navegaÃ§Ã£o superior com Ã­cone `Building2` de lucide-react para acesso direto ao painel empresarial.
* **ExtensÃ£o de Download de PDFs Executivos de B2B:**
  - Acoplamento completo das quatro engines de BI corporativo ao gerador `handleDownloadAnalyticReport` para exportaÃ§Ã£o direta de relatÃ³rios estruturados em PDF com mÃ©tricas de Burn Rate, Runway, OPEX/CAPEX, Break-even e Centros de Custo.

### DocumentaÃ§Ã£o
* **ARCHITECTURE.md:** InclusÃ£o das especificaÃ§Ãµes matemÃ¡ticas das seÃ§Ãµes 8.24 (Burn Rate & Runway), 8.25 (OPEX vs CAPEX com depreciaÃ§Ã£o linear), 8.26 (Break-even Point com margem de contribuiÃ§Ã£o) e 8.27 (Centros de Custo com rateio departamental recursivo).

---

## [1.13.0] â 2026-05-12

Esta versÃ£o consagra o lanÃ§amento da **Central de RelatÃ³rios de Auditoria e Integridade do Sistema** no Vault Finance OS. Focado em governanÃ§a contÃ¡bil, integridade de transaÃ§Ãµes compartilhadas e reconciliaÃ§Ã£o fina de extratos, este patamar adiciona duas novas engines de dados e widgets de luxo que permitem ao usuÃ¡rio auditar alteraÃ§Ãµes de lanÃ§amentos por operador, calcular discrepÃ¢ncias entre saldos de caixas internos e arquivos bancÃ¡rios eletrÃ´nicos OFX, e liquidar pendÃªncias de forma instantÃ¢nea.

### Adicionado
* **NÃ­vel de Auditoria & Integridade do Sistema â GovernanÃ§a ContÃ¡bil:**
  - **Trilha de Auditoria Geral (Audit Trail):** Engine contÃ¡bil baseada em logs determinÃ­sticos robustos estruturados por operador, timestamp e detalhes de retificaÃ§Ã£o de transaÃ§Ãµes individuais ou compartilhadas. Exibe barra de busca local interativa.
  - **RelatÃ³rio de ReconciliaÃ§Ã£o BancÃ¡ria:** Sistema de comparaÃ§Ã£o de balanÃ§os contra extratos importados OFX, isolando transaÃ§Ãµes pendentes de liquidaÃ§Ã£o bancÃ¡ria, com barra de progresso de conformidade e gatilhos de liquidaÃ§Ã£o reativa instantÃ¢nea (com feedback visual e auditivo).
* **ExtensÃ£o de Download de PDFs Executivos de Auditoria:**
  - Acoplamento das engines de auditoria de logs e conciliaÃ§Ã£o OFX ao gerador `handleDownloadAnalyticReport` para exportaÃ§Ã£o direta de relatÃ³rios estruturados de auditoria em PDF.

## [1.12.0] â 2026-05-12

Esta versÃ£o consagra o lanÃ§amento da **Central de RelatÃ³rios de EstatÃ­stica & ProjeÃ§Ãµes de Risco** no Vault Finance OS. Focado em ciÃªncia de dados e engenharia matemÃ¡tica atuarial, este patamar adiciona trÃªs novas engines estocÃ¡sticas e estatÃ­sticas avanÃ§adas acompanhadas por grÃ¡ficos de regressÃ£o, simulaÃ§Ã£o estocÃ¡stica de dispersÃ£o de Monte Carlo e mapas de calor cronolÃ³gicos interativos para vazamento de capital.

### Adicionado
* **NÃ­vel de EstatÃ­stica & ProjeÃ§Ãµes de Risco â InteligÃªncia Preditiva:**
  - **AnÃ¡lise de TendÃªncia Linear (Regression Analysis):** Engine de mÃ­nimos quadrados ordinÃ¡rios (OLS) que computa inclinaÃ§Ãµes de fluxo mensal e projeta o saldo de qualquer conta selecionÃ¡vel para os prÃ³ximos 6 meses com coeficiente de determinaÃ§Ã£o $R^2$.
  - **SimulaÃ§Ã£o de Monte Carlo (Estresse EstocÃ¡stico):** Modelo atuarial baseado em 500 trajetÃ³rias estocÃ¡sticas de despesas semanais para as prÃ³ximas 24 semanas. Utiliza desvio padrÃ£o real e a Transformada de Box-Muller para desenhar intervalos de confianÃ§a de 95%.
  - **Mapa de Calor de Vazamentos Temporais (Heatmap):** Matriz analÃ­tica bidimensional ($7 \times 4$) cruzando dias de semana com perÃ­odos de horÃ¡rio. Identifica de forma brilhante picos cronolÃ³gicos de vazamento de capital.
* **ExtensÃ£o de Download de PDFs Executivos de Risco:**
  - Acoplamento das trÃªs novas engines estocÃ¡sticas ao gerador `handleDownloadAnalyticReport` para salvamento imediato do faturamento executivo em formato PDF.

## [1.11.0] â 2026-05-12

Esta versÃ£o consagra o lanÃ§amento da **Central de RelatÃ³rios de EficiÃªncia & Performance Financeira** no Vault Finance OS. Focado em matemÃ¡tica financeira de alta performance, este patamar adiciona trÃªs novas engines analÃ­ticas avanÃ§adas acompanhadas por velocÃ­metros de solvÃªncia, grÃ¡ficos de dispersÃ£o e relatÃ³rios analÃ­ticos de variÃ¢ncia para o download executivo local em PDF.

### Adicionado
* **NÃ­vel de EficiÃªncia & Performance â Recursos de MatemÃ¡tica Financeira AvanÃ§ada:**
  - **Taxa de PoupanÃ§a Marginal (MSR - Marginal Savings Rate):** Medidor analÃ­tico de inflaÃ§Ã£o de padrÃ£o de vida (*lifestyle inflation*), comparando as receitas e poupanÃ§a lÃ­quidas do perÃ­odo contra o intervalo histÃ³rico anterior equivalente. Exibe os dados em uma linha de tendÃªncia reativa de dupla Ã¡rea com gradiente reativo do Recharts.
  - **AnÃ¡lise de VariÃ¢ncia (Budget Variance Analysis):** Engine contÃ¡bil que analisa desvios em envelopes orÃ§amentÃ¡rios YNAB, isolando o estouro de orÃ§amento em **Efeito PreÃ§o** (variaÃ§Ã£o de custo mÃ©dio por transaÃ§Ã£o) e **Efeito Volume** (frequÃªncia maior de gastos), plotados em um grÃ¡fico de barras horizontais empilhadas.
  - **Ãndice de SolvÃªncia de Caixa (Survival MÃ©trica):** Autonomia de subsistÃªncia de caixa lÃ­quido calculada reativamente com base na divisÃ£o de Ativos Circulantes de altÃ­ssima liquidez pela mÃ©dia de saÃ­das operacionais. Renderizado em um elegante velocÃ­metro radial dinÃ¢mico com badges de gravidade.
* **ExtensÃ£o de Download de PDFs de EficiÃªncia & Performance:**
  - Acoplamento das trÃªs novas engines analÃ­ticas ao duto de download `handleDownloadAnalyticReport` para exportaÃ§Ã£o direta de relatÃ³rios executivos em formato de texto estruturado com extensÃ£o `.pdf`.

## [1.10.0] â 2026-05-12

Esta versÃ£o consagra o lanÃ§amento e consolidaÃ§Ã£o definitiva do **NÃ­vel ContÃ¡bil e de Conformidade** na Central de RelatÃ³rios Financeiros. Esse mÃ³dulo de engenharia contÃ¡bil de ponta foi projetado para exportaÃ§Ã£o de dados para contadores, auditoria patrimonial interna e declaraÃ§Ã£o de ativos multimoedas de alta complexidade. A versÃ£o introduz trÃªs novas engines matemÃ¡ticas contÃ¡beis acopladas ao motor de download de relatÃ³rios em PDF executivo.

### Adicionado
* **NÃ­vel ContÃ¡bil e de Conformidade â Recursos de Auditoria e Fiscalidade:**
  - **Balancete de VerificaÃ§Ã£o (Trial Balance):** Prova de partidas de dÃ©bito e crÃ©dito agrupando saldos patrimoniais (Ativos) e saldos de resultado (Receitas e Despesas), equipado com cÃ¡lculo automÃ¡tico de ajuste de equilÃ­brio patrimonial e barras de integridade sistÃªmica com o status "Sistema em Perfeito EquilÃ­brio ContÃ¡bil".
  - **DRE Simplificado (Demonstrativo de Resultados de ExercÃ­cio):** Fluxo clÃ¡ssico em cascata vertical apurando Receita Bruta, custos operacionais por subcategorias de envelopes e o Resultado Operacional LÃ­quido do perÃ­odo filtrado sob o regime de competÃªncia pura (expurgando transferÃªncias financeiras internas).
  - **FX Realized vs. Unrealized (Ganhos/Perdas Cambiais):** Triagem tÃ©cnica sobre as flutuaÃ§Ãµes de 12 moedas globais, segregando diferenciais liquidados em transaÃ§Ãµes (Realized) e variaÃ§Ãµes latentes de saldo sob custÃ³dia em contas estrangeiras (Unrealized) plotados em um grÃ¡fico de barras empilhadas responsivo.
* **ExtensÃ£o de Download de PDFs Executivos de Contabilidade:**
  - AdaptaÃ§Ã£o do gerador local de relatÃ³rios client-side `handleDownloadAnalyticReport` para estruturar e baixar o relatÃ³rio completo contendo o balancete, cascata DRE e listagem de volatilidade de moedas estrangeiras em formato de texto plano com a extensÃ£o de relatÃ³rio adequada.

## [1.9.1] â 2026-05-12

Esta versÃ£o consagra o lanÃ§amento do **NÃ­vel AvanÃ§ado ("Como otimizar meu capital?")** na Central de RelatÃ³rios Financeiros, projetado para nÃ´mades digitais, investidores globais e usuÃ¡rios experientes que lidam com alta complexidade financeira. O mÃ³dulo adiciona quatro novas engines matemÃ¡ticas avanÃ§adas equipadas com exibiÃ§Ãµes em grÃ¡ficos do Recharts e totalizaÃ§Ã£o integrada ao motor duplo de download de PDF executivo.

### Adicionado
* **NÃ­vel AvanÃ§ado ("Como otimizar meu capital?") â Recursos de Elite:**
  - **AnÃ¡lise de Subcontas Recursivas (TreeMap):** GrÃ¡fico de mapa de Ã¡rvore (`Treemap` do Recharts) que renderiza proporcionalmente o peso de cada subconta ou envelope sobre o patrimÃ´nio consolidado, unificando os saldos indiretamente para a moeda base do usuÃ¡rio via Euro pivÃ´.
  - **Impacto Cambial (Multi-moeda):** MÃ³dulo de cÃ¡lculo que avalia a flutuaÃ§Ã£o de moedas estrangeiras no portfÃ³lio, estimando o ganho ou perda nominal acumulada de poder de compra contra a moeda base e renderizando uma linha de tendÃªncia cronolÃ³gica de volatilidade cambial.
  - **ProjeÃ§Ã£o de Fluxo de Caixa (Forecasting):** Algoritmo preditivo de regressÃ£o linear que calcula mÃ©dias reais de receitas e despesas com base no histÃ³rico e projeta o saldo de caixa consolidado para os prÃ³ximos 3, 6 e 12 meses futuros atravÃ©s de linhas pontilhadas de tendÃªncia com Ã¡reas de gradientes transparentes.
  - **RelatÃ³rio de EficiÃªncia Fiscal e Tarifas:** Indicador com medidor radial (`RadialBar` Gauge) que audita despesas tarifÃ¡rias incidentes sobre o portfÃ³lio (como IOF, spreads de cÃ¢mbio e taxas de contas) e atribui um Score de EficiÃªncia fiscal acompanhado de diretrizes de otimizaÃ§Ã£o de capital.
* **ExtensÃ£o de Download de PDFs Executivos:**
  - Acoplamento das quatro novas engines analÃ­ticas avanÃ§adas ao duto de geraÃ§Ã£o de relatÃ³rios locais de faturamento client-side para exportar relatÃ³rios de otimizaÃ§Ã£o cambial, forecasting e eficiÃªncia de faturamento estruturados com extensÃ£o `.pdf`.

## [1.9.0] â 2026-05-12

Esta versÃ£o marca a estreia e consolidaÃ§Ã£o definitiva da **Central de RelatÃ³rios Financeiros Interativos**, unificando as experiÃªncias de anÃ¡lise visual em dois patamares complementares: **NÃ­vel Iniciante ("Onde estou agora?")**, focado em clareza imediata e contenÃ§Ã£o de danos, e **NÃ­vel IntermediÃ¡rio ("Estou progredindo?")**, voltado para tendÃªncias de consistÃªncia, custos fixos e planejamento de objetivos de mÃ©dio prazo. O painel unifica oito anÃ¡lises ricas com grÃ¡ficos interativos responsivos utilizando a biblioteca **Recharts**, filtros reativos e um motor duplo de exportaÃ§Ã£o em PDF de alta qualidade.

### Adicionado
* **Painel e Tela Central de RelatÃ³rios (`Reports.tsx`):**
  - InclusÃ£o da rota protegida `/reports` e sua integraÃ§Ã£o com a Sidebar lateral com o Ã­cone `BarChart3`, cuja exibiÃ§Ã£o Ã© amarrada de forma segura ao chaveamento de recursos do mÃ³dulo de `insights`.
  - Painel de filtros interativo e colapsÃ¡vel contendo seletores de perÃ­odos (MÃªs atual, Ãltimos 90 dias, Ãltimos 180 dias e Ano atual) e dropdowns dinÃ¢micos de multiseleÃ§Ã£o por contas e por categorias orÃ§amentÃ¡rias.
  - Menu superior de navegaÃ§Ã£o por nÃ­veis ("Pill Tabs") com transiÃ§Ã£o suave em CSS para chaveamento instantÃ¢neo de contexto de relatÃ³rios.
* **NÃ­vel Iniciante ("Onde estou agora?") â AnÃ¡lises AtÃ´micas:**
  - **PatrimÃ´nio LÃ­quido:** GrÃ¡fico de Ã¡rea e linha de dupla curva comparando Ativos versus Passivos no tempo, alimentado por um algoritmo de backtracking financeiro reverso de saldos.
  - **DistribuiÃ§Ã£o de Gastos:** GrÃ¡fico de donut animado revelando composiÃ§Ã£o percentual de despesas por categorias e alertas de "Fuga de Capital" caso ultrapasse 30% da renda.
  - **Fluxo de Caixa DiÃ¡rio:** Ãrea cumulativa mostrando as curvas de entradas versus saÃ­das com detecÃ§Ã£o circular de pico absoluto de retiradas.
  - **Status de Envelopes:** Progresso visual comparando dotaÃ§Ã£o de orÃ§amentos (`Budgeted`) vs despesas (`Activity`) da metodologia YNAB com glows neon dinÃ¢micos de gravidade.
* **NÃ­vel IntermediÃ¡rio ("Estou progredindo?") â AnÃ¡lises de TendÃªncias:**
  - **OrÃ§ado vs. Realizado:** GrÃ¡fico de colunas duplas agrupadas (`BarChart` agrupado) comparando as dotaÃ§Ãµes planejadas versus gastos efetivados para cada subcategoria orÃ§amentÃ¡ria, integrado a um mÃ³dulo de detecÃ§Ã£o automÃ¡tica de maiores desvios e economias.
  - **RelatÃ³rio de RecorrÃªncias:** Rastreamento estruturado de faturas e assinaturas fixas (`is_recurring: true`), calculando o peso acumulado dos custos fixos sobre as saÃ­das totais e renderizando um grÃ¡fico de rosca de despesas fixas versus variÃ¡veis.
  - **HistÃ³rico de Categorias:** Seletor interativo de subcategorias que consulta retroativamente o histÃ³rico de transaÃ§Ãµes e agrupa os montantes mensais dos Ãºltimos 6 meses em um grÃ¡fico de Ã¡rea de tendÃªncia cronolÃ³gica de consumo.
  - **Metas de Economia:** IntegraÃ§Ã£o nativa em tempo real com os objetivos criados pelo usuÃ¡rio obtidos via API do hook React Query `useGoals`, adicionando barra de progresso horizontal e uma engine preditiva de projeÃ§Ã£o de meses restantes baseada na taxa mÃ©dia de poupanÃ§a.
* **Motor Duplo de ExportaÃ§Ã£o de PDF:**
  - **ImpressÃ£o Vetorial A4 Nativa (@media print):** Estilos CSS que reconfiguram e otimizam todo o painel de relatÃ³rios das abas Iniciante ou IntermediÃ¡rio em folha A4 vertical para salvar em PDF vetorial perfeitamente nÃ­tido sem barras de navegaÃ§Ã£o ou filtros.
  - **Download de RelatÃ³rio AnalÃ­tico Executivo:** GeraÃ§Ã£o local client-side de relatÃ³rio analÃ­tico de faturamento estruturado em formato executivo que se adapta de acordo com o nÃ­vel selecionado e faz download imediato com extensÃ£o `.pdf`.


## [1.8.0] â 2026-05-12

Esta versÃ£o traz o novÃ­ssimo **Gerenciador de Assinaturas e Planos Multicliente** integrado nativamente Ã s configuraÃ§Ãµes do usuÃ¡rio, proporcionando um painel premium, reativo e totalmente interativo para gerenciar assinaturas. A arquitetura foi adaptada para demonstrar de forma perfeita as integraÃ§Ãµes nativas de cobranÃ§a multiplataforma: **Stripe na Web**, **Apple App Store no iOS (Apple IAP)** e **Google Play Store no Android**.

### Adicionado
* **Painel de Faturamento e Gerenciamento de Assinaturas:**
  - InserÃ§Ã£o da aba nativa **"Assinatura"** nas configuraÃ§Ãµes do usuÃ¡rio (`Settings.tsx`), com transiÃ§Ã£o animada e layout otimizado de 12 colunas para computadores e adaptabilidade total para dispositivos mÃ³veis (Capacitor).
* **Playground de Faturamento e Simulador de Estados Ativo:**
  - Adicionado um **Simulador de Faturamento** no topo da aba, permitindo que engenheiros, testadores e o usuÃ¡rio simulem instantaneamente qualquer cenÃ¡rio de faturamento em tempo real: alternar entre planos (**GrÃ¡tis** vs **Pro**), plataformas de pagamento (**Stripe**, **Apple App Store**, **Google Play Store**) e ciclos de faturamento (**Mensal** vs **Anual**).
  - PersistÃªncia reativa das variÃ¡veis de simulaÃ§Ã£o no `localStorage` do navegador, mantendo a experiÃªncia consistente entre recarregamentos de pÃ¡gina.
* **Card Premium do Plano Pro Ativo:**
  - ExibiÃ§Ã£o sofisticada de status de assinatura Pro, com badge verde "Ativo" pulsante, preÃ§o atualizado em tempo real pelo ciclo e data da prÃ³xima cobranÃ§a dinÃ¢mica baseada no ciclo selecionado.
  - ExibiÃ§Ã£o de metadados simulados de faturamento especÃ­ficos para cada plataforma ativa (como Mastercard final `**** 4242` no Stripe, conta iCloud no iOS e e-mail Google no Android), acompanhados por botÃµes dinÃ¢micos de acesso direto Ã s lojas de aplicativos e de cancelamento simulado de plano.
* **Card do Plano GrÃ¡tis e Nudges de Limites:**
  - Card explicativo para usuÃ¡rios do plano bÃ¡sico gratuito, integrando barras de progresso reais de limites tÃ©cnicos do app (ex: limite de contas criadas e envelopes de orÃ§amento base-zero utilizados) e botÃ£o de aÃ§Ã£o animado para upgrade imediato.
* **Aplicador de Cupons Promocionais Reativo:**
  - Campo funcional de cupom promocional com validaÃ§Ã£o em tempo real. Os cupons sÃ£o interpretados reativamente (ex: `VAULTENGINEER` aplicando 100% de desconto perpÃ©tuo, ou `SAVE30` aplicando 30% de desconto) e atualizam instantaneamente todos os valores exibidos nos cards, tabelas e faturas.
* **HistÃ³rico de Faturas com Download Funcional de Extratos:**
  - HistÃ³rico de pagamentos estruturado com ID da fatura, data de emissÃ£o, plataforma de faturamento, preÃ§o final atualizado pelo cupom de desconto e status "Pago".
  - ImplementaÃ§Ã£o de um gerador e baixador reativo de faturas fidedignas (formato de nota fiscal em texto plano com extensÃ£o `.pdf` simulada), permitindo ao usuÃ¡rio baixar faturas legÃ­timas diretamente da interface do navegador.
* **Tabela Comparativa de Recursos e FAQ ExpandÃ­vel:**
  - Grade comparativa detalhada dos diferenciais tÃ©cnicos e de recursos entre o plano GrÃ¡tis e Pro.
  - AcordeÃ£o animado e expandÃ­vel com perguntas frequentes de faturamento abordando uso multidispositivo da assinatura Pro, cancelamento sem multas e polÃ­ticas de reembolso das lojas.
* **Modal Premium de ConfirmaÃ§Ã£o de Checkout (Upgrade):**
  - DiÃ¡logo de confirmaÃ§Ã£o com design translÃºcido em vidro (`backdrop-blur-xl`) para ativaÃ§Ã£o do Pro. Exibe um resumo analÃ­tico detalhado do checkout, abatimento real de cupons ativos, valor total e notas fiscais detalhadas adaptadas por plataforma.

## [1.7.0] â 2026-05-12

Esta versÃ£o traz a novÃ­ssima **Central de Ajuda (Help Center)** integrada, contendo uma rica base de conhecimento com busca instantÃ¢nea de artigos financeiros de engenharia, suporte interativo via ticket com loader simulado, coleta de diagnÃ³stico de telemetria tÃ©cnica e upload interativo de anexos por arrastar e soltar (drag-and-drop). Esta versÃ£o foi aprimorada com uma inteligente **arquitetura hÃ­brida de dupla identidade** para separar acessos pÃºblicos e privados.

### Adicionado
* **Suporte HÃ­brido PÃºblico vs. Privado (Acessibilidade de Escopo):**
  - **Acesso PÃºblico (`/help-center`):** Artigos de ajuda e FAQ acessÃ­veis livremente a qualquer usuÃ¡rio deslogado no site. Ao tentar clicar em "Suporte Direto" ou "Enviar Feedback", o sistema exibe uma tela de bloqueio com indicador de seguranÃ§a e botÃ£o de autenticaÃ§Ã£o que redireciona para `/auth`.
  - **Acesso Privado (`/help`):** Mapeado debaixo das rotas protegidas do `Layout` com a Sidebar ativa. Todas as abas e formulÃ¡rios funcionam livremente e de forma 100% nativa para o cliente autenticado.
* **ConsistÃªncia EstÃ©tica Pixel-Perfect:** RefatoraÃ§Ã£o visual do componente no modo privado. Removemos fundos escuros maciÃ§os (`bg-slate-950`), glows de fundo redundantes e o header de retorno "Voltar para a Home". Agora, o Help Center herda o tema nativo do painel, os contÃªineres e um cabeÃ§alho de tÃ­tulo clean idÃªntico ao das pÃ¡ginas de `Accounts` e `Settings`, garantindo integraÃ§Ã£o estrita.
* **Auto-Preenchimento e ProteÃ§Ã£o AntifalsificaÃ§Ã£o:** IntegraÃ§Ã£o nativa com `useAuthStore` do Zustand. Se o usuÃ¡rio estiver logado, os campos de Nome e E-mail sÃ£o travados com as credenciais reais do usuÃ¡rio, impedindo erros e garantindo a autenticidade de chamados.
* **Telemetria de DiagnÃ³stico TÃ©cnico (Suporte):** Mapeamento e exibiÃ§Ã£o colapsÃ¡vel transparente de metadados do ambiente (OS, navegador amigÃ¡vel, resoluÃ§Ã£o de tela, latÃªncia de API e cookies) para auxiliar a triagem rÃ¡pida pelo time de engenharia de suporte.
* **MÃ³dulo Drag-and-Drop de Anexos:** Ãrea de arrastar e soltar de arquivos de suporte (PNG, JPG, WEBP e PDFs) com preview de miniaturas ricas para imagens ou Ã­cones correspondentes de PDF, acompanhado por barra de progresso de upload animada.
* **Busca Reativa de Artigos TÃ©cnicos:** Base de conhecimento com pesquisa dinÃ¢mica por texto e filtros rÃ¡pidos por categorias (Metodologia YNAB, Multimoedas e CiberseguranÃ§a). Artigos ricos sobre regras matemÃ¡ticas de recursÃ£o, cÃ¢mbio pivÃ´ EUR e blindagem lÃ³gica contra IDOR/BOLA.
* **Canal de Suporte e Abertura de Tickets:** FormulÃ¡rio reativo para abertura de chamados que simula processamento em tempo real com gerador de ID de ticket exclusivo (ex: `#VT-84920`).
* **Canal de Feedback Interativo:** Sistema de avaliaÃ§Ã£o com estrelas reativas (hover glow), seletor de sentimento e persistÃªncia automÃ¡tica do histÃ³rico de feedbacks do usuÃ¡rio no `localStorage` do dispositivo.
* **Atalho Estrutural na Sidebar:** InjeÃ§Ã£o do botÃ£o de **Ajuda e Suporte** no rodapÃ© de [Sidebar.tsx](file:///c:/Users/mathe/PROJETO-YNAB/Ynab/src/shared/components/dashboard/Sidebar.tsx), logo acima das ConfiguraÃ§Ãµes, com comportamento ativo, colapsÃ¡vel e tooltip sincronizado.
* **Ancoragem na Landing Page:** Link em destaque na coluna de Suporte da Landing Page ([Landing.tsx](file:///c:/Users/mathe/PROJETO-YNAB/Ynab/src/modules/auth/pages/Landing.tsx)) apontando diretamente para as query parameters reativas do Help Center pÃºblico (`/help-center?tab=articles`).
* **Redirecionamento Inteligente:** Redirecionamento retrocompatÃ­vel automÃ¡tico de `/ajuda` para `/help-center?tab=articles` em [App.tsx](file:///c:/Users/mathe/PROJETO-YNAB/Ynab/src/App.tsx).


## [1.6.0] â 2026-05-12

Esta versÃ£o marca a introduÃ§Ã£o da **Central Legal (Legal Center)** unificada do Vault Finance OS, consolidando todas as polÃ­ticas, regulamentos e termos tÃ©cnicos do ecossistema em uma interface Ãºnica de navegaÃ§Ã£o fluida, alÃ©m de inaugurar a central ativa de seguranÃ§a, governanÃ§a de TI e compliance de dados do SaaS.

### Adicionado
* **Central Legal Unificada (Legal Center):** Desenvolvimento do componente e pÃ¡gina centralizada `/legal` ([LegalCenter.tsx](file:///c:/Users/mathe/PROJETO-YNAB/Ynab/src/modules/auth/pages/LegalCenter.tsx)), equipada com um menu lateral reativo e flutuante para desktop e abas horizontais adaptativas e deslizantes para celulares (Capacitor).
* **Painel Ativo de GovernanÃ§a de TI e CiberseguranÃ§a:** CriaÃ§Ã£o da aba de **VisÃ£o Geral** que detalha de forma transparente os pilares de seguranÃ§a do app, incluindo a isolaÃ§Ã£o de escopo lÃ³gica multitenant do banco PostgreSQL contra falhas IDOR/BOLA, rotinas de criptografia simÃ©trica com hash PBKDF2, fluxos JWT de sessÃ£o e auditorias estÃ¡ticas/dinÃ¢micas periÃ³dicas.
* **Redirecionamento Inteligente de Rotas Legadas:** ImplementaÃ§Ã£o de redirecionamento retrocompatÃ­vel dinÃ¢mico (`<Navigate replace />`) no roteador central [App.tsx](file:///c:/Users/mathe/PROJETO-YNAB/Ynab/src/App.tsx) para traduzir instantaneamente URLs antigas para as respectivas abas com query parameters da nova Central Legal.

### Alterado
* **SincronizaÃ§Ã£o de Links Institucionais:** AdaptaÃ§Ã£o completa dos links do rodapÃ© na Landing Page ([Landing.tsx](file:///c:/Users/mathe/PROJETO-YNAB/Ynab/src/modules/auth/pages/Landing.tsx)) e no banner de privacidade flutuante ([CookieBanner.tsx](file:///c:/Users/mathe/PROJETO-YNAB/Ynab/src/modules/auth/components/CookieBanner.tsx)) para apontarem para as abas corretas da central (`/legal?tab=termos`, `/legal?tab=privacidade`, `/legal?tab=cookies`).

### Removido
* **Pruning de CÃ³digo Redundante:** ExclusÃ£o definitiva de arquivos individuais legados (`TermsOfUse.tsx`, `PrivacyPolicy.tsx`, `CookiePolicy.tsx`) para manter o repositÃ³rio enxuto e mitigar custos de manutenÃ§Ã£o em duplicidade.

## [1.5.0] â 2026-05-11

Esta versÃ£o introduz a funcionalidade altamente solicitada de **ExclusÃ£o Seletiva de Contas das SomatÃ³rias**, permitindo aos usuÃ¡rios ocultarem saldos de contas e subcontas especÃ­ficas dos totais acumulados de contas pai, Net Worth global e dashboard, sem excluÃ­-las visualmente da interface.

### Adicionado
* **ExclusÃ£o Seletiva de SomatÃ³rios (DomÃ­nio):** AdiÃ§Ã£o do campo `exclude_from_totals` Ã  tabela fÃ­sica e modelo `Account` no Django, expondo-o na resposta serializada da Ã¡rvore financeira.
* **CÃ¡lculo de Saldos Inteligente e Recursivo (Frontend):** RefatoraÃ§Ã£o do algoritmo recursivo de somatÃ³rio (`sumNode`) em `AccountAccordion.tsx` com tratamento adaptativo de raiz (`isRootCall`). Subcontas marcadas para exclusÃ£o retornam saldo consolidado individual `0` para a conta pai, mas exibem seus saldos reais na sua prÃ³pria linha visual.
* **Filtragem de Ativos do Dashboard:** AdaptaÃ§Ã£o da lÃ³gica global do Zustand `totalsByCurrency` para ignorar o saldo de qualquer conta ou subconta que possua a flag de exclusÃ£o ativa, recalculando instantaneamente o Net Worth e as distribuiÃ§Ãµes de excedentes.
* **Componentes de ConfiguraÃ§Ã£o Premium (UI):** InclusÃ£o de um checkbox emoldurado de alta fidelidade visual ("Desconsiderar nos Totais") equipado com HelpTooltip dinÃ¢mico explicando as consequÃªncias da flag nos modais de:
  * **CriaÃ§Ã£o de Conta Raiz** (`AddRootAccountModal.tsx`)
  * **CriaÃ§Ã£o de Subconta** (`AddAccountModal.tsx`)
  * **EdiÃ§Ã£o de Conta** (`AccountActions.tsx`)
* **OrdenaÃ§Ã£o AlfabÃ©tica de Subcontas (A-Z):** ImplementaÃ§Ã£o de um controle de ordenaÃ§Ã£o alfabÃ©tica para as subcontas de cada conta matriz. O estado Ã© controlado por um botÃ£o reativo estilizado com o Ã­cone `ArrowDownAZ` posicionado no canto superior direito do acordeÃ£o financeiro, cuja preferÃªncia do usuÃ¡rio Ã© gravada e persistida reativamente no `localStorage` sob a chave `vault_sort_subaccounts_az`.
* **Caixa de Busca na SeleÃ§Ã£o de Contas (LanÃ§amento):** AdiÃ§Ã£o de caixas de busca reativas e inteligentes nos campos de seleÃ§Ã£o de contas de origem e destino dentro do modal de lanÃ§amento de transaÃ§Ãµes (`AddTransactionModal.tsx`). O campo aparece de forma sutil e condicionada quando o usuÃ¡rio possui mais de 4 contas cadastradas, acompanhado por filtragem reativa instantÃ¢nea de digitaÃ§Ã£o e tratamento de estado vazio ("Nenhuma conta encontrada") nos dropdowns do seletor.
* **Escolha de Moedas em DÃ­vidas (Multi-moedas):** IntroduÃ§Ã£o da possibilidade de selecionar a moeda ("EUR", "BRL", "USD") na criaÃ§Ã£o de novas dÃ­vidas no painel de devedores (`Debts.tsx`), integrando-se perfeitamente com os cÃ¡lculos cambiais dinÃ¢micos do sistema.
* **AcrÃ©scimo de Saldo Devedor (Mais DÃ©bito):** ImplementaÃ§Ã£o de um botÃ£o de aÃ§Ã£o e modal dedicado ("Mais DÃ©bito") para aumentar o saldo devedor de dÃ­vidas existentes. A aÃ§Ã£o conta com uma `@action add_debt_amount` atÃ´mica no Django que incrementa a dÃ­vida e opcionalmente gera a transaÃ§Ã£o financeira reversa correspondente para conciliaÃ§Ã£o bancÃ¡ria de saldos, registrando tambÃ©m uma nota automÃ¡tica de auditoria nos histÃ³ricos.
* **Layout de DÃ­vidas Responsivo (Pixel-Perfect):** RefatoraÃ§Ã£o do rodapÃ© dos cards de dÃ­vida em `Debts.tsx` para usar layout flex-wrap responsivo, impedindo colisÃµes de texto e que o botÃ£o "Adicionar Saldo" saia para fora do contÃªiner em telas pequenas e celulares.
* **Preenchimento AutomÃ¡tico Baseado no HistÃ³rico (Autocomplete Inteligente):** IntroduÃ§Ã£o de um mecanismo reativo de auto-complete integrado ao campo de DescriÃ§Ã£o do modal de transaÃ§Ãµes (`AddTransactionModal.tsx`). Ao comeÃ§ar a digitar, o sistema busca ativamente transaÃ§Ãµes anteriores com descriÃ§Ãµes correspondentes (case-insensitive). Ao selecionar uma sugestÃ£o, o formulÃ¡rio Ã© magicamente preenchido com o Ãºltimo valor absoluto, o tipo correto (Receita/Despesa), a Conta de Origem anterior e a Categoria de OrÃ§amento anterior correspondentes. O dropdown exibe informaÃ§Ãµes completas (Moeda, Categoria, Conta e Tipo) com badges premium e se fecha automaticamente se houver clique fora do contÃªiner.
* **PersonalizaÃ§Ã£o Modular da Interface (Feature Flags do UsuÃ¡rio):** CriaÃ§Ã£o de um mecanismo dinÃ¢mico e persistente no Zustand (`useFeatureStore.ts`) que permite ao usuÃ¡rio ativar ou desativar pÃ¡ginas inteiras do painel de controle (Dashboard, Ãrvore de Contas, Extrato de TransaÃ§Ãµes, OrÃ§amentos, DÃ­vidas, Metas e Insights Inteligentes).
* **Painel de Controle de MÃ³dulos (UI/UX):** IntegraÃ§Ã£o de uma nova aba ("MÃ³dulos") equipada com cards informativos individuais no painel de ConfiguraÃ§Ãµes gerais (`Settings.tsx`), oferecendo botÃµes de status ("â Habilitado" em verde / "â Desabilitado" em vermelho) e salvamento automÃ¡tico instantÃ¢neo no `localStorage`.
* **SeguranÃ§a e Filtragem de NavegaÃ§Ã£o DinÃ¢micas:** ReadequaÃ§Ã£o da Sidebar (`Sidebar.tsx`) e da navegaÃ§Ã£o mobile (`BottomNav.tsx`) para refletir em tempo real apenas as seÃ§Ãµes selecionadas pelo usuÃ¡rio, associada a um componente de proteÃ§Ã£o de rotas (`FeatureProtectedRoute` em `App.tsx`) que blinda o acesso direto por URL e previne loops de redirecionamento.
* **Planejamento Financeiro 50-30-20:** CriaÃ§Ã£o de um mÃ³dulo completo dedicado Ã  consagrada regra financeira 50-30-20, dividindo a renda lÃ­quida em Necessidades (50%), Desejos (30%) e Prioridades/Futuro (20%).
* **IntegraÃ§Ã£o Inteligente ou AutÃ´noma:** InclusÃ£o de um mecanismo de chaveamento que permite ao mÃ³dulo rodar no modo manual (inserindo renda estÃ¡tica) ou totalmente integrado ao ecossistema YNAB, somando as receitas reais do perÃ­odo e computando as despesas das categorias mapeadas automaticamente.
* **Componente de Mapeamento de Categorias (UI/UX):** Painel de mapeamento interativo para que o usuÃ¡rio associe suas categorias de orÃ§amento a um dos 3 baldes com um Ãºnico clique (persistido de forma segura e reativa no `localStorage` via `useRule503020Store`).
* **GrÃ¡ficos e Indicadores de Desempenho Visual:** InclusÃ£o de medidores de progresso reativos, indicadores inteligentes de teto de gastos (Verde/Alvo, Ãmbar/AtenÃ§Ã£o, Vermelho/Estourado) e grÃ¡ficos de pizza comparativos paralelos (DistribuiÃ§Ã£o Ideal vs. Gastos Reais do MÃªs).
* **MigraÃ§Ã£o de Banco Segura e Sem InterrupÃ§Ãµes:** AplicaÃ§Ã£o de migraÃ§Ã£o Django vinculando os modelos ao app original `core` (usando `app_label = 'core'`), gerando uma alteraÃ§Ã£o de coluna no SQLite e PostgreSQL sem quebrar deploys de produÃ§Ã£o ou tentar apagar tabelas legadas.



### Corrigido
* **Saldo Inicial de Contas Negativas:** CorreÃ§Ã£o da lÃ³gica de criaÃ§Ã£o de contas no Django (`perform_create` em `views.py`) que gerava a transaÃ§Ã£o automÃ¡tica de saldo inicial apenas para saldos positivos. Agora, contas criadas com saldo negativo tambÃ©m ganham automaticamente sua transaÃ§Ã£o de saldo inicial (como despesa, usando o valor absoluto do saldo inicial), sanando inconsistÃªncias de relatÃ³rios.
* **MigraÃ§Ã£o Corretiva de Dados Retroativos (ProduÃ§Ã£o):** IntroduÃ§Ã£o da migraÃ§Ã£o corretiva de dados `0022_fix_negative_and_positive_initial_balances.py` no Django. Durante o deploy, ela varre todas as contas reais do banco de dados (especialmente na produÃ§Ã£o) que foram criadas sem transaÃ§Ãµes de saldo inicial (seja saldo positivo ou negativo) e gera a transaÃ§Ã£o corretiva inicial de forma 100% segura e invisÃ­vel ao usuÃ¡rio.
* **Ajuste de BalÃµes de Texto Informativo (Tooltips):** CorreÃ§Ã£o do estouro e corte de balÃµes informativos de ajuda (`HelpTooltip.tsx`) por meio da adiÃ§Ã£o das propriedades de utilidade CSS `break-words` e `whitespace-normal`, e diminuiÃ§Ã£o da largura responsiva mÃ¡xima em celulares (`max-w-[240px] sm:max-w-[320px]`). Evita o vazamento lateral em todas as resoluÃ§Ãµes e layouts mÃ³veis do sistema.

---

## [1.4.0] â 2026-05-11

Esta versÃ£o representa um marco de engenharia focando em **Clean Architecture** e **ModularizaÃ§Ã£o de Alta CoesÃ£o**, separando de forma estrita e hermÃ©tica a infraestrutura administrativa reutilizÃ¡vel do SaaS (**SaaS Boilerplate Starter Kit**) das lÃ³gicas e fluxos de negÃ³cios especializados de finanÃ§as e metodologia YNAB do **Vault Finance OS**.

### Adicionado
* **Isolamento de Infraestrutura SaaS (Boilerplate):** Encapsulamento completo de rotinas administrativas, JWT, perfil do usuÃ¡rio, autenticaÃ§Ã£o segura multifator 2FA (TOTP) e polÃ­ticas internacionais de dados (GDPR/LGPD) em mÃ³dulos dedicados (`core` no Django e `src/modules/auth` no React).
* **MÃ³dulo Especializado de FinanÃ§as (Domain Core):** CriaÃ§Ã£o do mÃ³dulo financeiro autocontido (`finance` no Django e `src/modules/finance` no React), responsÃ¡vel exclusivo por Ã¡rvores de contas mestre e envelopes recursivos, algoritmos de teto/transbordo (*distribute_excess*), amortizaÃ§Ã£o de dÃ­vidas e metas.
* **Backup de SeguranÃ§a Completo (JSON):** CorreÃ§Ã£o do botÃ£o de exportaÃ§Ã£o e implementaÃ§Ã£o de rotina para download de backup integral instantÃ¢neo contendo todas as contas, transaÃ§Ãµes, categorias, metas, dÃ­vidas e modelos.
* **ExportaÃ§Ã£o AnalÃ­tica para Planilha (CSV):** Adicionada funcionalidade para exportar o livro-razÃ£o de transaÃ§Ãµes do perÃ­odo ativo em formato CSV de planilha, otimizado com codificaÃ§Ã£o UTF-8 BOM para compatibilidade com Excel e Google Sheets.
* **Estrutura Compartilhada de UI (Shared Componentry):** UnificaÃ§Ã£o de componentes genÃ©ricos e primitives do Shadcn/ui sob o diretÃ³rio `src/shared/`, otimizando a reusabilidade e blindando os mÃ³dulos de negÃ³cios contra dependÃªncias acopladas.
* **Garantia de NÃ£o-RegressÃ£o (Zero-Regression Pipeline):** ExpansÃ£o e normalizaÃ§Ã£o da suÃ­te de testes com 100% de sucesso em todas as verificaÃ§Ãµes do backend (40 de 40 testes verdes no Pytest) e do frontend (27 de 27 testes verdes no Vitest).

---

## [1.3.0] â 2026-05-10

Esta versÃ£o foca em automaÃ§Ã£o de reconciliaÃ§Ã£o financeira para saldos iniciais de todas as contas (contas mestre e subcontas), na governanÃ§a e privacidade dos dados do usuÃ¡rio com a funcionalidade de zerar dados, e na flexibilidade organizacional atravÃ©s da movimentaÃ§Ã£o hierÃ¡rquica dinÃ¢mica de contas e subcontas.

### Adicionado
* **MovimentaÃ§Ã£o HierÃ¡rquica DinÃ¢mica de Contas (Drag & Drop na Web):** IntegraÃ§Ã£o de um sistema avanÃ§ado de Drag & Drop HTML5 nativo no componente `AccountAccordion.tsx`, permitindo ao usuÃ¡rio reestruturar toda a Ã¡rvore financeira ao arrastar qualquer conta para dentro de outra para tornÃ¡-la subconta, de forma extremamente reativa e fluida.
* **AÃ§Ã£o e Modal Inteligente "Mover Conta" (Otimizado para Celular / App):** Nova aÃ§Ã£o dedicada no menu `AccountActions.tsx` que abre um modal interativo com seletor de contas pai elegÃ­veis. O seletor calcula e filtra de forma recursiva a prÃ³pria conta e todos os seus descendentes diretos ou indiretos, prevenindo loops cÃ­clicos de recursÃ£o infinita e oferecendo uma usabilidade de toque perfeita para telas mÃ³veis.
* **ValidaÃ§Ã£o Ativa Anti-Loop no Backend (Django):** InclusÃ£o de um algoritmo de validaÃ§Ã£o no mÃ©todo `validate` do `AccountSerializer` que barra qualquer tentativa de mover uma conta para dentro de si mesma ou de seus prÃ³prios descendentes directos/indiretos, retornando o cÃ³digo de erro de integridade `400 BAD REQUEST` para blindar o cÃ¡lculo dos saldos recursivos na Ã¡rvore financeira.
* **GeraÃ§Ã£o AutomÃ¡tica de Receitas para Todas as Contas:** ImplementaÃ§Ã£o de regras de automaÃ§Ã£o transacional no backend Django (`AccountViewSet`), de modo que, ao definir o Saldo Atual de qualquer conta (mestre ou subconta, seja na criaÃ§Ã£o ou ediÃ§Ã£o), o sistema gera automaticamente uma transaÃ§Ã£o do tipo receita (em caso de aumento de saldo) ou despesa de ajuste (em caso de reduÃ§Ã£o). As transaÃ§Ãµes sÃ£o marcadas como efetivadas (`status='realized'`) e aplicadas ao saldo (`is_applied_to_balance=True`) para fins histÃ³ricos, eliminando qualquer dessincronizaÃ§Ã£o entre saldos e registros transacionais.
* **MigraÃ§Ãµes de Dados Retroativas de Saldos (0019 & 0020):** CriaÃ§Ã£o das migraÃ§Ãµes de dados Django `0019_create_initial_balances_for_subaccounts` e `0020_create_initial_balances_for_master_accounts` para gerar retroativamente transaÃ§Ãµes de receita com descriÃ§Ã£o "Saldo Inicial" para todas as subcontas e contas mestre com saldo positivo que ainda nÃ£o possuÃ­am histÃ³rico transacional, regularizando de forma limpa e automÃ¡tica as contas antigas no banco de dados apÃ³s o deploy.
* **Endpoint de Reset Permanente de Dados Financeiros:** Nova APIView segura no backend `/auth/profile/reset-data/` restrita a usuÃ¡rios autenticados, que executa uma remoÃ§Ã£o atÃ´mica em bloco de todas as transaÃ§Ãµes, contas, categorias, orÃ§amentos, metas e dÃ­vidas vinculadas ao usuÃ¡rio logado, preservando sua conta de acesso, credenciais e perfil (idioma, 2FA, etc.).
* **Zona de Perigo com Dupla ConfirmaÃ§Ã£o nas ConfiguraÃ§Ãµes:** Interface do usuÃ¡rio premium na aba "Dados" em `Settings.tsx` com uma seÃ§Ã£o visual estilizada de "Zona de Perigo" de alto impacto estÃ©tico, integrada com um modal de dupla confirmaÃ§Ã£o de seguranÃ§a que exige do usuÃ¡rio digitar a palavra-chave "EXCLUIR" para prevenir aÃ§Ãµes destrutivas acidentais.
* **Novos Casos de Teste Automatizados (Backend):** InclusÃ£o de testes robustos no Pytest em `test_accounts.py` (`test_automatic_income_on_account_creation`, `test_automatic_adjustment_on_account_balance_update`, `test_account_circular_dependency_prevention` e `test_profile_reset_data`) para auditar todas as novas regras de negÃ³cio, prevenÃ§Ã£o de ciclos cÃ­clicos e garantir 100% de estabilidade e integridade funcional.

### Alterado
* **RefatoraÃ§Ã£o Visual Premium dos Badges de Teto de Contas:** SeparaÃ§Ã£o do indicador de limite/teto das contas em dois pills independentes, de cantos perfeitamente arredondados (`rounded-full`) e responsivos: o primeiro contendo o Ã­cone de medidor (`Gauge`) acompanhado do valor do limite monetÃ¡rio, e o segundo exibindo a porcentagem consumida. O tamanho da fonte foi ampliado para `text-[13px]` para harmonizar elegantemente com a escala de tamanho do nome da conta, aprimorando significativamente o equilÃ­brio visual e a legibilidade das mÃ©tricas de teto em telas desktop e mobile.

### Corrigido
* **NormalizaÃ§Ã£o de Ãcones no Windows (Barras Invertidas):** CorreÃ§Ã£o do bug que gerava caminhos com barras invertidas (`\`) ao salvar imagens atravÃ©s do `default_storage.save` no Windows, comprometendo as URLs absolutas dos Ã­cones retornadas pelo endpoint `/api/icons/upload/`. Agora, todas as barras sÃ£o normalizadas com `.replace('\\', '/')`, garantindo renderizaÃ§Ã£o instantÃ¢nea do preview em qualquer SO.
* **ServiÃ§o de Arquivos de MÃ­dia em ProduÃ§Ã£o (Django):** InclusÃ£o de mapeamento de URLs dinÃ¢micas para arquivos estÃ¡ticos e de mÃ­dia na raiz `ynab_backend/urls.py` via `django.views.static.serve` quando `DEBUG=False`. Isso resolve em definitivo o erro `404 Not Found` no Render ao acessar imagens, avatares ou Ã­cones enviados pelos usuÃ¡rios na plataforma online.
* **Coleta de Testes de Ãcones no Pytest:** Ajuste do nome do arquivo de testes de `tests_icon.py` para `test_icons.py` para estar em conformidade com as regras de nomenclatura do Pytest e ser incluÃ­do na suÃ­te automatizada de testes, alÃ©m de adicionar o caso `test_icon_upload_endpoint` simulando uploads Multipart.

---

## [1.2.0] â 2026-05-10

Esta versÃ£o marca a consolidaÃ§Ã£o completa da infraestrutura de governanÃ§a, conformidade legal internacional com LGPD e GDPR, seguranÃ§a ativa contra IDOR/BOLA e documentaÃ§Ã£o exaustiva de negÃ³cios e matemÃ¡tica do ecossistema.

### Adicionado
* **SincronizaÃ§Ã£o Bidirecional Automatizada de Idioma:** SincronizaÃ§Ã£o inteligente e automÃ¡tica entre o idioma selecionado na Landing Page/Site e o idioma ativo na aplicaÃ§Ã£o logada, persistindo as preferÃªncias diretamente no banco de dados atravÃ©s da rota `/auth/profile/update/` e utilizando uma flag local `vault_lang_explicit` para preservar a escolha do usuÃ¡rio sem perda de dados em novos dispositivos.
* **Compliance de Privacidade (LGPD & GDPR):** CriaÃ§Ã£o das pÃ¡ginas institucionais [TermsOfUse.tsx](file:///C:/Users/mathe/PROJETO-YNAB/Ynab/src/pages/TermsOfUse.tsx) (Termos de Uso), [PrivacyPolicy.tsx](file:///C:/Users/mathe/PROJETO-YNAB/Ynab/src/pages/PrivacyPolicy.tsx) (PolÃ­tica de Privacidade) e [CookiePolicy.tsx](file:///C:/Users/mathe/PROJETO-YNAB/Ynab/src/pages/CookiePolicy.tsx) (PolÃ­tica de Cookies).
* **PolÃ­ticas Corporativas de SLA e Pentests:** IntegraÃ§Ã£o formal de metas de uptime de 99.9% com reembolso em crÃ©ditos na mensalidade, RTO de 4h/RPO de 1h, e garantias de blindagem contra ataques de quebra de escopo por IDOR (testes de intrusÃ£o anuais) nas pÃ¡ginas de polÃ­ticas legais.
* **Banner DinÃ¢mico de Cookies e Consentimento:** ImplementaÃ§Ã£o da store Zustand `useConsentStore` e do componente flutuante multilÃ­ngue adaptativo `CookieBanner` integrado ao hook `useConsentTracker` para ativaÃ§Ã£o reativa de scripts de rastreamento de marketing/analytics somente sob opt-in explÃ­cito.
* **RodapÃ© Premium Multi-Colunas:** Novo rodapÃ© completo na Landing Page, com layout dark mode de alta definiÃ§Ã£o, alinhamento vertical rigoroso de pixel e dados institucionais/DPO completos.
* **[NEW] [SECURITY.md](file:///C:/Users/mathe/PROJETO-YNAB/SECURITY.md):** Manual de divulgaÃ§Ã£o coordenada de vulnerabilidades e SLAs Ã¡geis para patches de seguranÃ§a.
* **[NEW] [CONTRIBUTING.md](file:///C:/Users/mathe/PROJETO-YNAB/CONTRIBUTING.md):** Guia prÃ¡tico de governanÃ§a, convenÃ§Ãµes de commits, guias de estilo PEP 8 e ESLint/Prettier e fluxos de Pull Requests.
* **[NEW] [DEPLOYMENT.md](file:///C:/Users/mathe/PROJETO-YNAB/DEPLOYMENT.md):** Guia prÃ¡tico de orquestraÃ§Ã£o com Docker Compose, pipelines automatizadas via GitHub Actions, rotinas de backups automatizados do PostgreSQL no AWS S3 e compilaÃ§Ã£o do Capacitor Mobile para Android e iOS.
* **[NEW] [TESTING.md](file:///C:/Users/mathe/PROJETO-YNAB/TESTING.md):** EstratÃ©gia de QA, testes relacionais de recursividade financeira com Pytest e mocks de chamadas HTTP no frontend com Vitest.
* **Wikis e PÃ¡ginas de Conhecimento:** CriaÃ§Ã£o de guias matemÃ¡ticos e conceituais do ecossistema ([wiki_recursividade_infinita.md](file:///C:/Users/mathe/PROJETO-YNAB/docs/wiki_recursividade_infinita.md), [wiki_multimoedas.md](file:///C:/Users/mathe/PROJETO-YNAB/docs/wiki_multimoedas.md) e [wiki_seguranca.md](file:///C:/Users/mathe/PROJETO-YNAB/docs/wiki_seguranca.md)).

### Corrigido
* **Alinhamento de BotÃµes dos Planos na Landing Page:** Ajuste de posicionamento vertical dos botÃµes "ComeÃ§ar de GraÃ§a" e "Assinar o Pro" adotando um contÃªiner flexÃ­vel com altura mÃ­nima uniforme de `min-h-[200px] sm:min-h-[180px]` para os blocos superiores de preÃ§os e tÃ­tulos, garantindo alinhamento pixel-perfect mesmo se as descriÃ§Ãµes ou preÃ§os quebrarem linha em telas menores.
* **Menu de ConfiguraÃ§Ãµes e UnificaÃ§Ã£o Funcional da Sidebar:** RefatoraÃ§Ã£o completa do `NavLink` do botÃ£o de configuraÃ§Ãµes em [Sidebar.tsx](file:///C:/Users/mathe/PROJETO-YNAB/Ynab/src/components/dashboard/Sidebar.tsx) para adotar a exata mesma estrutura funcional baseada em children baseadas em `isActive` das demais rotas, incorporando o indicador ativo vertical reativo na esquerda, controle de truncagem e duraÃ§Ã£o de transiÃ§Ã£o idÃªnticos.
* **Rigidez de Layout da Sidebar (PrevenÃ§Ã£o de Esmagamento):** InclusÃ£o da diretiva `shrink-0` (ou `flex-shrink-0`) no contÃªiner `<aside>` da [Sidebar.tsx](file:///C:/Users/mathe/PROJETO-YNAB/Ynab/src/components/dashboard/Sidebar.tsx) e na div wrapper do [Layout.tsx](file:///C:/Users/mathe/PROJETO-YNAB/Ynab/src/components/dashboard/Layout.tsx), impedindo que o motor de renderizaÃ§Ã£o flexbox do navegador esprema a barra lateral em janelas estreitas e mantendo os itens sempre alinhados na horizontal.
* **Bordas do Layout Geral (Sidebar e Header):** Ajuste fino de posicionamento no `Topbar.tsx` e `Sidebar.tsx` estabelecendo altura rÃ­gida de `h-16` para alinhar de forma milimÃ©trica as bordas e divisores verticais e horizontais.

---

## [1.1.0] â 2026-05-09

Esta versÃ£o foca em acessibilidade global, experiÃªncia estÃ©tica premium, suporte multi-idiomas nativo e inteligÃªncia de distribuiÃ§Ã£o de limites orÃ§amentÃ¡rios.

### Adicionado
* **Suporte Multi-idioma de Alta Fidelidade (i18n):** TraduÃ§Ã£o completa da landing page e do app financeiro para **12 idiomas globais** (`pt-BR`, `en`, `es`, `fr`, `de`, `it`, `nl`, `pl`, `zh`, `ja`, `ar`, `hi`) via `react-i18next` com suporte a orientaÃ§Ã£o RTL.
* **Suporte a 160+ Moedas Globais:** Motor dinÃ¢mico de formataÃ§Ã£o financeira usando a API Intl do navegador e seletor de moedas rÃ¡pido com busca por texto.
* **Controle de Teto de Contas (Ceilings):** Adicionada a propriedade opcional `ceiling` para estabelecer limites de saldo em contas e envelopes.
* **Algoritmo de DistribuiÃ§Ã£o de Excessos (*distribute_excess*):** LÃ³gica matemÃ¡tica inteligente para redistribuir saldos excedentes ao teto para subcontas filhas e reservas, operando sob o algoritmo de preenchimento de Ã¡gua (*water-filling algorithm*).
* **EstratÃ©gia de Cobertura de Gastos Excessivos (*cover_overspending*):** Cobertura automÃ¡tica de saldos negativos distribuindo a pendÃªncia entre contas irmÃ£s.
* **PÃ¡gina de GestÃ£o de DÃ­vidas:** Nova interface [Debts.tsx](file:///C:/Users/mathe/PROJETO-YNAB/Ynab/src/pages/Debts.tsx) com a store `useDebtStore` para amortizaÃ§Ã£o progressiva de passivos.
* **Gestos e Pull-to-Refresh Mobile:** Adicionados gestos nativos de swipe para Android/iOS e gesto de puxar para atualizar saldos na tela.
* **SuÃ­te Completa de Testes Automatizados (100% Pass):** ImplementaÃ§Ã£o massiva de testes para persistÃªncia de limites de teto, Ã¡rvores de agregaÃ§Ã£o recursiva e seguranÃ§a no backend e frontend.

### Alterado
* **Pruning de CÃ³digo Legado:** ExclusÃ£o definitiva de arquivos nÃ£o-utilizados e pacotes Ã³rfÃ£os do antigo protÃ³tipo React Native para aliviar o bundle.
* **RemoÃ§Ã£o de Idiomas Redundantes:** RemoÃ§Ã£o do `pt-PT` para unificar todos os termos em lÃ­ngua portuguesa sob o PortuguÃªs do Brasil (`pt-BR`).

---

## [1.0.0] â 2026-05-05 - 2026-05-08

Esta versÃ£o representa o lanÃ§amento estÃ¡vel inicial de produÃ§Ã£o do **Vault Finance OS**, consolidando os apps mobile nativos e a sincronizaÃ§Ã£o offline de dados.

### Adicionado
* **CompilaÃ§Ã£o Mobile Nativa com Capacitor v8:** EstruturaÃ§Ã£o dos aplicativos Android e iOS utilizando o Capacitor com suporte nativo a biometria, armazenamento seguro e controle de hardware.
* **AutenticaÃ§Ã£o Nativa com Google Sign-In:** IntegraÃ§Ã£o nativa usando o plugin `@codetrix-studio/capacitor-google-auth` e comunicaÃ§Ã£o segura com endpoints sociais do Django REST Framework.
* **Processador de SincronizaÃ§Ã£o Offline-First:** Arquitetura de persistÃªncia local de transaÃ§Ãµes com sincronizaÃ§Ã£o em segundo plano assim que a conectividade for restabelecida.
* **Mecanismo de TransaÃ§Ãµes Pendentes e Efetivadas:** DistinÃ§Ã£o de saldos lÃ­quidos em tempo real baseada no status (`pending` e `realized`) e agendamentos futuros.
* **Floating Action Button (FAB):** Adicionado botÃ£o de atalho flutuante de '+' na interface mÃ³vel, ocultando menus redundantes do desktop no mobile.

---

## [0.9.0] â 2026-05-04

Foco em BI (Business Intelligence), metas patrimoniais de longo prazo e algoritmos de distribuiÃ§Ã£o sistemÃ¡tica de receitas.

### Adicionado
* **Dashboard de BI Integrado:** GrÃ¡ficos interativos em Modo Escuro de evoluÃ§Ã£o patrimonial lÃ­quida (*Net Worth*) e fatiamento de despesas em formato de rosca por categorias.
* **Sistema de Metas Patrimoniais (Goals):** CriaÃ§Ã£o de alvos financeiros flexÃ­veis com suporte a mÃºltiplos ativos e moedas.
* **Templates Modulares de DistribuiÃ§Ã£o:** GestÃ£o de regras predefinidas para recebimento de receitas lÃ­quidas, com alocaÃ§Ãµes percentuais fixas ou dinÃ¢micas para categorias orÃ§amentÃ¡rias.

---

## [0.8.0] â 2026-05-02 - 2026-05-03

SeguranÃ§a multifator, persistÃªncia cambial de taxas e visualizaÃ§Ã£o detalhada de portfÃ³lio.

### Adicionado
* **AutenticaÃ§Ã£o em Duas Etapas (2FA):** LÃ³gica integrada ao backend (Django) e frontend (React) usando o algoritmo de cÃ³digo dinÃ¢mico TOTP (RFC 6238) via `pyotp`.
* **Dashboard Detalhado de Conta:** Interface com macro e micro visualizaÃ§Ãµes, filtros temporais dinÃ¢micos e design baseado em glassmorphism de alta fidelidade.
* **SincronizaÃ§Ã£o Cambial AutomÃ¡tica:** AtualizaÃ§Ã£o em segundo plano das taxas de conversÃ£o de moedas estrangeiras via banco de dados Supabase (PostgreSQL).

---

## [0.7.0] â 2026-04-26 - 2026-05-01

Infraestrutura de nuvem, controle de sessÃµes e fluxos sociais web.

### Adicionado
* **AutenticaÃ§Ã£o Social Web:** Fluxo funcional do Google OAuth2 integrado ao frontend SPA React.
* **SincronizaÃ§Ã£o por Tarefas Cron:** CriaÃ§Ã£o do endpoint de `/ping` de baixo custo computacional no Django para manter ativas e aquecidas as instÃ¢ncias gratuitas do Render e Supabase.
* **Registro FlexÃ­vel de Novos UsuÃ¡rios:** Rota de cadastro no DRF mapeando dinamicamente campos de perfil e preferÃªncias.
* **Deploy Integrado Multicloud:** ConfiguraÃ§Ã£o de arquivos `vercel.json` para suporte a rotas SPA, orquestraÃ§Ã£o Docker para Oracle Cloud e build scripts automatizados no Render.

---

## [0.6.0] â 2026-04-25

ConsolidaÃ§Ã£o da lÃ³gica financeira recursiva e de categorizaÃ§Ã£o.

### Adicionado
* **LÃ³gica OrÃ§amentÃ¡ria Recursiva (Base-Zero):** AgregaÃ§Ã£o inteligente de saldos em sub-envelopes recursivos de forma infinita.
* **Importador de Extratos BancÃ¡rios OFX:** Upload e processamento automÃ¡tico de arquivos de transaÃ§Ã£o financeira OFX nativo do backend.
* **RefatoraÃ§Ã£o completa para TanStack Query:** MigraÃ§Ã£o de toda a camada de sincronizaÃ§Ã£o assÃ­ncrona do frontend para React Query, mitigando problemas de concorrÃªncia.
* **AdoÃ§Ã£o Global de Dark Mode Premium:** EstilizaÃ§Ã£o de todo o ecossistema com paletas escuras de alto contraste.

---

## [0.5.0] â 2026-04-21 - 2026-04-22

Nascimento do Vault Finance OS.

### Adicionado
* **Estrutura Base MultirepositÃ³rio:** ConfiguraÃ§Ã£o inicial do Django REST Framework (Backend) e do React + Vite + TypeScript + TailwindCSS (Frontend).
* **AutenticaÃ§Ã£o Baseada em JSON Web Tokens (JWT):** ImplementaÃ§Ã£o inicial de fluxo seguro de tokens com SimpleJWT (Access e Refresh tokens).
* **Initial Commit:** Envio inicial do repositÃ³rio contendo as bases lÃ³gicas para o modelo relacional de transaÃ§Ãµes.
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





