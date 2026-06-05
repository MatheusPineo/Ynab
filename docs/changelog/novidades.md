# Novidades e Atualizações

## Integração de Logos Bancárias Clearbit Logo API (05/06/2026) 🏦✨
Corrigimos e completamos a integração da Clearbit Logo API para exibição dinâmica de logotipos de instituições financeiras no Vault Finance OS:
* **Entrada de Website/Domínio:** Adicionamos o campo "Website / Domínio do Banco" (ex: `itau.com.br`, `nubank.com.br`) nos formulários de criação e edição de contas normais, subcontas e cartões de crédito.
* **Sanitização de URLs Sujas:** Adicionamos higienização automática no backend. Se você digitar uma URL completa (ex: `https://www.nubank.com.br/`), o sistema extrairá estritamente o domínio base (`nubank.com.br`), garantindo consultas corretas à Clearbit.
* **Persistência de Campo e Serialização:** O backend Django agora armazena e expõe o campo `bank_domain` e gera a propriedade calculada `bank_logo_url` no endpoint de árvore de contas (`/api/accounts/tree/`) e de cartões de crédito.
* **Correção de Sincronização:** Corrigimos um problema onde a edição do domínio no formulário exibia a mensagem de sucesso mas não persistia visualmente no painel de controle. Agora, o endpoint de árvore serializa adequadamente os campos `bank_domain` e `bank_logo_url` recursivamente para todas as subcontas filhas.
* **Reatividade Instantânea no DOM:** Corrigimos o estado de erro do React para resetar sempre que a URL do banco é alterada, forçando a pintura imediata da imagem no DOM assim que o formulário é salvo (sem necessidade de atualizar a página).
* **Exibição nas Listas e Detalhes:** A interface renderiza de forma elegante a marca do banco no menu de contas, no cabeçalho das páginas de detalhes e no widget "Top Contas" do painel de controle.
* **Fallbacks Elegantes com Lucide:** Caso o domínio não esteja preenchido ou a API da Clearbit não localize a marca do banco (erro 404), a interface exibe automaticamente um ícone genérico de banco (`Landmark`), mantendo o design limpo e consistente. Caso ocorram erros em outros arquivos de mídia, revertemos para o ícone customizado da conta.
* **Padronização Visual Completa:** Removemos os antigos círculos de moeda ("R$", "€") em contas e subcontas que não tinham imagem/logo. Agora todas as contas sem logo ou ícone customizado utilizam o mesmo componente de avatar exibindo o ícone genérico `Landmark`, criando uma identidade visual consistente em todo o painel.
* **Rastreabilidade de Depuração:** Adicionamos um trace em console (`console.log`) na renderização para que você possa inspecionar e confirmar em tempo real a chegada dos dados do domínio do banco vindos da API.

## Classificação 50/30/20 na Interface e Widget de Análises (05/06/2026) 🏷️📊
Integramos a nova propriedade de macroalocação diretamente no frontend do Vault Finance OS para tornar a regra 50/30/20 totalmente editável e visual:
* **Seletor de Classificação no Formulário:** Ao editar qualquer categoria/envelope, você verá um novo campo de seleção para classificar a categoria entre *Necessidade (50%)*, *Desejo (30%)*, *Poupança (20%)* ou *Não Rastrear*.
* **Badges Visuais Otimizados:** Envelopes classificados agora exibem um pequeno e discreto badge colorido ao lado de seu nome (`50%`, `30%` ou `20%`) diretamente na tabela do orçamento.
* **Widget Analítico Reativo:** O painel de monitoramento da Regra 50/30/20 no rodapé foi totalmente refatorado para calcular dinamicamente os totais baseados nas suas tags personalizadas, divididos pela renda real mensal recebida.

## Tags de Macroalocação (Regra 50/30/20) nas Categorias (05/06/2026) 🏷️📊
Adicionamos uma nova camada analítica de tags no backend para a Regra 50/30/20 nas categorias do orçamento:
* **Nova Propriedade `macro_allocation`:** Agora cada envelope de categoria pode ser explicitamente categorizado sob uma macro-alocação: *Necessidades (50%)*, *Desejos (30%)*, *Poupança/Investimentos (20%)* ou *Não Monitorado*.
* **Exposição do Campo na API:** Os serializadores e o endpoint estruturado em árvore (`/api/finance/categories/tree/`) foram atualizados para expor essa classificação de forma dinâmica, permitindo relatórios e dashboards mais inteligentes no frontend.

