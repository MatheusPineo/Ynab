# Manual de Custódia: Gestão de Patrimônio e Investimentos (Smart Ledger)

A construção sustentável de riqueza exige uma governança clara e sem complicações. O módulo **Wealth & Investments** do Vault Finance OS funciona como um livro-razão de controle manual (**Smart Ledger**). Em vez de depender de estimativas automáticas complexas baseadas em curvas de juros teóricas ou impostos regressivos provisionados, o sistema se torna um CRUD inteligente focado nos saldos e rendimentos exatos que você declarar.

Dessa forma, o saldo de qualquer ativo e o seu patrimônio líquido consolidado refletem 100% a realidade dos seus lançamentos reais, sem surpresas matemáticas baseadas no tempo.

---

## 1. Como Funciona o Smart Ledger (Cálculo de Saldo)

O valor bruto de qualquer ativo (seja Renda Fixa ou Renda Variável) é determinado de forma estrita pela soma algébrica de suas movimentações reais declaradas:

$$\text{Valor Bruto} = \sum \text{Compras} - \sum \text{Vendas} + \sum \text{Rendimentos (YIELD)}$$

* **Compras (BUY):** Adiciona valor financeiro ao ativo e acumula a quantidade de cotas/ações.
* **Vendas (SELL):** Deduz valor financeiro do ativo e reduz a quantidade de cotas/ações.
* **Rendimento/Ajuste Manual (YIELD):** Adiciona valor financeiro diretamente ao saldo do ativo para representar juros creditados, dividendos que foram reinvestidos ou ajustes manuais para conciliar o saldo com o extrato real da corretora.

---

## 2. Atualização em Lote de Saldos (Batch Update)

Para economizar seu tempo, você não precisa criar lançamentos manuais de rendimento um a um para cada ativo no final do mês. O Vault Finance OS disponibiliza a funcionalidade de **Atualização em Lote**:

1. Vá para a tela de configurações ou painel de investimentos e acione a **Atualização de Saldos**.
2. Digite o saldo atualizado (declarado) de cada um dos seus ativos com base no extrato oficial da sua corretora ou banco.
3. O sistema calculará de forma automática a diferença:
   $$\text{Diferença} = \text{Saldo Declarado} - \text{Saldo Atual no Banco de Dados}$$
4. Se houver diferença, o sistema criará automaticamente um lançamento do tipo **Rendimento (YIELD)** com esse valor exato, reconciliando seu portfólio instantaneamente.

---

## 3. Distribuição Proporcional e Atualização em Cascata (Hierarquia Dinâmica)

O Vault Finance OS suporta gerenciamento inteligente de saldos em três níveis hierárquicos: **Conta de Custódia** (ex: Corretora Rico), **Macro Categoria** (ex: Ações) e **Ativo Unitário** (ex: PETR4).

### Fluxo Top-Down (De Cima para Baixo)
Se você atualizar diretamente o saldo total de uma **Macro Categoria** ou da **Conta de Custódia**:
* O sistema distribui automaticamente o valor novo entre os ativos filhos de forma **proporcional** ao saldo que cada um tinha anteriormente.
* **Fórmula do Ativo:** $NovoSaldoAtivo = SaldoAntigoAtivo \times \left(\frac{NovoSaldoMacro}{SaldoAntigoMacro}\right)$.
* **Tratamento de Zeros:** Se todos os ativos daquela categoria estivessem zerados, o novo saldo é distribuído igualmente.
* **Ajuste de Centavos:** Para evitar erros de arredondamento inerentes a números de ponto flutuante, a diferença residual de centavos é automaticamente somada ao ativo de maior valor da categoria.

### Fluxo Bottom-Up (De Baixo para Cima)
Se você editar o saldo de um **Ativo Unitário** individualmente:
* O sistema recalcula reativamente os totais em tela da **Macro Categoria** e da **Conta de Custódia** associada.
* Isso garante consistência visual imediata antes de consolidar os dados.

---

## 4. Preço Médio e Lucro/Prejuízo

O sistema gerencia de forma inteligente a base de custo do seu patrimônio:
* **Preço Médio Ponderado:** Calculado automaticamente a cada nova compra, considerando taxas e emolumentos declarados.
* **Lucro e Prejuízo (P/L):** Representa a diferença simples entre o saldo declarado do ativo e o seu custo de aquisição acumulado.
* **Rendimentos Isentos de Impostos Complexos:** Toda a dedução regressiva teórica de IRPF e IOF foi descontinuada. O saldo exibido no painel de controle é exatamente o saldo que você declara e acompanha, simplificando o controle fiscal e o fechamento mensal da sua carteira.
