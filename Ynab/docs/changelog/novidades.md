# Novidades do Vault 💎

Fique por dentro das últimas melhorias e novos fluxos do sistema criados especialmente para otimizar sua experiência financeira.

## 🚀 Integração e Ativação do Roteiro de Empréstimos (12/06/2026)

Concluímos o registro oficial do novo painel de controle financeiro no roteador da aplicação, ativando formalmente o acesso direto e completo ao dashboard de empréstimos concedidos.

### O que mudou?
- **Ativação da Rota `/loans`:** O painel de Empréstimos Concedidos (`LoansDashboard`) agora está registrado na rota principal de navegação protegida da aplicação, permitindo que você navegue diretamente para as opções de amortização e visualização de saldos devedores de terceiros.
- **Carregamento Otimizado:** Implementada a importação estática do componente principal, reduzindo o delay perceptível ao alternar para o painel de controle de empréstimos.

## 🧹 Otimização de Performance e Faxina Técnica no Backend (12/06/2026)

Realizamos uma grande limpeza interna para remover códigos antigos que não são mais utilizados, melhorando a performance e a manutenção do sistema.

### O que mudou?
- **Remoção de Módulos Obsoletos:** Eliminamos completamente os antigos ViewSets, serializadores e serviços de gestão de dívidas (`SplitRule`, `Debt`, `DebtPayment`, `DebtCharge`, `Debtor`, `DebtItem`) que foram substituídos pela UX moderna de Empréstimos Concedidos (`LOAN_GIVEN`).
- **Remoção Física no Banco de Dados:** Excluímos as tabelas de dados de dívidas legadas e removemos as colunas e chaves estrangeiras obsoletas (`Transaction.split_rule`, `Transaction.shared_amount`, `Asset.linked_debt`) do banco de dados relacional.
- **Simplificação de Ativos:** O cálculo de valor dos ativos (Assets) foi simplificado para desvincular dívidas legadas, removendo o campo de dívida vinculada (`linked_debt`) dos endpoints de serialização.
- **Limpeza de Rotas:** Menos rotas ativas na API significam um backend mais leve e tempos de resposta ainda menores.

## 🤝 Novo Assistente de Divisão com Empréstimo no Lançamento de Transações (12/06/2026)

Lançar compras divididas com amigos ou familiares ficou muito mais simples e integrado às suas contas de empréstimo.

### O que mudou?
- **Divisão com Empréstimo Direto:** Ao lançar uma despesa, você pode marcar "Dividir compra com terceiros (Eles te devem)?" para abrir a nova interface.
- **Automação Contábil:** O Vault criará automaticamente a sua parte da despesa na conta de origem e criará transferências automáticas das partes dos terceiros para as contas de empréstimo (`LOAN_GIVEN`) selecionadas, com suporte opcional a categorias YNAB para orçamento base-zero.
- **Interface Limpa:** Removido o fluxo legado de regras de rateio complexas dentro do lançamento, proporcionando uma experiência de usuário simplificada.

## 🔄 Suporte a Categorias em Transferências para Orçamento Base-Zero (12/06/2026)

Agora você pode selecionar uma categoria ao realizar transferências de contas que estão no orçamento (On-Budget) para contas de acompanhamento ou empréstimos (Off-Budget).

### O que mudou?
- **Orçamento Base-Zero Preservado:** Toda transferência que retira dinheiro do seu orçamento principal agora exige/permite o vínculo a uma categoria, registrando corretamente a saída de fundos e evitando furos no orçamento.
- **Integração Total:** Atualizado o backend e o frontend para processarem a categoria na engine de transferências de transações.

## 🤝 Novo Painel de Controle de Empréstimos Concedidos (12/06/2026)

Facilitamos o controle dos empréstimos que você faz para amigos, familiares ou terceiros com uma tela dedicada.

### O que há de novo?
- **Visualização Clara:** Veja rapidamente o saldo total pendente de todos os empréstimos concedidos.
- **Amortização Simplificada:** Registre pagamentos parciais ou totais recebidos através do assistente de "Receber Pagamento", integrando os valores automaticamente de volta no seu RTA (Pronto para Atribuir).
- **Badge e Saldo Invertido:** Identificação fácil na lista de contas com o badge "A Receber" e exibição com destaque visual apropriado.

## 🐛 Correção de Crash ao Abrir Lançador de Transações (11/06/2026)

Corrigimos um erro técnico de carregamento de componente na abertura do modal de nova transação.

### O que mudou?
- **Estabilidade Garantida:** Corrigido o erro de carregamento (referente à inicialização de dados da conta) que impedia o formulário de se abrir corretamente.

