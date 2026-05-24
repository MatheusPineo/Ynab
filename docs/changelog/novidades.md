## [1.35.26] - 2026-05-24

**Corre��es e Estabiliza��o**
- **Sincronia YNAB x Cart�o:** Lan�amentos de compras com cart�o de cr�dito agora atualizam instantaneamente todos os fundos das categorias, garantindo que voc� n�o precise recarregar a p�gina para ver a dedu��o real do seu or�amento.
- **Visualiza��o de Fatura:** A p�gina de Cart�es agora identifica automaticamente e exibe a fatura em aberto, em vez de selecionar faturas futuras.
## [1.35.25] - 2026-05-24

**Corre��es e Estabiliza��o**
- **Cart�es de Cr�dito:** Lan�amentos de compras com cart�o de cr�dito agora geram a fatura automaticamente no sistema sem falhas silenciosas.
- **Cart�es de Cr�dito:** O Limite Dispon�vel agora � atualizado visualmente de forma instant�nea ap�s registrar uma nova compra.
## v1.35.24
- **Enxugamento da Interface:** Retiramos a aba de Insights (pois temos muitos relatórios concentrados em uma aba só agora) e removemos o campo Categoria na Caixa de Entrada (Inbox) para deixar a interface ainda mais limpa e direta.

## v1.35.23
- **Melhorias Visuais e Estabilidade:** Cores mais refinadas na barra de limite ultrapassado (overfunded) para subcontas, agora com um gradiente dinâmico de azul para roxo. Também consertamos um problema técnico que impedia a tela de Inbox Inteligente de abrir em algumas situações.

## v1.35.22
- **Novo Visual das Subcontas e Limites:** Substituímos as antigas tags de "Teto" por uma Barra de Progresso muito mais bonita e intuitiva! Agora você pode ver o limite da sua subconta enchendo aos poucos.
  - A barra é **Vermelha** no início e fica **Verde** ao atingir a metade do limite.
  - Se você ultrapassar o limite, ela vai brilhar em **Ciano Neon**, informando que houve transbordamento.
  - E contas que não possuem nenhum limite? Elas agora exibem uma barra neutra indicando "Saldo Livre".

## v1.35.21
- **Proteção Contra Erros Visuais nos Relatórios:** Quando uma nova conta é cadastrada, os Relatórios e Gráficos Inteligentes precisavam de dados para montar a interface. Agora, quando a conta está zerada ou carregando, o Vault apresenta uma belíssima tela sutil de "Ainda sem dados suficientes", garantindo navegação contínua em vez de travar o App.

## v1.35.20
- **Proteção Contra Quedas (Anti-Crash):** O sistema agora conta com um novo escudo global. Se um gráfico isolado ou widget da Dashboard falhar por algum motivo, ele não vai mais derrubar toda a tela. Apenas o componente defeituoso mostrará um alerta suave, permitindo que você continue a usar o resto do Vault normalmente.

## v1.35.19
- **Navegação Suave no Seletor:** Adicionamos scroll fluído e contido à lista de contas. Você não perderá mais o contexto e nem será arrastado pela página acidentalmente enquanto tenta encontrar sua subconta preferida no meio de dezenas.

## v1.35.18
- **Consistência Visual do Seletor de Contas:** Corrigimos layouts onde o menu de contas ficava achatado em cantos de telas, garantindo expansão total 100% harmonizada.

## v1.35.17
- **Novo Seletor de Contas Universal:** Todas as telas do sistema agora usam nosso incrível e veloz seletor de contas global, com busca integrada e design premium ocupando todo o espaço disponível.

## v1.35.16
- **Melhorias de Compras Parceladas:** O modal de compra no Cartão de Crédito agora aceita números dinâmicos e customizados de parcelamento (ex: 24x, 36x), permitindo compras grandes com precisão flexível no motor do YNAB!

## v1.35.15
- **Design de Cartões Ajustado:** Melhoramos sutilmente o visual dos cartões na sua tela! Os ícones oficiais ganharam mais "respiro" interno e não tocam mais nas bordas do container, trazendo uma experiência perfeitamente realista de cartões físicos.

## v1.35.13
- **Gráficos Reais e Inteligentes:** Conectamos totalmente nossa nova infraestrutura do servidor diretamente na sua tela de Relatórios! Todos os gráficos agora desenham suas curvas e fatias lendo estritamente os lançamentos do banco de dados, sem usar dados de demonstração.
- **Gráficos Vazios Elegantes:** Caso você ainda não possua dados suficientes em um mês específico, o sistema não exibirá gráficos quebrados. Em vez disso, você verá um painel minimalista e elegante avisando que ainda faltam informações para desenhar o relatório.

