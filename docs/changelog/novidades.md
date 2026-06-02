# Novidades e Atualizações

## Motor Avançado de Renda Fixa e Tributação Brasileira (02/06/2026) 📈🇧🇷
Refatoramos o cálculo matemático para investimentos de Renda Fixa e Tesouro Direto:
* **Base de 252 Dias Úteis:** O rendimento dos ativos de renda fixa agora segue a convenção brasileira oficial, desconsiderando fins de semana e feriados nacionais nos cálculos de juros acumulados diários.
* **Marcação a Mercado por Preço Unitário (PU):** O sistema agora prioriza o valor real de liquidação do ativo com base nos preços históricos e atuais cadastrados no banco de dados (`DailyAssetPrice`). Caso não haja um preço atualizado, o sistema utiliza o cálculo teórico da curva de juros do ativo.
* **Tributação Regressiva de IR e IOF:** Implementamos o desconto automático de Imposto de Renda Regressivo (22,5% a 15%) e IOF no rendimento com base nos dias corridos da aplicação, exibindo valores Brutos e Líquidos realistas equivalentes aos portais oficiais (como o do Tesouro Direto).
* **Desconto FIFO nas Vendas:** Vendas parciais de ativos agora amortizam primeiro as tranches de compras mais antigas (First In, First Out), mantendo os saldos de impostos de renda e custódia perfeitamente auditáveis.

## Identificação Precisa de Dispositivos (02/06/2026) 📱⏰
Melhoramos a clareza e o rastreamento dos aparelhos cadastrados em sua conta:
* **Data e Hora no Nome Padrão:** O nome sugerido do dispositivo móvel no momento do login de confiança agora inclui não apenas a data, mas também a hora e o minuto exatos (ex: `Telemóvel Android - 02/06/2026 20:44`). Isso permite diferenciar com total facilidade os dispositivos caso você possua mais de um aparelho do mesmo modelo cadastrado no mesmo dia.

## Flexibilidade no Registro de Dispositivos (02/06/2026) 🔒📱
Corrigimos um problema de validação que impedia o registro de novos aparelhos caso eles tivessem o mesmo nome de exibição:
* **Múltiplos Dispositivos com o Mesmo Nome:** Removida a restrição de unicidade rígida para o nome do dispositivo. Agora você pode registrar múltiplos celulares ou tablets que tenham o mesmo nome dinâmico ou genérico (por exemplo, no mesmo dia ou com o mesmo fallback), desde que a identificação interna exclusiva (chave/token do dispositivo) seja diferente. Isso resolve o erro "A device with this name is already registered."

## Notificações Push Locais Nativas de Transações (02/06/2026) 🔔📱
Introduzimos feedback visual e instantâneo ao capturar transações financeiras em segundo plano no Android:
* **Feedback de Sincronização em Tempo Real:** Sempre que o aplicativo interceptar uma transação financeira em segundo plano (como uma compra via Pix ou cartão) e transmiti-la com sucesso para o backend (HTTP 200/201), uma notificação push nativa local é disparada imediatamente na tela do dispositivo.
* **Canal Dedicado de Alta Importância:** Registramos um canal de notificações exclusivo no Android (`NotificationChannel`) com prioridade alta, garantindo a exibição do banner suspenso (*heads-up notification*) no topo da tela do usuário.
* **Mensagem Confirmatória:** A notificação exibe o título **"Vault Finance OS"** e a mensagem **"Transação salva no sistema"**, confirmando instantaneamente que o ciclo automatizado de captura de transações em background funcionou perfeitamente.

## Estabilidade no Registro de Dispositivos Móveis (02/06/2026) 🔒🛠️
Melhoramos a robustez e o feedback durante o registro de novos aparelhos:
* **Tratamento Fino de Erros de Rede/Validação:** Refatoramos a comunicação com a API de dispositivos (`/api/devices/register/`) tanto na tela de configuração (`InboxMobileSyncActivation.tsx`) quanto no modal de autorização de novos aparelhos (`DeviceTrustModal.tsx`). Agora, qualquer detalhe de erro ou validação do Django (como chaves duplicadas ou problemas de sessão) é capturado, logado no console e amigavelmente exibido na notificação visual Toast, eliminando falhas silenciosas.


## Bloqueio de Segurança Seguro: PIN + Biometria (02/06/2026) 🔒📱
Adicionamos um sistema de segurança de nível bancário ao Vault Finance OS para proteger suas informações financeiras e dados sensíveis:
* **Bloqueio Automático em Segundo Plano:** O aplicativo monitora o ciclo de vida do sistema operacional móvel. Sempre que você colocar o aplicativo em segundo plano ou mudar de tela, o aplicativo será imediatamente bloqueado e exigirá autenticação para liberar os dados.
* **Tela de Proteção Glassmorphic:** Ao reabrir o app, uma bela tela com efeito de vidro fosco obstrui completamente a visualização, impedindo o vazamento de saldos no gerenciador de tarefas do aparelho.
* **Autenticação Biométrica Nativa:** O leitor de impressão digital ou reconhecimento facial do seu celular é disparado automaticamente ao carregar a tela.
* **Teclado PIN Seguro:** Teclado numérico minimalista e responsivo que permite desbloqueio por códigos de 4 a 6 dígitos (PIN padrão de fábrica: `1234`).
* **Botão de Fallback Biométrico:** Um botão acessível para redisparar o sensor biométrico caso ocorra falha ou cancelamento acidental.

