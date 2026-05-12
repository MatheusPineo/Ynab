import React, { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { 
  ArrowLeft, 
  ShieldCheck, 
  Scale, 
  Cookie, 
  ShieldAlert, 
  Key, 
  Database, 
  CheckCircle, 
  BarChart3, 
  Star,
  Shield,
  FileText,
  Globe,
  ChevronRight
} from "lucide-react";

export default function LegalCenter() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, i18n } = useTranslation();

  // Define active tab, fallback to 'overview'
  const activeTab = searchParams.get("tab") || "overview";

  useEffect(() => {
    // Ensure scroll is at top when mounting or changing tabs
    const html = document.documentElement;
    const body = document.body;
    html.style.overflow = "auto";
    body.style.overflow = "auto";
    html.style.height = "auto";
    body.style.height = "auto";
    window.scrollTo(0, 0);
  }, [activeTab]);

  const handleTabChange = (tabId: string) => {
    setSearchParams({ tab: tabId });
  };

  const menuItems = [
    {
      category: "CONTRATOS E REGRAS",
      items: [
        {
          id: "overview",
          label: "Visão Geral",
          sublabel: "Governança e Segurança",
          icon: Shield,
          badge: "LGPD/GDPR"
        },
        {
          id: "termos",
          label: "Termos de Uso",
          sublabel: "Contrato e SLA 99.9%",
          icon: Scale,
          badge: "SaaS v1.2"
        }
      ]
    },
    {
      category: "PRIVACIDADE E DADOS",
      items: [
        {
          id: "privacidade",
          label: "Política de Privacidade",
          sublabel: "Proteção de Dados Fin.",
          icon: ShieldCheck,
          badge: "Criptografado"
        },
        {
          id: "cookies",
          label: "Política de Cookies",
          sublabel: "Consentimento Ativo",
          icon: Cookie,
          badge: "Opt-in"
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-100 relative overflow-x-hidden">
      {/* Ambient background glows */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/4 h-[500px] w-[800px] rounded-full bg-emerald-500/5 blur-[120px]" />
        <div className="absolute bottom-10 right-1/4 h-[400px] w-[600px] rounded-full bg-teal-500/5 blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* Navigation Top Header */}
        <header className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 sm:mb-12 border-b border-slate-900 pb-6">
          <Link
            to="/"
            className="inline-flex items-center text-emerald-400 hover:text-emerald-300 transition-colors gap-2 text-sm font-semibold group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" /> 
            <span>Voltar para a Home</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono py-1 px-3 bg-slate-900 border border-slate-800 text-slate-400 rounded-full flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Canal Seguro de Governança
            </span>
          </div>
        </header>

        {/* Hero Banner Section */}
        <section className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-10 mb-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4 uppercase tracking-wider">
              Legal Center / Central Legal
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200 mb-4 tracking-tight leading-tight">
              Governança, Privacidade e Transparência
            </h1>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Bem-vindo ao centro técnico-jurídico do <strong>Vault Finance OS</strong>. Aqui unificamos todos os nossos regulamentos de nível de serviço, políticas de conformidade internacional (LGPD/GDPR), proteção contra vazamento de dados e auditorias de cibersegurança de forma clara e transparente.
            </p>
          </div>
        </section>

        {/* Content Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* MOBILE TABS NAVIGATION - HORIZONTAL SLIDE */}
          <div className="lg:hidden w-full overflow-x-auto no-scrollbar pb-2 mb-4">
            <div className="flex gap-2 min-w-max px-1">
              {menuItems.flatMap(cat => cat.items).map((item) => {
                const Icon = item.icon;
                const isSelected = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-emerald-500 text-zinc-950 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                        : "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* DESKTOP SIDEBAR NAVIGATION (Columns 1 to 4) */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-6 bg-slate-900/45 border border-slate-900 p-5 rounded-2xl shadow-xl backdrop-blur-md">
            <div className="space-y-6">
              {menuItems.map((category, idx) => (
                <div key={idx} className="space-y-2">
                  <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase px-3 block">
                    {category.category}
                  </span>
                  <div className="space-y-1">
                    {category.items.map((item) => {
                      const Icon = item.icon;
                      const isSelected = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleTabChange(item.id)}
                          className={`w-full flex items-center justify-between text-left p-3 rounded-xl border transition-all duration-200 group relative ${
                            isSelected
                              ? "bg-slate-900/80 text-white border-slate-800 font-medium"
                              : "bg-transparent text-slate-400 border-transparent hover:bg-slate-900/30 hover:text-slate-200"
                          }`}
                        >
                          {/* Active border bar indicator */}
                          {isSelected && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 rounded-r-md bg-gradient-to-b from-emerald-400 to-emerald-600" />
                          )}
                          
                          <div className="flex items-center gap-3 pl-1.5">
                            <div className={`p-1.5 rounded-lg border transition-colors ${
                              isSelected 
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                                : "bg-slate-950 text-slate-500 border-slate-800 group-hover:border-slate-700 group-hover:text-slate-300"
                            }`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold tracking-tight">{item.label}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5 leading-none">{item.sublabel}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-mono py-0.5 px-1.5 rounded border ${
                              isSelected
                                ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                                : "bg-slate-950 border-slate-900 text-slate-600"
                            }`}>
                              {item.badge}
                            </span>
                            <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${
                              isSelected ? "text-slate-400 translate-x-0.5" : "text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5"
                            }`} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800/60 px-3 text-xs text-slate-500 leading-relaxed font-mono">
              <p>Última revisão do centro:</p>
              <p className="text-emerald-400 font-semibold mt-1">Maio de 2026 (v1.2.0)</p>
            </div>
          </aside>

          {/* MAIN CONTENT WORKSPACE (Columns 5 to 12) */}
          <main className="lg:col-span-8 bg-slate-900/20 border border-slate-900/50 rounded-2xl p-4 sm:p-8 shadow-inner">
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              {activeTab === "overview" && <TabOverview />}
              {activeTab === "termos" && <TabTermsOfUse />}
              {activeTab === "privacidade" && <TabPrivacyPolicy />}
              {activeTab === "cookies" && <TabCookiePolicy />}
            </div>
          </main>

        </div>

      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS: TAB CONTENTS
// ============================================================================

/**
 * 1. Overview Tab
 */
function TabOverview() {
  return (
    <div className="space-y-8">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Shield className="w-6 h-6 text-emerald-400" />
          Central de Governança, Segurança e Isolação
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Nossa estrutura de defesa e conformidade de dados consolidada.
        </p>
      </div>

      <div className="prose prose-invert max-w-none space-y-6 text-slate-300 leading-relaxed text-sm sm:text-base">
        <p>
          O <strong>Vault Finance OS</strong> foi projetado sob os mais rígidos princípios de cibersegurança financeira e soberania pessoal. Diferente de plataformas legadas que priorizam o compartilhamento de metadados de consumo, nossa arquitetura opera sob o modelo de <strong>blindagem de ponta a ponta</strong> e **isolação multitenant rígida**.
        </p>

        {/* Highlight cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 rounded-lg w-max mb-3">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Isolação Multitenant PostgreSQL</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Nossas consultas ORM no Django vinculam estritamente o identificador `request.user` em todas as ações de leitura ou escrita. É impossível alterar parâmetros ou consultar dados pertencentes a outro usuário (blindagem absoluta contra vulnerabilidades IDOR/BOLA).
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 rounded-lg w-max mb-3">
              <Key className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Criptografia Ativa</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Comunicação blindada via HTTPS com protocolo TLS v1.3. Senhas e sementes 2FA são processadas por hashing unidirecional PBKDF2, o que impede a extração mesmo diante de vazamentos físicos.
            </p>
          </div>
        </div>

        <section className="bg-slate-900/30 border border-slate-850 rounded-xl p-5 sm:p-6 space-y-3">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            Nossa Postura de Conformidade Internacional
          </h3>
          <p className="text-slate-400 text-xs sm:text-sm">
            Atuamos em total alinhamento com a Lei Geral de Proteção de Dados (<strong>LGPD</strong> - Brasil) e o Regulamento Geral sobre a Proteção de Dados (<strong>GDPR</strong> - União Europeia). Garantimos reativamente:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-400">
            <li><strong>Direito de Exclusão (Esquecimento):</strong> Delete seus dados permanentemente do PostgreSQL em 48h.</li>
            <li><strong>Direito de Exportação (Portabilidade):</strong> Exporte suas contas e transações em formatos abertos (JSON/CSV).</li>
            <li><strong>Consentimento Explícito de Rastreamento:</strong> Zero cookies analíticos são carregados sem o seu opt-in expresso.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-base font-bold text-slate-100">Políticas de Auditorias de Cibersegurança</h3>
          <p className="text-slate-400 text-xs sm:text-sm">
            Para garantir que nossa blindagem nunca sofra regressões, o ecossistema é submetido a varreduras automatizadas de SAST/DAST a cada commit contra riscos catalogados pelo OWASP Top 10, além de <strong>Testes de Intrusão Periódicos (Pentesting)</strong> para validar os fluxos de tokens e proteção 2FA.
          </p>
        </section>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 flex items-start gap-4">
          <ShieldAlert className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-yellow-200 uppercase tracking-widest font-mono">Contato de Governança (DPO)</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Caso deseje realizar uma denúncia de segurança, solicitar auditorias ou requisitar a exclusão perpétua de sua conta, fale diretamente com o nosso Encarregado pelo Tratamento de Dados (DPO) pelo e-mail:{" "}
              <a href="mailto:dpo@vaultfinance.os" className="text-emerald-400 hover:underline">dpo@vaultfinance.os</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 2. Terms Of Use Tab
 */
function TabTermsOfUse() {
  return (
    <div className="space-y-8">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Scale className="w-6 h-6 text-emerald-400" />
          Termos de Uso do Ecossistema
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Regulamento de utilização do Vault Finance OS comercializado por Vault Finance Ltd.
        </p>
      </div>

      <div className="prose prose-invert max-w-none space-y-8 text-slate-300 leading-relaxed text-sm sm:text-base">
        
        <section className="bg-slate-900/50 border border-slate-800/60 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <Scale className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-slate-100">1. Aceite dos Termos</h3>
          </div>
          <p className="text-slate-400 text-sm">
            Ao acessar, cadastrar-se ou utilizar o Vault Finance OS de qualquer forma, você declara aceitar integralmente estes Termos de Uso e nossa Política de Privacidade. Caso não concorde com qualquer disposição aqui estipulada, você deve abster-se de utilizar a nossa aplicação.
          </p>
        </section>

        <section className="bg-slate-900/50 border border-slate-800/60 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <ShieldAlert className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-bold text-yellow-100">2. Isenção de Responsabilidade sobre Decisões Financeiras</h3>
          </div>
          <div className="space-y-4 text-slate-400 text-sm">
            <p className="font-semibold text-slate-200">
              O Vault Finance OS é exclusivamente um software de utilidade analítica e organizadora para alocação inteligente de saldo base-zero.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Ausência de Recomendação:</strong> Nossos painéis, insights ou alocações automatizadas NÃO constituem conselho financeiro pessoal, recomendações de investimento, ou consultoria patrimonial oficial.
              </li>
              <li>
                <strong>Soberania de Escolhas:</strong> Todas as decisões de gastos, amortização de dívidas, investimentos ou despesas são tomadas voluntária e exclusivamente pelo próprio usuário, sob sua inteira responsabilidade jurídica.
              </li>
              <li>
                <strong>Isenção de Danos:</strong> A <strong>Vault Finance Ltd.</strong> não será civilmente responsável por quaisquer prejuízos, lucros cessantes, perdas financeiras ou flutuações patrimoniais sofridos pelo usuário em decorrência do uso das projeções e relatórios do software.
              </li>
            </ul>
          </div>
        </section>

        <section className="bg-slate-900/50 border border-slate-800/60 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-slate-100">3. Acordo de Nível de Serviço (SLA) de Disponibilidade</h3>
          </div>
          <div className="space-y-4 text-slate-400 text-sm">
            <p>
              Como um SaaS financeiro robusto voltado para planejamento orçamentário estável, assumimos o compromisso formal de manter nossa API e o frontend acessíveis.
            </p>
            <ul className="list-disc pl-5 space-y-3">
              <li>
                <strong>Garantia de Uptime (Disponibilidade):</strong> Estabelecemos uma meta de disponibilidade mensal de <strong>99.9%</strong> (uptime) para a Plataforma, calculada mensalmente.
              </li>
              <li>
                <strong>Eventos Excluídos do SLA (Provedores Terceiros):</strong> Não serão computadas como indisponibilidade as interrupções decorrentes de instabilidades sistêmicas globais de nossos provedores de infraestrutura terceiros (tais como falha geral e prolongada do Render Cloud Hosting, do banco de dados Supabase ou da rede CDN da Vercel), desde que estas falhas estejam oficialmente registradas e declaradas nas respectivas páginas de status públicas desses provedores.
              </li>
              <li>
                <strong>Política de Compensação e Créditos:</strong> Caso a taxa de uptime mensal da Plataforma caia abaixo do SLA de 99.9% por falhas diretas e exclusivas sob controle do Vault Finance OS, o usuário Pro poderá solicitar a concessão de créditos de compensação na mensalidade seguinte de acordo com a tabela:
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-800 border border-slate-800 rounded-lg text-xs">
                    <thead>
                      <tr className="bg-slate-950 text-slate-300">
                        <th className="px-4 py-2 text-left font-bold border-r border-slate-800">Uptime Mensal Realizado</th>
                        <th className="px-4 py-2 text-left font-bold">Percentual de Crédito de Desconto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-400">
                      <tr>
                        <td className="px-4 py-2 border-r border-slate-800">De 99.0% a 99.8%</td>
                        <td className="px-4 py-2 text-yellow-400">10% de desconto na fatura seguinte</td>
                      </tr>
                      <tr className="bg-slate-900/30">
                        <td className="px-4 py-2 border-r border-slate-800">De 95.0% a 98.9%</td>
                        <td className="px-4 py-2 text-yellow-400">25% de desconto na fatura seguinte</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 border-r border-slate-800">Abaixo de 95.0%</td>
                        <td className="px-4 py-2 text-emerald-400 font-bold">50% de desconto na fatura seguinte</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </li>
              <li>
                <strong>Métricas de RTO e RPO (Mitigação de Desastres):</strong> Nos comprometemos com um Objetivo de Tempo de Recuperação (<strong>RTO</strong>) máximo de <strong>4 horas</strong> para restauração de serviços críticos em caso de interrupção geral, e com um Objetivo de Ponto de Recuperação (<strong>RPO</strong>) máximo de <strong>1 hora</strong>, decorrente da nossa rotina contínua de backups incrementais automatizados no PostgreSQL.
              </li>
            </ul>
          </div>
        </section>

        <section className="bg-slate-900/50 border border-slate-800/60 rounded-xl p-6">
          <h3 className="text-lg font-bold text-slate-100 mb-3">4. Restrições de Uso do Software</h3>
          <p className="text-slate-400 mb-3 text-sm">
            Não é permitido aos usuários:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-slate-400">
            <li>Utilizar o aplicativo para fins ilícitos, fraudes financeiras, lavagem de capitais ou violação de leis fiscais locais.</li>
            <li>Praticar engenharia reversa no frontend React ou injetar scripts maliciosos nos endpoints REST da nossa API.</li>
            <li>Sublicenciar, revender ou compartilhar credenciais de acesso individuais sem prévio contrato de parceria.</li>
          </ul>
        </section>

        <section className="bg-slate-900/50 border border-slate-800/60 rounded-xl p-6">
          <h3 className="text-lg font-bold text-slate-100 mb-3">5. Rescisão de Acesso</h3>
          <p className="text-slate-400 text-sm">
            Reservamo-nos o direito de suspender ou banir contas de usuários que descumprirem estes termos, sem direito a reembolso de planos ativos em caso de má fé comprovada ou fraudes.
          </p>
        </section>

        <section className="bg-slate-900/50 border border-slate-800/60 rounded-xl p-6">
          <h3 className="text-lg font-bold text-slate-100 mb-3">6. Fale Conosco</h3>
          <p className="text-slate-400 text-sm">
            Se houver qualquer dúvida sobre este Acordo de Termos de Uso, entre em contato diretamente com nosso suporte pelo e-mail:{" "}
            <a href="mailto:suporte@vaultfinance.os" className="text-emerald-400 hover:underline">
              suporte@vaultfinance.os
            </a>.
          </p>
        </section>

      </div>
    </div>
  );
}

/**
 * 3. Privacy Policy Tab
 */
function TabPrivacyPolicy() {
  return (
    <div className="space-y-8">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
          Política de Privacidade
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Regulamento de privacidade, criptografia e conformidade legal com LGPD e GDPR.
        </p>
      </div>

      <div className="prose prose-invert max-w-none space-y-8 text-slate-300 leading-relaxed text-sm sm:text-base">
        
        <section className="bg-slate-900/50 border border-slate-800/60 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-slate-100">1. Compromisso de Criptografia em Trânsito e Repouso</h3>
          </div>
          <p className="text-slate-400 text-sm">
            Todos os dados e comunicações de rede entre o cliente (Web/Mobile) e o servidor são blindados através de conexões <strong>HTTPS/TLS v1.3 de nível bancário</strong>. Isso impede interceptações maliciosas em redes WiFi públicas ou operadoras de telefonia. Senhas e chaves simétricas de 2FA do banco são armazenadas de forma unidirecional usando hashes <strong>PBKDF2</strong> de segurança criptográfica de ponta.
          </p>
        </section>

        <section className="bg-slate-900/50 border border-slate-800/60 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <Database className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-slate-100">2. Banco de Dados PostgreSQL e Backend Django</h3>
          </div>
          <p className="text-slate-400 text-sm">
            O Vault Finance OS gerencia as suas contas, categorias de orçamentos e transações de forma segura em nosso banco relacional <strong>PostgreSQL</strong>, hospedado e orquestrado por canais estáveis e monitorados de infraestrutura em nuvem privada. Todas as transações e orçamentos inseridos pertencem estritamente ao seu perfil identificador (ID). É impossível o vazamento ou intersecção de dados entre diferentes usuários (<em>Multi-tenant isolation</em>).
          </p>
        </section>

        <section className="bg-slate-900/50 border border-slate-800/60 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <Key className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-slate-100">3. Fluxo de Autenticação JWT e Proteção 2FA</h3>
          </div>
          <p className="text-slate-400 text-sm">
            Sua sessão é protegida utilizando o fluxo de tokens assinados <strong>SimpleJWT</strong>. Caso você ative a <strong>Autenticação em Duas Etapas (2FA)</strong> em suas configurações, o servidor do Django exigirá, além das suas credenciais tradicionais, o envio do código numérico de 6 dígitos gerado pelo seu Authenticator móvel baseado em TOTP (RFC 6238). O token JWT de acesso é renovado de forma silenciosa e expira em 15 minutos para evitar roubos de cookies de sessão.
          </p>
        </section>

        <section className="bg-slate-900/50 border border-slate-800/60 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-slate-100">4. Seus Direitos Legais (LGPD & GDPR)</h3>
          </div>
          <div className="space-y-4 text-slate-400 text-sm">
            <p>
              Como titular dos dados sensíveis financeiros, você possui total soberania de dados assegurada pelas leis internacionais de privacidade:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Direito de Exclusão (Esquecimento):</strong> Você pode solicitar a exclusão total, perpétua e definitiva de todos os seus dados pessoais, históricos de contas e transações de nossas tabelas PostgreSQL.
              </li>
              <li>
                <strong>Direito de Exportação (Portabilidade):</strong> Você pode solicitar o download total de suas transações e dados de orçamento em formatos estruturados (JSON/CSV) para portar a qualquer outro sistema de sua preferência.
              </li>
              <li>
                <strong>Direito de Retificação:</strong> Você pode alterar ou retificar dados cadastrais incorretos diretamente do seu painel de configurações.
              </li>
            </ul>
          </div>
        </section>

        <section className="bg-slate-900/50 border border-slate-800/60 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-slate-100">5. Auditorias de Segurança, Isolação Multitenant e Pentests</h3>
          </div>
          <div className="space-y-4 text-slate-400 text-sm">
            <p>
              Para assegurar a blindagem de suas informações e evitar qualquer tipo de vazamento, operamos sob uma política de cibersegurança ativa:
            </p>
            <ul className="list-disc pl-5 space-y-3">
              <li>
                <strong>Prevenção Absoluta contra IDOR / BOLA:</strong> Nosso backend estruturado em Django implementa isolamento lógico estrito de banco de dados (PostgreSQL). Todas as queries ORM e rotas de API exigem a amarração do ID do usuário autenticado no cabeçalho da sessão (`request.user`). É impossível que um Usuário A visualize, altere ou exclua contas, orçamentos ou transações pertencentes a um Usuário B modificando parâmetros de consulta, IDs de rota ou cargas úteis JSON.
              </li>
              <li>
                <strong>Varreduras Automatizadas de Vulnerabilidade:</strong> Realizamos análises estáticas e dinâmicas de segurança (SAST/DAST) automatizadas a cada push de código no pipeline, auditando dependências e prevenindo riscos catalogados pela OWASP.
              </li>
              <li>
                <strong>Testes de Intrusão Periódicos (Pentesting):</strong> O ecossistema é periodicamente submetido a simulações de ataques reais (Pentests manuais e automatizados) para garantir a inviolabilidade absoluta dos fluxos do JWT de sessão, tokens de criptografia e do algoritmo 2FA base-zero.
              </li>
            </ul>
          </div>
        </section>

        <section className="bg-slate-900/50 border border-slate-800/60 rounded-xl p-6">
          <h3 className="text-lg font-bold text-slate-100 mb-3">6. Fale Conosco sobre Encarregado de Dados (DPO)</h3>
          <p className="text-slate-400 text-sm">
            Se você deseja exercer o seu direito de exclusão, exportação de dados ou deseja falar com o nosso Encarregado pelo Tratamento de Dados Pessoais (DPO), encaminhe um e-mail formal de solicitação para:{" "}
            <a href="mailto:dpo@vaultfinance.os" className="text-emerald-400 hover:underline">
              dpo@vaultfinance.os
            </a>. Retornaremos com as ações e arquivos em até 48 horas úteis.
          </p>
        </section>

      </div>
    </div>
  );
}

/**
 * 4. Cookie Policy Tab
 */
function TabCookiePolicy() {
  return (
    <div className="space-y-8">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Cookie className="w-6 h-6 text-emerald-400" />
          Política de Cookies
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Uso transparente de cookies para funcionalidade, segurança e desempenho do Vault Finance OS.
        </p>
      </div>

      <div className="prose prose-invert max-w-none space-y-8 text-slate-300 leading-relaxed text-sm sm:text-base">
        
        <section className="bg-slate-900/50 border border-slate-800/60 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <Cookie className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-slate-100">1. O que são Cookies?</h3>
          </div>
          <p className="text-slate-400 text-sm">
            Cookies são pequenos arquivos de texto armazenados de forma segura pelo seu navegador ao acessar sites ou aplicativos. Eles ajudam a lembrar as suas preferências regionais de idioma, manter o seu login ativo e nos ajudam a auditar o desempenho de carregamento do app.
          </p>
        </section>

        <section className="bg-slate-900/50 border border-slate-800/60 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-emerald-100">2. Cookies Estritamente Necessários (Sempre Ativos)</h3>
          </div>
          <p className="text-slate-400 mb-4 text-sm">
            Esses cookies são essenciais para o funcionamento básico e segurança cibernética do aplicativo, não podendo ser desativados sob o risco de quebrar o login ou impossibilitar operações de alocação orçamentária.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-slate-400">
            <li>
              <strong>Autenticação JWT:</strong> Cookies de segurança que armazenam chaves criptográficas de tokens de acesso para garantir que suas requisições financeiras sejam autenticadas de forma segura.
            </li>
            <li>
              <strong>Preferências do Sistema:</strong> Lembrar se você ativou o Modo Privado ou se prefere visualizar decimais nos seus saldos de budget.
            </li>
            <li>
              <strong>Segurança contra Fraude (CSRF):</strong> Proteção contra roubos e tentativas de sequestro de sessão durante transferências.
            </li>
          </ul>
        </section>

        <section className="bg-slate-900/50 border border-slate-800/60 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <BarChart3 className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-bold text-yellow-100">3. Cookies de Performance e Analytics (Opcionais)</h3>
          </div>
          <p className="text-slate-400 mb-4 text-sm">
            Estes cookies nos ajudam a entender como os usuários utilizam o Vault Finance OS (como cliques em botões, erros de renderização e tempo de permanência em dashboards), auxiliando na otimização de performance e correção de bugs em segundo plano.
          </p>
          <p className="text-slate-400 text-sm">
            O rastreamento via cookies analíticos (como Google Analytics ou PostHog) só será inicializado caso você concorde explicitamente em nosso banner de consentimento do rodapé. Caso rejeite, seu comportamento não será rastreado.
          </p>
        </section>

        <section className="bg-slate-900/50 border border-slate-800/60 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <Star className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-slate-100">4. Como Alterar Minhas Preferências de Cookies?</h3>
          </div>
          <p className="text-slate-400 text-sm">
            Você pode alterar as suas escolhas a qualquer momento limpando o cache e cookies do seu navegador ou abrindo o painel flutuante de gerenciamento no rodapé. Seus dados e preferências são soberanos.
          </p>
        </section>

        <section className="bg-slate-900/50 border border-slate-800/60 rounded-xl p-6">
          <h3 className="text-lg font-bold text-slate-100 mb-3">5. Dúvidas?</h3>
          <p className="text-slate-400 text-sm">
            Se você tem perguntas sobre nossa Política de Cookies, envie uma mensagem para o nosso suporte técnico:{" "}
            <a href="mailto:suporte@vaultfinance.os" className="text-emerald-400 hover:underline">
              suporte@vaultfinance.os
            </a>.
          </p>
        </section>

      </div>
    </div>
  );
}