## v1.35.9
- **Motor de Relatórios Real:** Preparamos a infraestrutura do sistema para abandonar os dados de demonstração! Agora, nosso motor no servidor calcula matematicamente em tempo real seu Fluxo de Caixa, Distribuição de Gastos e Evolução de Patrimônio Líquido com base estritamente nas suas transações reais.

## v1.35.8
- **Ícones Oficiais de Cartão de Crédito:** Diga adeus aos ícones genéricos! Agora, ao visualizar seus Cartões de Crédito, você verá os ícones reais e oficiais das bandeiras Visa, Mastercard, American Express, Elo, UnionPay e JCB diretamente no seu painel.

## v1.35.7
- **Consistência do Arquitetura de Contas:** Agora a parte de registrar uma nova compra em um Cartão de Crédito permite selecionar sua árvore de contas e subcontas cadastradas, em vez de exigir as velhas categorias estáticas. Para isso, alteramos o backend das Matrizes de Transação e os seletores visuais.
- **Correção da Exibição de Bandeiras:** Foi efetuado o deploy da estrutura de banco de dados correspondente à bandeira do cartão, resolvendo o sumiço do ícone logo após o cadastro!

## v1.35.6
- **Cartões de Crédito Mais Inteligentes:** Reformulamos a experiência de uso de Cartões de Crédito! Agora, ao cadastrar um novo cartão, você poderá escolher a Bandeira exata (Visa, Mastercard, Elo, Amex) e visualizá-la lindamente no seu painel. 
- **Seleção de Subconta Precisa:** Corrigimos o visualizador de Subcontas no painel de compras no cartão, garantindo que você visualize a árvore completa hierárquica na hora de deduzir sua despesa!
- **Edição e Exclusão:** Agora é possível editar ou excluir um cartão de crédito livremente com um clique no botão de 3 pontinhos na tela de Cartões!

﻿## v1.35.5
- **Digitação Monetária Global Premium:** Substituímos em todo o sistema a caixa de digitação nativa do navegador por uma caixa de formatação dinâmica. Ao digitar valores no Orçamento, Cartões, Metas ou Dívidas, a digitação ocorre fluidamente da Direita para a Esquerda (Ex: ao digitar 100, aparece 1,00), reproduzindo a experiência perfeita de aplicativos bancários. As horrorosas setas de incremento/decremento nativas também foram removidas permanentemente!
# Novidades e AtualizaÃ§Ãµes

## v1.35.3`n- **Upload Inteligente da Inbox:** Redesenhamos a engenharia por trás do envio em massa de cupons fiscais. Agora a barra de progresso no painel de Inteligência Artificial processa cada imagem individualmente (Ex: 'Processando 1 de 3...'), tornando o navegador imune a travamentos ao enviar PDFs ou fotos pesadas.
- **Rastreamento de Faturas Parciais:** Começou a registrar os gastos agora, mas possui parcelas em aberto de meses passados? O painel de adição de transações de Cartão de Crédito agora permite escolher exatamente em qual parcela a cobrança deve iniciar (Ex: 9 de 12).

- **Design de PatrimÃ´nio LÃ­quido:** A pÃ¡gina de investimentos agora conta com um Dashboard premium exibindo seu PatrimÃ´nio LÃ­quido com design mais fluÃ­do e atraente.
- **Tabela HistÃ³rica de Ativos Ampliada:** A tabela do livro-razÃ£o (ledger) agora ocupa a tela inteira de forma horizontal e as quantidades exatas sÃ£o formatadas mais limpas, eliminando a rolagem chata!
- **InformaÃ§Ãµes Detalhadas de Contas:** Agora ao criar uma Conta Corrente ou CartÃ£o de CrÃ©dito vocÃª receberÃ¡ um balÃ£o de explicaÃ§Ã£o detalhada sobre como o dinheiro (On-Budget ou Fatura) funciona.
- **TraduÃ§Ã£o:** A aba de investimentos na barra lateral agora descreve exatamente o que ela faz.

## Atualização: Suporte a Taxonomia Global de Investimentos (23/05/2026)

Agora o Vault Finance OS suporta uma organização de investimentos muito mais completa, classificando por país e categoria macro (ex: Renda Variável BR, Exterior, etc). Além disso, adicionamos suporte para vencimento (due date) em atividades de investimento!

- **Frontend de Investimentos Preparado:** Formulários de cadastro de ativos estão recebendo nova infraestrutura técnica para exibir corretamente os novos tipos globais (Ações, ETFs Internacionais, Criptomoedas, etc).






