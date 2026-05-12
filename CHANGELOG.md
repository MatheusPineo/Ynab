# Registro de Alterações — Vault Finance OS (Changelog)

Todas as alterações notáveis, correções de bugs, novas funcionalidades e marcos estéticos aplicados ao **Vault Finance OS** são registrados de forma cronológica neste documento. Ele segue rigorosamente o padrão internacional do [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/) e adota o Versionamento Semântico (**SemVer**): `MAJOR.MINOR.PATCH`.

A linha do tempo abaixo foi sincronizada e mapeada diretamente a partir do histórico real de commits do Git para refletir a evolução fidedigna de nosso software.

---

## [1.17.4] — 2026-05-12

Esta versão realiza a **Implementação de Relatórios Opcionais e Correção de Bugs de Runtime na Central de Relatórios (Reports.tsx)** no Vault Finance OS. Focada em modularização sob demanda e usabilidade, ela introduz novos controles de feature flags para cada tipo de relatório (Iniciante, Intermediário, Avançado, Contábil, Eficiência, Risco, Auditoria, Corporativo, Integridade) e corrige dois erros graves na navegação e exibição do painel de auditoria.

### Adicionado
* **Configurações de Relatórios Opcionais:**
  - **useFeatureStore.ts:** Expansão do tipo `EnabledFeatures` e do estado persistente de controle de recursos com 9 novas chaves de visibilidade de relatórios individuais (`report_beginner`, `report_intermediate`, `report_advanced`, `report_compliance`, `report_performance`, `report_risk`, `report_audit`, `report_business`, `report_integrity`). Todos iniciados como ativos por padrão (`true`).
  - **Settings.tsx:** Integração automática das novas chaves de relatórios no painel de Módulos Opcionais das Configurações, contendo títulos claros e descrições detalhadas das ferramentas de análise.
  - **Reports.tsx:** Sincronização reativa e ocultação dinâmica dos botões das abas na barra de navegação de relatórios com base nas preferências salvas pelo usuário. Inclui redirecionamento inteligente automático com `useEffect` para a primeira aba habilitada disponível caso a aba ativa seja desativada.

### Corrigido
* **Crash de Navegação em Auditoria:**
  - **Reports.tsx:** Correção dos erros fatais de JavaScript `"Search is not defined"` e `"CheckSquare is not defined"` ao selecionar a aba de Auditoria, decorrentes de importações em falta dos ícones `Search` e `CheckSquare` de `lucide-react`.
* **Exibição Redundante Contábil:**
  - **Reports.tsx:** Correção da lógica de aninhamento de condicionais de renderização no JSX. O painel de "Conformidade & Contabilidade" (compliance) que funcionava como "else" padrão do primeiro ternário principal foi refatorado para ter seu próprio condicional estrito (`activeLevel === "compliance" ? (...) : null`). Isso impede que o painel de Contabilidade seja renderizado incorretamente por baixo de outras abas como "Eficiência", "Corporativo", "Risco" e "Integridade".
* **Geração e Download de Relatório PDF Corrompido:**
  - **Reports.tsx:** Resolução do bug em que o botão "Download PDF" baixava um arquivo de texto plano (`text/plain`) com extensão fictícia `.pdf`. Os leitores de PDF consideravam o arquivo corrompido e recusavam a abertura. Refatorado para disparar uma janela de impressão executiva limpa e monoespaçada que formata o relatório perfeitamente para papel e possibilita o salvamento em PDF real legítimo e íntegro pelo navegador, mantendo um fallback seguro e automático para `.txt` caso bloqueadores de pop-ups impeçam o fluxo.

---

## [1.17.3] — 2026-05-12

Esta versão realiza a **Correção de Crash de Runtime na Central de Relatórios (Reports.tsx)** no Vault Finance OS. Focada em segurança de tipos e robustez matemática, ela resolve um travamento instantâneo que ocorria ao carregar o painel de relatórios quando o banco de dados do Django retornava IDs numéricos inteiros para as transações, impedindo que o método `.split("")` quebrasse o fluxo de renderização do React.

### Corrigido
* **Crash de Conversão de Tipo de ID de Transação:**
  - **Reports.tsx:** Correção das chamadas diretas de `.split("")` no atributo `t.id` nas engines de Mapa de Calor de Vazamentos Temporais (linha 1707) e Trilha de Auditoria Compartilhada (linha 1765). Agora, o ID é encapsulado de forma segura como string via `String(t.id || "")` antes do fatiamento, tolerando perfeitamente tanto identificadores numéricos (chaves primárias autoincrementais do Django) quanto UUIDs de texto.

---

## [1.17.2] — 2026-05-12

Esta versão realiza a **Correção Estrutural e Redecoração de Luxo dos Modais de Dívidas** no Vault Finance OS. Focado em usabilidade e design responsivo mobile-first, ela elimina uma quebra de layout no componente de dívidas causada por conflitos de aninhamento de tags e esmagamento horizontal de campos, transformando o formulário em um layout vertical luxuoso e fluído com suporte a glassmorphism.

### Corrigido
* **Aninhamento Inválido de Componentes:**
  - **Debts.tsx:** Correção da inserção de elementos `<DialogFooter>` dentro de `<DialogHeader>` que causava o vazamento de layouts flexbox horizontais indesejados, corrompendo a organização estrutural dos inputs no formulário.
* **Layout Espremido e Sobreposições:**
  - Mudança do layout horizontal rígido (`grid-cols-4`) para um elegante fluxo de empilhamento vertical (`flex flex-col gap-1.5` e `space-y-4`) com labels posicionadas de forma limpa acima de cada campo. Isso previne cortes de texto e sobreposição de inputs em todas as resoluções de tela.

### Alterado
* **Estilização Premium de Dívidas:**
  - Redesenho dos modais de **Nova Dívida**, **Registrar Pagamento** e **Adicionar Débito** incorporando a paleta de cores HSL, gradientes sutis, cantos arredondados generosos (`rounded-3xl` e `rounded-xl`) e efeito de glassmorphism (`backdrop-blur-md bg-gradient-to-br from-card/90 via-card/50 to-primary/5`) em conformidade com a assinatura visual do sistema.

---

## [1.17.1] — 2026-05-12

Esta versão consagra a **Redecoração Visual de Luxo da Central de Ajuda e Suporte (HelpCenter.tsx)** no Vault Finance OS. Utilizando o design do painel de faturamento e assinaturas como referência máxima de elegância, a Central de Ajuda foi inteiramente reconstruída sob a estética de glassmorphism translúcido, brilhos sutis de profundidade e micro-transições impecáveis.

### Alterado
* **Redesenho do HelpCenter:**
  - **HelpCenter.tsx:** Reconstrução visual completa do formulário de abertura de tickets de suporte, menu lateral de canais e painel de feedbacks anteriores. Adicionados elementos translúcidos de vidro, efeitos de hover de altíssimo nível, badges premium do Shadcn UI e animações de drag and drop para arquivos anexados.

---

## [1.17.0] — 2026-05-12

Esta versão realiza a **Modularização de Alta Fidelidade da Aba de Assinaturas e Planos** no Vault Finance OS. Extraído diretamente do escopo de simulações do Lovable, o ecossistema agora gerencia e valida de forma isolada os planos e simulações de faturamento (Stripe, Apple App Store, Google Play Store), integrando visualizações dinâmicas de consumo de limites gratuitos, histórico de recibos para download e benefícios corporativos Pro através de um componente autônomo de alta coesão (`SubscriptionPanel`).

### Adicionado
* **Componente Modularizado SubscriptionPanel:**
  - **SubscriptionPanel.tsx (Novo):** Criação do componente isolado dentro do ecossistema `@/modules/auth/components/` contendo cards de preços dinâmicos, limitadores visuais de consumo do plano Free para contas, transações e metas (com barras de progresso), faturamento multi-plataforma flexível e download de recibos estruturados de pagamentos simulados.
* **Layouts de Alta Costura Visual:**
  - **Indicadores Dinâmicos de Consumo:** Inclusão de alertas amigáveis e indicadores de limite quando o usuário atinge acima de 80% do uso do plano Gratuito.
  - **Tabelas de Faturas:** Lista de faturas com semáforos de status de transação (Pago, Pendente, Falhou, Reembolsado).

