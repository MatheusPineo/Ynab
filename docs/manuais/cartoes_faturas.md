# Manual de OperaÃ§Ã£o: CartÃµes de CrÃ©dito e GestÃ£o de Faturas

CartÃµes de crÃ©dito nÃ£o sÃ£o dinheiro vivo, mas sim um instrumento de transferÃªncia de liquidez. O **Vault Finance OS** foi desenhado para tratar cartÃµes de crÃ©dito nÃ£o como um meio de se endividar Ã s cegas, mas como uma ferramenta inteligente acoplada diretamente ao seu saldo fÃ­sico.

Este manual explica a mecÃ¢nica de Reserva AutomÃ¡tica (Ynab), o complexo motor de fracionamento de parcelas e as regras do ciclo de faturamento.

---

## 1. A MÃ¡gica da Reserva de Pagamento AutomÃ¡tica

Diferente de sistemas de controle comuns em que o cartÃ£o de crÃ©dito fica isolado, no nosso motor, uma compra no cartÃ£o Ã© imediatamente confrontada com a realidade do seu fluxo de caixa na conta corrente.

### O que acontece nos bastidores de uma compra?
1. VocÃª tem R$ 100,00 no seu envelope de `AlimentaÃ§Ã£o`.
2. VocÃª vai ao restaurante e gasta R$ 60,00 utilizando o "CartÃ£o Black".
3. **A MÃ¡gica:** O sistema deduzirÃ¡ R$ 60,00 do seu envelope de `AlimentaÃ§Ã£o` (seu gasto foi concretizado) e, simultaneamente, transferirÃ¡ esse dinheiro fÃ­sico para um envelope especial e protegido de **"Pagamento do CartÃ£o Black"**.

**O resultado:** O dinheiro que vocÃª usou para pagar o restaurante jÃ¡ saiu do seu orÃ§amento de forma limpa, e agora estÃ¡ "guardado" no seu saldo esperando o momento exato em que a fatura vencer para ser transferido para o banco emissor do cartÃ£o. Sem surpresas no fim do mÃªs!

> [!TIP]
> Se o envelope de Pagamento do CartÃ£o estiver com a barra verde completa, significa que 100% da sua fatura atual jÃ¡ possui cobertura (funding) real com dinheiro do seu banco. Quitar a fatura se torna um simples evento de transferÃªncia.

---

## 2. O Impacto do Dia de Fechamento (O Melhor Dia de Compra)

O ciclo de faturamento de um cartÃ£o obedece rigidamente Ã  variÃ¡vel `closing_day` (Dia de Fechamento) cadastrada durante a criaÃ§Ã£o do cartÃ£o. A janela de corte dita para qual mÃªs a primeira parcela serÃ¡ alocada.

### O Algoritmo de AlocaÃ§Ã£o de Faturas

| CenÃ¡rio de LanÃ§amento | Regra AlgorÃ­tmica | Para Onde Vai a Fatura? |
| :--- | :--- | :--- |
| **Antes do Fechamento** (`date < closing_day`) | A fatura do mÃªs corrente ainda nÃ£o foi fechada. | Cobrada e acumulada na fatura do **prÃ³prio mÃªs atual**. |
| **No Dia ou ApÃ³s Fechamento** (`date >= closing_day`) | O ciclo do mÃªs encerrou. ComeÃ§a o "Melhor dia para compra". | Transferida automaticamente para o ciclo do **mÃªs seguinte**. |

> [!WARNING]
> O Vault Finance OS realiza este cÃ¡lculo de forma atÃ´mica no backend (`process_credit_card_transaction`). VocÃª nunca deve mentir a data real da transaÃ§Ã£o para jogar para o mÃªs seguinte; insira a data verdadeira e o motor farÃ¡ a alocaÃ§Ã£o de tempo para a fatura correspondente.

---

## 3. LanÃ§amento e Fatiamento de Compras Parceladas

