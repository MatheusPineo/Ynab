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

O sistema adaptará o formulário automaticamente de acordo com o grupo:
- **Para Renda Fixa Brasileira:** O formulário focará nas condições de rentabilidade (Valor Aplicado, Indexador, Taxa de Retorno, Data de Vencimento e Liquidez).
- **Para Demais Ativos (Renda Variável Global, Renda Fixa Global, Cripto):** O foco é na negociação tradicional com inputs de Quantidade, Preço Unitário e Taxas/Custos adicionais. O Total será contabilizado na respectiva moeda base consolidada ($ ou R$).
