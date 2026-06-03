# Gestão de Investimentos

O módulo de investimentos do Vault Finance OS foi desenhado para suportar um portfólio verdadeiramente global e multi-ativos, cobrindo ativos em múltiplas jurisdições.

## Taxonomia Global

O sistema categoriza os investimentos considerando a custódia e natureza de cada ativo:
- **Brasil (BR):** Ativos custodiados em território nacional (ex: Ações da B3, FIIs, Tesouro Direto, CDBs). O sistema exibe regras exclusivas de Renda Fixa brasileira.
- **Internacional (GLOBAL):** Ativos em outras jurisdições (ex: 🇺🇸 Estados Unidos, 🇵🇹 Portugal, 🇨🇭 Suíça, 🇸🇬 Singapura). Inclui Stocks, REITs e Bonds globais. O sistema identifica automaticamente países fora do Brasil e adequa as categorias de ativos.
- **Universal:** Ativos independentes de jurisdição (ex: Criptomoedas, Imóveis, Startups).

## Adicionando um Lançamento

Para registrar uma nova compra ou movimentação:
1. Navegue até a tela da carteira e clique em **+ Adicionar Lançamento**.
2. **País de Custódia:** Selecione a localização através de um *Combobox pesquisável* completo. A lista nativa obedece uma ordem puramente alfabética, no entanto, você pode **fixar os seus países favoritos no topo** clicando no ícone de "Pin" (Alfinete) à direita do nome de cada país. 
   - **Persistência Global:** Suas preferências de "Pin" não ficam apenas no navegador. Elas são sincronizadas em tempo real com o banco de dados da nuvem. Assim, se você utilizar o Capacities ou mudar de computador, seus países favoritos continuarão fixados lá.
   - Se você escolher Brasil (BR), a taxonomia de investimentos brasileira será exibida. Se selecionar qualquer outro país, a interface global entra em vigor.
3. **Macro Grupo:** Escolha a classe macro (Renda Variável, Renda Fixa Brasileira/Global, Criptoativos, Alternativos).
4. **Tipo Específico:** Selecione a subdivisão exata (ex: FIIs, Tesouro Direto, Stocks, Stablecoins).

O formulário de lançamentos e o acompanhamento de patrimônio são unificados:
- **Lançamento Tradicional:** Registre a Quantidade, o Preço Unitário e os Custos adicionais para calcular o custo total.
- **Rendimento/Ajuste Manual (YIELD):** Para registrar rendimentos acumulados ou conciliar diferenças de saldo, lance a atividade do tipo Rendimento informando a diferença no valor do ativo de forma direta.