O parcelamento Ã© processado atravÃ©s do nosso motor de fatiamento atÃ´mico, garantindo consistÃªncia na linha do tempo independentemente do tamanho ou valor quebrado da despesa.

**Como registrar um parcelamento:**
1. Na tela de **Nova TransaÃ§Ã£o**, selecione sua conta de CartÃ£o de CrÃ©dito.
2. Insira o **Valor Total** da compra (Ex: R$ 1.500,00). 
3. No campo numÃ©rico `Parcelas`, informe a quantidade desejada (Ex: 10x).
4. Confirme a categoria orÃ§amentÃ¡ria (Ex: EletrÃ´nicos) e a data da transaÃ§Ã£o.

**O que o Motor YNAB faz de forma silenciosa:**
* Ele criarÃ¡ a **TransaÃ§Ã£o Matriz (`CreditCardTransaction`)** constando R$ 1.500,00 no dia de hoje para o histÃ³rico e tracking de auditoria.
* Ele quebrarÃ¡ o valor de maneira milimÃ©trica e lanÃ§arÃ¡ dez registros individuais de faturas (`Installment`) de R$ 150,00.
* A alocaÃ§Ã£o obedecerÃ¡ a regra do Dia de Fechamento: se hoje for antes da data de corte, a primeira parcela cai na fatura atual e as prÃ³ximas 9 seguem a sequÃªncia. Caso a compra seja efetuada no "Melhor dia de compra", a primeira parcela comeÃ§arÃ¡ no ciclo seguinte.
* **Reserva Gradual de Caixa:** MÃªs a mÃªs, quando o mÃªs vira, a parcela da fatura subtrai o seu respectivo envelope e vai enchendo o envelope de pagamento do cartÃ£o. O sistema processa o endividamento passivo conforme o tempo passa, protegendo a sua liquidez hoje.

### ?? Calculadora Inteligente de Parcelas (Total vs Parcela)
Quando você realiza uma compra parcelada, o Vault Finance OS facilita a matemática para você. Abaixo do campo de parcelas, você encontra o **Toggle Inteligente**:
- **Valor Total:** Se a compra foi de R$ 1000,00 em 10x, digite 1000 e selecione *Valor Total*. O sistema exibirá o alerta didático de que criará 10 parcelas de R$ 100,00.
- **Valor da Parcela:** Se você sabe apenas que vai pagar 10x de R$ 100,00, basta digitar 100 e selecionar *Valor Parcela*. O sistema escalará matematicamente a Compra Matriz para R$ 1000,00 no ato da dedução de limite, garantindo a paridade do livro-razo sem exigir que voc use calculadoras externas!

---

## 4. Estratégia Regional (Brasil vs Portugal)

Para atender de forma nativa e transparente as diferenças operacionais de cartões e terminais de pagamento na Europa e na América Latina, o **Vault Finance OS** implementa comportamentos inteligentes dependendo do país de emissão do seu cartão de crédito:

### 🇧🇷 Regras para Cartões Emitidos no Brasil (BR)
* **Parcelamento na Maquininha**: O parcelamento diretamente no terminal de pagamento (POS) pelo estabelecimento parceiro é totalmente suportado. Ao lançar uma compra parcelada, o motor fatiará o valor nas respectivas faturas subsequentes conforme selecionado.
* **Modalidade de Pagamento**: O pagamento padrão é feito por reembolso total (100%) da fatura no dia do vencimento.