## Redesenho Minimalista e Foco no Orçamento Base-Zero (05/06/2026) 🎨💎
Executamos uma limpeza radical na interface da página de Orçamento mensal para reduzir a sobrecarga cognitiva e manter o foco estrito na metodologia de Orçamento Base-Zero:
* **Menu de Ações Consolidado:** Removemos todos os botões soltos de rebalanceamento do cabeçalho. As funções de *Capturar Receita*, *Financiar Metas*, *Cobrir Rombos*, *Recolher Sobras* e *Limpar Mês* agora residem juntas em um único menu dropdown discreto ("⋮") posicionado ao lado do seletor de meses.
* **Métrica de RTA em Destaque:** O painel "Disponível para Alocar" (Ready to Assign) foi ampliado e centralizado, tornando-se o foco absoluto da tela com tipografia clean e legibilidade premium.
* **Banner de Receitas Pendentes:** Em vez de listar todas as receitas abertas na tela inicial, criamos um banner elegante que avisa se você possui receitas aguardando distribuição e abre um Dialog Modal interativo para gerenciar esses lançamentos sem poluir o visual.
* **Widget 50/30/20 Relocado:** O painel de monitoramento da Regra 50/30/20 foi movido para o rodapé da página para não conflitar com a listagem principal de envelopes.

## Agregação Correta de Múltiplas Moedas no Orçamento (05/06/2026) 💱💵
Corrigimos um bug contábil no cálculo do orçamento mensal. Anteriormente, se você possuía contas em moedas diferentes (como EUR e BRL), o sistema somava os valores de forma cega de 1 para 1 (ex: somando €1.000,00 e R$6.000,00 como 7.000). Agora, o motor de orçamentos no backend normaliza todas as receitas e despesas de BRL/USD para EUR (moeda base) de forma automática usando as taxas oficiais correspondentes (1 EUR = 6 BRL, 1 EUR = 1.08 USD) antes de gerar o saldo "Disponível para Alocar" (Ready to Assign) e o saldo disponível de cada envelope. Isso garante relatórios e planejamentos 100% precisos e livres de distorções cambiais.

## Recuperação Automática após Atualizações (05/06/2026) 🔄✅
Implementamos um mecanismo inteligente de **auto-recuperação** no Vault Finance OS. Agora, quando publicamos uma nova versão da plataforma enquanto você está usando o sistema, ao navegar para uma nova tela, a página se atualiza automaticamente e de forma transparente — sem exibir erros ou telas em branco. Você sempre verá a versão mais recente do sistema sem precisar recarregar manualmente o navegador.

## Correção de Estabilidade na Página de Patrimônio (05/06/2026) 🐛✅
Corrigimos um problema que impedia a página de **Patrimônio e Ativos** de carregar corretamente. Ao acessar a tela de ativos, o sistema exibia uma tela em branco ou um erro genérico. A falha foi identificada como um defeito interno de carregamento do módulo e já foi resolvida — a página de Patrimônio agora abre normalmente e exibe todos os seus dados e funcionalidades.

## Correção de Estabilidade na Listagem de Transações (05/06/2026) 🐛✅
Identificamos e corrigimos um erro raro que podia causar um travamento momentâneo na tela de transações ao trocar rapidamente entre filtros (como "Pendentes" e "Todas"). O problema ocorria quando a lista virtual tentava acessar itens ainda não carregados durante a transição. Agora a lista possui verificações preventivas e a navegação entre filtros é fluida e segura.

## Central de Alertas Globais e Ações Pendentes (05/06/2026) 🔔🛠️
Implementamos um hub centralizado de notificações para ajudar você a gerenciar e resolver pendências operacionais no Vault Finance OS instantaneamente:
* **Sino de Ações Pendentes:** O ícone de sino de notificação no cabeçalho global monitora continuamente o seu banco de dados e exibe um indicador de alerta dinâmico caso existam ações urgentes exigindo sua atenção.
* **Agrupamento Inteligente de Pendências:** O menu dropdown de notificações consolida de forma amigável:
  - **Homologação de Comprovantes:** Cupons fiscais ou recibos que o Gemini AI processou na Inbox Inteligente e aguardam sua conferência e confirmação em lote.
  - **Transações Agendadas Pendentes:** Transações futuras ou lançamentos agendados que chegaram ao vencimento e precisam ser efetivados no sistema.
