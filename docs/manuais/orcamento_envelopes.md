# Manual de Operação: Metodologia de Envelopes (Orçamento Base-Zero)

Bem-vindo ao coração do **Vault Finance OS**. Nosso sistema de controle orçamentário não se baseia em tentar adivinhar o futuro, mas sim em gerenciar com precisão absoluta a realidade do seu fluxo de caixa atual. 

Neste manual, ensinaremos como dominar as quatro engrenagens do nosso motor financeiro: o indicador RTA, a hierarquia de envelopes, a passagem automática de mês (Rollover) e as metas avançadas.

---

## 1. A Regra de Ouro: O Indicador RTA (Pronto para Atribuir)

Sempre que um novo dinheiro entra fisicamente em uma de suas contas correntes (salário, venda, rendimentos reais), ele vai direto para um grande funil principal que chamamos de **RTA (Ready to Assign)**, ou **"Pronto para Atribuir"**.

A regra número um da metodologia Base-Zero é nunca deixar dinheiro parado nesse funil.

* **Dar um trabalho para cada centavo:** Sua missão mensal é entrar no painel de Orçamento e mover o saldo do RTA para os seus envelopes específicos, até que o número verde no topo da tela fique **exatamente em R$ 0,00**.
* **Prevenção ao Caos:** Se o seu RTA estiver positivo, significa que você tem dinheiro vulnerável sem propósito definido. Se estiver vermelho (negativo), você orçou mais dinheiro nos envelopes do que realmente tem na conta corrente física, gerando um risco fatal de superendividamento (Overdraft).

> [!TIP]
> **Dica de Ouro:** Não conte com dinheiro que você "vai receber" semana que vem. O Vault Finance OS obriga você a lidar apenas com a liquidez que já está no seu bolso.

---

## 2. Estruturação: Grupos e Sub-envelopes

Para que o seu orçamento não seja uma lista confusa, o sistema implementa categorias infinitamente recursivas e expansíveis. 

* **Grupos Pai (Master Categories):** São as grandes fatias do seu orçamento. Exemplos: `Despesas Fixas`, `Qualidade de Vida`, `Saúde`, `Metas de Longo Prazo`.
* **Sub-envelopes (Sub-categories):** Onde o dinheiro de fato é alocado. Dentro de "Despesas Fixas", você pode criar as gavetas `Aluguel`, `Luz`, `Internet`.
* **Como distribuir:** Clique no campo "Designado" de um sub-envelope e digite o valor que deseja colocar lá dentro. O montante será automaticamente deduzido do RTA e o campo "Disponível" do envelope ficará verde. 

Quando você lançar uma despesa na tela de Transações utilizando este envelope, o sistema fará a subtração imediata. Se o gasto for maior do que o montante que estava lá dentro, o envelope ficará vermelho sinalizando estouro de orçamento (*Overspending*).

---

## 3. A Virada de Mês e o Rollover Automático (MoM)

Diferente de sistemas tradicionais que "resetam" as categorias no dia 1º, nosso motor YNAB perpetua a contabilidade mês a mês com integridade garantida (`YNABBudgetService`).

* **Saldos Positivos Rolam para o Próximo Mês:** Se você designou R$ 500 para `Alimentação`, mas gastou apenas R$ 400 em maio, no dia 1º de junho você terá um saldo inicial no envelope de `Alimentação` de **R$ 100**. Você economizou, e o dinheiro fica garantido!
* **Dívidas de Dinheiro Físico (Cash Overspending):** Se um envelope ficar negativo em vermelho porque você gastou dinheiro da conta corrente que não estava orçado, no mês seguinte o sistema fará um acerto de contas brutal: esse déficit será deduzido inteiramente e diretamente do seu RTA (Ready to Assign) do novo mês.
* **Dívidas de Crédito (Credit Overspending):** Se o envelope ficar negativo porque você lançou compras no cartão de crédito, o déficit não prejudicará o seu RTA futuro. O sistema transforma essa diferença em "dívida flutuante" dentro da conta de Passivo do cartão, sinalizando que você tem uma fatura futura não-financiada.

> [!WARNING]
> Nunca deixe um mês fechar com envelopes em vermelho na conta corrente (Cash). Cubra os excessos imediatamente realocando dinheiro de envelopes mais robustos ("Role para os socos"). A matemática não perdoa quebras de caixa!

---

## 4. O Motor de Metas de Acúmulo

A organização não serve apenas para pagar contas, mas para acumular riqueza. O Vault Finance OS possui um simulador de Metas acoplado a qualquer sub-envelope.

**Como configurar uma Meta:**
1. Selecione um envelope que você deseja utilizar como poupança, por exemplo: `Trocar de Carro`.
2. Acesse a aba de propriedades e crie uma meta de **Acúmulo Alvo** (Target Balance).
3. Defina o valor financeiro (Ex: R$ 30.000) e uma data limite final (Ex: Dezembro de 2026).
4. O sistema processará automaticamente a matemática de divisão pelo tempo restante e gerará uma sugestão proativa: "Designar R$ 800 este mês para manter-se na rota".

As metas são sinalizadas no painel de controle por pequenas barras de progresso circulares acopladas ao lado de cada envelope, mantendo você sempre orientado em direção à construção dos seus objetivos financeiros de curto e longo prazo.
