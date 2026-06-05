# 🏢 Ativos Patrimoniais & Termômetro de Liquidez (Runway)

O Vault Finance OS oferece um módulo específico de **Net Worth & Assets (Patrimônio Líquido & Ativos)**, desenhado para ajudar você a cadastrar bens, vinculá-los a financiamentos e estimar sua resiliência financeira no curto e médio prazo.

---

## 1. O que são Ativos (Assets)?

No Vault, **Ativo** representa qualquer recurso de valor econômico que você possui. Isso inclui:
- **Reserva de Emergência / Investimentos Líquidos:** Contas bancárias e títulos resgatáveis.
- **Bens de Alto Valor:** Imóveis (casa, apartamento), automóveis (carros, motos), equipamentos profissionais de alto custo, joias ou obras de arte.
- **Investimentos de Longo Prazo:** Previdência privada ou fundos ilíquidos.

---

## 2. Níveis de Liquidez (Liquidity Tiers)

Cada ativo cadastrado no sistema deve ser classificado em um nível de liquidez, que determina a rapidez com que ele pode ser transformado em dinheiro vivo em caso de necessidade:
- **IMMEDIATE (Liquidez Imediata):** Dinheiro em mãos, saldo na conta corrente ou aplicações financeiras que você pode resgatar e usar no mesmo dia.
- **MEDIUM (Liquidez Média):** Ativos que levam alguns dias ou semanas para serem liquidados (ex: ações negociadas em bolsa, títulos de renda fixa com carência curta).
- **ILLIQUID (Ilíquido / Sem Liquidez):** Bens de difícil venda imediata (ex: imóveis, carros, maquinário comercial). Eles contam para o seu Patrimônio Líquido, mas são ignorados no cálculo do termômetro de liquidez.

---

## 3. Financiamentos e Valor Efetivo

Se você adquiriu um bem através de financiamento (ex: carro com alienação ou imóvel com hipoteca), você pode vinculá-lo a uma **Dívida** preexistente no Vault.

O Vault calcula o **Valor Efetivo** do seu ativo deduzindo a dívida restante do valor de mercado atual do bem:
$$\text{Valor Efetivo} = \max(\text{Valor de Mercado} - \text{Dívida Restante}, 0)$$

> [!TIP]
> Se o saldo devedor for maior que o valor de mercado (devido à desvalorização acelerada de um veículo, por exemplo), o Vault limita o valor efetivo a zero para não poluir o cálculo do seu patrimônio com saldos negativos fictícios.

---

## 4. O Termômetro de Liquidez (Financial Runway)

O **Financial Runway (Runway Months)** indica por quantos meses você conseguiria sobreviver sem nenhuma receita recorrente, mantendo seu padrão de gastos atual.

A fórmula utilizada pelo Vault é a seguinte:
$$\text{Meses de Runway} = \frac{\text{Ativos Líquidos (Immediate + Medium)}}{\text{Despesa Média Mensal}}$$

### Como calculamos a Despesa Média Mensal?
1. **Histórico Real de Transações:** O Vault analisa suas despesas reais (excluindo transferências internas entre suas contas) dos últimos 90 dias nas contas *on-budget* e extrai a média mensal.
2. **Orçamento Mensal (Fallback):** Se você for um usuário novo e ainda não tiver histórico de transações passadas, o Vault utilizará o total planejado em seu **Orçamento (Monthly Budget)** do mês atual para estimar seus gastos.
