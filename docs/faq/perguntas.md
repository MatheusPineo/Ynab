# FAQ: Perguntas Frequentes e Casos Especiais (Corner Cases)

Neste documento, compilamos as respostas diretas para os cenários mais complexos ou confusos vivenciados por novos usuários durante a operação do Vault Finance OS.

---

## Categoria: Investimentos e Patrimônio

### Q1: Por que meu saldo de investimentos não muda nos finais de semana?
A imensa maioria dos contratos de Renda Fixa brasileira (como CDBs, LCIs e LCAs atrelados ao CDI ou Selic) rende de forma regulamentada sob a premissa de **252 Dias Úteis** por ano. 
Nosso motor matemático (`PortfolioEvolutionEngine`) varre inteligentemente os sábados, domingos e feriados nacionais móveis (como Carnaval e Páscoa). Portanto, a "estagnação" visual do seu saldo nos fins de semana não é um bug, mas a representação exata e fiel do mercado financeiro brasileiro agindo sobre o seu dinheiro de acordo com o Banco Central.

---

## Categoria: Cartões e Orçamento

### Q2: O que acontece se eu gastar mais no cartão do que o limite do envelope? (Credit Overspending)
Quando você passa um cartão de crédito, o sistema tentará mover o dinheiro físico do seu envelope de gastos (Ex: `Alimentação`) para o envelope de reserva de `Pagamento do Cartão`. 
Se o envelope não possuir saldo suficiente, o envelope de `Alimentação` ficará em vermelho. Como a compra foi feita **a crédito**, o déficit não será deduzido do seu RTA (Pronto para Atribuir) no mês seguinte. Ao invés disso, o sistema transformará esse déficit em "dívida passiva" e o montante faltante ficará flutuando em aberto no saldo negativo da conta do cartão de crédito, demonstrando que você possui faturas futuras que não possuem reserva de pagamento real. Aja rápido para cobrir!

---

## Categoria: Inteligência Artificial (Inbox)

### Q3: A IA leu meu comprovante errado. O que devo fazer?
O modelo Gemini 2.5 Flash, que opera nosso Inbox de Notas, possui índices de precisão que beiram os 99% na extração de OCR. Contudo, imagens severamente borradas, cortadas ou boletos despadronizados podem gerar alucinações.
**Ação:** O Inbox do Vault Finance funciona em modo *Staging* (Homologação). A IA nunca altera o seu saldo diretamente. Ela joga a sugestão na tela. Se algum valor ou data estiverem errados, simplesmente clique no campo do formulário, **edite manualmente** a informação antes de confirmar e, somente então, clique em "Homologar e Lançar".

---

## Categoria: Multimoedas e Operação Básica

### Q4: Posso usar o aplicativo offline durante uma viagem? Como ficam as moedas estrangeiras?
**Uso Offline:** O Vault Finance OS é uma PWA (Progressive Web App) arquitetada com cache e armazenamento em `localStorage`. Muitas visualizações funcionam normalmente mesmo sem internet. Contudo, ações ativas como cadastrar compras, bater extrato ou solicitar extração via IA exigem rede, pois o sistema preza pela consistência absoluta de banco de dados (Transações ACID) com o servidor.
**Moedas Estrangeiras:** Caso faça gastos no exterior, cadastre a nova conta marcando a moeda (Ex: USD ou EUR) em "Configurações Globais". A arquitetura multimoedas segmenta os patrimônios para que valores diferentes não se misturem indiscriminadamente.

---

## Categoria: Reconciliação e Auditoria

### Q5: Como faço para destravar uma transação antiga que está com o ícone de cadeado?
O ícone de cadeado e o status verde de `Reconciled` sinalizam que aquela transação já foi processada através do ciclo de **Auditoria/Reconciliação Bancária Semanal**. Isso significa que ela está matematicamente validada contra um extrato passado e protegida ("congelada") pela ORM do sistema para evitar alterações de dados que corrompam seu histórico no longo prazo.
**Solução:** Caso precise apagar, alterar o valor ou a conta de um lançamento com cadeado, você deve acessá-lo na grade de Transações ou Detalhes da Conta, desmarcar a flag correspondente (Desreconciliar) salvando a operação. A transação voltará ao status `realized` (livre) e poderá ser modificada novamente.

