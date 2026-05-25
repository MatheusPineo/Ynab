## [1.35.30] - 2026-05-25

**Controle Total: Exclusão e Edição Granular**
- **Opções Avançadas:** Agora ao excluir ou editar um lançamento parcelado, você pode escolher exatamente como quer aplicar a alteração:
  1. **Apenas esta parcela:** Ideal para pular ou renegociar um único mês.
  2. **Esta e as próximas:** Perfeito para quando você antecipa ou cancela a compra no meio do caminho.
  3. **Todas as parcelas:** Se foi um erro completo, apague tudo de uma vez.
- O YNAB ajustará as reservas de dinheiro mágica e matematicamente pra você!

## [1.35.29] - 2026-05-25

**Melhorias e Ajustes na Fatura do Cartão**
- **Fatura sempre no Mês Correto:** Ajustamos a visualização para sempre abrir automaticamente no mês atual, exibindo a fatura em aberto corretamente e na ordem certa (meses de Janeiro a Dezembro, em ordem cronológica).
- **Aviso de Fatura Vazia:** Se não houver nada lançado no mês selecionado, agora a tela te mostra um aviso amigável indicando a ausência de lançamentos, melhorando a experiência.
- **Gestão Total de Lançamentos:** Os botões de excluir e editar lançamentos na fatura agora estão operacionais! Excluir um lançamento apaga magicamente todos os vínculos dele (até os envelopes do YNAB), garantindo consistência total!

## [1.35.28] - 2026-05-24

**Novidades na Compra com Cartão**
- **Calculadora Inteligente de Parcelas:** Agora, ao registrar uma nova compra no cartão de crédito em várias vezes, você pode escolher se o valor digitado é o **Total da Compra** ou apenas o valor de **Uma Parcela**. O sistema vai automaticamente calcular e mostrar exatamente quanto vai ficar o montante e quanto será cobrado por mês, direto na tela, antes de você confirmar!
## [1.35.26] - 2026-05-24

**Correções e Estabilização**
- **Sincronia YNAB x Cartão:** Lançamentos de compras com cartão de crédito agora atualizam instantaneamente todos os fundos das categorias, garantindo que você não precise recarregar a página para ver a dedução real do seu orçamento.
- **Visualização de Fatura:** A página de Cartões agora identifica automaticamente e exibe a fatura em aberto, em vez de selecionar faturas futuras.
## [1.35.25] - 2026-05-24

**Correções e Estabilização**
- **Cartões de Crédito:** Lançamentos de compras com cartão de crédito agora geram a fatura automaticamente no sistema sem falhas silenciosas.
- **Cartões de Crédito:** O Limite Disponível agora é atualizado visualmente de forma instantânea após registrar uma nova compra.
## v1.35.24
- **Enxugamento da Interface:** Retiramos a aba de Insights (pois temos muitos relatÃ³rios concentrados em uma aba sÃ³ agora) e removemos o campo Categoria na Caixa de Entrada (Inbox) para deixar a interface ainda mais limpa e direta.

## v1.35.23
- **Melhorias Visuais e Estabilidade:** Cores mais refinadas na barra de limite ultrapassado (overfunded) para subcontas, agora com um gradiente dinÃ¢mico de azul para roxo. TambÃ©m consertamos um problema tÃ©cnico que impedia a tela de Inbox Inteligente de abrir em algumas situaÃ§Ãµes.

## v1.35.22
- **Novo Visual das Subcontas e Limites:** SubstituÃ­mos as antigas tags de "Teto" por uma Barra de Progresso muito mais bonita e intuitiva! Agora vocÃª pode ver o limite da sua subconta enchendo aos poucos.
  - A barra Ã© **Vermelha** no inÃ­cio e fica **Verde** ao atingir a metade do limite.
  - Se vocÃª ultrapassar o limite, ela vai brilhar em **Ciano Neon**, informando que houve transbordamento.
  - E contas que nÃ£o possuem nenhum limite? Elas agora exibem uma barra neutra indicando "Saldo Livre".

## v1.35.21
- **ProteÃ§Ã£o Contra Erros Visuais nos RelatÃ³rios:** Quando uma nova conta Ã© cadastrada, os RelatÃ³rios e GrÃ¡ficos Inteligentes precisavam de dados para montar a interface. Agora, quando a conta estÃ¡ zerada ou carregando, o Vault apresenta uma belÃ­ssima tela sutil de "Ainda sem dados suficientes", garantindo navegaÃ§Ã£o contÃ­nua em vez de travar o App.

