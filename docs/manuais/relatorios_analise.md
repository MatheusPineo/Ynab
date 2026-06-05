# Manual Analítico: Relatórios, Gráficos e Simuladores

A gestão financeira de excelência não termina no registro das despesas; ela culmina na interpretação gráfica dos seus dados históricos para modelar um futuro seguro. O **Vault Finance OS** oferece uma suíte analítica baseada em reengenharia contábil (Backtracking) e simulação estratégica de patrimônio.

Neste manual, aprenderemos a interpretar as principais visões de diagnóstico do sistema.

---

## 1. Gráfico de Fluxo de Caixa (Backtracking Engine)

Diferente de gráficos simplistas que somam "Entradas menos Saídas" no final do mês, o nosso gráfico de fluxo de caixa gera uma linha de tendência baseada na sua liquidez real, dia após dia.

### Como a Engine de Backtracking Funciona
O sistema conhece o saldo exato que você tem em conta corrente **hoje**. Para desenhar a linha do passado:
1. Ele pega o seu saldo atual.
2. Ele anda para trás no tempo, **somando** o que foi gasto (devolvendo ao saldo) e **subtraindo** o que foi recebido.
3. Este processo reconstrói matematicamente o saldo exato que você possuía no bolso em cada dia do mês passado.
4. **Interpretação (Insights):** Observe a inclinação da linha no gráfico principal do Dashboard.
   * **Linha em queda abrupta no início do mês:** Indica má distribuição do orçamento, esgotando recursos logo após o dia de pagamento.
   * **Variações serrilhadas (Subidas e Descidas Constantes):** Típico de perfis empreendedores ou de quem recebe fluxos de pagamentos picados ao longo do mês.
   * **Linha plana ou em ascensão suave:** Demonstra estabilidade no acúmulo de capital.

---

## 2. A Regra 50-30-20 (Análise Real e Simulação)

A Regra 50-30-20 é o modelo universal de distribuição ideal de renda, onde **50%** é destinado a Necessidades Básicas, **30%** para Desejos/Estilo de Vida e **20%** para Construção do Futuro/Quitação de Dívidas. O Vault possui uma tela inteiramente dedicada a essa premissa.

### Modo Real (Auditoria de Hábitos)
No modo Real, a ferramenta se acopla ao seu banco de dados e avalia os seus gastos lançados:
* Os grupos orçamentários do sistema foram mapeados nativamente para respeitarem as métricas acima.
* **Leitura de Dados:** Se a sua aba de Desejos apontar, por exemplo, 45% (estourando a cota de 30%), a barra ficará em vermelho e o painel apontará o diagnóstico crítico: seu estilo de vida está sufocando a sua capacidade de poupar, ou você corre risco de comprometer as necessidades básicas.

### Modo Simulação Livre (Sandbox)
O painel também funciona como um laboratório de finanças.
* Você digita livremente um novo "Salário Alvo" hipotético.
* A calculadora fraciona os valores (Ex: para R$ 10.000, ela aloca R$ 5.000, R$ 3.000 e R$ 2.000).
* Útil para simular qual seria o seu novo padrão de vida ao receber um aumento de salário ou ao projetar os custos para trocar de emprego.

---

## 3. Gestão Abrangente de Dívidas e Passivos

Passivos que envolvem juros compostos agem de forma agressiva contra o seu patrimônio. Nossa aba estrutural de **Dívidas** foi projetada para que nenhum detalhe passe despercebido e você tenha o controle isolado e histórico do financiamento.

### Como Acompanhar Passivos de Forma Profissional
* **O Cartão Mestre da Dívida:** Ao registrar um empréstimo ou financiamento de longo prazo, ele ganha um painel exclusivo fora da zona do cartão de crédito.
* **Histórico Expandido (CRUD de Passivo):** Dentro de cada dívida aberta, você tem um submódulo que unifica duas ações temporais:
  1. **Acréscimos Contraídos (Juros):** Sempre que o banco credor aplicar a taxa de juros do mês, você registra um lançamento no card (aumentando a dívida de forma documentada).
  2. **Amortizações (Pagamentos):** Ao pagar as parcelas (usando seu dinheiro físico do envelope base), o registro aparece lado a lado subtraindo a dívida.
* **Visibilidade Clara:** Você acompanha não apenas o número diminuir, mas exatamente *o que* está afetando o número: os juros puxando para cima, e suas amortizações puxando para baixo. Isso traz clareza tática sobre a necessidade de adiantar parcelas para fugir da taxa de financiamento.

---

## 4. Modelos de Distribuição Avançados (Distribution Templates)

Os **Modelos de Distribuição** são gabaritos inteligentes criados para automatizar a dispersão em lote de grandes quantias recebidas de uma só vez (como salários, prêmios ou dividendos).

### Como Utilizar e Gerenciar
1. **O Atalho de Distribuição:** Ao receber uma receita (por exemplo, na homologação do Inbox Inteligente ou ao clicar em distribuir fundos), você pode abrir o modal de Distribuição Rápida.
2. **Distribuição em Lote por Contas e Envelopes:** O modelo aceita tanto subcontas físicas (bancos e carteiras) quanto categorias de envelopes do seu orçamento YNAB. Cada linha do template pode ser configurada com:
   * **Valor Fixo:** Garante que aquela categoria ou conta receberá exatamente o valor preestipulado (ex: R$ 1.500 para o aluguel).
   * **Percentual:** Distribui o valor restante ou global de forma proporcional (ex: 20% para a poupança).
3. **Navegação Inteligente de Configuração:** Se você precisar criar, editar as regras ou excluir um Modelo de Distribuição existente, clique no botão **"Gerenciar Modelos"** (ícone de engrenagem) disponível diretamente no cabeçalho do modal de distribuição. 
4. **Sincronização Ativa de Abas:** O sistema utiliza deep links baseados em parâmetros de URL (`?tab=templates`). Ao clicar no botão de gerenciamento, o Vault Finance OS redireciona você instantaneamente para `/settings?tab=templates`, abrindo a tela de configurações diretamente na aba correta e poupando cliques desnecessários de navegação.

