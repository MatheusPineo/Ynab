# Novidades e Atualizações

## Motor de Amortização FIFO e Devedores Agrupados (29/05/2026) 👥💰
Introduzimos o Motor de Quitação FIFO Agrupado para roommates e divisão de contas! Agora gerenciar despesas compartilhadas e recebimentos ficou totalmente automatizado e integrado aos envelopes do orçamento:
* **Amortização em Fila Cronológica (FIFO):** Registre os pagamentos feitos pelos seus devedores de forma agrupada por envelope de despesa. O sistema varre as dívidas na ordem cronológica de vencimento (as mais antigas primeiro), liquidando-as sequencialmente e realizando o fracionamento (*split*) caso o pagamento seja parcial.
* **Cadastro de Itens em Lote (Bulk Creation):** Lançamos o suporte para cadastrar múltiplos itens de dívida de uma só vez para um roommate em uma subconta (`add_items`). Essa ação apenas gera os registros internos de auditoria de dívida sem duplicar a dedução no saldo do envelope físico de origem (uma vez que você já registrou o gasto total no sistema, ex: a nota do supermercado).
* **Injeção Atômica de Saldos:** Cada pagamento recupera instantaneamente o saldo do respectivo envelope de despesa de origem, curando os furos causados pelos gastos compartilhados.
* **Livro Razão Transparente:** Cada amortização gera um lançamento detalhado de receita no histórico do envelope, garantindo rastreabilidade completa.
* **Visualização Agrupada Inteligente:** A interface de devedores agora consolida as dívidas pendentes por subconta/envelope, mostrando o saldo total a receber por categoria de forma resumida e permitindo expandir para auditar cada item individual.

## Metas Inteligentes de Envelopes, Alocação Rápida e Rebalanceamento Automático (29/05/2026) 🎯✨
Revolucionamos a forma de orçar e distribuir o seu dinheiro no Vault Finance OS! Agora você conta com um motor de automação avançado e controles de rebalanceamento rápido integrados diretamente ao cabeçalho do seu Orçamento:

* **Novas Metas e Tetos de Gastos:** Configure regras proativas para cada sub-envelope (categoria):
  * *Metas Fixas:* Valor exato a ser alocado todo mês.
  * *Metas Percentuais:* Permite direcionar frações percentuais do seu orçamento total (ideal para aportes ou divisão clássica como 50/30/20).
  * *Tetos de Acúmulo (Ceilings):* Impede o acúmulo desmedido de sobras em um envelope, garantindo maior liquidez para outras gavetas.
* **Smart Income Allocation (Distribuição Inteligente):** No topo do Orçamento, você tem um painel intuitivo exibindo o saldo do seu RTA (**"X€ Disponível para Atribuir"** em verde). Através do novo modal de distribuição de renda, você pode orçar tudo com um clique:
  * *Metas Recorrentes (`RECURRING_TARGETS`):* Preenche automaticamente todos os envelopes com base nas suas metas cadastradas.
  * *Excedente Proporcional (`EXTRA_PROPORTIONAL`):* Distribui sobras ou rendas extras de forma balanceada e proporcional entre suas prioridades padrão.
* **Rebalanceamento de Um Clique:**
  * *Ajustar ao Teto (`REBALANCE_TO_CEILING`):* Recolhe o dinheiro que excedeu o teto de gastos configurado nos envelopes e devolve tudo instantaneamente para o seu RTA.
  * *Zerar Envelopes Estourados (`REBALANCE_ZERO_OVERSPENT`):* Cobre todos os envelopes que ficaram negativos com dinheiro do RTA de forma automática, garantindo uma virada de mês limpa.

## Modal Interativo de Pagamento Triplo de Faturas (28/05/2026) 💳✨
Construímos uma interface inovadora e interativa de pagamento de faturas de cartão de crédito. Agora, ao clicar em "Pagar Fatura" nas Transações ou nos Detalhes da Fatura, você tem acesso a 3 abas inteligentes com simulações visuais em tempo real:
* **Escolher Compras (Modo Itemizado):** Permite selecionar individualmente quais parcelas e compras deseja quitar nesta fatura. O sistema calcula a soma acumulada de forma instantânea.
* **Digitar Valor (Modo FIFO):** Digite um valor fixo e veja a mágica acontecer! O modal calcula de forma cronológica quais parcelas seriam liquidadas e exibe uma barra de progresso visual fluida na parcela que receber pagamento parcial (split), ajudando você a visualizar o impacto financeiro exato de forma imediata.
* **Porcentagem (Modo Pro-Rata):** Arraste o novo controle deslizante (Slider interativo) ou digite um percentual (1% a 100%) para aplicar um desconto pro-rata proporcional em todas as parcelas e ver o valor total a ser debitado na hora.
* **Integração Fluida com Contas:** Escolha a conta corrente de débito e deixe que o motor recalcule os saldos livres e reservados do YNAB instantaneamente.

## Visualização Gráfica do Bloqueio de Envelopes (28/05/2026) 📊
Adicionamos um gráfico Donut (Pie Chart) premium e interativo na tela de detalhes de cada subconta/envelope:
* **Entendimento Imediato de Saldos:** Veja de forma clara e visual quanto do saldo físico da subconta está realmente livre para novos gastos (**Disponível para Gastos** em verde) e quanto está retido e garantido para o pagamento da fatura do cartão (**Reservado para Cartão** em âmbar).
* **Resiliência Visual Completa:** O gráfico foi desenvolvido de forma a prever cenários sem saldo reservado, exibindo 100% de disponibilidade em verde de forma limpa, sem quebras de layout.

