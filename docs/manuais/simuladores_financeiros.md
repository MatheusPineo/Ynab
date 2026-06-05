# Simuladores Financeiros Dinâmicos

A aba de **Planejamento** do Vault Finance OS oferece simuladores integrados reativamente com a sua realidade financeira. Diferente de simuladores convencionais na internet, as ferramentas coletam automaticamente seus dados reais de Patrimônio Líquido, despesas e taxa de poupança histórica para estimar metas de longo prazo.

---

## 1. Rumo ao Milhão (Millionaire Calculator)

Este simulador projeta em quanto tempo você acumulará **1 Milhão** na sua moeda base.

* **Patrimônio Líquido Inicial:** Pré-preenchido automaticamente com o somatório consolidado de todas as suas contas, mais o valor líquido efetivo de seus ativos, menos suas dívidas não vinculadas.
* **Aporte Mensal Previsto:** Pré-preenchido com base na sua média histórica real de economias mensais (receitas efetivadas menos despesas efetivadas no histórico de transações).
* **Retorno Anual Esperado:** Ajustável de acordo com as suas expectativas de rendimentos da carteira de investimentos (padrão em 8% a.a.).

### Visualização Gráfica
Um gráfico interativo em curva (área) projeta ano a ano a evolução do seu patrimônio acumulado (compostos por juros mensais) versus o total de dinheiro que você aportou manualmente.

---

## 2. Aposentadoria e Independência Financeira (FIRE)

O simulador **FIRE** (Financial Independence, Retire Early) calcula o capital necessário para que você viva exclusivamente do rendimento dos seus investimentos, cobrindo seu custo de vida atual.

* **Despesa Mensal Base:** Carrega dinamicamente a sua despesa média mensal real calculada na engine de Runway.
* **Taxa de Retirada Segura (Safe Withdrawal Rate):** Ajustável via controle deslizante (slider) de 2% a 6% ao ano (o padrão recomendado de mercado é 4% a.a.).
* **Número FIRE (Meta de Aposentadoria):** O montante ideal calculado para a independência financeira usando a regra matemática:
  $$\text{Meta FIRE} = \frac{\text{Despesa Mensal} \times 12}{\text{Taxa de Retirada}}$$
  *Exemplo: Para despesas de €3.000/mês e retirada de 4%, sua meta FIRE será de €900.000.*

### Diagnóstico de Atingimento
* **Progresso:** Exibe a porcentagem do seu patrimônio atual em relação à meta FIRE.
* **Atingimento Estimado:** Projeta o mês e ano exatos em que você atingirá a independência financeira caso mantenha a taxa de aporte atual e o rendimento projetado.
