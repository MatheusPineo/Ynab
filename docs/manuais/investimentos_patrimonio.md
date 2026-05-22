# Manual de Custódia: Gestão de Patrimônio e Investimentos (Wealth Tracker)

A construção sustentável de riqueza exige uma governança milimétrica sobre a sua custódia e rentabilidade passiva. O módulo **Wealth & Investments** do Vault Finance OS atua como um livro-razão institucional, monitorando cada movimentação financeira sua — desde ações no exterior até CDBs nacionais — aplicando matemática avançada para lhe apresentar o verdadeiro ganho líquido da sua carteira.

Este documento delineia o funcionamento técnico das duas vertentes de portfólio suportadas: **Renda Variável/Criptoativos** e a sofisticada arquitetura de **Renda Fixa Brasileira**.

---

## 1. Renda Variável e Criptoativos (Preço Médio e Ledger Histórico)

Ativos negociados em bolsa, fundos ou mercados descentralizados sofrem oscilação diária (marcação a mercado). O acompanhamento manual dessas movimentações, especialmente após aportes recorrentes e vendas parciais, costuma ser uma tarefa altamente complexa. 

**Como gerenciar no Vault Finance OS:**
1. **Atividades Base (Livro-Razão):** Toda nova operação no mercado deve ser lançada como uma atividade em seu painel de inventário através dos seletores: `Compra` (Aporte), `Venda` (Resgate), `Desdobramento` (Split) ou `Dividendo` (Rendimento isento/tributável).
2. **Cálculo de Preço Médio Ponderado (Weighted Average Cost):** Quando você efetua aportes parciais (ex: compra 10 cotas a R$ 100,00 e, meses depois, 20 cotas a R$ 80,00), a `PortfolioEvolutionEngine` do sistema refaz integralmente o seu histórico. Ela calcula atômica e matematicamente o novo custo base unitário exato, ajustando automaticamente a proporção de capital comprometido caso você venda uma fatia do ativo.
3. **Sincronia de Cotação Diária:** O sistema se conecta passivamente ao motor externo `MarketDataService` e busca a última cotação global de fechamento da bolsa, cruzando o seu *Preço Médio* com a *Cotação Atual* para gerar o indicador visual P/L (Lucro e Prejuízo) colorido em tempo real no dashboard.

---

## 2. Renda Fixa Pós-Fixada Brasileira (Engine Matemática CDI Base 252)

A Renda Fixa não é "fixa" sem matemática robusta. O cálculo de evolução financeira no mercado nacional obedece à rígida regulamentação de 252 Dias Úteis aplicada às curvas de juros (CDI e Taxa Selic).

**Dinâmica de Capitalização (Acrual):**
* Ao registrar um ativo bancário (ex: um CDB de 105% do CDI ou uma LCI Itaú), você declara o "Valor Principal" aportado.
* Diferente da Renda Variável que oscila com oferta e demanda, a evolução da Renda Fixa Brasileira é computada **dia após dia, de forma retroativa**, desde a data da sua aplicação.
* **O Limpador de Feriados:** A nossa Engine varre a taxa referencial da tabela histórica (`DailyCDIRate`). O capital apenas sofre capitalização diária (juros compostos) se o dia for **Útil**. Sábados, Domingos e feriados bancários (deduzidos automaticamente via cálculo de Páscoa/Carnaval) não incidem capitalização, gerando a "falsa" estagnação de saldos nos finais de semana de acordo com o padrão do Banco Central.

---

## 3. Marcação a Mercado e Dedução Automática de Impostos (IR / IOF)

A maior ilusão de um portfólio amador é avaliar a rentabilidade baseada no saldo bruto. O Vault Finance OS blinda suas expectativas de capital fatiando agressivamente as despesas federais e fiscais *antes* de lhe mostrar seu saldo na tela.

### Tributação Dinâmica e Provisionada
A engine (`BrazilianFixedIncomeEngine`) aplica, de forma automatizada, um desconto de tributos projetados como se você realizasse o resgate total do ativo **hoje**:

* **IOF (Imposto sobre Operações Financeiras):** Se o seu título possuir menos de 30 dias na carteira, o sistema abate a tabela de IOF (que decrece diariamente e aniquila até 96% do rendimento no 1º dia).
* **IRPF Regressivo da Renda Fixa:** Se o seu título for sujeito à taxação tributária (como CDBs ou Tesouro Direto), a inteligência do sistema calcula o seu dia exato de resgate virtual, alinha com a Tabela Regressiva Nacional da Receita Federal e provisiona apenas a alíquota respectiva em cima do juro auferido (e não do principal).

> [!WARNING]
> **Dashboard Líquido (Net Wealth):** O grande número visualizado no seu cartão de "Patrimônio Total" já deduz integralmente essas variáveis operacionais. É o capital exato que entraria na sua conta corrente se o resgate ocorresse neste mesmo instante.

### Referência: Tabela Regressiva do IR (Renda Fixa Brasileira)

A engine matemática transita fluidamente de camada tributária com base no prazo corrido de custódia (data da aplicação até o momento atual):

| Prazo de Permanência na Custódia (Dias Corridos) | Alíquota Imposto de Renda (%) |
| :--- | :--- |
| **Até 180 dias** (0 a 6 meses) | 22,5% |
| **De 181 a 360 dias** (6 meses a 1 ano) | 20,0% |
| **De 361 a 720 dias** (1 ano a 2 anos) | 17,5% |
| **Acima de 720 dias** (Mais de 2 anos) | 15,0% |