### Alterado
* **Refatoração Geral de Configurações:**
  - **Settings.tsx:** Remoção completa de mais de 500 linhas de código duplicadas, incluindo dezenas de variáveis de estados em linha e handlers de faturamento simulado. Integração limpa do novo `<SubscriptionPanel />` sob a aba `subscription`, melhorando drasticamente a legibilidade e a manutenção do arquivo de configurações.

---

## [1.16.0] — 2026-05-12

Esta versão consagra a **Integração Real e de Alta Performance do Módulo de Chamados Técnicos** (Central de Suporte) do Vault Finance OS. Toda a antiga lógica mockada de simulação de chamados no frontend foi removida para dar lugar a um duto real de dados que persiste as informações com total segurança no banco de dados e as encaminha de forma reativa para o e-mail oficial da engenharia (`matheuskrx@gmail.com`), acompanhado por anexos binários reais e telemetria diagnóstica detalhada do navegador do cliente.

### Adicionado
* **Camada de Persistência & Modelagem Contábil de Suporte:**
  - **SupportTicket (Model Django):** Armazenamento de solicitações com campos dedicados para nome, e-mail de contato, tipo de chamado, nível de urgência, assunto, mensagem detalhada, anexo de capturas de tela/extratos (`FileField` apontando para `support_tickets/`) e dados estruturados de telemetria diagnóstica do cliente (`JSONField`).
* **Endpoint de Alta Fidelidade (REST API):**
  - **SubmitSupportTicketView (APIView):** Rota segura `/api/tickets/` protegida por tokens JWT Bearer que valida as requisições de clientes logados, cria o registro do ticket de suporte com protocolo único sequencial (`VT-XXXXX`) e envia de forma assíncrona/segura o feedback via e-mail.
* **Barramento Reativo de Notificações via E-mail:**
  - **Template HTML & Plain-Text Premium:** Envio de e-mails com design refinado, tabela de variáveis cadastrais, caixa formatada com a descrição da demanda do usuário e uma tabela limpa e legível de telemetria diagnóstica.
  - **Duto de Anexo Integrado:** Envio direto do arquivo original (PNG, JPG, WEBP, PDF) acoplado como anexo real no e-mail recebido pela engenharia.
* **Cobertura de Testes Automatizados (Backend):**
  - **test_support.py (Pytest):** Criação da suíte de testes contendo validações completas contra solicitações anônimas (401 Unauthorized) e verificações de integridade de dados e cabeçalhos de autenticação JWT Bearer para submissões válidas (201 Created).

### Alterado
* **Integração Client-Side (React):**
  - **HelpCenter.tsx:** Substituição da antiga simulação temporal (`setTimeout`) por um fluxo de processamento de API real e assíncrono conectando-se com segurança por meio do utilitário `authenticatedFetch` e submetendo objetos legítimos de `FormData` contendo metadados e arquivos físicos reais.

---

## [1.15.0] — 2026-05-12

Esta versão consagra o lançamento da **Central de Relatórios de Auditoria e Integridade Técnica** no Vault Finance OS. Focado no desenvolvedor e em auditores externos, este patamar adiciona três novas engines de validação de dados com logs imutáveis de ciclo de vida de transações, consolidação multi-entidade com eliminação de inflação patrimonial fictícia e análise granular de discrepância de conciliação OFX por conta.

### Adicionado
* **Nível de Integridade Técnica — Auditoria de Dados:**
  - **Log de Alterações Imutáveis (Immutable Logs):** Engine de rastreabilidade completa do ciclo de vida de cada transação com hashes SHA-256 determinísticos, classificação em 3 níveis de status (Prístina/Modificada/Sinalizada), linha do tempo de edições por operador e índice de integridade percentual.
  - **Consolidação Multi-Entidade (Moeda Mestra):** Agrupamento automático de contas por entidade jurídica (Pessoal, Empresa Principal, Empresa Secundária), detecção de transferências inter-companhia e eliminação de inflação patrimonial fictícia com ajuste de 50%.
  - **Discrepância de Conciliação OFX:** Análise granular por conta individual isolando transações pendentes de liquidação bancária, com semáforo de risco (🟢🟡🔴), barra de conformidade global e métricas de cobertura de conciliação.
* **Nona Pill Tab — Integridade:** Botão de navegação superior com ícone `Fingerprint` de lucide-react.
* **Extensão de Download de PDFs Executivos de Integridade:**
  - Exportação estruturada de Immutable Logs, Consolidação Multi-Entidade e Discrepância OFX em formato PDF.

### Documentação
* **ARCHITECTURE.md:** Inclusão das seções 8.28 (Immutable Logs), 8.29 (Multi-Entidade) e 8.30 (Discrepância OFX por Conta).

---

## [1.14.0] — 2026-05-12

Esta versão consagra o lançamento da **Central de Relatórios para Empresas (B2B & Startups)** no Vault Finance OS. Focado em saúde corporativa e inteligência de negócios, este patamar adiciona quatro novas engines de BI financeiro empresarial com gráficos de projeção de Runway, rosquinhas contábeis de OPEX/CAPEX, simulações de Break-even Point e rateio departamental por centros de custo recursivos.

### Adicionado
* **Nível Corporativo (B2B & Startups) — Saúde Empresarial:**
  - **Cash Burn Rate & Runway Preditivo:** Engine de consumo de caixa corporativo que mede a velocidade de queima de capital e projeta a autonomia financeira restante (Runway) com gráficos de área Recharts e alertas de solvência dinâmicos. Fórmula: `(Saldo Inicial - Saldo Final) / Meses`.
  - **OPEX vs. CAPEX (Balanço de Capital):** Discriminação contábil entre despesas operacionais correntes e investimentos em ativos duráveis (hardware, servidores, patentes) com gráfico de rosquinha interativo e cálculo de depreciação linear teórica de 20% ao ano.
  - **Ponto de Equilíbrio Contábil (Break-even Point):** Determinação do faturamento mínimo necessário para igualar custos operacionais com margem de contribuição real. Gráfico linear Recharts cruzando receitas simuladas (0%-200%) contra custos totais para identificar visualmente a interseção.
  - **Centros de Custo & Rateio Departamental:** Rateio contábil recursivo de despesas por departamentos (Tecnologia, Marketing, RH/Admin, Operações) utilizando classificação por palavras-chave e gráfico de barras horizontais com badges de percentual.
* **Oitava Pill Tab — Corporativo (B2B):** Botão de navegação superior com ícone `Building2` de lucide-react para acesso direto ao painel empresarial.
* **Extensão de Download de PDFs Executivos de B2B:**
  - Acoplamento completo das quatro engines de BI corporativo ao gerador `handleDownloadAnalyticReport` para exportação direta de relatórios estruturados em PDF com métricas de Burn Rate, Runway, OPEX/CAPEX, Break-even e Centros de Custo.

### Documentação
* **ARCHITECTURE.md:** Inclusão das especificações matemáticas das seções 8.24 (Burn Rate & Runway), 8.25 (OPEX vs CAPEX com depreciação linear), 8.26 (Break-even Point com margem de contribuição) e 8.27 (Centros de Custo com rateio departamental recursivo).

---

## [1.13.0] — 2026-05-12

Esta versão consagra o lançamento da **Central de Relatórios de Auditoria e Integridade do Sistema** no Vault Finance OS. Focado em governança contábil, integridade de transações compartilhadas e reconciliação fina de extratos, este patamar adiciona duas novas engines de dados e widgets de luxo que permitem ao usuário auditar alterações de lançamentos por operador, calcular discrepâncias entre saldos de caixas internos e arquivos bancários eletrônicos OFX, e liquidar pendências de forma instantânea.

### Adicionado
* **Nível de Auditoria & Integridade do Sistema — Governança Contábil:**
  - **Trilha de Auditoria Geral (Audit Trail):** Engine contábil baseada em logs determinísticos robustos estruturados por operador, timestamp e detalhes de retificação de transações individuais ou compartilhadas. Exibe barra de busca local interativa.
  - **Relatório de Reconciliação Bancária:** Sistema de comparação de balanços contra extratos importados OFX, isolando transações pendentes de liquidação bancária, com barra de progresso de conformidade e gatilhos de liquidação reativa instantânea (com feedback visual e auditivo).