## Inteligência de Regras e Associação de Comprovantes (02/06/2026) 🤖🧠
Expandimos a inteligência por trás do **Inbox IA** para tornar a homologação de comprovantes ainda mais rápida e autônoma:
* **Aprendizado Contínuo de Estabelecimentos:** O Vault Finance OS agora aprende com base nas suas validações passadas. Ao homologar um comprovante, o sistema associa palavras-chave do estabelecimento (ex: "ALDI", "UBER") à conta e categoria financeira que você escolheu.
* **Preenchimento Automático Proativo:** Da próxima vez que você enviar um comprovante do mesmo estabelecimento, a IA detectará a regra aprendida e pré-selecionará automaticamente a conta corrente, cartão ou envelope de gastos correto, restando apenas revisar e homologar.
* **Detecção Automática de Tipo de Transação:** O sistema diferencia de forma transparente se o lançamento trata-se de uma despesa comum, receita ou compra de cartão de crédito.
* **Integração de Notificações e SMS (Match Engine Local):** Lançamos um novo endpoint `/api/inbox/notification/` que permite enviar notificações de transações financeiras diretamente do seu smartphone Android (através de utilitários como Tasker ou Macrodroid). Se o estabelecimento já tiver uma regra aprendida, o sistema preencherá os dados instantaneamente sem chamar o Gemini (Bypass de IA), economizando tempo de processamento e recursos.
* **Mockup de Notificação em Tela (Smartphone Preview):** Para capturas automáticas geradas por texto (notificações push/SMS enviadas do celular, sem imagem física de comprovante), a coluna de visualização da Inbox agora renderiza um mockup elegante de smartphone com o balão de notificação original. Isso permite realizar a conferência visual do texto recebido em tempo real na tela de homologação.
* **Ficha de Auditoria Avançada:** Adicionado suporte para hidratação automática em tempo real do envelope/categoria, conta bancária e tipo de transação (receita/despesa) no painel de aprovação à direita da tela, além de um seletor visual de categorias para possibilitar que você re-classifique envelopes antes de consolidar os dados.


## Experiência Exclusiva e Isolada no App Android (31/05/2026) 📱🚀
Melhoramos a experiência de uso do aplicativo móvel do Vault Finance OS para dispositivos Android:
* **Navegação 100% Autônoma:** O aplicativo nativo construído com Capacitor agora detecta que está rodando em um celular e pula automaticamente a página institucional pública (landing page).
* **Foco no App:** Ao abrir o app, você será direcionado instantaneamente para a tela de autenticação (`/auth`) ou diretamente para o seu Painel de Controle (`/dashboard`) se já estiver conectado, sem misturar o site institucional de marketing na navegação móvel.
* **Ajuste de Safe Area (Layout Harmônico):** Corrigimos o espaçamento do cabeçalho superior (`Topbar`) no celular. Adicionamos uma margem de segurança no topo no ambiente nativo para que a logo do Vault e os botões de notificação/modo escuro não disputem espaço ou fiquem por baixo dos ícones de status do Android (bateria, wifi e relógio).


## Visualização Unificada de Devedores na Subconta (30/05/2026) 👥💼
A tela interna de cada subconta (envelope) agora conta com um painel completo e dinâmico de devedores:
* **Painel "Devedores deste Envelope":** Exibe de forma inteligente a lista de devedores e os respectivos saldos que cada um deve a este envelope.
* **Unificação Matemática:** O resumo integra e calcula de forma dinâmica os saldos pendentes originados tanto de roommate splits (`DebtItem`) quanto de empréstimos diretos e pessoais (`Debt` onde a contraparte nos deve), garantindo que nenhum valor devido fique oculto na visualização interna do envelope.

## Cumprimento Inteligente no Topbar (30/05/2026) ☀️🌙
A página inicial agora se comunica com você de acordo com o período do dia:
* **Saudação Dinâmica por Horário:** O cabeçalho superior (`Topbar.tsx`) agora analisa a hora do seu navegador.
  * Entre **05:00 e 11:59**, você receberá um caloroso **"Bom dia"**.
  * Entre **12:00 e 18:59**, o cumprimento muda para **"Boa tarde"**.
  * Entre **19:00 e 04:59**, a interface exibe **"Boa noite"**.
* O seu nome de usuário e o clássico emoji de aceno (`👋`) permanecem perfeitamente alinhados à direita do cumprimento.

