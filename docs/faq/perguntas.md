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
