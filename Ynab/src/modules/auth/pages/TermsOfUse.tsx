import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ShieldAlert, Scale, CheckCircle } from "lucide-react";

export default function TermsOfUse() {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    html.style.overflow = "auto";
    body.style.overflow = "auto";
    html.style.height = "auto";
    body.style.height = "auto";
    window.scrollTo(0, 0);
  }, []);

  return (

    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Top bar navigation back to Home */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center text-emerald-400 hover:text-emerald-300 transition-colors gap-2 text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar para a Home
          </Link>
        </div>

        {/* Hero Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 sm:p-12 mb-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200 mb-4 tracking-tight">
            Termos de Uso
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
            Estes Termos de Uso regem a utilização do ecossistema e do software
            financeiro <strong>Vault Finance OS</strong> comercializado por{" "}
            <strong>[NOME DA EMPRESA]</strong>.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 text-slate-500 text-xs font-mono uppercase tracking-widest bg-slate-950 py-1.5 px-3 rounded-full border border-slate-800">
            Última atualização: Maio de 2026
          </div>
        </div>

        {/* Content Body */}
        <div className="prose prose-invert max-w-none space-y-8 text-slate-300 leading-relaxed text-sm sm:text-base">
          
          {/* Section 1 */}
          <section className="bg-slate-900/50 border border-slate-800/60 rounded-xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <Scale className="w-6 h-6 text-emerald-400" />
              <h2 className="text-xl font-bold text-slate-100">1. Aceite dos Termos</h2>
            </div>
            <p className="text-slate-400">
              Ao acessar, cadastrar-se ou utilizar o Vault Finance OS de qualquer forma, 
              você declara aceitar integralmente estes Termos de Uso e nossa Política de Privacidade. 
              Caso não concorde com qualquer disposição aqui estipulada, você deve abster-se de utilizar a nossa aplicação.
            </p>
          </section>

          {/* Section 2 */}
          <section className="bg-slate-900/50 border border-slate-800/60 rounded-xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <ShieldAlert className="w-6 h-6 text-yellow-400" />
              <h2 className="text-xl font-bold text-slate-100 text-yellow-100">
                2. Isenção de Responsabilidade sobre Decisões Financeiras
              </h2>
            </div>
            <div className="space-y-4">
              <p className="font-semibold text-slate-200">
                O Vault Finance OS é exclusivamente um software de utilidade analítica e organizadora para alocação inteligente de saldo base-zero.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-slate-400">
                <li>
                  <strong>Ausência de Recomendação:</strong> Nossos painéis, insights ou alocações automatizadas NÃO constituem conselho financeiro pessoal, recomendações de investimento, ou consultoria patrimonial oficial.
                </li>
                <li>
                  <strong>Soberania de Escolhas:</strong> Todas as decisões de gastos, amortização de dívidas, investimentos ou despesas são tomadas voluntária e exclusivamente pelo próprio usuário, sob sua inteira responsabilidade jurídica.
                </li>
                <li>
                  <strong>Isenção de Danos:</strong> A <strong>[NOME DA EMPRESA]</strong> não será civilmente responsável por quaisquer prejuízos, lucros cessantes, perdas financeiras ou flutuações patrimoniais sofridos pelo usuário em decorrência do uso das projeções e relatórios do software.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section className="bg-slate-900/50 border border-slate-800/60 rounded-xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
              <h2 className="text-xl font-bold text-slate-100">3. Acordo de Nível de Serviço (SLA) de Disponibilidade</h2>
            </div>
            <div className="space-y-4 text-slate-400 text-sm sm:text-base">
              <p>
                Como um SaaS financeiro robusto voltado para planejamento orçamentário estável, assumimos o compromisso formal de manter nossa API e o frontend acessíveis.
              </p>
              <ul className="list-disc pl-5 space-y-3">
                <li>
                  <strong>Garantia de Uptime (Disponibilidade):</strong> Estabelecemos uma meta de disponibilidade mensal de <strong>99.9%</strong> (uptime) para a Plataforma, calculada mensalmente.
                </li>
                <li>
                  <strong>Eventos Excluídos do SLA (Provedores Terceiros):</strong> Não serão computadas como indisponibilidade as interrupções decorrentes de instabilidades sistêmicas globais de nossos provedores de infraestrutura terceiros (tais como falha geral e prolongada do <strong>Render Cloud Hosting</strong>, do banco de dados <strong>Supabase</strong> ou da rede CDN da <strong>Vercel</strong>), desde que estas falhas estejam oficialmente registradas e declaradas nas respectivas páginas de status públicas desses provedores.
                </li>
                <li>
                  <strong>Política de Compensação e Créditos:</strong> Caso a taxa de uptime mensal da Plataforma caia abaixo do SLA de 99.9% por falhas diretas e exclusivas sob controle do Vault Finance OS, o usuário Pro poderá solicitar a concessão de créditos de compensação na mensalidade seguinte de acordo com a tabela:
                  <div className="mt-2 overflow-x-auto">
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

          {/* Section 4 */}
          <section className="bg-slate-900/50 border border-slate-800/60 rounded-xl p-6 sm:p-8">
            <h2 className="text-xl font-bold text-slate-100 mb-4">4. Restrições de Uso do Software</h2>
            <p className="text-slate-400 mb-3">
              Não é permitido aos usuários:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-400">
              <li>Utilizar o aplicativo para fins ilícitos, fraudes financeiras, lavagem de capitais ou violação de leis fiscais locais.</li>
              <li>Praticar engenharia reversa no frontend React ou injetar scripts maliciosos nos endpoints REST da nossa API.</li>
              <li>Sublicenciar, revender ou compartilhar credenciais de acesso individuais sem prévio contrato de parceria.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="bg-slate-900/50 border border-slate-800/60 rounded-xl p-6 sm:p-8">
            <h2 className="text-xl font-bold text-slate-100 mb-4">5. Rescisão de Acesso</h2>
            <p className="text-slate-400">
              Reservamo-nos o direito de suspender ou banir contas de usuários que descumprirem estes termos, sem direito a reembolso de planos ativos em caso de má fé comprovada ou fraudes.
            </p>
          </section>

          {/* Section 6 */}
          <section className="bg-slate-900/50 border border-slate-800/60 rounded-xl p-6 sm:p-8">
            <h2 className="text-xl font-bold text-slate-100 mb-4">6. Fale Conosco</h2>
            <p className="text-slate-400">
              Se houver qualquer dúvida sobre este Acordo de Termos de Uso, entre em contato diretamente com nosso suporte pelo e-mail:{" "}
              <a href="mailto:[EMAIL DE CONTATO]" className="text-emerald-400 hover:underline">
                [EMAIL DE CONTATO]
              </a>
              .
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
