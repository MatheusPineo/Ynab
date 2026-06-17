# Changelog — Vault OS 💎

Todas as mudanças de engenharia relevantes para o projeto serão registradas neste arquivo.

## [1.112.00] - 2026-06-18

### Alterado
- **Contas Físicas (`src/modules/finance/pages/CommandCenter.tsx`):**
  - Removido o chip simulado de cartão de crédito das contas.
  - Refatorado o layout da linha do topo dos cartões utilizando flexbox (`flex-1`, `pr-2`, `gap-2`) e substituído o truncamento precoce (`truncate`) por quebra de linha flexível de até 2 linhas (`line-clamp-2`) para corrigir a sobreposição e corte precoce de nomes.
  - Reativado o modal de criação de contas `<AddAccountModal>` após as correções defensivas.

### Corrigido
- **Componente de Cadastro (`src/modules/finance/components/AddAccountModal.tsx`):**
  - Adicionado optional chaining estrito (`parentAccount?.id`, `parentAccount?.name`, `parentAccount?.currency`) para evitar quebras por `undefined` na renderização e submissão.

## [1.111.00] - 2026-06-17

### Corrigido
- **Command Center (`src/modules/finance/pages/CommandCenter.tsx`):**
  - Removido o bloco de depuração Pure Data Extractor (`// 🛑 PURE DATA EXTRACTOR HIJACK 🛑`), restaurando o fluxo normal da UI (`PullToRefresh`).
  - Isolado temporariamente o componente `<AddAccountModal>` devido a falhas internas que causavam a quebra do Error Boundary na aba de Contas Físicas.
  - Substituído o botão de criar conta por um botão nativo com ação informativa (`alert`) até a conclusão da manutenção no modal.

## [1.103.00] - 2026-06-12

### Adicionado
- **Roteamento Principal (`src/App.tsx`):**
  - Importação estática e registro do componente `LoansDashboard` sob a rota `/loans`, integrando-o ao layout protegido do painel de controle financeiro.
- **Modal de Criação de Contas (`src/modules/finance/components/AddRootAccountModal.tsx`):**
  - Adicionado botão de tipo de conta `LOAN_GIVEN` ("Empréstimo") com ícone `HandCoins`, permitindo o cadastro de contas de empréstimos concedidos a partir do dashboard principal.
- **Painel de Empréstimos (`src/modules/finance/pages/LoansDashboard.tsx`):**
  - Adicionado campo de seleção de data (Date input) com estado `receiveDate` no modal de recebimento de pagamentos, permitindo agendar ou registrar retroativamente amortizações com datas personalizadas em vez de fixar no dia atual.

### Alterado
- **Engine de Transferências (`src/backend/finance/views.py`):**
  - Atualizado o endpoint de transferências para aceitar opcionalmente o parâmetro `category_id`, permitindo o orçamento base-zero quando recursos saem de contas "On-Budget" para contas de empréstimos concedidos ("Off-Budget").
- **Modelos de Conta do Backend (`src/backend/finance/models.py`):**
  - Configurada a constante `ACCOUNT_TYPES` para incluir a tupla correspondente ao tipo de conta `LOAN_GIVEN` (Empréstimo Concedido).

## [1.94.00] - 2026-06-11

### Corrigido
- **Modal de Transações (`src/modules/finance/components/AddTransactionModal.tsx`):**
  - Reorganizado o escopo de variáveis e a ordem das destruturações de hooks no topo do componente, evitando o erro de execução de acesso antes de inicialização (`Cannot access before initialization` referente à variável `allAccounts`).

## [1.93.00] - 2026-06-11

### Alterado
- **Modal de Transações (`src/modules/finance/components/AddTransactionModal.tsx`):**
  - Ajustada a verificação de `currentCard` para validar o tipo de conta da conta selecionada na árvore (`allAccounts`) antes de apresentar os campos e o fluxo de cartão de crédito.

## [1.92.00] - 2026-06-11

### Alterado
- **Ações de Conta (`src/modules/finance/components/AccountActions.tsx`):**
  - Modificado o dropdown de "Tipo de Conta" para usar valores em minúsculo (`checking`, `credit_card`, `tracking`), resolvendo erro de validação do Django API.
  - Removido o campo "Ícone da Conta" (`IconPicker`) do formulário de edição de contas.

## [1.91.00] - 2026-06-11

### Removido
- **Ações de Conta (`src/modules/finance/components/AccountActions.tsx`):**
  - Removida a opção de "Adicionar Sub-conta" do menu de ações da conta.

## [1.90.00] - 2026-06-11

### Alterado
- **Ações de Conta (`src/modules/finance/components/AccountActions.tsx`):**
  - Adicionado seletor de "Tipo de Conta" no modal de edição de contas, possibilitando alterar dinamicamente entre Conta Corrente/Carteira (`CHECKING`), Cartão de Crédito (`CREDIT_CARD`) e Conta de Acompanhamento (`TRACKING`).

## [1.89.00] - 2026-06-11

### Adicionado
- **Acordeão de Contas (`src/modules/finance/components/AccountAccordion.tsx`):**
  - Adicionados badges visuais indicativos ao lado do nome da conta para identificar tipos "Cartão" (`CREDIT_CARD`) e "Acompanhamento" (`TRACKING`).

## [1.88.00] - 2026-06-11

### Adicionado
- **Seletor Global de Categoria (`src/shared/components/ui/global-category-selector.tsx`):**
  - Novo componente de dropdown avançado (Combobox) com suporte a busca, filtros integrados, acessibilidade de teclado e agrupamento de categorias.

### Alterado
- **Modal de Transações (`src/modules/finance/components/AddTransactionModal.tsx`):**
  - Substituído o seletor padrão `<Select>` de categorias pelo `GlobalCategorySelector` para seleção de categorias com busca instantânea.

## [1.76.01] - 2026-06-10

### Alterado
- **Módulo Financeiro / Cartões de Crédito (`src/modules/finance/pages/CreditCards.tsx`):**
  - Substituído o seletor legado de "Subconta de despesa" (`GlobalAccountSelector`) pelo YNAB Category Selector usando os componentes `Select`, `SelectGroup`, `SelectLabel` e `SelectItem`.
  - Atualizada a validação e as mensagens de erro nos toasts e nos labels de formulário de "Subconta de despesa" para "Categoria" e "Categoria de Despesa".
  - Corrigida a renderização para iterar sobre `categoryGroups` e seus filhos (`children`) organizadamente.
