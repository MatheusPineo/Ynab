# Novidades do Vault 💎

Fique por dentro das últimas melhorias e novos fluxos do sistema criados especialmente para otimizar sua experiência financeira.

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