* **Extensão de Download de PDFs Executivos de Auditoria:**
  - Acoplamento das engines de auditoria de logs e conciliação OFX ao gerador `handleDownloadAnalyticReport` para exportação direta de relatórios estruturados de auditoria em PDF.

## [1.12.0] — 2026-05-12

Esta versão consagra o lançamento da **Central de Relatórios de Estatística & Projeções de Risco** no Vault Finance OS. Focado em ciência de dados e engenharia matemática atuarial, este patamar adiciona três novas engines estocásticas e estatísticas avançadas acompanhadas por gráficos de regressão, simulação estocástica de dispersão de Monte Carlo e mapas de calor cronológicos interativos para vazamento de capital.

### Adicionado
* **Nível de Estatística & Projeções de Risco — Inteligência Preditiva:**
  - **Análise de Tendência Linear (Regression Analysis):** Engine de mínimos quadrados ordinários (OLS) que computa inclinações de fluxo mensal e projeta o saldo de qualquer conta selecionável para os próximos 6 meses com coeficiente de determinação $R^2$.
  - **Simulação de Monte Carlo (Estresse Estocástico):** Modelo atuarial baseado em 500 trajetórias estocásticas de despesas semanais para as próximas 24 semanas. Utiliza desvio padrão real e a Transformada de Box-Muller para desenhar intervalos de confiança de 95%.
  - **Mapa de Calor de Vazamentos Temporais (Heatmap):** Matriz analítica bidimensional ($7 \times 4$) cruzando dias de semana com períodos de horário. Identifica de forma brilhante picos cronológicos de vazamento de capital.
* **Extensão de Download de PDFs Executivos de Risco:**
  - Acoplamento das três novas engines estocásticas ao gerador `handleDownloadAnalyticReport` para salvamento imediato do faturamento executivo em formato PDF.

## [1.11.0] — 2026-05-12

Esta versão consagra o lançamento da **Central de Relatórios de Eficiência & Performance Financeira** no Vault Finance OS. Focado em matemática financeira de alta performance, este patamar adiciona três novas engines analíticas avançadas acompanhadas por velocímetros de solvência, gráficos de dispersão e relatórios analíticos de variância para o download executivo local em PDF.

### Adicionado
* **Nível de Eficiência & Performance — Recursos de Matemática Financeira Avançada:**
  - **Taxa de Poupança Marginal (MSR - Marginal Savings Rate):** Medidor analítico de inflação de padrão de vida (*lifestyle inflation*), comparando as receitas e poupança líquidas do período contra o intervalo histórico anterior equivalente. Exibe os dados em uma linha de tendência reativa de dupla área com gradiente reativo do Recharts.
  - **Análise de Variância (Budget Variance Analysis):** Engine contábil que analisa desvios em envelopes orçamentários YNAB, isolando o estouro de orçamento em **Efeito Preço** (variação de custo médio por transação) e **Efeito Volume** (frequência maior de gastos), plotados em um gráfico de barras horizontais empilhadas.
  - **Índice de Solvência de Caixa (Survival Métrica):** Autonomia de subsistência de caixa líquido calculada reativamente com base na divisão de Ativos Circulantes de altíssima liquidez pela média de saídas operacionais. Renderizado em um elegante velocímetro radial dinâmico com badges de gravidade.
* **Extensão de Download de PDFs de Eficiência & Performance:**
  - Acoplamento das três novas engines analíticas ao duto de download `handleDownloadAnalyticReport` para exportação direta de relatórios executivos em formato de texto estruturado com extensão `.pdf`.

## [1.10.0] — 2026-05-12

Esta versão consagra o lançamento e consolidação definitiva do **Nível Contábil e de Conformidade** na Central de Relatórios Financeiros. Esse módulo de engenharia contábil de ponta foi projetado para exportação de dados para contadores, auditoria patrimonial interna e declaração de ativos multimoedas de alta complexidade. A versão introduz três novas engines matemáticas contábeis acopladas ao motor de download de relatórios em PDF executivo.

### Adicionado
* **Nível Contábil e de Conformidade — Recursos de Auditoria e Fiscalidade:**
  - **Balancete de Verificação (Trial Balance):** Prova de partidas de débito e crédito agrupando saldos patrimoniais (Ativos) e saldos de resultado (Receitas e Despesas), equipado com cálculo automático de ajuste de equilíbrio patrimonial e barras de integridade sistêmica com o status "Sistema em Perfeito Equilíbrio Contábil".
  - **DRE Simplificado (Demonstrativo de Resultados de Exercício):** Fluxo clássico em cascata vertical apurando Receita Bruta, custos operacionais por subcategorias de envelopes e o Resultado Operacional Líquido do período filtrado sob o regime de competência pura (expurgando transferências financeiras internas).
  - **FX Realized vs. Unrealized (Ganhos/Perdas Cambiais):** Triagem técnica sobre as flutuações de 12 moedas globais, segregando diferenciais liquidados em transações (Realized) e variações latentes de saldo sob custódia em contas estrangeiras (Unrealized) plotados em um gráfico de barras empilhadas responsivo.
* **Extensão de Download de PDFs Executivos de Contabilidade:**
  - Adaptação do gerador local de relatórios client-side `handleDownloadAnalyticReport` para estruturar e baixar o relatório completo contendo o balancete, cascata DRE e listagem de volatilidade de moedas estrangeiras em formato de texto plano com a extensão de relatório adequada.

## [1.9.1] — 2026-05-12

Esta versão consagra o lançamento do **Nível Avançado ("Como otimizar meu capital?")** na Central de Relatórios Financeiros, projetado para nômades digitais, investidores globais e usuários experientes que lidam com alta complexidade financeira. O módulo adiciona quatro novas engines matemáticas avançadas equipadas com exibições em gráficos do Recharts e totalização integrada ao motor duplo de download de PDF executivo.

### Adicionado
* **Nível Avançado ("Como otimizar meu capital?") — Recursos de Elite:**
  - **Análise de Subcontas Recursivas (TreeMap):** Gráfico de mapa de árvore (`Treemap` do Recharts) que renderiza proporcionalmente o peso de cada subconta ou envelope sobre o patrimônio consolidado, unificando os saldos indiretamente para a moeda base do usuário via Euro pivô.
  - **Impacto Cambial (Multi-moeda):** Módulo de cálculo que avalia a flutuação de moedas estrangeiras no portfólio, estimando o ganho ou perda nominal acumulada de poder de compra contra a moeda base e renderizando uma linha de tendência cronológica de volatilidade cambial.
  - **Projeção de Fluxo de Caixa (Forecasting):** Algoritmo preditivo de regressão linear que calcula médias reais de receitas e despesas com base no histórico e projeta o saldo de caixa consolidado para os próximos 3, 6 e 12 meses futuros através de linhas pontilhadas de tendência com áreas de gradientes transparentes.
  - **Relatório de Eficiência Fiscal e Tarifas:** Indicador com medidor radial (`RadialBar` Gauge) que audita despesas tarifárias incidentes sobre o portfólio (como IOF, spreads de câmbio e taxas de contas) e atribui um Score de Eficiência fiscal acompanhado de diretrizes de otimização de capital.
* **Extensão de Download de PDFs Executivos:**
  - Acoplamento das quatro novas engines analíticas avançadas ao duto de geração de relatórios locais de faturamento client-side para exportar relatórios de otimização cambial, forecasting e eficiência de faturamento estruturados com extensão `.pdf`.

## [1.9.0] — 2026-05-12

Esta versão marca a estreia e consolidação definitiva da **Central de Relatórios Financeiros Interativos**, unificando as experiências de análise visual em dois patamares complementares: **Nível Iniciante ("Onde estou agora?")**, focado em clareza imediata e contenção de danos, e **Nível Intermediário ("Estou progredindo?")**, voltado para tendências de consistência, custos fixos e planejamento de objetivos de médio prazo. O painel unifica oito análises ricas com gráficos interativos responsivos utilizando a biblioteca **Recharts**, filtros reativos e um motor duplo de exportação em PDF de alta qualidade.