## v1.35.20
- **ProteÃ§Ã£o Contra Quedas (Anti-Crash):** O sistema agora conta com um novo escudo global. Se um grÃ¡fico isolado ou widget da Dashboard falhar por algum motivo, ele nÃ£o vai mais derrubar toda a tela. Apenas o componente defeituoso mostrarÃ¡ um alerta suave, permitindo que vocÃª continue a usar o resto do Vault normalmente.

## v1.35.19
- **NavegaÃ§Ã£o Suave no Seletor:** Adicionamos scroll fluÃ­do e contido Ã  lista de contas. VocÃª nÃ£o perderÃ¡ mais o contexto e nem serÃ¡ arrastado pela pÃ¡gina acidentalmente enquanto tenta encontrar sua subconta preferida no meio de dezenas.

## v1.35.18
- **ConsistÃªncia Visual do Seletor de Contas:** Corrigimos layouts onde o menu de contas ficava achatado em cantos de telas, garantindo expansÃ£o total 100% harmonizada.

## v1.35.17
- **Novo Seletor de Contas Universal:** Todas as telas do sistema agora usam nosso incrÃ­vel e veloz seletor de contas global, com busca integrada e design premium ocupando todo o espaÃ§o disponÃ­vel.

## v1.35.16
- **Melhorias de Compras Parceladas:** O modal de compra no CartÃ£o de CrÃ©dito agora aceita nÃºmeros dinÃ¢micos e customizados de parcelamento (ex: 24x, 36x), permitindo compras grandes com precisÃ£o flexÃ­vel no motor do YNAB!

## v1.35.15
- **Design de CartÃµes Ajustado:** Melhoramos sutilmente o visual dos cartÃµes na sua tela! Os Ã­cones oficiais ganharam mais "respiro" interno e nÃ£o tocam mais nas bordas do container, trazendo uma experiÃªncia perfeitamente realista de cartÃµes fÃ­sicos.

## v1.35.13
- **GrÃ¡ficos Reais e Inteligentes:** Conectamos totalmente nossa nova infraestrutura do servidor diretamente na sua tela de RelatÃ³rios! Todos os grÃ¡ficos agora desenham suas curvas e fatias lendo estritamente os lanÃ§amentos do banco de dados, sem usar dados de demonstraÃ§Ã£o.
- **GrÃ¡ficos Vazios Elegantes:** Caso vocÃª ainda nÃ£o possua dados suficientes em um mÃªs especÃ­fico, o sistema nÃ£o exibirÃ¡ grÃ¡ficos quebrados. Em vez disso, vocÃª verÃ¡ um painel minimalista e elegante avisando que ainda faltam informaÃ§Ãµes para desenhar o relatÃ³rio.

## v1.35.9
- **Motor de RelatÃ³rios Real:** Preparamos a infraestrutura do sistema para abandonar os dados de demonstraÃ§Ã£o! Agora, nosso motor no servidor calcula matematicamente em tempo real seu Fluxo de Caixa, DistribuiÃ§Ã£o de Gastos e EvoluÃ§Ã£o de PatrimÃ´nio LÃ­quido com base estritamente nas suas transaÃ§Ãµes reais.

## v1.35.8
- **Ã�cones Oficiais de CartÃ£o de CrÃ©dito:** Diga adeus aos Ã­cones genÃ©ricos! Agora, ao visualizar seus CartÃµes de CrÃ©dito, vocÃª verÃ¡ os Ã­cones reais e oficiais das bandeiras Visa, Mastercard, American Express, Elo, UnionPay e JCB diretamente no seu painel.

## v1.35.7
- **ConsistÃªncia do Arquitetura de Contas:** Agora a parte de registrar uma nova compra em um CartÃ£o de CrÃ©dito permite selecionar sua Ã¡rvore de contas e subcontas cadastradas, em vez de exigir as velhas categorias estÃ¡ticas. Para isso, alteramos o backend das Matrizes de TransaÃ§Ã£o e os seletores visuais.
- **CorreÃ§Ã£o da ExibiÃ§Ã£o de Bandeiras:** Foi efetuado o deploy da estrutura de banco de dados correspondente Ã  bandeira do cartÃ£o, resolvendo o sumiÃ§o do Ã­cone logo apÃ³s o cadastro!