* **Roteamento Inteligente e Resolução com Um Clique:** Clicar em qualquer pendência dentro do dropdown de notificações redireciona você instantaneamente para a tela correta (como a Inbox de IA ou a listagem filtrada de transações pendentes) onde você pode homologar e resolver o item imediatamente.

## Modelos de Distribuição e Seleção Visual de Bancos (05/06/2026) ⚙️🏦
Aprimoramos o ecossistema do Vault Finance OS com suporte expandido para distribuição de receitas e identificação visual de suas contas financeiras:
* **Modelos de Distribuição por Envelopes (Templates):** Agora os Modelos de Distribuição suportam o direcionamento de fundos diretamente para **Categorias de Envelopes** do seu orçamento YNAB, além de subcontas financeiras tradicionais. O motor do backend foi totalmente corrigido para aceitar a criação e persistência de payloads mistos com total segurança.
* **Atalho Direto para Configuração (Gerenciar Modelos):** Adicionamos um botão de engrenagem ("Gerenciar Modelos") diretamente no modal de distribuição. Ao clicar nele, o sistema te redireciona automaticamente para as Configurações (`/settings?tab=templates`) abrindo de forma reativa a aba correspondente sem exigir cliques adicionais.
* **Seleção Visual de Ícones de Conta:** Implementamos um seletor visual interativo de logomarcas de bancos (**IconPicker**) no formulário de criação e edição de Contas e Subcontas. Escolha a marca oficial da sua instituição financeira (ex: Nubank, Itaú, Bradesco, Banco do Brasil, Santander, Caixa, Inter, etc.) e o sistema salvará a referência para exibi-la reativamente em todos os menus do aplicativo.


## Refatoração de UI e Ordenação de Transações (05/06/2026) 🧹📊
Realizamos uma série de melhorias de usabilidade e limpeza visual nas telas de transações e contas:
* **Remoção de Campos Redundantes:** Eliminamos o campo "Categoria de Orçamento" do modal de novos lançamentos para simplificar a criação de transações diárias. Ajustamos também os fluxos de cartões de crédito para permitir compras rápidas sem categoria.
* **Limpeza na Visualização de Subcontas:** Removemos o botão "+ nova transação" de dentro das páginas individuais das subcontas, já que o botão global de lançamento no cabeçalho cumpre essa função perfeitamente, limpando a tela de controles redundantes.
* **Ordenação Interativa Completa:** Agora você pode clicar nos cabeçalhos das colunas **Data**, **Descrição** e **Status** na tabela de transações para ordenar seus dados de forma crescente ou decrescente instantaneamente. A ordenação é executada localmente de forma extremamente rápida e sem alterar a integridade dos dados originais.


## Patrimônio Líquido e Controle de Ativos (Net Worth & Assets) (05/06/2026) 🏢📈
Lançamos o módulo completo de **Ativos Patrimoniais e Runway Financeiro (Termômetro de Liquidez)** no Vault Finance OS:
* **Cadastro de Bens e Ativos:** Agora você pode cadastrar ativos de forma integrada no sistema (ex: Imóveis, Carros, Equipamentos, Jóias, além de contas financeiras de investimento). Cada ativo armazena dados de valor de compra, valor atual de mercado e nível de liquidez.
* **Vínculo Transparente com Dívidas:** Vincule seus ativos diretamente a dívidas registradas no sistema (ex: financiamento do carro ou hipoteca da casa).
* **Cálculo de Valor Efetivo:** O sistema calcula automaticamente o valor real e líquido que você detém daquele bem deduzindo o saldo devedor restante: `Valor Efetivo = Valor de Mercado - Dívida Restante`. Se o valor for negativo (ex: desvalorização do bem abaixo do financiamento), o sistema limita a zero para proteger seu cálculo patrimonial.
* **Runway Financeiro (Termômetro de Liquidez):** O novo endpoint calcula reativamente quantos meses você consegue se sustentar sem novas receitas. A engine soma o valor dos seus ativos de liquidez imediata e média e divide pela sua despesa mensal média real (calculada a partir do histórico de transações dos últimos 90 dias ou do orçamento ativo como fallback).