### Adicionado
* **Painel e Tela Central de Relatórios (`Reports.tsx`):**
  - Inclusão da rota protegida `/reports` e sua integração com a Sidebar lateral com o ícone `BarChart3`, cuja exibição é amarrada de forma segura ao chaveamento de recursos do módulo de `insights`.
  - Painel de filtros interativo e colapsável contendo seletores de períodos (Mês atual, Últimos 90 dias, Últimos 180 dias e Ano atual) e dropdowns dinâmicos de multiseleção por contas e por categorias orçamentárias.
  - Menu superior de navegação por níveis ("Pill Tabs") com transição suave em CSS para chaveamento instantâneo de contexto de relatórios.
* **Nível Iniciante ("Onde estou agora?") — Análises Atômicas:**
  - **Patrimônio Líquido:** Gráfico de área e linha de dupla curva comparando Ativos versus Passivos no tempo, alimentado por um algoritmo de backtracking financeiro reverso de saldos.
  - **Distribuição de Gastos:** Gráfico de donut animado revelando composição percentual de despesas por categorias e alertas de "Fuga de Capital" caso ultrapasse 30% da renda.
  - **Fluxo de Caixa Diário:** Área cumulativa mostrando as curvas de entradas versus saídas com detecção circular de pico absoluto de retiradas.
  - **Status de Envelopes:** Progresso visual comparando dotação de orçamentos (`Budgeted`) vs despesas (`Activity`) da metodologia YNAB com glows neon dinâmicos de gravidade.
* **Nível Intermediário ("Estou progredindo?") — Análises de Tendências:**
  - **Orçado vs. Realizado:** Gráfico de colunas duplas agrupadas (`BarChart` agrupado) comparando as dotações planejadas versus gastos efetivados para cada subcategoria orçamentária, integrado a um módulo de detecção automática de maiores desvios e economias.
  - **Relatório de Recorrências:** Rastreamento estruturado de faturas e assinaturas fixas (`is_recurring: true`), calculando o peso acumulado dos custos fixos sobre as saídas totais e renderizando um gráfico de rosca de despesas fixas versus variáveis.
  - **Histórico de Categorias:** Seletor interativo de subcategorias que consulta retroativamente o histórico de transações e agrupa os montantes mensais dos últimos 6 meses em um gráfico de área de tendência cronológica de consumo.
  - **Metas de Economia:** Integração nativa em tempo real com os objetivos criados pelo usuário obtidos via API do hook React Query `useGoals`, adicionando barra de progresso horizontal e uma engine preditiva de projeção de meses restantes baseada na taxa média de poupança.
* **Motor Duplo de Exportação de PDF:**
  - **Impressão Vetorial A4 Nativa (@media print):** Estilos CSS que reconfiguram e otimizam todo o painel de relatórios das abas Iniciante ou Intermediário em folha A4 vertical para salvar em PDF vetorial perfeitamente nítido sem barras de navegação ou filtros.
  - **Download de Relatório Analítico Executivo:** Geração local client-side de relatório analítico de faturamento estruturado em formato executivo que se adapta de acordo com o nível selecionado e faz download imediato com extensão `.pdf`.


## [1.8.0] — 2026-05-12

Esta versão traz o novíssimo **Gerenciador de Assinaturas e Planos Multicliente** integrado nativamente às configurações do usuário, proporcionando um painel premium, reativo e totalmente interativo para gerenciar assinaturas. A arquitetura foi adaptada para demonstrar de forma perfeita as integrações nativas de cobrança multiplataforma: **Stripe na Web**, **Apple App Store no iOS (Apple IAP)** e **Google Play Store no Android**.

### Adicionado
* **Painel de Faturamento e Gerenciamento de Assinaturas:**
  - Inserção da aba nativa **"Assinatura"** nas configurações do usuário (`Settings.tsx`), com transição animada e layout otimizado de 12 colunas para computadores e adaptabilidade total para dispositivos móveis (Capacitor).
* **Playground de Faturamento e Simulador de Estados Ativo:**
  - Adicionado um **Simulador de Faturamento** no topo da aba, permitindo que engenheiros, testadores e o usuário simulem instantaneamente qualquer cenário de faturamento em tempo real: alternar entre planos (**Grátis** vs **Pro**), plataformas de pagamento (**Stripe**, **Apple App Store**, **Google Play Store**) e ciclos de faturamento (**Mensal** vs **Anual**).
  - Persistência reativa das variáveis de simulação no `localStorage` do navegador, mantendo a experiência consistente entre recarregamentos de página.
* **Card Premium do Plano Pro Ativo:**
  - Exibição sofisticada de status de assinatura Pro, com badge verde "Ativo" pulsante, preço atualizado em tempo real pelo ciclo e data da próxima cobrança dinâmica baseada no ciclo selecionado.
  - Exibição de metadados simulados de faturamento específicos para cada plataforma ativa (como Mastercard final `**** 4242` no Stripe, conta iCloud no iOS e e-mail Google no Android), acompanhados por botões dinâmicos de acesso direto às lojas de aplicativos e de cancelamento simulado de plano.
* **Card do Plano Grátis e Nudges de Limites:**
  - Card explicativo para usuários do plano básico gratuito, integrando barras de progresso reais de limites técnicos do app (ex: limite de contas criadas e envelopes de orçamento base-zero utilizados) e botão de ação animado para upgrade imediato.
* **Aplicador de Cupons Promocionais Reativo:**
  - Campo funcional de cupom promocional com validação em tempo real. Os cupons são interpretados reativamente (ex: `VAULTENGINEER` aplicando 100% de desconto perpétuo, ou `SAVE30` aplicando 30% de desconto) e atualizam instantaneamente todos os valores exibidos nos cards, tabelas e faturas.
* **Histórico de Faturas com Download Funcional de Extratos:**
  - Histórico de pagamentos estruturado com ID da fatura, data de emissão, plataforma de faturamento, preço final atualizado pelo cupom de desconto e status "Pago".
  - Implementação de um gerador e baixador reativo de faturas fidedignas (formato de nota fiscal em texto plano com extensão `.pdf` simulada), permitindo ao usuário baixar faturas legítimas diretamente da interface do navegador.
* **Tabela Comparativa de Recursos e FAQ Expandível:**
  - Grade comparativa detalhada dos diferenciais técnicos e de recursos entre o plano Grátis e Pro.
  - Acordeão animado e expandível com perguntas frequentes de faturamento abordando uso multidispositivo da assinatura Pro, cancelamento sem multas e políticas de reembolso das lojas.
* **Modal Premium de Confirmação de Checkout (Upgrade):**
  - Diálogo de confirmação com design translúcido em vidro (`backdrop-blur-xl`) para ativação do Pro. Exibe um resumo analítico detalhado do checkout, abatimento real de cupons ativos, valor total e notas fiscais detalhadas adaptadas por plataforma.

## [1.7.0] — 2026-05-12

Esta versão traz a novíssima **Central de Ajuda (Help Center)** integrada, contendo uma rica base de conhecimento com busca instantânea de artigos financeiros de engenharia, suporte interativo via ticket com loader simulado, coleta de diagnóstico de telemetria técnica e upload interativo de anexos por arrastar e soltar (drag-and-drop). Esta versão foi aprimorada com uma inteligente **arquitetura híbrida de dupla identidade** para separar acessos públicos e privados.

### Adicionado
* **Suporte Híbrido Público vs. Privado (Acessibilidade de Escopo):**
  - **Acesso Público (`/help-center`):** Artigos de ajuda e FAQ acessíveis livremente a qualquer usuário deslogado no site. Ao tentar clicar em "Suporte Direto" ou "Enviar Feedback", o sistema exibe uma tela de bloqueio com indicador de segurança e botão de autenticação que redireciona para `/auth`.
  - **Acesso Privado (`/help`):** Mapeado debaixo das rotas protegidas do `Layout` com a Sidebar ativa. Todas as abas e formulários funcionam livremente e de forma 100% nativa para o cliente autenticado.
