# Integração com Métodos de Orçamento (YNAB / Actual Budget) 📈

O Vault foi desenhado para seguir os princípios de orçamento envelope (Zero-Based Budgeting), onde cada centavo possui um trabalho específico.

## 📥 Como Funciona o Fluxo de Gastos no Cartão
Sempre que você lança uma transação em um cartão de crédito no Vault, o sistema interage com as categorias de despesa do YNAB de forma imediata:
1. O sistema verifica se há saldo suficiente na categoria selecionada.
2. O Vault realiza o débito virtual da categoria orçamentária.
3. Esse valor é transferido internamente para a obrigação de pagamento do cartão de crédito.
4. Quando a fatura fecha e você realiza o pagamento, o saldo reservado do cartão de crédito é usado para liquidar a fatura, mantendo seu patrimônio consolidado redondo e sem furos.
