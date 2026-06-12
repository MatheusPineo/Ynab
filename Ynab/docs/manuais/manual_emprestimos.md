# Manual de Empréstimos Concedidos 🤝

O módulo de Empréstimos no Vault permite gerenciar de forma transparente o dinheiro que você emprestou para amigos, familiares ou terceiros, garantindo o alinhamento com seu orçamento base-zero.

## 💼 Contas do Tipo Empréstimo Concedido (`LOAN_GIVEN`)

Contas de Empréstimo são contas de **Acompanhamento (Off-Budget)**. Isso significa que o saldo contido nelas não faz parte do seu dinheiro "Pronto para Atribuir" (RTA) disponível para o orçamento diário.

- **Exibição Visual:** Elas se destacam no seu menu lateral com um badge vermelho/rose escrito **A Receber** e o ícone de aperto de mãos/moeda.
- **Saldo Invertido:** O saldo é exibido como um valor positivo a receber, facilitando o controle visual do total que terceiros te devem.

## 🔄 Como Registrar um Novo Empréstimo

Você tem duas formas principais de criar um saldo devedor de empréstimo:

1. **Lançamento Direto:** Crie uma nova conta com o tipo "Empréstimo Concedido (A Receber)" e configure o saldo inicial dela.
2. **Divisão de Despesa no Modal de Transações:** Ao lançar uma compra qualquer (por exemplo, um jantar de R$ 100 onde um amigo deve te pagar R$ 50), você pode usar o assistente de divisão:
   - Marque a opção de dividir compra.
   - Adicione a conta de empréstimo do seu amigo.
   - Defina a fatia dele (R$ 50).
   - O Vault criará automaticamente uma transferência no valor da fatia para a conta de empréstimo, criando a dívida a receber sem bagunçar suas despesas pessoais.

## 💰 Como Receber um Pagamento (Amortização)

Quando a pessoa te devolver o dinheiro (parcial ou integralmente), acesse o **Painel de Empréstimos** (`/loans`):

1. Clique na conta de empréstimo correspondente no painel.
2. Clique no botão **Receber Pagamento**.
3. Preencha o valor recebido e a conta de destino onde o dinheiro foi depositado (ex: sua Conta Corrente).
4. O sistema irá registrar uma transferência de devolução, reduzindo o saldo devedor e disponibilizando o dinheiro de volta na sua conta líquida e no seu orçamento (RTA).