## 💳 Sincronização Dinâmica do Formulário de Transações (11/06/2026)

Corrigimos a exibição de parcelamentos e opções de cartão de crédito no lançamento de transações.

### O que mudou?
- **Identificação Precisa:** Ao alterar uma conta para Conta Corrente (ou qualquer outro tipo não-crédito), o modal de transação reconhece instantaneamente a mudança e esconde o campo de "Parcelamento" na hora.

## 🛠️ Correções e Simplificação no Formulário de Edição de Conta (11/06/2026)

Corrigimos a validação no salvamento do tipo de conta e limpamos campos desnecessários no formulário para tornar a edição mais ágil.

### O que mudou?
- **Fim do Erro de Validação:** Ajustamos os valores internos do seletor para garantir compatibilidade com o servidor, permitindo salvar alterações sem falhas.
- **Formulário Mais Limpo:** Removemos o campo "Ícone da Conta" do formulário de edição de contas, reduzindo a complexidade visual do modal.

## 🧹 Simplificação do Menu de Ações da Conta (11/06/2026)

Removemos a opção "Adicionar Sub-conta" do menu de ações da conta para manter a interface mais limpa e focada no gerenciamento de contas principais.

### O que mudou?
- **Menu mais enxuto:** O menu de opções da conta agora exibe apenas as ações essenciais (Ver Detalhes, Editar, Mover Conta e Deletar), tornando a navegação mais rápida e livre de distrações.

## 🔄 Alteração Dinâmica do Tipo de Conta no Modal de Edição (11/06/2026)

Adicionamos um novo seletor de "Tipo de Conta" no modal de edição de contas! Agora ficou fácil alternar as suas contas entre Conta Corrente/Carteira, Cartão de Crédito e Acompanhamento.

### O que mudou?
- **Flexibilidade Total:** Errou o tipo de conta no cadastro? Não precisa excluir e recriar. Basta clicar em editar e selecionar o tipo correto no dropdown.
- **Ajuda Integrada:** O seletor conta com um guia rápido (tooltip) para explicar o comportamento de cada tipo (ex: cartões geram dívida, acompanhamento fica fora do orçamento).
- **Sincronização Imediata:** Ao trocar o tipo, as tags visuais e o comportamento no orçamento se atualizam na hora.

## 🏷️ Identificação Rápida de Tipos de Contas com Badges Visuais (11/06/2026)

Adicionamos badges visuais elegantes na listagem do seu painel de contas para diferenciar instantaneamente as contas de crédito e de acompanhamento.

### O que mudou?
- **Tag "Cartão":** Contas cadastradas como Cartão de Crédito (`CREDIT_CARD`) agora exibem uma tag dourada/amber com ícone de cartão para fácil identificação.
- **Tag "Acompanhamento":** Contas que servem apenas para controle de ativos ou investimentos (`TRACKING`) agora exibem uma tag azul/sky com ícone de gráfico.
- **Visualização Otimizada:** Mantém a interface limpa e elegante enquanto facilita a distinção visual do fluxo de caixa versus orçamento.

## 🔍 Busca Instantânea no Seletor de Categorias ao Lançar Transações (11/06/2026)

Lançar transações ficou ainda mais ágil! Integramos um seletor avançado com barra de busca na escolha de categorias ao adicionar ou editar despesas e receitas.

### O que há de novo?
- **Filtro em tempo real:** Agora você pode simplesmente digitar o nome da categoria no modal de transação para encontrá-la instantaneamente.
- **Paridade de Interface:** O mesmo visual e comportamento premium (popover moderno, navegação por setas do teclado e efeito de vidro) do seletor de contas foi portado para as categorias.
- **Navegação Inteligente:** Suporte total a teclado (setas para navegar, Enter para confirmar e Escape para fechar).

## 🌟 Novo Seletor de Categorias YNAB no Cartão de Crédito (10/06/2026)

Ficou muito mais fácil e intuitivo organizar os gastos do seu cartão de crédito! Substituímos o seletor antigo por um menu organizado pelas categorias de orçamento do YNAB.

### O que mudou?
- **Adeus Menu Confuso:** Antes, você via uma lista genérica de contas. Agora, as categorias são agrupadas de forma clara (ex: Sobrevivência, Lazer, Metas de Longo Prazo).
- **Validação Inteligente:** O sistema agora alerta claramente se você esquecer de escolher uma Categoria antes de confirmar sua compra.
- **Experiência Premium:** Menu mais elegante, de rolagem suave e com visual translúcido (efeito glassmorphism) combinando com o restante do aplicativo.