---

## Categoria: Planejamento Orçamentário e Metas

### Q6: Como funcionam as Metas de Orçamento (Budget Targets) e a Distribuição Inteligente (Smart Allocation)?
O Vault Finance OS permite definir regras de orçamento em qualquer sub-envelope (categoria) nas opções da barra lateral:
* **Metas Fixas:** Define um valor monetário obrigatório (ex: R$ 400 para combustível).
* **Metas Percentuais:** Define uma fração percentual de uma receita a ser alocada (ex: 10% para investimentos).
* **Tetos de Gastos:** Opcionalmente, defina um limite máximo acumulável. Se configurado, o envelope não acumulará sobras acima do teto.

Para poupar trabalho, use o recurso de **Distribuição de Renda (Smart Allocation)** no botão de ações rápidas no topo do orçamento. Ao invés de digitar um por um, o sistema pega o saldo acumulado no seu **RTA** (Pronto para Atribuir) e o distribui automaticamente de acordo com as metas cadastradas, com a opção de direcionar sobras de forma proporcional (`EXTRA_PROPORTIONAL`).

---

### Q7: O que são as Ações de Rebalanceamento Automático de Envelopes?
São ferramentas de um clique no cabeçalho do orçamento para otimizar a distribuição do seu dinheiro sem esforço manual:
1. **Ajustar ao Teto (`REBALANCE_TO_CEILING`):** O sistema varre todos os envelopes que acumularam sobras acima dos seus Tetos de Gastos configurados, recolhe o excesso e o envia de volta ao **RTA**, permitindo que você aproveite esse dinheiro em envelopes com maior necessidade no momento.
2. **Zerar Envelopes Estourados (`REBALANCE_ZERO_OVERSPENT`):** Caso algum envelope tenha fechado o mês anterior no vermelho devido a gastos extras não previstos, esta ação retira o dinheiro diretamente do **RTA** para cobrir os furos de caixa, iniciando o novo mês com tudo zerado e limpo.

---

## Categoria: Divisão de Despesas e Colegas de Quarto

### Q8: Como funciona a quitação de dívidas de roommates via FIFO?
Quando você divide despesas (ex: compras de mercado ou contas da casa) com roommates, o sistema registra itens de dívida individuais vinculados ao envelope de origem de onde você tirou o dinheiro. 
Quando o roommate te paga e você registra o pagamento para um envelope específico, o sistema:
1. **Recupera o envelope:** Deposita o valor recebido de volta na categoria/envelope correspondente, recomponendo o saldo que você gastou originalmente.
2. **Quita cronologicamente (FIFO):** O motor de pagamentos amortiza as dívidas desse roommate naquele envelope na ordem em que foram criadas (as mais antigas primeiro). Se o pagamento for parcial e cobrir apenas metade do valor de uma despesa antiga, essa despesa ficará com o status `Parcial` e o saldo restante será deduzido na próxima oportunidade.

---

### Q9: O cadastro de itens de dívida em lote diminui o saldo do meu envelope de novo?
Não! O cadastro em lote de itens de dívida (`add_items`) é apenas um registro de controle para futuras cobranças. Ele **não gera uma nova despesa física nem deduz saldo** do seu envelope ou conta de origem novamente. Presume-se que o débito global original já foi lançado por você ao registrar a compra principal (ex: a nota do supermercado que você pagou no caixa). O endpoint serve apenas para estruturar a fração que cabe a cada roommate.

---

## Categoria: Dispositivos Móveis (App Nativo)

### Q10: O aplicativo Android carrega a landing page institucional do site?
Não. Para oferecer uma experiência 100% integrada e autônoma, o aplicativo construído com Capacitor detecta que está rodando em ambiente nativo. Ao abrir o aplicativo, ele pula automaticamente o site institucional público (a landing page inicial) e te direciona diretamente para a tela de login (`/auth`) ou para o seu Painel de Controle (`/dashboard`), caso sua sessão já esteja ativa. Isso garante que a navegação do app de celular não se misture com a estrutura de marketing do site web.