### 🇵🇹 Regras para Cartões Emitidos em Portugal (PT)
* **Sem Parcelamento no POS (Bypass de Maquininha)**: Terminais de pagamento locais em Portugal (Rede Multibanco) não possuem a opção de parcelar compras diretamente no estabelecimento. Portanto, ao lançar uma compra no cartão 'PT', o Vault Finance OS **força a transação a ser criada em parcela única (1x - Débito Diferido/Deferred Debit)**, ignorando qualquer opção de parcelamento preenchida.
* **Modalidades de Reembolso Locais (Settlement Modes)**:
  * **100% de Reembolso (Fim do Mês / FULL_REIMBURSEMENT)**: O valor total acumulado no mês é debitado diretamente da sua conta corrente na data de vencimento (modalidade padrão).
  * **Crédito Rotativo (Pagamento Parcial / REVOLVING_CREDIT)**: Permite pagar apenas uma fração configurada da fatura (ex: 5%, 10% ou 20%), acumulando o restante com incidência de juros. O sistema suporta a definição da porcentagem de pagamento mínimo.
  * **Pagamento Fracionado (FRACTIONED)**: Em Portugal, o fracionamento ou parcelamento de compras não ocorre na maquininha, mas sim *a posteriori* através da app do banco emissor (ex: fracionar compra em 3x após o gasto ocorrer). O Vault Finance OS permite gerenciar essas modalidades diretamente nas configurações de cada cartão.

---

## 5. Pagamento Avançado de Faturas (Experiência Interativa em 3 Abas)

O **Vault Finance OS** implementa um motor de dedução diferida para faturas de cartão de crédito. Quando a compra ocorre, o dinheiro não sai da subconta real no YNAB, mas entra em um estado "Reservado" (`reserved_credit_balance`).

Para acompanhar esse saldo reservado de forma transparente, a tela de detalhes de cada subconta apresenta um **Gráfico Donut de Distribuição de Saldo**:
* **Disponível para Gastos (Verde)**: O saldo livre e utilizável para despesas.
* **Reservado para Cartão (Âmbar)**: O saldo bloqueado e garantido para o pagamento de parcelas futuras.

A dedução física dos saldos ocorre somente ao realizar o pagamento da fatura (`pay_bill`) através do **Modal de Pagamento Avançado de Fatura**, que oferece uma interface premium em 3 abas distintas de liquidação:

### 1. Aba "Escolher Compras" (Modo ITEMIZED)
* **Como funciona:** Exibe a lista completa de compras e parcelas pendentes da fatura com caixas de seleção (checkboxes) individuais.
* **Experiência Visual:** Você pode marcar ou desmarcar livremente itens específicos. O modal calcula e exibe em tempo real o valor total consolidado na parte inferior.
* **Indicação de Uso:** Ideal para conciliar compras específicas do cartão que você já deseja dar baixa em seus respectivos envelopes de orçamento.

### 2. Aba "Digitar Valor" (Modo FIFO)
* **Como funciona:** Permite que você digite um valor fixo (ex: R$ 50,00) que deseja pagar. O sistema consome esse montante abatendo as parcelas da fatura na ordem cronológica (da mais antiga para a mais nova).
* **Experiência Visual (Simulação FIFO em Tempo Real):** Ao digitar o valor, o modal simula a fila de forma visual e instantânea: as parcelas cobertas pelo valor são marcadas automaticamente com um checkmark verde, e se o valor terminar no meio de uma parcela (cobertura parcial), uma **barra de progresso fluida** é exibida sob aquela parcela mostrando a fração coberta.
* **Indicação de Uso:** Perfeito para pagamentos avulsos ou parciais de faturas quando você possui um montante fixo em mãos. O sistema lida com o fracionamento e joga o valor restante da parcela para a fatura do mês seguinte de forma automática.

### 3. Aba "Porcentagem" (Modo PERCENTAGE)
* **Como funciona:** Aplica uma taxa de desconto percentual uniforme a todos os lançamentos ativos da fatura.
* **Experiência Visual:** Equipado com um controle deslizante (**Slider interativo**) de 1% a 100% que funciona em perfeita sincronia com um input numérico manual. O valor monetário total que será debitado é exibido instantaneamente no resumo de distribuição pro-rata.
* **Indicação de Uso:** Ideal para amortizar a fatura como um todo mantendo a proporcionalidade das parcelas (ex: pagar 50% de todas as despesas da fatura). O saldo remanescente de cada compra (ex: os outros 50%) é empurrado automaticamente para o ciclo subsequente.

