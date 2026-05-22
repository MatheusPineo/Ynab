# Manual de Operação: Cartões de Crédito e Gestão de Faturas

Cartões de crédito não são dinheiro vivo, mas sim um instrumento de transferência de liquidez. O **Vault Finance OS** foi desenhado para tratar cartões de crédito não como um meio de se endividar às cegas, mas como uma ferramenta inteligente acoplada diretamente ao seu saldo físico.

Este manual explica a mecânica de Reserva Automática (Ynab), o complexo motor de fracionamento de parcelas e as regras do ciclo de faturamento.

---

## 1. A Mágica da Reserva de Pagamento Automática

Diferente de sistemas de controle comuns em que o cartão de crédito fica isolado, no nosso motor, uma compra no cartão é imediatamente confrontada com a realidade do seu fluxo de caixa na conta corrente.

### O que acontece nos bastidores de uma compra?
1. Você tem R$ 100,00 no seu envelope de `Alimentação`.
2. Você vai ao restaurante e gasta R$ 60,00 utilizando o "Cartão Black".
3. **A Mágica:** O sistema deduzirá R$ 60,00 do seu envelope de `Alimentação` (seu gasto foi concretizado) e, simultaneamente, transferirá esse dinheiro físico para um envelope especial e protegido de **"Pagamento do Cartão Black"**.

**O resultado:** O dinheiro que você usou para pagar o restaurante já saiu do seu orçamento de forma limpa, e agora está "guardado" no seu saldo esperando o momento exato em que a fatura vencer para ser transferido para o banco emissor do cartão. Sem surpresas no fim do mês!

> [!TIP]
> Se o envelope de Pagamento do Cartão estiver com a barra verde completa, significa que 100% da sua fatura atual já possui cobertura (funding) real com dinheiro do seu banco. Quitar a fatura se torna um simples evento de transferência.

---

## 2. O Impacto do Dia de Fechamento (O Melhor Dia de Compra)

O ciclo de faturamento de um cartão obedece rigidamente à variável `closing_day` (Dia de Fechamento) cadastrada durante a criação do cartão. A janela de corte dita para qual mês a primeira parcela será alocada.

### O Algoritmo de Alocação de Faturas

| Cenário de Lançamento | Regra Algorítmica | Para Onde Vai a Fatura? |
| :--- | :--- | :--- |
| **Antes do Fechamento** (`date < closing_day`) | A fatura do mês corrente ainda não foi fechada. | Cobrada e acumulada na fatura do **próprio mês atual**. |
| **No Dia ou Após Fechamento** (`date >= closing_day`) | O ciclo do mês encerrou. Começa o "Melhor dia para compra". | Transferida automaticamente para o ciclo do **mês seguinte**. |

> [!WARNING]
> O Vault Finance OS realiza este cálculo de forma atômica no backend (`process_credit_card_transaction`). Você nunca deve mentir a data real da transação para jogar para o mês seguinte; insira a data verdadeira e o motor fará a alocação de tempo para a fatura correspondente.

---

## 3. Lançamento e Fatiamento de Compras Parceladas

O parcelamento é processado através do nosso motor de fatiamento atômico, garantindo consistência na linha do tempo independentemente do tamanho ou valor quebrado da despesa.

**Como registrar um parcelamento:**
1. Na tela de **Nova Transação**, selecione sua conta de Cartão de Crédito.
2. Insira o **Valor Total** da compra (Ex: R$ 1.500,00). 
3. No campo numérico `Parcelas`, informe a quantidade desejada (Ex: 10x).
4. Confirme a categoria orçamentária (Ex: Eletrônicos) e a data da transação.

**O que o Motor YNAB faz de forma silenciosa:**
* Ele criará a **Transação Matriz (`CreditCardTransaction`)** constando R$ 1.500,00 no dia de hoje para o histórico e tracking de auditoria.
* Ele quebrará o valor de maneira milimétrica e lançará dez registros individuais de faturas (`Installment`) de R$ 150,00.
* A alocação obedecerá a regra do Dia de Fechamento: se hoje for antes da data de corte, a primeira parcela cai na fatura atual e as próximas 9 seguem a sequência. Caso a compra seja efetuada no "Melhor dia de compra", a primeira parcela começará no ciclo seguinte.
* **Reserva Gradual de Caixa:** Mês a mês, quando o mês vira, a parcela da fatura subtrai o seu respectivo envelope e vai enchendo o envelope de pagamento do cartão. O sistema processa o endividamento passivo conforme o tempo passa, protegendo a sua liquidez hoje.