* **Consistência Estética Pixel-Perfect:** Refatoração visual do componente no modo privado. Removemos fundos escuros maciços (`bg-slate-950`), glows de fundo redundantes e o header de retorno "Voltar para a Home". Agora, o Help Center herda o tema nativo do painel, os contêineres e um cabeçalho de título clean idêntico ao das páginas de `Accounts` e `Settings`, garantindo integração estrita.
* **Auto-Preenchimento e Proteção Antifalsificação:** Integração nativa com `useAuthStore` do Zustand. Se o usuário estiver logado, os campos de Nome e E-mail são travados com as credenciais reais do usuário, impedindo erros e garantindo a autenticidade de chamados.
* **Telemetria de Diagnóstico Técnico (Suporte):** Mapeamento e exibição colapsável transparente de metadados do ambiente (OS, navegador amigável, resolução de tela, latência de API e cookies) para auxiliar a triagem rápida pelo time de engenharia de suporte.
* **Módulo Drag-and-Drop de Anexos:** Área de arrastar e soltar de arquivos de suporte (PNG, JPG, WEBP e PDFs) com preview de miniaturas ricas para imagens ou ícones correspondentes de PDF, acompanhado por barra de progresso de upload animada.
* **Busca Reativa de Artigos Técnicos:** Base de conhecimento com pesquisa dinâmica por texto e filtros rápidos por categorias (Metodologia YNAB, Multimoedas e Cibersegurança). Artigos ricos sobre regras matemáticas de recursão, câmbio pivô EUR e blindagem lógica contra IDOR/BOLA.
* **Canal de Suporte e Abertura de Tickets:** Formulário reativo para abertura de chamados que simula processamento em tempo real com gerador de ID de ticket exclusivo (ex: `#VT-84920`).
* **Canal de Feedback Interativo:** Sistema de avaliação com estrelas reativas (hover glow), seletor de sentimento e persistência automática do histórico de feedbacks do usuário no `localStorage` do dispositivo.
* **Atalho Estrutural na Sidebar:** Injeção do botão de **Ajuda e Suporte** no rodapé de [Sidebar.tsx](file:///c:/Users/mathe/PROJETO-YNAB/Ynab/src/shared/components/dashboard/Sidebar.tsx), logo acima das Configurações, com comportamento ativo, colapsável e tooltip sincronizado.
* **Ancoragem na Landing Page:** Link em destaque na coluna de Suporte da Landing Page ([Landing.tsx](file:///c:/Users/mathe/PROJETO-YNAB/Ynab/src/modules/auth/pages/Landing.tsx)) apontando diretamente para as query parameters reativas do Help Center público (`/help-center?tab=articles`).
* **Redirecionamento Inteligente:** Redirecionamento retrocompatível automático de `/ajuda` para `/help-center?tab=articles` em [App.tsx](file:///c:/Users/mathe/PROJETO-YNAB/Ynab/src/App.tsx).


## [1.6.0] — 2026-05-12

Esta versão marca a introdução da **Central Legal (Legal Center)** unificada do Vault Finance OS, consolidando todas as políticas, regulamentos e termos técnicos do ecossistema em uma interface única de navegação fluida, além de inaugurar a central ativa de segurança, governança de TI e compliance de dados do SaaS.

### Adicionado
* **Central Legal Unificada (Legal Center):** Desenvolvimento do componente e página centralizada `/legal` ([LegalCenter.tsx](file:///c:/Users/mathe/PROJETO-YNAB/Ynab/src/modules/auth/pages/LegalCenter.tsx)), equipada com um menu lateral reativo e flutuante para desktop e abas horizontais adaptativas e deslizantes para celulares (Capacitor).
* **Painel Ativo de Governança de TI e Cibersegurança:** Criação da aba de **Visão Geral** que detalha de forma transparente os pilares de segurança do app, incluindo a isolação de escopo lógica multitenant do banco PostgreSQL contra falhas IDOR/BOLA, rotinas de criptografia simétrica com hash PBKDF2, fluxos JWT de sessão e auditorias estáticas/dinâmicas periódicas.
* **Redirecionamento Inteligente de Rotas Legadas:** Implementação de redirecionamento retrocompatível dinâmico (`<Navigate replace />`) no roteador central [App.tsx](file:///c:/Users/mathe/PROJETO-YNAB/Ynab/src/App.tsx) para traduzir instantaneamente URLs antigas para as respectivas abas com query parameters da nova Central Legal.

### Alterado
* **Sincronização de Links Institucionais:** Adaptação completa dos links do rodapé na Landing Page ([Landing.tsx](file:///c:/Users/mathe/PROJETO-YNAB/Ynab/src/modules/auth/pages/Landing.tsx)) e no banner de privacidade flutuante ([CookieBanner.tsx](file:///c:/Users/mathe/PROJETO-YNAB/Ynab/src/modules/auth/components/CookieBanner.tsx)) para apontarem para as abas corretas da central (`/legal?tab=termos`, `/legal?tab=privacidade`, `/legal?tab=cookies`).

### Removido
* **Pruning de Código Redundante:** Exclusão definitiva de arquivos individuais legados (`TermsOfUse.tsx`, `PrivacyPolicy.tsx`, `CookiePolicy.tsx`) para manter o repositório enxuto e mitigar custos de manutenção em duplicidade.

## [1.5.0] — 2026-05-11

Esta versão introduz a funcionalidade altamente solicitada de **Exclusão Seletiva de Contas das Somatórias**, permitindo aos usuários ocultarem saldos de contas e subcontas específicas dos totais acumulados de contas pai, Net Worth global e dashboard, sem excluí-las visualmente da interface.

### Adicionado
* **Exclusão Seletiva de Somatórios (Domínio):** Adição do campo `exclude_from_totals` à tabela física e modelo `Account` no Django, expondo-o na resposta serializada da árvore financeira.
* **Cálculo de Saldos Inteligente e Recursivo (Frontend):** Refatoração do algoritmo recursivo de somatório (`sumNode`) em `AccountAccordion.tsx` com tratamento adaptativo de raiz (`isRootCall`). Subcontas marcadas para exclusão retornam saldo consolidado individual `0` para a conta pai, mas exibem seus saldos reais na sua própria linha visual.
* **Filtragem de Ativos do Dashboard:** Adaptação da lógica global do Zustand `totalsByCurrency` para ignorar o saldo de qualquer conta ou subconta que possua a flag de exclusão ativa, recalculando instantaneamente o Net Worth e as distribuições de excedentes.
* **Componentes de Configuração Premium (UI):** Inclusão de um checkbox emoldurado de alta fidelidade visual ("Desconsiderar nos Totais") equipado com HelpTooltip dinâmico explicando as consequências da flag nos modais de:
  * **Criação de Conta Raiz** (`AddRootAccountModal.tsx`)
  * **Criação de Subconta** (`AddAccountModal.tsx`)
  * **Edição de Conta** (`AccountActions.tsx`)
* **Ordenação Alfabética de Subcontas (A-Z):** Implementação de um controle de ordenação alfabética para as subcontas de cada conta matriz. O estado é controlado por um botão reativo estilizado com o ícone `ArrowDownAZ` posicionado no canto superior direito do acordeão financeiro, cuja preferência do usuário é gravada e persistida reativamente no `localStorage` sob a chave `vault_sort_subaccounts_az`.
* **Caixa de Busca na Seleção de Contas (Lançamento):** Adição de caixas de busca reativas e inteligentes nos campos de seleção de contas de origem e destino dentro do modal de lançamento de transações (`AddTransactionModal.tsx`). O campo aparece de forma sutil e condicionada quando o usuário possui mais de 4 contas cadastradas, acompanhado por filtragem reativa instantânea de digitação e tratamento de estado vazio ("Nenhuma conta encontrada") nos dropdowns do seletor.
* **Escolha de Moedas em Dívidas (Multi-moedas):** Introdução da possibilidade de selecionar a moeda ("EUR", "BRL", "USD") na criação de novas dívidas no painel de devedores (`Debts.tsx`), integrando-se perfeitamente com os cálculos cambiais dinâmicos do sistema.
* **Acréscimo de Saldo Devedor (Mais Débito):** Implementação de um botão de ação e modal dedicado ("Mais Débito") para aumentar o saldo devedor de dívidas existentes. A ação conta com uma `@action add_debt_amount` atômica no Django que incrementa a dívida e opcionalmente gera a transação financeira reversa correspondente para conciliação bancária de saldos, registrando também uma nota automática de auditoria nos históricos.
* **Layout de Dívidas Responsivo (Pixel-Perfect):** Refatoração do rodapé dos cards de dívida em `Debts.tsx` para usar layout flex-wrap responsivo, impedindo colisões de texto e que o botão "Adicionar Saldo" saia para fora do contêiner em telas pequenas e celulares.
* **Preenchimento Automático Baseado no Histórico (Autocomplete Inteligente):** Introdução de um mecanismo reativo de auto-complete integrado ao campo de Descrição do modal de transações (`AddTransactionModal.tsx`). Ao começar a digitar, o sistema busca ativamente transações anteriores com descrições correspondentes (case-insensitive). Ao selecionar uma sugestão, o formulário é magicamente preenchido com o último valor absoluto, o tipo correto (Receita/Despesa), a Conta de Origem anterior e a Categoria de Orçamento anterior correspondentes. O dropdown exibe informações completas (Moeda, Categoria, Conta e Tipo) com badges premium e se fecha automaticamente se houver clique fora do contêiner.
* **Personalização Modular da Interface (Feature Flags do Usuário):** Criação de um mecanismo dinâmico e persistente no Zustand (`useFeatureStore.ts`) que permite ao usuário ativar ou desativar páginas inteiras do painel de controle (Dashboard, Árvore de Contas, Extrato de Transações, Orçamentos, Dívidas, Metas e Insights Inteligentes).
* **Painel de Controle de Módulos (UI/UX):** Integração de uma nova aba ("Módulos") equipada com cards informativos individuais no painel de Configurações gerais (`Settings.tsx`), oferecendo botões de status ("✓ Habilitado" em verde / "✗ Desabilitado" em vermelho) e salvamento automático instantâneo no `localStorage`.
* **Segurança e Filtragem de Navegação Dinâmicas:** Readequação da Sidebar (`Sidebar.tsx`) e da navegação mobile (`BottomNav.tsx`) para refletir em tempo real apenas as seções selecionadas pelo usuário, associada a um componente de proteção de rotas (`FeatureProtectedRoute` em `App.tsx`) que blinda o acesso direto por URL e previne loops de redirecionamento.
* **Planejamento Financeiro 50-30-20:** Criação de um módulo completo dedicado à consagrada regra financeira 50-30-20, dividindo a renda líquida em Necessidades (50%), Desejos (30%) e Prioridades/Futuro (20%).
* **Integração Inteligente ou Autônoma:** Inclusão de um mecanismo de chaveamento que permite ao módulo rodar no modo manual (inserindo renda estática) ou totalmente integrado ao ecossistema YNAB, somando as receitas reais do período e computando as despesas das categorias mapeadas automaticamente.
* **Componente de Mapeamento de Categorias (UI/UX):** Painel de mapeamento interativo para que o usuário associe suas categorias de orçamento a um dos 3 baldes com um único clique (persistido de forma segura e reativa no `localStorage` via `useRule503020Store`).
* **Gráficos e Indicadores de Desempenho Visual:** Inclusão de medidores de progresso reativos, indicadores inteligentes de teto de gastos (Verde/Alvo, Âmbar/Atenção, Vermelho/Estourado) e gráficos de pizza comparativos paralelos (Distribuição Ideal vs. Gastos Reais do Mês).
* **Migração de Banco Segura e Sem Interrupções:** Aplicação de migração Django vinculando os modelos ao app original `core` (usando `app_label = 'core'`), gerando uma alteração de coluna no SQLite e PostgreSQL sem quebrar deploys de produção ou tentar apagar tabelas legadas.



### Corrigido
* **Saldo Inicial de Contas Negativas:** Correção da lógica de criação de contas no Django (`perform_create` em `views.py`) que gerava a transação automática de saldo inicial apenas para saldos positivos. Agora, contas criadas com saldo negativo também ganham automaticamente sua transação de saldo inicial (como despesa, usando o valor absoluto do saldo inicial), sanando inconsistências de relatórios.
* **Migração Corretiva de Dados Retroativos (Produção):** Introdução da migração corretiva de dados `0022_fix_negative_and_positive_initial_balances.py` no Django. Durante o deploy, ela varre todas as contas reais do banco de dados (especialmente na produção) que foram criadas sem transações de saldo inicial (seja saldo positivo ou negativo) e gera a transação corretiva inicial de forma 100% segura e invisível ao usuário.
* **Ajuste de Balões de Texto Informativo (Tooltips):** Correção do estouro e corte de balões informativos de ajuda (`HelpTooltip.tsx`) por meio da adição das propriedades de utilidade CSS `break-words` e `whitespace-normal`, e diminuição da largura responsiva máxima em celulares (`max-w-[240px] sm:max-w-[320px]`). Evita o vazamento lateral em todas as resoluções e layouts móveis do sistema.

---

## [1.4.0] — 2026-05-11

Esta versão representa um marco de engenharia focando em **Clean Architecture** e **Modularização de Alta Coesão**, separando de forma estrita e hermética a infraestrutura administrativa reutilizável do SaaS (**SaaS Boilerplate Starter Kit**) das lógicas e fluxos de negócios especializados de finanças e metodologia YNAB do **Vault Finance OS**.

### Adicionado
* **Isolamento de Infraestrutura SaaS (Boilerplate):** Encapsulamento completo de rotinas administrativas, JWT, perfil do usuário, autenticação segura multifator 2FA (TOTP) e políticas internacionais de dados (GDPR/LGPD) em módulos dedicados (`core` no Django e `src/modules/auth` no React).
* **Módulo Especializado de Finanças (Domain Core):** Criação do módulo financeiro autocontido (`finance` no Django e `src/modules/finance` no React), responsável exclusivo por árvores de contas mestre e envelopes recursivos, algoritmos de teto/transbordo (*distribute_excess*), amortização de dívidas e metas.
* **Backup de Segurança Completo (JSON):** Correção do botão de exportação e implementação de rotina para download de backup integral instantâneo contendo todas as contas, transações, categorias, metas, dívidas e modelos.
* **Exportação Analítica para Planilha (CSV):** Adicionada funcionalidade para exportar o livro-razão de transações do período ativo em formato CSV de planilha, otimizado com codificação UTF-8 BOM para compatibilidade com Excel e Google Sheets.
* **Estrutura Compartilhada de UI (Shared Componentry):** Unificação de componentes genéricos e primitives do Shadcn/ui sob o diretório `src/shared/`, otimizando a reusabilidade e blindando os módulos de negócios contra dependências acopladas.
* **Garantia de Não-Regressão (Zero-Regression Pipeline):** Expansão e normalização da suíte de testes com 100% de sucesso em todas as verificações do backend (40 de 40 testes verdes no Pytest) e do frontend (27 de 27 testes verdes no Vitest).

---

## [1.3.0] — 2026-05-10

Esta versão foca em automação de reconciliação financeira para saldos iniciais de todas as contas (contas mestre e subcontas), na governança e privacidade dos dados do usuário com a funcionalidade de zerar dados, e na flexibilidade organizacional através da movimentação hierárquica dinâmica de contas e subcontas.

### Adicionado
* **Movimentação Hierárquica Dinâmica de Contas (Drag & Drop na Web):** Integração de um sistema avançado de Drag & Drop HTML5 nativo no componente `AccountAccordion.tsx`, permitindo ao usuário reestruturar toda a árvore financeira ao arrastar qualquer conta para dentro de outra para torná-la subconta, de forma extremamente reativa e fluida.
* **Ação e Modal Inteligente "Mover Conta" (Otimizado para Celular / App):** Nova ação dedicada no menu `AccountActions.tsx` que abre um modal interativo com seletor de contas pai elegíveis. O seletor calcula e filtra de forma recursiva a própria conta e todos os seus descendentes diretos ou indiretos, prevenindo loops cíclicos de recursão infinita e oferecendo uma usabilidade de toque perfeita para telas móveis.
* **Validação Ativa Anti-Loop no Backend (Django):** Inclusão de um algoritmo de validação no método `validate` do `AccountSerializer` que barra qualquer tentativa de mover uma conta para dentro de si mesma ou de seus próprios descendentes directos/indiretos, retornando o código de erro de integridade `400 BAD REQUEST` para blindar o cálculo dos saldos recursivos na árvore financeira.
* **Geração Automática de Receitas para Todas as Contas:** Implementação de regras de automação transacional no backend Django (`AccountViewSet`), de modo que, ao definir o Saldo Atual de qualquer conta (mestre ou subconta, seja na criação ou edição), o sistema gera automaticamente uma transação do tipo receita (em caso de aumento de saldo) ou despesa de ajuste (em caso de redução). As transações são marcadas como efetivadas (`status='realized'`) e aplicadas ao saldo (`is_applied_to_balance=True`) para fins históricos, eliminando qualquer dessincronização entre saldos e registros transacionais.
* **Migrações de Dados Retroativas de Saldos (0019 & 0020):** Criação das migrações de dados Django `0019_create_initial_balances_for_subaccounts` e `0020_create_initial_balances_for_master_accounts` para gerar retroativamente transações de receita com descrição "Saldo Inicial" para todas as subcontas e contas mestre com saldo positivo que ainda não possuíam histórico transacional, regularizando de forma limpa e automática as contas antigas no banco de dados após o deploy.
* **Endpoint de Reset Permanente de Dados Financeiros:** Nova APIView segura no backend `/auth/profile/reset-data/` restrita a usuários autenticados, que executa uma remoção atômica em bloco de todas as transações, contas, categorias, orçamentos, metas e dívidas vinculadas ao usuário logado, preservando sua conta de acesso, credenciais e perfil (idioma, 2FA, etc.).
* **Zona de Perigo com Dupla Confirmação nas Configurações:** Interface do usuário premium na aba "Dados" em `Settings.tsx` com uma seção visual estilizada de "Zona de Perigo" de alto impacto estético, integrada com um modal de dupla confirmação de segurança que exige do usuário digitar a palavra-chave "EXCLUIR" para prevenir ações destrutivas acidentais.
* **Novos Casos de Teste Automatizados (Backend):** Inclusão de testes robustos no Pytest em `test_accounts.py` (`test_automatic_income_on_account_creation`, `test_automatic_adjustment_on_account_balance_update`, `test_account_circular_dependency_prevention` e `test_profile_reset_data`) para auditar todas as novas regras de negócio, prevenção de ciclos cíclicos e garantir 100% de estabilidade e integridade funcional.

### Alterado
* **Refatoração Visual Premium dos Badges de Teto de Contas:** Separação do indicador de limite/teto das contas em dois pills independentes, de cantos perfeitamente arredondados (`rounded-full`) e responsivos: o primeiro contendo o ícone de medidor (`Gauge`) acompanhado do valor do limite monetário, e o segundo exibindo a porcentagem consumida. O tamanho da fonte foi ampliado para `text-[13px]` para harmonizar elegantemente com a escala de tamanho do nome da conta, aprimorando significativamente o equilíbrio visual e a legibilidade das métricas de teto em telas desktop e mobile.

### Corrigido
* **Normalização de Ícones no Windows (Barras Invertidas):** Correção do bug que gerava caminhos com barras invertidas (`\`) ao salvar imagens através do `default_storage.save` no Windows, comprometendo as URLs absolutas dos ícones retornadas pelo endpoint `/api/icons/upload/`. Agora, todas as barras são normalizadas com `.replace('\\', '/')`, garantindo renderização instantânea do preview em qualquer SO.
* **Serviço de Arquivos de Mídia em Produção (Django):** Inclusão de mapeamento de URLs dinâmicas para arquivos estáticos e de mídia na raiz `ynab_backend/urls.py` via `django.views.static.serve` quando `DEBUG=False`. Isso resolve em definitivo o erro `404 Not Found` no Render ao acessar imagens, avatares ou ícones enviados pelos usuários na plataforma online.
* **Coleta de Testes de Ícones no Pytest:** Ajuste do nome do arquivo de testes de `tests_icon.py` para `test_icons.py` para estar em conformidade com as regras de nomenclatura do Pytest e ser incluído na suíte automatizada de testes, além de adicionar o caso `test_icon_upload_endpoint` simulando uploads Multipart.

---

## [1.2.0] — 2026-05-10

Esta versão marca a consolidação completa da infraestrutura de governança, conformidade legal internacional com LGPD e GDPR, segurança ativa contra IDOR/BOLA e documentação exaustiva de negócios e matemática do ecossistema.

### Adicionado
* **Sincronização Bidirecional Automatizada de Idioma:** Sincronização inteligente e automática entre o idioma selecionado na Landing Page/Site e o idioma ativo na aplicação logada, persistindo as preferências diretamente no banco de dados através da rota `/auth/profile/update/` e utilizando uma flag local `vault_lang_explicit` para preservar a escolha do usuário sem perda de dados em novos dispositivos.
* **Compliance de Privacidade (LGPD & GDPR):** Criação das páginas institucionais [TermsOfUse.tsx](file:///C:/Users/mathe/PROJETO-YNAB/Ynab/src/pages/TermsOfUse.tsx) (Termos de Uso), [PrivacyPolicy.tsx](file:///C:/Users/mathe/PROJETO-YNAB/Ynab/src/pages/PrivacyPolicy.tsx) (Política de Privacidade) e [CookiePolicy.tsx](file:///C:/Users/mathe/PROJETO-YNAB/Ynab/src/pages/CookiePolicy.tsx) (Política de Cookies).
* **Políticas Corporativas de SLA e Pentests:** Integração formal de metas de uptime de 99.9% com reembolso em créditos na mensalidade, RTO de 4h/RPO de 1h, e garantias de blindagem contra ataques de quebra de escopo por IDOR (testes de intrusão anuais) nas páginas de políticas legais.
* **Banner Dinâmico de Cookies e Consentimento:** Implementação da store Zustand `useConsentStore` e do componente flutuante multilíngue adaptativo `CookieBanner` integrado ao hook `useConsentTracker` para ativação reativa de scripts de rastreamento de marketing/analytics somente sob opt-in explícito.
* **Rodapé Premium Multi-Colunas:** Novo rodapé completo na Landing Page, com layout dark mode de alta definição, alinhamento vertical rigoroso de pixel e dados institucionais/DPO completos.
* **[NEW] [SECURITY.md](file:///C:/Users/mathe/PROJETO-YNAB/SECURITY.md):** Manual de divulgação coordenada de vulnerabilidades e SLAs ágeis para patches de segurança.
* **[NEW] [CONTRIBUTING.md](file:///C:/Users/mathe/PROJETO-YNAB/CONTRIBUTING.md):** Guia prático de governança, convenções de commits, guias de estilo PEP 8 e ESLint/Prettier e fluxos de Pull Requests.
* **[NEW] [DEPLOYMENT.md](file:///C:/Users/mathe/PROJETO-YNAB/DEPLOYMENT.md):** Guia prático de orquestração com Docker Compose, pipelines automatizadas via GitHub Actions, rotinas de backups automatizados do PostgreSQL no AWS S3 e compilação do Capacitor Mobile para Android e iOS.
* **[NEW] [TESTING.md](file:///C:/Users/mathe/PROJETO-YNAB/TESTING.md):** Estratégia de QA, testes relacionais de recursividade financeira com Pytest e mocks de chamadas HTTP no frontend com Vitest.
* **Wikis e Páginas de Conhecimento:** Criação de guias matemáticos e conceituais do ecossistema ([wiki_recursividade_infinita.md](file:///C:/Users/mathe/PROJETO-YNAB/docs/wiki_recursividade_infinita.md), [wiki_multimoedas.md](file:///C:/Users/mathe/PROJETO-YNAB/docs/wiki_multimoedas.md) e [wiki_seguranca.md](file:///C:/Users/mathe/PROJETO-YNAB/docs/wiki_seguranca.md)).

### Corrigido
* **Alinhamento de Botões dos Planos na Landing Page:** Ajuste de posicionamento vertical dos botões "Começar de Graça" e "Assinar o Pro" adotando um contêiner flexível com altura mínima uniforme de `min-h-[200px] sm:min-h-[180px]` para os blocos superiores de preços e títulos, garantindo alinhamento pixel-perfect mesmo se as descrições ou preços quebrarem linha em telas menores.
* **Menu de Configurações e Unificação Funcional da Sidebar:** Refatoração completa do `NavLink` do botão de configurações em [Sidebar.tsx](file:///C:/Users/mathe/PROJETO-YNAB/Ynab/src/components/dashboard/Sidebar.tsx) para adotar a exata mesma estrutura funcional baseada em children baseadas em `isActive` das demais rotas, incorporando o indicador ativo vertical reativo na esquerda, controle de truncagem e duração de transição idênticos.
* **Rigidez de Layout da Sidebar (Prevenção de Esmagamento):** Inclusão da diretiva `shrink-0` (ou `flex-shrink-0`) no contêiner `<aside>` da [Sidebar.tsx](file:///C:/Users/mathe/PROJETO-YNAB/Ynab/src/components/dashboard/Sidebar.tsx) e na div wrapper do [Layout.tsx](file:///C:/Users/mathe/PROJETO-YNAB/Ynab/src/components/dashboard/Layout.tsx), impedindo que o motor de renderização flexbox do navegador esprema a barra lateral em janelas estreitas e mantendo os itens sempre alinhados na horizontal.
* **Bordas do Layout Geral (Sidebar e Header):** Ajuste fino de posicionamento no `Topbar.tsx` e `Sidebar.tsx` estabelecendo altura rígida de `h-16` para alinhar de forma milimétrica as bordas e divisores verticais e horizontais.

---

## [1.1.0] — 2026-05-09

Esta versão foca em acessibilidade global, experiência estética premium, suporte multi-idiomas nativo e inteligência de distribuição de limites orçamentários.

### Adicionado
* **Suporte Multi-idioma de Alta Fidelidade (i18n):** Tradução completa da landing page e do app financeiro para **12 idiomas globais** (`pt-BR`, `en`, `es`, `fr`, `de`, `it`, `nl`, `pl`, `zh`, `ja`, `ar`, `hi`) via `react-i18next` com suporte a orientação RTL.
* **Suporte a 160+ Moedas Globais:** Motor dinâmico de formatação financeira usando a API Intl do navegador e seletor de moedas rápido com busca por texto.
* **Controle de Teto de Contas (Ceilings):** Adicionada a propriedade opcional `ceiling` para estabelecer limites de saldo em contas e envelopes.
* **Algoritmo de Distribuição de Excessos (*distribute_excess*):** Lógica matemática inteligente para redistribuir saldos excedentes ao teto para subcontas filhas e reservas, operando sob o algoritmo de preenchimento de água (*water-filling algorithm*).
* **Estratégia de Cobertura de Gastos Excessivos (*cover_overspending*):** Cobertura automática de saldos negativos distribuindo a pendência entre contas irmãs.
* **Página de Gestão de Dívidas:** Nova interface [Debts.tsx](file:///C:/Users/mathe/PROJETO-YNAB/Ynab/src/pages/Debts.tsx) com a store `useDebtStore` para amortização progressiva de passivos.
* **Gestos e Pull-to-Refresh Mobile:** Adicionados gestos nativos de swipe para Android/iOS e gesto de puxar para atualizar saldos na tela.
* **Suíte Completa de Testes Automatizados (100% Pass):** Implementação massiva de testes para persistência de limites de teto, árvores de agregação recursiva e segurança no backend e frontend.

### Alterado
* **Pruning de Código Legado:** Exclusão definitiva de arquivos não-utilizados e pacotes órfãos do antigo protótipo React Native para aliviar o bundle.
* **Remoção de Idiomas Redundantes:** Remoção do `pt-PT` para unificar todos os termos em língua portuguesa sob o Português do Brasil (`pt-BR`).

---

## [1.0.0] — 2026-05-05 - 2026-05-08

Esta versão representa o lançamento estável inicial de produção do **Vault Finance OS**, consolidando os apps mobile nativos e a sincronização offline de dados.

### Adicionado
* **Compilação Mobile Nativa com Capacitor v8:** Estruturação dos aplicativos Android e iOS utilizando o Capacitor com suporte nativo a biometria, armazenamento seguro e controle de hardware.
* **Autenticação Nativa com Google Sign-In:** Integração nativa usando o plugin `@codetrix-studio/capacitor-google-auth` e comunicação segura com endpoints sociais do Django REST Framework.
* **Processador de Sincronização Offline-First:** Arquitetura de persistência local de transações com sincronização em segundo plano assim que a conectividade for restabelecida.
* **Mecanismo de Transações Pendentes e Efetivadas:** Distinção de saldos líquidos em tempo real baseada no status (`pending` e `realized`) e agendamentos futuros.
* **Floating Action Button (FAB):** Adicionado botão de atalho flutuante de '+' na interface móvel, ocultando menus redundantes do desktop no mobile.

---

## [0.9.0] — 2026-05-04

Foco em BI (Business Intelligence), metas patrimoniais de longo prazo e algoritmos de distribuição sistemática de receitas.

### Adicionado
* **Dashboard de BI Integrado:** Gráficos interativos em Modo Escuro de evolução patrimonial líquida (*Net Worth*) e fatiamento de despesas em formato de rosca por categorias.
* **Sistema de Metas Patrimoniais (Goals):** Criação de alvos financeiros flexíveis com suporte a múltiplos ativos e moedas.
* **Templates Modulares de Distribuição:** Gestão de regras predefinidas para recebimento de receitas líquidas, com alocações percentuais fixas ou dinâmicas para categorias orçamentárias.

---

## [0.8.0] — 2026-05-02 - 2026-05-03

Segurança multifator, persistência cambial de taxas e visualização detalhada de portfólio.

### Adicionado
* **Autenticação em Duas Etapas (2FA):** Lógica integrada ao backend (Django) e frontend (React) usando o algoritmo de código dinâmico TOTP (RFC 6238) via `pyotp`.
* **Dashboard Detalhado de Conta:** Interface com macro e micro visualizações, filtros temporais dinâmicos e design baseado em glassmorphism de alta fidelidade.
* **Sincronização Cambial Automática:** Atualização em segundo plano das taxas de conversão de moedas estrangeiras via banco de dados Supabase (PostgreSQL).

---

## [0.7.0] — 2026-04-26 - 2026-05-01

Infraestrutura de nuvem, controle de sessões e fluxos sociais web.

### Adicionado
* **Autenticação Social Web:** Fluxo funcional do Google OAuth2 integrado ao frontend SPA React.
* **Sincronização por Tarefas Cron:** Criação do endpoint de `/ping` de baixo custo computacional no Django para manter ativas e aquecidas as instâncias gratuitas do Render e Supabase.
* **Registro Flexível de Novos Usuários:** Rota de cadastro no DRF mapeando dinamicamente campos de perfil e preferências.
* **Deploy Integrado Multicloud:** Configuração de arquivos `vercel.json` para suporte a rotas SPA, orquestração Docker para Oracle Cloud e build scripts automatizados no Render.

---

## [0.6.0] — 2026-04-25

Consolidação da lógica financeira recursiva e de categorização.

### Adicionado
* **Lógica Orçamentária Recursiva (Base-Zero):** Agregação inteligente de saldos em sub-envelopes recursivos de forma infinita.
* **Importador de Extratos Bancários OFX:** Upload e processamento automático de arquivos de transação financeira OFX nativo do backend.
* **Refatoração completa para TanStack Query:** Migração de toda a camada de sincronização assíncrona do frontend para React Query, mitigando problemas de concorrência.
* **Adoção Global de Dark Mode Premium:** Estilização de todo o ecossistema com paletas escuras de alto contraste.

---

## [0.5.0] — 2026-04-21 - 2026-04-22

Nascimento do Vault Finance OS.

### Adicionado
* **Estrutura Base Multirepositório:** Configuração inicial do Django REST Framework (Backend) e do React + Vite + TypeScript + TailwindCSS (Frontend).
* **Autenticação Baseada em JSON Web Tokens (JWT):** Implementação inicial de fluxo seguro de tokens com SimpleJWT (Access e Refresh tokens).
* **Initial Commit:** Envio inicial do repositório contendo as bases lógicas para o modelo relacional de transações.