## Estabilidade do Sistema e Correções de Cartão (30/05/2026) 🛠️🔒
Implementamos correções críticas de infraestrutura para garantir estabilidade absoluta no controle de faturas e processamento de compras:
* **Segurança na Criação de Compras:** Corrigimos o fluxo de inserção de despesas de cartão de crédito no banco de dados, prevenindo falhas de integração (`IntegrityError`) ao criar a transação matriz antes de resolver a gaveta/envelope padrão de despesa.
* **Consistência do Motor de Faturas:** Corrigimos comportamentos inesperados ao usar as estratégias FIFO e de pagamento percentual no fechamento de faturas, eliminando erros causados por variáveis órfãs em atualizações anteriores.
* **Robustez em Relatórios e Cargas:** Ajustamos formatações de datas e importações redundantes internas de modelos.

## Edição Inline, Exclusão e Seletor de Contas Global nas Dívidas (30/05/2026) 👥⚙️
Adicionamos recursos poderosos de edição direta e usabilidade ao painel de Dívidas:
* **Seletor de Contas Global:** Substituímos os menus suspensos simples pelo seletor global do sistema, permitindo que você busque facilmente por nome e reassocie subcontas/envelopes para itens de dívida e modais de lançamento ("Registrar Pagamento" e "Adicionar Débito").
* **Ajuste Rápido de Valores:** Adicionado o suporte para alterar o valor total de dívidas individuais dando um duplo clique no valor.
* **Exclusão Estornada:** Permite excluir registros de dívidas individuais diretamente pela lixeira do card de devedores, estornando e reajustando automaticamente os saldos do orçamento.

## Mutações em Dívidas e Rebalanceamento Atômico (30/05/2026) 💸
Implementamos melhorias críticas no gerenciamento de itens de dívida individuais para roommates:
* **Edição de Itens de Dívida (PATCH):** Agora você pode editar o valor total (	otal_amount) ou mover um item de dívida para outra subconta/envelope (origin_subaccount_id).
* **Rebalanceamento Atômico de Envelopes:** Se você mover uma dívida de um envelope para outro (ex: de 'Geral' para 'Mercado'), o sistema automaticamente retira o peso financeiro do envelope antigo e transfere para o novo, mantendo o controle de saldo impecável.
* **Exclusão de Dívidas (DELETE) com Estorno:** Ao excluir um item de dívida, seu peso financeiro é estornado automaticamente da subconta associada antes de o registro ser deletado permanentemente, garantindo que o saldo do seu envelope retorne ao estado original.

## Motor de Amortização FIFO e Devedores Agrupados (29/05/2026) 👥💰
Introduzimos o Motor de Quitação FIFO Agrupado para roommates e divisão de contas! Agora gerenciar despesas compartilhadas e recebimentos ficou totalmente automatizado e integrado aos envelopes do orçamento:
* **Amortização em Fila Cronológica (FIFO):** Registre os pagamentos feitos pelos seus devedores de forma agrupada por envelope de despesa. O sistema varre as dívidas na ordem cronológica de vencimento (as mais antigas primeiro), liquidando-as sequencialmente e realizando o fracionamento (*split*) caso o pagamento seja parcial.
* **Cadastro de Itens em Lote (Bulk Creation):** Lançamos o suporte para cadastrar múltiplos itens de dívida de uma só vez para um roommate em uma subconta (`add_items`). Essa ação apenas gera os registros internos de auditoria de dívida sem duplicar a dedução no saldo do envelope físico de origem (uma vez que você já registrou o gasto total no sistema, ex: a nota do supermercado).
* **Injeção Atômica de Saldos:** Cada pagamento recupera instantaneamente o saldo do respectivo envelope de despesa de origem, curando os furos causados pelos gastos compartilhados.
* **Livro Razão Transparente:** Cada amortização gera um lançamento detalhado de receita no histórico do envelope, garantindo rastreabilidade completa.
* **Painel de Controle de Devedores Renovado:** Redesenhamos os cards da tela principal de Dívidas (`Debts.tsx`). Agora, os saldos pendentes são exibidos de forma aninhada, agrupados por cada subconta/envelope correspondente. Removemos as barras de progresso lineares antigas e o subtítulo genérico, substituindo-os pelo agrupamento de subcontas em aberto. O botão principal foi renomeado para "Registrar Pagamento", eliminando qualquer ambiguidade semântica.
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

### 5. Pagamentos Mais Precisos e Isolamento de Moedas
- **Pagamento Direcionado:** Ao clicar em "Registrar Pagamento" dentro de uma subconta específica de um colega, o novo modal já puxa a dívida diretamente para aquele envelope, abatendo cronologicamente (FIFO) as despesas dele. Muito mais rápido e livre de erros!
- **Soma Correta por Moeda:** Caso um devedor possua despesas em Euro e Real misturadas, os valores totais não serão mais somados em um único texto confuso. Agora as moedas são listadas e separadas na tela para garantir integridade.

### Seguranca nas Faturas
- **Status de Cobertura**: Veja imediatamente um aviso caso nao tenha saldo nos envelopes para pagar a fatura.
- **Organizacao**: Corrija compras sem categoria diretamente na fatura clicando em Vincular Envelope!