## Otimização de Performance Profunda - Fase 3 (04/06/2026) ⚡🧠
Concluímos a terceira e última fase do nosso plano de otimização de performance, agora focada em tornar os cálculos internos e o carregamento inicial da aplicação significativamente mais rápidos:
* **Motor de Orçamento Turbinado:** Os cálculos internos que processam todo o seu histórico de receitas, alocações e gastos por envelope foram completamente reestruturados. O sistema agora recolhe todos os dados necessários de uma só vez e processa mês a mês com consultas otimizadas, em vez de buscar os dados repetidamente a cada mês. Isso torna a abertura da tela de **Orçamento** muito mais responsiva, especialmente para usuários com vários meses de histórico.
* **Metas de Categoria Instantâneas:** O cálculo do valor faltante para atingir suas metas de poupança e gastos agora é feito de forma agrupada. Antes, cada categoria consultava individualmente sua meta no banco de dados — agora todas as metas são carregadas em uma única consulta e distribuídas internamente, eliminando atrasos visíveis ao carregar a árvore de orçamento.
* **Relatórios de Patrimônio Líquido Acelerados:** A evolução do seu patrimônio ao longo dos meses é agora computada com uma consulta consolidada, reduzindo drasticamente o tempo de cálculo para gerar os gráficos de evolução patrimonial.
* **Carregamento Ultra-Rápido de Páginas:** A aplicação agora carrega apenas o módulo necessário para a página que você está a visitar. As telas de **Dashboard**, **Transações**, **Dívidas**, **Relatórios**, **Cartões de Crédito**, **Investimentos** e todas as demais são carregadas sob demanda, resultando num arranque inicial do aplicativo muito mais leve e responsivo.
* **Gráficos Carregados Sob Demanda:** A biblioteca de gráficos usada na tela de **Relatórios** (271 kB) agora é descarregada apenas quando você navega para a página de relatórios. Isso reduz significativamente o peso do carregamento inicial do aplicativo para quem não acessa relatórios com frequência.

## Otimização de Performance no Frontend - Fase 2 (04/06/2026) ⚡🎨
Finalizámos a segunda fase do nosso plano de otimização de performance, desta vez focados estritamente na velocidade de renderização e reatividade visual do frontend do Vault Finance OS:
* **Fim das Requisições em Cascata (Waterfalls):** Reduzimos drasticamente o tempo de carregamento inicial do painel de **Dívidas**. Agora, a coleta de roommates e saldos pendentes ocorre em paralelo (`Promise.all()`), e os saldos agregados são buscados de uma só vez pelo componente pai e distribuídos aos cartões. Isso elimina dezenas de conexões concorrentes simultâneas ao abrir a página.
* **Transações Fluidas e Rolagem Infinita (Virtualização):** A listagem de **Transações** foi equipada com renderização virtualizada utilizando a biblioteca `react-window`. Agora, tanto a tabela desktop quanto os cards para telemóveis renderizam instantaneamente no navegador apenas as linhas que estão visíveis no ecrã. Isso impede o travamento do scroll e o consumo excessivo de memória ao gerenciar centenas ou milhares de registros.
* **Componentes e Gráficos Memorizados:** Evitámos re-renderizações desnecessárias em áreas sensíveis:
  - As funções da store na visualização de faturas em **Cartões de Crédito** foram encapsuladas em hooks de memorização para manter a navegação suave.
  - O gráfico principal do **Dashboard** foi isolado e memorizado. Interagir com o cursor do gráfico ou fazer consultas em outras áreas do dashboard não causa mais re-desenho redundante de toda a página inicial.

