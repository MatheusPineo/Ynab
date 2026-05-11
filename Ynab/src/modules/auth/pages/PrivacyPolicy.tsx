import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Database, Key, CheckCircle } from "lucide-react";

export default function PrivacyPolicy() {
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
        {/* Navigation bar */}
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
            Política de Privacidade
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
            Esta política explica como os seus dados pessoais e financeiros são coletados, processados, armazenados e protegidos em total conformidade com a LGPD e GDPR por <strong>[NOME DA EMPRESA]</strong>.
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
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <h2 className="text-xl font-bold text-slate-100">1. Compromisso de Criptografia em Trânsito e Repouso</h2>
            </div>
            <p className="text-slate-400">
              Todos os dados e comunicações de rede entre o cliente (Web/Mobile) e o servidor são blindados 
              através de conexões <strong>HTTPS/TLS v1.3 de nível bancário</strong>. Isso impede interceptações maliciosas em redes WiFi públicas ou operadoras de telefonia.
              Senhas e chaves simétricas de 2FA do banco são armazenadas de forma unidirecional usando hashes <strong>PBKDF2</strong> de segurança criptográfica de ponta.
            </p>
          </section>

          {/* Section 2 */}
          <section className="bg-slate-900/50 border border-slate-800/60 rounded-xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-6 h-6 text-emerald-400" />
              <h2 className="text-xl font-bold text-slate-100">2. Banco de Dados PostgreSQL e Backend Django</h2>
            </div>
            <p className="text-slate-400">
              O Vault Finance OS gerencia as suas contas, categorias de orçamentos e transações de forma 
              segura em nosso banco relacional <strong>PostgreSQL</strong>, hospedado e orquestrado por canais estáveis e monitorados de infraestrutura em nuvem privada.
              Todas as transações e orçamentos inseridos pertencem estritamente ao seu perfil identificador (ID). É impossível o vazamento ou intersecção de dados entre diferentes usuários (<em>Multi-tenant isolation</em>).
            </p>
          </section>

          {/* Section 3 */}
          <section className="bg-slate-900/50 border border-slate-800/60 rounded-xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <Key className="w-6 h-6 text-emerald-400" />
              <h2 className="text-xl font-bold text-slate-100">3. Fluxo de Autenticação JWT e Proteção 2FA</h2>
            </div>
            <p className="text-slate-400">
              Sua sessão é protegida utilizando o fluxo de tokens assinados <strong>SimpleJWT</strong>. Caso você ative a 
              <strong>Autenticação em Duas Etapas (2FA)</strong> em suas configurações, o servidor do Django exigirá, além das suas credenciais tradicionais, 
              o envio do código numérico de 6 dígitos gerado pelo seu Authenticator móvel baseado em TOTP (RFC 6238). O token JWT de acesso é renovado de forma silenciosa e expira em 15 minutos para evitar roubos de cookies de sessão.
            </p>
          </section>

          {/* Section 4 */}
          <section className="bg-slate-900/50 border border-slate-800/60 rounded-xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
              <h2 className="text-xl font-bold text-slate-100">4. Seus Direitos Legais (LGPD & GDPR)</h2>
            </div>
            <div className="space-y-4 text-slate-400">
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

          {/* Section 5 */}
          <section className="bg-slate-900/50 border border-slate-800/60 rounded-xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <h2 className="text-xl font-bold text-slate-100">5. Auditorias de Segurança, Isolação Multitenant e Pentests</h2>
            </div>
            <div className="space-y-4 text-slate-400 text-sm sm:text-base">
              <p>
                Para assegurar a blindagem de suas informações e evitar qualquer tipo de vazamento, operamos sob uma política de cibersegurança ativa:
              </p>
              <ul className="list-disc pl-5 space-y-3">
                <li>
                  <strong>Prevenção Absoluta contra IDOR / BOLA:</strong> Nosso backend estruturado em Django implementa isolamento lógico estrito de banco de dados (PostgreSQL). Todas as queries ORM e rotas de API exigem a amarração do ID do usuário autenticado no cabeçalho da sessão (`request.user`). É impossível que um Usuário A visualize, altere ou exclua contas, orçamentos ou transações pertencentes a um Usuário B modificando parâmetros de consulta, IDs de rota ou cargas úteis JSON.
                </li>
                <li>
                  <strong>Varreduras Automatizadas de Vulnerabilidade:</strong> Realizamos análises estáticas e dinâmicas de segurança (SAST/DAST) automatizadas a cada push de código no pipeline, auditando dependências e prevenindo riscos catalogados pela OWASP (como vazamento de logs, injeção SQL, Cross-Site Scripting e Cross-Site Request Forgery).
                </li>
                <li>
                  <strong>Testes de Intrusão Periódicos (Pentesting):</strong> O ecossistema é periodicamente submetido a simulações de ataques reais (Pentests manuais e automatizados) para garantir a inviolabilidade absoluta dos fluxos do JWT de sessão, tokens de criptografia e do algoritmo 2FA base-zero.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 6 */}
          <section className="bg-slate-900/50 border border-slate-800/60 rounded-xl p-6 sm:p-8">
            <h2 className="text-xl font-bold text-slate-100 mb-4">6. Fale Conosco sobre Encarregado de Dados (DPO)</h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Se você deseja exercer o seu direito de exclusão, exportação de dados ou deseja falar com o nosso Encarregado pelo Tratamento de Dados Pessoais (DPO), encaminhe um e-mail formal de solicitação para:{" "}
              <a href="mailto:[EMAIL DE CONTATO]" className="text-emerald-400 hover:underline">
                [EMAIL DE CONTATO]
              </a>
              . Retornaremos com as ações e arquivos em até 48 horas úteis.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