## v1.35.6
- **CartÃµes de CrÃ©dito Mais Inteligentes:** Reformulamos a experiÃªncia de uso de CartÃµes de CrÃ©dito! Agora, ao cadastrar um novo cartÃ£o, vocÃª poderÃ¡ escolher a Bandeira exata (Visa, Mastercard, Elo, Amex) e visualizÃ¡-la lindamente no seu painel. 
- **SeleÃ§Ã£o de Subconta Precisa:** Corrigimos o visualizador de Subcontas no painel de compras no cartÃ£o, garantindo que vocÃª visualize a Ã¡rvore completa hierÃ¡rquica na hora de deduzir sua despesa!
- **EdiÃ§Ã£o e ExclusÃ£o:** Agora Ã© possÃ­vel editar ou excluir um cartÃ£o de crÃ©dito livremente com um clique no botÃ£o de 3 pontinhos na tela de CartÃµes!

ï»¿## v1.35.5
- **DigitaÃ§Ã£o MonetÃ¡ria Global Premium:** SubstituÃ­mos em todo o sistema a caixa de digitaÃ§Ã£o nativa do navegador por uma caixa de formataÃ§Ã£o dinÃ¢mica. Ao digitar valores no OrÃ§amento, CartÃµes, Metas ou DÃ­vidas, a digitaÃ§Ã£o ocorre fluidamente da Direita para a Esquerda (Ex: ao digitar 100, aparece 1,00), reproduzindo a experiÃªncia perfeita de aplicativos bancÃ¡rios. As horrorosas setas de incremento/decremento nativas tambÃ©m foram removidas permanentemente!
# Novidades e AtualizaÃƒÂ§ÃƒÂµes

## v1.35.3`n- **Upload Inteligente da Inbox:** Redesenhamos a engenharia por trÃ¡s do envio em massa de cupons fiscais. Agora a barra de progresso no painel de InteligÃªncia Artificial processa cada imagem individualmente (Ex: 'Processando 1 de 3...'), tornando o navegador imune a travamentos ao enviar PDFs ou fotos pesadas.
- **Rastreamento de Faturas Parciais:** ComeÃ§ou a registrar os gastos agora, mas possui parcelas em aberto de meses passados? O painel de adiÃ§Ã£o de transaÃ§Ãµes de CartÃ£o de CrÃ©dito agora permite escolher exatamente em qual parcela a cobranÃ§a deve iniciar (Ex: 9 de 12).

- **Design de PatrimÃƒÂ´nio LÃƒÂ­quido:** A pÃƒÂ¡gina de investimentos agora conta com um Dashboard premium exibindo seu PatrimÃƒÂ´nio LÃƒÂ­quido com design mais fluÃƒÂ­do e atraente.
- **Tabela HistÃƒÂ³rica de Ativos Ampliada:** A tabela do livro-razÃƒÂ£o (ledger) agora ocupa a tela inteira de forma horizontal e as quantidades exatas sÃƒÂ£o formatadas mais limpas, eliminando a rolagem chata!
- **InformaÃƒÂ§ÃƒÂµes Detalhadas de Contas:** Agora ao criar uma Conta Corrente ou CartÃƒÂ£o de CrÃƒÂ©dito vocÃƒÂª receberÃƒÂ¡ um balÃƒÂ£o de explicaÃƒÂ§ÃƒÂ£o detalhada sobre como o dinheiro (On-Budget ou Fatura) funciona.
- **TraduÃƒÂ§ÃƒÂ£o:** A aba de investimentos na barra lateral agora descreve exatamente o que ela faz.

## AtualizaÃ§Ã£o: Suporte a Taxonomia Global de Investimentos (23/05/2026)

Agora o Vault Finance OS suporta uma organizaÃ§Ã£o de investimentos muito mais completa, classificando por paÃ­s e categoria macro (ex: Renda VariÃ¡vel BR, Exterior, etc). AlÃ©m disso, adicionamos suporte para vencimento (due date) em atividades de investimento!

- **Frontend de Investimentos Preparado:** FormulÃ¡rios de cadastro de ativos estÃ£o recebendo nova infraestrutura tÃ©cnica para exibir corretamente os novos tipos globais (AÃ§Ãµes, ETFs Internacionais, Criptomoedas, etc).