## Otimização de Performance no Backend - Fase 1 (04/06/2026) ⚡🚀
Executámos a primeira fase do nosso plano de otimização de performance no backend do Vault Finance OS para garantir respostas imediatas da API e carregamento ultra-rápido de dados:
* **Banco de Dados mais Inteligente:** Adicionámos índices de alta performance nas tabelas e colunas mais filtradas e consultadas pelo sistema (`MonthlyBudget` por mês/ano, `Installment` por status de parcelas, e `Debt` por tipo de dívida). Isso acelera significativamente as buscas internas e os relatórios.
* **Fim das Consultas Repetitivas (N+1):** Otimizámos as consultas das categorias de orçamento, dotações orçamentárias mensais e regras de rateio. O servidor agora recolhe todas as relações de dados necessárias em uma única consulta estruturada, reduzindo drasticamente o número de acessos ao banco de dados e a latência de rede.
* **Cálculos Acelerados no Banco de Dados:** Refatorámos o processamento de dívidas e de faturas de cartões de crédito. Cálculos pesados de somatórios e saldos restantes, que antes consumiam processamento em memória, agora são executados diretamente no PostgreSQL em nível de banco de dados (`annotate` e `Sum`). O serializer recebe os totais prontos, aliviando o carregamento dos cards de devedores e a listagem de faturas.

