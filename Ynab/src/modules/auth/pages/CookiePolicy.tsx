import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Cookie, ShieldCheck, BarChart3, Star } from "lucide-react";

export default function CookiePolicy() {
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
            Política de Cookies
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
            Esta política detalha como o <strong>Vault Finance OS</strong> utiliza cookies para oferecer segurança, consistência de estado e compreender o uso do produto por <strong>[NOME DA EMPRESA]</strong>.
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
              <Cookie className="w-6 h-6 text-emerald-400" />
              <h2 className="text-xl font-bold text-slate-100">1. O que são Cookies?</h2>
            </div>
            <p className="text-slate-400">
              Cookies são pequenos arquivos de texto armazenados de forma segura pelo seu navegador 
              ao acessar sites ou aplicativos. Eles ajudam a lembrar as suas preferências regionais de idioma, manter o seu login ativo e nos ajudam a auditar o desempenho de carregamento do app.
            </p>
          </section>

          {/* Section 2 */}
          <section className="bg-slate-900/50 border border-slate-800/60 rounded-xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <h2 className="text-xl font-bold text-slate-100 text-emerald-100">
                2. Cookies Estritamente Necessários (Sempre Ativos)
              </h2>
            </div>
            <p className="text-slate-400 mb-4">
              Esses cookies são essenciais para o funcionamento básico e segurança cibernética do aplicativo, não podendo ser desativados sob o risco de quebrar o login ou impossibilitar operações de alocação orçamentária.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-400">
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

          {/* Section 3 */}
          <section className="bg-slate-900/50 border border-slate-800/60 rounded-xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="w-6 h-6 text-yellow-400" />
              <h2 className="text-xl font-bold text-slate-100 text-yellow-100">
                3. Cookies de Performance e Analytics (Opcionais)
              </h2>
            </div>
            <p className="text-slate-400 mb-4">
              Estes cookies nos ajudam a entender como os usuários utilizam o Vault Finance OS (como cliques em botões, erros de renderização e tempo de permanência em dashboards), auxiliando na otimização de performance e correção de bugs em segundo plano.
            </p>
            <p className="text-slate-400">
              O rastreamento via cookies analíticos (como Google Analytics ou PostHog) só será inicializado caso você concorde explicitamente em nosso banner de consentimento do rodapé. Caso rejeite, seu comportamento não será rastreado.
            </p>
          </section>

          {/* Section 4 */}
          <section className="bg-slate-900/50 border border-slate-800/60 rounded-xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <Star className="w-6 h-6 text-emerald-400" />
              <h2 className="text-xl font-bold text-slate-100">4. Como Alterar Minhas Preferências de Cookies?</h2>
            </div>
            <p className="text-slate-400">
              Você pode alterar as suas escolhas a qualquer momento limpando o cache e cookies do seu navegador ou abrindo o painel flutuante de gerenciamento no rodapé. Seus dados e preferências são soberanos.
            </p>
          </section>

          {/* Section 5 */}
          <section className="bg-slate-900/50 border border-slate-800/60 rounded-xl p-6 sm:p-8">
            <h2 className="text-xl font-bold text-slate-100 mb-4">5. Dúvidas?</h2>
            <p className="text-slate-400">
              Se você tem perguntas sobre nossa Política de Cookies, envie uma mensagem para o nosso suporte técnico:{" "}
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