## Pagamento Avançado e Flexível de Faturas de Cartão (28/05/2026) 💳
Lançamos o motor de pagamento de faturas com três estratégias de amortização para o controle total do seu orçamento e fluxo de caixa:
* **Modo ITEMIZED (Seleção de Itens):** Quitação focada e precisa de parcelas específicas da sua fatura, descontando somente os valores dos respectivos envelopes.
* **Modo FIFO (Primeiro que Entra, Primeiro que Sai):** Defina um valor livre para pagar a fatura e o sistema quita as parcelas na ordem cronológica de vencimento. Se o valor cobrir apenas parte de uma parcela, o sistema realiza um *split* automático: quita a fração e gera o saldo devedor restante na fatura do mês seguinte.
* **Modo PERCENTAGE (Pagamento Proporcional):** Efetue um pagamento proporcional (ex: 20%) de todas as compras da fatura. A fatia de 20% é quitada nos envelopes correspondentes e os 80% pendentes são postergados para o mês subsequente.

## Infraestrutura para Dedução Diferida de Faturas (28/05/2026) 🔒
Iniciamos a estruturação de banco de dados para a dedução diferida do YNAB:
* **Saldos Reservados:** Agora o sistema é capaz de reservar saldos em envelopes para pagamentos futuros sem deduzir imediatamente o valor em conta corrente, evitando flutuações precoces no orçamento.
* **Vínculos de Parcelas:** As parcelas de cartões agora salvam a sua exata subconta de origem de despesa, preparando o motor para liquidações parciais inteligentes no vencimento da fatura.

## Suporte Regional e Modalidades para Portugal e Brasil (28/05/2026) 🇵🇹 🇧🇷
O Vault Finance OS agora é totalmente compatível com as regras financeiras locais e os comportamentos de terminais de pagamento (maquininhas) de Portugal e do Brasil!

### 1. Bloqueio Inteligente de Parcelas para Portugal (Bypass de POS) 🛒
Em Portugal, os terminais de pagamento locais (Rede Multibanco) não suportam o parcelamento de compras diretamente na maquininha no momento da venda (o chamado parcelamento pelo estabelecimento, muito comum no Brasil).
* **Como funciona:** Se o seu cartão for configurado como emitido em **Portugal (PT)**, o sistema automaticamente forçará a transação a ser registrada em **parcela única (1x - Débito Diferido)**, ignorando qualquer número de parcelas vindo do formulário. Isso impede erros de digitação e mantém as compras em total conformidade com a realidade do mercado europeu.

### 2. Novas Modalidades de Reembolso Europeias 💳
Agora você pode configurar como a fatura do seu cartão de crédito português é liquidada no fim do mês:
* **100% de Reembolso (Débito Direto Autorizado):** O banco retira o valor total gasto diretamente da sua conta à ordem no vencimento da fatura (opção padrão).
* **Crédito Rotativo (Pagamento Parcial):** Pague apenas uma fração mínima (ex: 5%, 10%, 20%) configurada em seu cartão, rolando o restante do saldo da fatura com a incidência de juros do banco.
* **Pagamento Fracionado:** O fracionamento de compras é configurado a nível de cartão para compras que você fracionar diretamente na app do seu banco emissor após o gasto ter sido efetuado.

---

## Lançamentos de Faturas e Cartões de Crédito (Maio 2026)
Agora o sistema de faturas do cartão de crédito possui um fluxo muito mais intuitivo e prático!

### 1. Novo Fluxo de Pagamento de Fatura 💳
Antes, ao registrar uma compra no cartão de crédito, o sistema já subtraía imediatamente o saldo das suas subcontas (como "Microsoft 365"). Agora, nós modernizamos essa lógica!
- **O saldo não muda na hora!** A compra aparece como "pendente" dentro da sua subconta e não afeta o orçamento no mesmo instante.
- **Pagamento inteligente:** Apenas quando você clica em "Pagar Fatura", o sistema debita o valor exato da conta corrente e efetiva a dedução em cada uma das subcontas nas quais as compras foram categorizadas. Isso te dá controle total e reflete o mundo real!

### 2. Pacotes de Fatura nas Transações 📦
Na sua tela de Transações, agora você verá um "Pacote" agrupador da Fatura.
- Você verá um item como: **Fatura Nubank (Maio/2026)**
- Ele agrupa todas as compras feitas naquele cartão, naquele mês.
- Ao clicar no pacote, **você é direcionado para uma nova tela exclusiva de Detalhes da Fatura**, muito mais limpa e organizada, abandonando aquele antigo modelo de "sanfona" que deixava tudo apertado.
- Existe um botão prático de **"Pagar Fatura"** nessa tela!

### 3. Edição e Exclusão Flexível 🗑️
- Quando você exclui a compra "Matriz" escolhendo a opção "Excluir Todas", as reservas e as transações de dívida são limpadas completamente, sem o temido Erro 404.
- Você também pode editar o valor e o nome das parcelas diretamente, e os ajustes se propagam perfeitamente para as próximas parcelas da dívida, mantendo seu orçamento no trilho certo!

### 4. Estética de Faturas e Subcontas Premium ✨
- **Tela de Faturas Unificada:** O visual da aba de faturas foi completamente redesenhado. Agora ele utiliza cards luxuosos para mostrar o **Total**, **Pago** e **Pendente**, mantendo essa estrutura até mesmo nos meses sem compras, preservando a imersão e consistência.
- **Barras de Limite (Budget):** Demos adeus às barras de progresso grossas nas subcontas! O sistema agora usa linhas de preenchimento ultrafinas (6px). As porcentagens de uso ficam flutuando elegantemente como *badges* modernos acima das linhas, resultando num visual super *clean*. As contas sem limite ("Saldo Livre") ganharam o mesmo visual minimalista simétrico.
