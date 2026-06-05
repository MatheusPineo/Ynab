# Cartões de Crédito e Integração de Logos Bancárias

Nesta versão, a seleção de subcontas em Cartões de Crédito foi atualizada. Agora você pode escolher suas contas e subcontas diretamente como origem da despesa na compra de cartão de crédito. As bandeiras dos cartões também são exibidas e sincronizadas corretamente.

## Integração de Logos Dinâmicas (Clearbit Logo API)

O Vault Finance OS agora suporta a integração automática e dinâmica de logos de bancos para as suas contas e cartões de crédito utilizando a API Clearbit Logo.

### Como Funciona:
1. **Cadastro ou Edição**: Ao criar ou editar uma conta/cartão de crédito, você verá um campo chamado **"Website / Domínio do Banco"** (ex: `itau.com.br`, `millenniumbcp.pt`, `nubank.com.br`).
2. **Carregamento Automático**: O sistema irá automaticamente construir e carregar a logo oficial correspondente a esse domínio.
3. **Fallbacks Robustos**: Caso o domínio esteja em branco ou ocorra um erro ao carregar a imagem do servidor da Clearbit, o sistema reverterá automaticamente para o seu ícone personalizado configurado na conta. Se este também não estiver disponível, o aplicativo renderizará o símbolo correspondente à moeda da conta (R$, €, $), mantendo uma interface limpa, elegante e livre de falhas de renderização.
4. **Locais de Exibição**: As logos dos bancos são apresentadas no menu de contas (lista sanfonada), no cabeçalho de detalhes de cada conta e no painel de controle (widget das "Top Contas").