## Telemetria de Estabilidade e Diagnóstico Avançado (04/06/2026) 🔍🛠️
Integrámos o PostHog ao ecossistema do Vault Finance OS para garantir que o seu aplicativo funcione sempre de forma ultra estável e com performance de ponta:
* **Unificação e Resiliência nas Conexões:** Unificámos todas as requisições do painel de Configurações e sincronizações de idioma sob o componente central de chamadas (`authenticatedFetch`). Isso significa que a renovação de tokens JWT expirados agora ocorre de forma transparente (sem deslogar o utilizador) e falhas de conexão de rede são capturadas e tratadas de forma unificada na telemetria de produção.
* **Prevenção de Loops e Travamentos no Orçamento:** Corrigimos uma falha que causava travamento silencioso (React Error #185) ao tentar editar ou excluir categorias de orçamento no painel. O erro ocorria devido a um conflito invisível de focos entre a caixa de diálogo e o menu suspenso do Radix UI, que agora foi totalmente blindado com prevenção de foco concorrente.
* **Diagnóstico Silencioso de Falhas:** O sistema agora detecta e reporta falhas críticas do servidor em tempo real para o nosso time de engenharia. Isso permite que bugs sejam corrigidos preventivamente antes de impactarem a sua rotina financeira.
* **Rastreamento de Anomalias de Cálculo (Invariantes de Negócio):** Introduzimos o utilitário de invariantes de negócios. Caso ocorra alguma inconsistência matemática ou diferença de centavos ao rodar simulações como o Smart Income Splitter, um evento silencioso de anomalia é enviado para depuração automatizada antes de afetar os dados do usuário.
* **Rastreamento Avançado de Falhas no Backend:** Implementámos o middleware `TelemetryExceptionMiddleware` no Django. Agora, qualquer erro não tratado de servidor (HTTP 500) é reportado com o histórico completo de pilha de execução (*stack trace*) e dados do usuário para o PostHog, otimizando as auditorias de suporte.
* **Rastreamento de Erros da API:** Implementámos um interceptor de rede global. Agora, qualquer falha HTTP (como erros de servidor 500 ou requisições ruins 400 da API do Django) é detectada de forma proativa e enviada como um evento de diagnóstico ao PostHog com detalhes sobre o método, endereço do endpoint e corpo do erro de forma higienizada e segura.
* **Detecção de Quedas de Rede Físicas:** Adicionámos rastreamento para erros físicos de conexão (como bloqueios de CORS, quedas de DNS ou estado de internet offline do utilizador). O frontend reporta essas ocorrências como eventos `network_failure` para melhor análise de indisponibilidade externa.
* **Auditoria de UX e Erros Tratados:** Lançámos uma biblioteca centralizada de telemetria para registrar exceções em blocos try/catch e falhas de validação de formulários. O formulário de registro de chaves de celular, por exemplo, agora notifica falhas de validação (como campos obrigatórios vazios) para que possamos otimizar a experiência do usuário.
* **Captura de Erros no Error Boundary:** Acoplámos o PostHog diretamente ao nosso capturador de erros do frontend (`ErrorBoundary`). Assim, mesmo quando o aplicativo impede que um travamento se espalhe pela tela inteira ("White Screen of Death"), a falha é detectada e registrada com sucesso na telemetria, prevenindo bugs invisíveis.
* **Mapeamento de Fontes e Desofuscação de Alta Fidelidade:** Otimizámos a geração de mapas de fontes (`sourcemap: true`) e a compilação do Vite (`esbuild: { keepNames: true }`) para preservar nomes originais de classes e funções do código. Ajustámos também o `vercel.json` para que as requisições do crawler do PostHog aos arquivos de mapa contornem o rewrite global do SPA, permitindo a perfeita resolução nítida de stack traces minificados de volta para o código TypeScript original.
* **Privacidade dos Dados Garantida:** Mantemos conformidade rígida com a LGPD e GDPR. O sistema captura apenas detalhes de erros e navegação básica (como páginas lentas) para auditoria de estabilidade, sem registrar informações de saldos confidenciais, senhas ou dados pessoais.
* **Gravação de Sessões de Suporte:** Habilitámos o recurso que permite simular visualmente ações que geraram travamentos na interface, permitindo que a nossa equipe de suporte compreenda e replique erros de layout de forma muito mais rápida.
* **Isolamento de Ambientes:** Telemetrias e rastreamento são desligados automaticamente em modo de testes locais ou simulações automatizadas, garantindo que o banco de dados de desempenho real reflita a utilização genuína da plataforma.

## Painel de Dispositivos Crunchyroll-Style e Metadados Ricos (03/06/2026) 📱🔒
Aprimoramos o controle de segurança e gerenciamento de dispositivos autorizados no backend com um painel no estilo Crunchyroll:
* **Metadados Ricos:** O modelo `TrustedDevice` agora armazena informações completas de contexto:
  - **Sistema Operacional & Navegador (`os_browser_info`):** Exibe o agente parseado de forma amigável (ex: "Chrome on Windows").
  - **Nome Customizado (`custom_name`):** Nome opcional dado pelo usuário para identificar o aparelho (ex: "S23 Ultra de Matheus").
  - **Endereço IP (`ip_address`):** Rastreia o endereço IP do dispositivo de conexão (considerando cabeçalhos `HTTP_X_FORWARDED_FOR`).
  - **Localização Geográfica (`location_string`):** Traduz o fuso horário geográfico do dispositivo para um formato legível de localização (ex: `Lisbon, Europe`).
  - **Tempo de Uso (`last_used_at`):** Registra automaticamente a última data e hora de atividade do dispositivo através de um campo com atualização automática (`auto_now=True`).
* **Sessão Atual Ativa (`is_current_device`):** O serializer agora identifica reativamente e destaca se o dispositivo listado corresponde à sessão ativa atual que fez a requisição.
* **Validação Resiliente e Flexível:** Tornamos o validador do serializer tolerante a campos ausentes (como `custom_name` e `device_key`), gerando fallbacks inteligentes para evitar erros do tipo "This field is required" no fluxo de registro manual.

## Detecção Inteligente e Registro Robusto de Dispositivos (03/06/2026) 📱💻
Aprimoramos o fluxo de segurança e autorização de dispositivos de forma a eliminar falhas na versão Web e coletar dados mais precisos:
* **Prevenção de Crash em Navegadores:** O sistema agora detecta via `Capacitor.getPlatform()` se está rodando em ambiente web. Se estiver no navegador, ele ignora a chamada ao plugin nativo `DeviceAuth` (resolvendo o erro de plugin não implementado) e salva a chave de confiança localmente de forma segura.
* **Coleta de Metadados do Aparelho (Crunchyroll-Style):** O payload de registro foi enriquecido com metadados detalhados:
  - **Nome Inteligente por SO:** Em vez de registrar genericamente como "Telemóvel Android" no computador, o Vault detecta o User-Agent e nomeia o dispositivo de forma apropriada (ex: *Windows PC*, *Mac*, *Linux PC*).
  - **User-Agent & Timezone:** O backend passa a receber de forma passiva a string inteira de agente (`raw_user_agent`) e o fuso horário geográfico ativo (`timezone` via Intl API) para auditoria e controle de sessões.
* **Tratamento de Exceções Nativo:** O salvamento no plugin nativo do Capacitor agora conta com blocos robustos de `try/catch` para garantir que o fluxo de autorização nunca trave a UI do usuário caso ocorra alguma falha de hardware.

## Regras de Rateio (Split Rules) & UX de Recorrência Inteligente (03/06/2026) 🤝⏰
Implementamos novas facilidades e controles avançados para transações compartilhadas e edições de recorrência:
* **Rastreabilidade de Devedores (Novidade v1.44.09):** O painel de roommates/devedores ganhou total transparência. Agora, cada card de dívida exibe a transação matriz de origem com o valor compartilhado original, a regra aplicada (e.g. "🔗 Divisão Casa") e o envelope que receberá o reembolso direto ("Retorna para o envelope: [Nome]").
* **Aplicar Regras de Rateio (Split):** Agora você pode marcar a opção "Aplicar Regra de Rateio?" diretamente no lançamento de qualquer despesa ou receita comum. Ao marcar, selecione a regra cadastrada e informe um valor compartilhado opcional (caso queira ratear apenas uma parte do valor total).
* **Deep Link Sem Perda de Dados (Criar/Editar):** Ao lado do seletor de regras, o atalho "Criar/Editar" salva instantaneamente o rascunho de todos os campos preenchidos no formulário (descrição, valor, conta, etc.), direciona você para a página de configurações de regras e restaura todo o rascunho automaticamente ao retornar.
* **Modal de Ajuste de Recorrência:** Quando você altera o valor de uma transação agendada recorrente (`status='scheduled'`), um novo modal intercepta a ação e pergunta se deseja aplicar o novo valor apenas a esta ocorrência específica (Opção A) ou atualizar o modelo padrão para todos os meses futuros (Opção B).

## Lançamento Simplificado de Transações sem Checkbox de Categoria (03/06/2026) 💸🏷️
Simplificamos o fluxo de lançamento de receitas e despesas no sistema removendo etapas desnecessárias:
* **Remoção do Checkbox Intermediário:** Eliminamos a pergunta opcional "Vincular a uma categoria?" e seu respectivo checkbox.
* **Exibição Direta do Seletor:** Agora, o campo para escolher a Categoria de Orçamento (ou mantê-la como "Sem categoria") é exibido por padrão diretamente no modal para qualquer transação comum de entrada ou saída de caixa.

## Painel Analítico Regra 50/30/20 no Orçamento (03/06/2026) 📈📊
Adicionamos um painel analítico dinâmico (termômetro visual) no topo do seu Orçamento Mensal que permite acompanhar a conformidade das suas alocações com a clássica regra 50/30/20 (Necessidades/Desejos/Poupança) em tempo real:
* **Classificação Macro de Categorias:** Os grupos de categorias principais agora podem ser classificados no sistema sob uma regra macro correspondente: **Necessidades (Needs)**, **Desejos (Wants)** ou **Poupança (Savings)**.
* **Metas Customizáveis por Perfil:** Defina suas próprias porcentagens ideais de metas diretamente no perfil de usuário (por padrão 50% para Necessidades, 30% para Desejos e 20% para Poupança).
* **Termômetros Visuais Dinâmicos:** Um indicador de barras de progresso no cabeçalho do Orçamento compara instantaneamente o percentual de dinheiro alocado em cada grupo macro contra a renda total recebida no mês corrente.
* **Alertas Inteligentes de Estouro:** As barras mudam automaticamente de cor (verde para amarelo ou vermelho) caso a alocação exceda os limites planejados, fornecendo um aviso preventivo sutil sobre possíveis desequilíbrios de caixa.

## Auto-Assign Inteligente e Financiamento de Metas de Orçamento (03/06/2026) 🎯💰
Lançamos o recurso **Auto-Assign (Financiamento Inteligente de Metas)** para acelerar o planejamento financeiro do envelope com base no comportamento de cada meta de despesa ou poupança:
* **Tipos de Metas Avançados:** O modelo de categorias agora aceita configurações específicas de comportamento:
  - `NEEDED_FOR_SPENDING` (Necessário para Gastos): Calcula a diferença entre o saldo atual da categoria e o target desejado, alocando apenas a quantia faltante.
  - `SAVINGS_BUILDER` (Acumulador de Poupança): Ignora o saldo disponível acumulado anteriormente e aloca o valor total da meta estipulada para o mês corrente.
* **Algoritmo de Priorização:** O botão "Financiar Metas" executa uma varredura priorizando o preenchimento de metas de gastos obrigatórios (`NEEDED_FOR_SPENDING`) antes de alocar recursos nos acumuladores de poupança (`SAVINGS_BUILDER`).
* **Segurança do Saldo Disponível (RTA):** O sistema monitora o saldo `Ready to Assign` e suspende a distribuição assim que o saldo atinge zero, evitando a geração de saldos vermelhos acidentais no planejamento mensal.
* **Operação com Um Clique:** Ative o preenchimento automático das metas através do novo botão "Financiar Metas" disponível no menu superior do Orçamento Mensal.

## Smart Income Splitter: Divisor Inteligente de Receitas (03/06/2026) 💸🎭
Introduzimos o simulador **Smart Income Splitter**, uma ferramenta inovadora desenvolvida para gerenciar finanças compartilhadas e receitas variáveis com precisão contábil:
* **Simulação de Divisão sem Lançamentos Fantasmas:** Agora, ao registrar uma receita, você pode acionar a modal de simulação de partição. Isso permite visualizar como a receita é distribuída com parceiros ou sócios antes de realizar a gravação contábil.
* **Múltiplas Regras de Repartição:** Escolha entre regras como *Needs Fund (Fixo)*, *Divisão 50% / 50%* ou *Divisão 70% / 30%*. O sistema lê automaticamente a meta consolidada de despesas fixas (Needs) do seu orçamento para parametrizar a divisão.
* **Isolamento de Caixa Limpo:** O lançamento final de receita gravado no sistema registra e envia apenas o valor correspondente à sua parte para custear as necessidades fixas. A sobra ou parte correspondente ao parceiro é excluída do seu livro-razão e do RTA, evitando inflar artificialmente sua renda disponível ou poluir o caixa.
* **Acesso Simplificado:** Acesse a funcionalidade através do novo botão "Capturar Receita com Split Inteligente" localizado no cabeçalho do Orçamento Mensal.

## Painel de Ajuste Cascading Smart Ledger (03/06/2026) 📊🔄
Lançamos uma interface visual dedicada e de alto desempenho para gerenciar seus investimentos de forma dinâmica e precisa:
* **Novo Painel de Ajustes (SmartLedgerModal):** Adicionado o botão "Ajustar Livro-Razão (Smart Ledger)" na tela de Investimentos. Ele abre um painel em árvore dinâmico mostrando as Contas, as Macro Categorias e os Ativos.
* **Cascata Reativa (Bottom-Up):** Edite saldos de ativos unitários diretamente na árvore e assista à soma automática recalcular reativamente em tempo real no nível da Macro Categoria e da Conta correspondente.
* **Distribuição Proporcional Inteligente (Top-Down):** Se você editar o saldo de uma Conta ou de uma Macro Categoria, a interface recalcula e redistribui proporcionalmente a diferença sobre todos os ativos sob ela, aplicando automaticamente restos centesimais ao ativo mais relevante.
* **Persistência Consolidada:** Um botão integrado de submissão unifica todas as mudanças da árvore local e envia os novos saldos em um único lote otimizado para o backend.

## Descontinuação do Motor de Investimentos & Smart Ledger (03/06/2026) 💸📈
Realizamos a simplificação ("lobotomia") definitiva do motor de investimentos do Vault Finance OS em favor do modelo **Smart Ledger** manual direcionado pelo usuário:
* **Fórmula Simplificada de Saldo (Smart Ledger):** O saldo (Valor Bruto) de qualquer ativo (seja ação ou renda fixa) agora é puramente a soma e subtração dos lançamentos declarados: `SUM(BUYs) - SUM(SELLs) + SUM(YIELDs)`. Não há mais juros compostos CDI projetados dinamicamente por dia útil nem acúmulo temporal matemático.
* **Lançamentos de Rendimento Manual (`YIELD`):** Adicionada a opção de lançar atividades do tipo Rendimento/Ajuste Manual, que incrementam diretamente o valor do ativo na carteira de investimentos.
* **Atualização de Saldos em Lote:** Novo endpoint `POST /api/wealth/batch-update/` que permite atualizar em bloco os saldos reais declarados. O sistema calcula a diferença contra o saldo atual em banco e gera de forma autônoma a transação de ajuste `YIELD` correspondente.
* **Isenção de Impostos Teóricos Fiscais:** Descontinuamos os cálculos e provisionamento regressivo de Imposto de Renda (IR) e IOF na carteira, delegando o controle de liquidez e declaração total de forma simples e direta ao usuário.

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
