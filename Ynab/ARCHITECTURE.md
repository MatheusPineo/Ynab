# Arquitetura Técnica — Vault OS 💎

Este documento descreve cirurgicamente a arquitetura técnica do módulo de Finanças, com destaque especial para o fluxo de Cartões de Crédito e Integração com Categorias YNAB.

## 📌 Visão Geral do Módulo de Cartões de Crédito

O arquivo `src/modules/finance/pages/CreditCards.tsx` gerencia a interface do usuário para visualização e lançamento de despesas em cartões de crédito.

### Fluxo de Lançamento de Transação
1. **Escolha da Categoria de Despesa:** O usuário seleciona a categoria através do `GlobalCategorySelector` (que fornece busca de texto, popover do Radix UI estruturado hierarquicamente por Grupos de Categorias `categoryGroups` e controle de teclado).
2. **Validação:** É validado se uma categoria YNAB válida foi selecionada (`categoryId`).
3. **Persistência / API:** A transação é enviada para a API do backend `/credit-cards/{id}/create_transaction/`, que debita o saldo da categoria orçamentária e provisiona o pagamento na fatura do cartão correspondente.

## 🔄 Fluxo de Dados YNAB
- O hook de estado global `useAccountStore` expõe a lista de categorias organizadas em grupos (`categoryGroups`), bem como os métodos de sincronização `fetchCategoryGroups()` e resolvedores como `getCategoryName()`.
- O modal de compras de cartão de crédito e o modal global de lançamento de transações (`AddTransactionModal.tsx`) utilizam o `GlobalCategorySelector` para seleção de categorias com busca e filtragem dinâmica.

