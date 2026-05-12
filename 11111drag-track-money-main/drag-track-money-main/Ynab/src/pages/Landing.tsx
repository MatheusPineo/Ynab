import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  Wallet,
  Globe2,
  HandCoins,
  CreditCard,
  Target,
  EyeOff,
  Check,
  Sparkles,
  ArrowRight,
  Menu,
  X,
  Fingerprint,
  Coins,
  Apple,
  Play,
  Monitor,
  Smartphone,
} from "lucide-react";

const features = [
  {
    icon: Wallet,
    title: "Orçamento Base-Zero",
    desc: "Dê uma função para cada centavo e nunca mais se pergunte para onde seu dinheiro foi.",
  },
  {
    icon: Globe2,
    title: "Global e Multilíngue",
    desc: "Suporte em tempo real para mais de 160 moedas do mundo e tradução nativa para 12 idiomas.",
  },
  {
    icon: HandCoins,
    title: "Controle de Dívidas",
    desc: "Acompanhe exatamente quem te deve e o que você deve a terceiros, com histórico de pagamentos.",
  },
  {
    icon: CreditCard,
    title: "Contas e Cartões",
    desc: "Gerencie todas as suas contas bancárias, saldos e limites de cartões de crédito em um só lugar.",
  },
  {
    icon: Target,
    title: "Metas Financeiras",
    desc: "Crie objetivos, acompanhe barras de progresso visuais e alcance seus maiores sonhos.",
  },
  {
    icon: EyeOff,
    title: "Modo Privado",
    desc: "Oculte todos os seus saldos com um único clique para usar o sistema em ambientes públicos com segurança.",
  },
];

const faqs = [
  {
    q: "Posso cancelar a qualquer momento?",
    a: "Sim. Você pode cancelar sua assinatura quando quiser, sem multa e sem perguntas.",
  },
  {
    q: "Meus dados financeiros estão seguros?",
    a: "Usamos criptografia de ponta a ponta, autenticação biométrica e nunca vendemos seus dados.",
  },
  {
    q: "O Vault Finance OS funciona fora do Brasil?",
    a: "Sim. Suportamos mais de 160 moedas e 12 idiomas — você pode usar de qualquer lugar do mundo.",
  },
  {
    q: "Existe uma versão gratuita de verdade?",
    a: "Sim. O plano Free é gratuito para sempre, ideal para quem está começando a se organizar.",
  },
];

export default function Landing() {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [menuOpen, setMenuOpen] = useState(false);

  // Allow page scroll on landing (index.css sets overflow-hidden globally)
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    const prevHtmlH = html.style.height;
    const prevBodyH = body.style.height;
    html.style.overflow = "auto";
    body.style.overflow = "auto";
    html.style.height = "auto";
    body.style.height = "auto";
    html.classList.add("dark");
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
      html.style.height = prevHtmlH;
      body.style.height = prevBodyH;
    };
  }, []);

  const proPrice = annual ? "R$ 15,83" : "R$ 19,90";
  const proSuffix = annual ? "/mês • cobrado R$ 190/ano" : "/mês";

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#09090b] text-zinc-100 antialiased font-sans selection:bg-emerald-500/30 selection:text-emerald-100">
      {/* Ambient background glows */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-emerald-500/20 blur-[140px]" />
        <div className="absolute top-[40%] -right-40 h-[500px] w-[500px] rounded-full bg-emerald-600/10 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            maskImage:
              "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          }}
        />
      </div>

      {/* NAVBAR */}
      <header className="fixed top-4 left-1/2 z-50 w-[95%] max-w-6xl -translate-x-1/2">
        <nav className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-[0_4px_30px_rgba(0,0,0,0.3)] backdrop-blur-xl sm:px-6">
          <a href="#top" className="flex items-center gap-2 group">
            <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-transform group-hover:scale-105">
              <Shield className="h-5 w-5 text-zinc-950" strokeWidth={2.5} />
            </div>
            <span className="text-base font-semibold tracking-tight">
              Vault <span className="text-emerald-400">Finance OS</span>
            </span>
          </a>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-zinc-400 transition-colors hover:text-white">Funcionalidades</a>
            <a href="#pricing" className="text-sm text-zinc-400 transition-colors hover:text-white">Preços</a>
            <a href="#faq" className="text-sm text-zinc-400 transition-colors hover:text-white">FAQ</a>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <Link
              to="/auth"
              className="rounded-lg px-4 py-2 text-sm text-zinc-300 transition-colors hover:text-white"
            >
              Entrar
            </Link>
            <Link
              to="/auth"
              className="group relative rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 transition-all hover:scale-[1.03] hover:bg-emerald-400 hover:shadow-[0_0_25px_rgba(16,185,129,0.6)]"
            >
              Começar Grátis
            </Link>
          </div>

          <button
            className="md:hidden rounded-lg p-2 text-zinc-300 hover:bg-white/5"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        {menuOpen && (
          <div className="mt-2 rounded-2xl border border-white/10 bg-zinc-950/90 p-4 backdrop-blur-xl md:hidden">
            <div className="flex flex-col gap-1">
              <a onClick={() => setMenuOpen(false)} href="#features" className="rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-white/5">Funcionalidades</a>
              <a onClick={() => setMenuOpen(false)} href="#pricing" className="rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-white/5">Preços</a>
              <a onClick={() => setMenuOpen(false)} href="#faq" className="rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-white/5">FAQ</a>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Link to="/auth" className="rounded-lg border border-white/10 px-3 py-2 text-center text-sm text-zinc-200">Entrar</Link>
                <Link to="/auth" className="rounded-lg bg-emerald-500 px-3 py-2 text-center text-sm font-medium text-zinc-950">Começar Grátis</Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section id="top" className="relative px-4 pt-36 pb-24 sm:pt-44 sm:pb-32">
        <div className="mx-auto max-w-6xl text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-zinc-300 backdrop-blur-xl">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            Novo: gestão multimoedas em tempo real
          </div>

          <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
            O Sistema Operacional{" "}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-500 bg-clip-text text-transparent">
                Definitivo
              </span>
              <span className="absolute inset-0 -z-10 blur-2xl bg-emerald-500/30" />
            </span>{" "}
            para o Seu Dinheiro.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base text-zinc-400 sm:text-lg">
            Assuma o controle total da sua vida financeira com orçamento inteligente,
            gestão de dívidas e suporte global a múltiplas moedas. Sem planilhas chatas,
            apenas resultados.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/auth"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-semibold text-zinc-950 shadow-[0_0_40px_rgba(16,185,129,0.45)] transition-all hover:scale-[1.03] hover:bg-emerald-400 hover:shadow-[0_0_60px_rgba(16,185,129,0.7)]"
            >
              Criar Conta Grátis
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-semibold text-zinc-100 backdrop-blur-xl transition-all hover:scale-[1.03] hover:bg-white/10"
            >
              Ver Demonstração
            </a>
          </div>

          {/* Platform availability badges */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
            <a href="#" className="group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-200 backdrop-blur-xl transition-all hover:scale-[1.04] hover:border-emerald-500/30 hover:bg-white/10">
              <Apple className="h-4 w-4 text-zinc-100" />
              <span className="flex flex-col leading-tight text-left">
                <span className="text-[10px] text-zinc-500">Baixe na</span>
                <span>App Store</span>
              </span>
            </a>
            <a href="#" className="group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-200 backdrop-blur-xl transition-all hover:scale-[1.04] hover:border-emerald-500/30 hover:bg-white/10">
              <Play className="h-4 w-4 text-zinc-100" />
              <span className="flex flex-col leading-tight text-left">
                <span className="text-[10px] text-zinc-500">Disponível no</span>
                <span>Google Play</span>
              </span>
            </a>
            <a href="#" className="group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-200 backdrop-blur-xl transition-all hover:scale-[1.04] hover:border-emerald-500/30 hover:bg-white/10">
              <Monitor className="h-4 w-4 text-zinc-100" />
              <span className="flex flex-col leading-tight text-left">
                <span className="text-[10px] text-zinc-500">Acesse o</span>
                <span>Web App</span>
              </span>
            </a>
          </div>

          {/* Multi-device mockups: Laptop + Phone */}
          <div className="relative mx-auto mt-20 max-w-5xl">
            {/* Radial emerald glow behind devices */}
            <div className="absolute inset-x-0 -top-10 -bottom-10 -z-10 mx-auto h-[120%] w-[90%] rounded-full bg-emerald-500/25 blur-[120px]" />
            <div className="absolute left-1/2 top-1/2 -z-10 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/20 blur-[100px]" />

            {/* Floating badges */}
            <div className="absolute -left-2 top-10 hidden animate-float-slow rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:flex items-center gap-2 z-20">
              <Coins className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-medium">+160 Moedas</span>
            </div>
            <div className="absolute -right-2 top-32 hidden animate-float rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:flex items-center gap-2 z-20">
              <Fingerprint className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-medium">Segurança Biométrica</span>
            </div>

            {/* LAPTOP */}
            <div className="relative mx-auto w-full max-w-4xl animate-float">
              {/* Screen bezel */}
              <div className="overflow-hidden rounded-[18px] border border-white/10 bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 p-2 shadow-[0_30px_80px_rgba(0,0,0,0.6)] backdrop-blur-xl">
                <div className="rounded-[10px] bg-zinc-950/95 p-4 sm:p-6">
                  {/* Browser chrome */}
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                      <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
                      <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                    </div>
                    <span className="text-xs text-zinc-500">vault.app/dashboard</span>
                    <div className="w-12" />
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-3 text-left sm:grid-cols-3">
                    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                      <p className="text-xs text-zinc-500">Patrimônio Líquido</p>
                      <p className="mt-2 text-xl font-semibold tabular-nums sm:text-2xl">R$ 84.230,50</p>
                      <p className="mt-1 text-xs text-emerald-400">↗ +12,4% no mês</p>
                    </div>
                    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                      <p className="text-xs text-zinc-500">Receita</p>
                      <p className="mt-2 text-xl font-semibold tabular-nums sm:text-2xl">R$ 12.500</p>
                      <p className="mt-1 text-xs text-zinc-500">8 categorias</p>
                    </div>
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-4">
                      <p className="text-xs text-emerald-300/80">Meta: Casa nova</p>
                      <p className="mt-2 text-xl font-semibold tabular-nums sm:text-2xl">68%</p>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
                        <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid h-28 grid-cols-12 items-end gap-2 sm:h-32 sm:gap-3">
                    {[40, 65, 50, 80, 60, 90, 75, 95, 70, 85, 55, 78].map((h, i) => (
                      <div
                        key={i}
                        className="rounded-t-md bg-gradient-to-t from-emerald-500/20 to-emerald-400/80"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              {/* Laptop base */}
              <div className="mx-auto h-3 w-[105%] -translate-x-[2.5%] rounded-b-2xl bg-gradient-to-b from-zinc-800 to-zinc-900 shadow-[0_10px_30px_rgba(0,0,0,0.5)]" />
              <div className="mx-auto h-1 w-[40%] rounded-b-xl bg-zinc-950/80" />
            </div>

            {/* PHONE - overlapping front-right, levitating */}
            <div className="absolute -bottom-10 right-2 z-30 w-[150px] animate-float-slow sm:right-8 sm:-bottom-16 sm:w-[200px]">
              <div className="relative overflow-hidden rounded-[32px] border border-white/15 bg-gradient-to-br from-zinc-900 to-zinc-950 p-1.5 shadow-[0_25px_60px_rgba(0,0,0,0.7),0_0_60px_rgba(16,185,129,0.25)] backdrop-blur-xl">
                {/* Phone notch */}
                <div className="absolute left-1/2 top-2 z-10 h-4 w-16 -translate-x-1/2 rounded-full bg-zinc-950" />
                <div className="rounded-[26px] bg-zinc-950 p-3 pt-7">
                  {/* Status bar */}
                  <div className="flex items-center justify-between text-[8px] text-zinc-500">
                    <span>9:41</span>
                    <span>•••</span>
                  </div>

                  {/* Balance card */}
                  <div className="mt-2 rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/15 to-emerald-600/5 p-3">
                    <p className="text-[8px] text-emerald-300/80">Saldo total</p>
                    <p className="mt-1 text-sm font-semibold tabular-nums text-white sm:text-base">R$ 12.480</p>
                    <div className="mt-2 flex h-10 items-end gap-0.5">
                      {[30, 55, 40, 70, 50, 85, 65, 90].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-sm bg-gradient-to-t from-emerald-500/30 to-emerald-400"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* List items */}
                  <div className="mt-2 space-y-1.5">
                    {[
                      { l: "Mercado", v: "-R$ 240" },
                      { l: "Salário", v: "+R$ 5.200", up: true },
                      { l: "Netflix", v: "-R$ 39" },
                    ].map((it) => (
                      <div key={it.l} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.03] px-2 py-1.5">
                        <span className="text-[9px] text-zinc-400">{it.l}</span>
                        <span className={`text-[9px] font-medium tabular-nums ${it.up ? "text-emerald-400" : "text-zinc-300"}`}>{it.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CROSS-PLATFORM TRUST BANNER */}
      <section className="relative px-4 pt-16 pb-4 sm:pt-24">
        <div className="mx-auto max-w-5xl rounded-2xl border border-white/10 bg-white/5 px-6 py-8 backdrop-blur-xl">
          <p className="text-center text-sm text-zinc-300 sm:text-base">
            Disponível e sincronizado em tempo real para todos os seus dispositivos.
          </p>
          <div className="mt-6 flex items-center justify-center gap-10 sm:gap-16">
            <div className="flex flex-col items-center gap-2 text-zinc-400 transition-colors hover:text-emerald-400">
              <Apple className="h-7 w-7" />
              <span className="text-[11px] uppercase tracking-wider">iOS</span>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <div className="flex flex-col items-center gap-2 text-zinc-400 transition-colors hover:text-emerald-400">
              <Smartphone className="h-7 w-7" />
              <span className="text-[11px] uppercase tracking-wider">Android</span>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <div className="flex flex-col items-center gap-2 text-zinc-400 transition-colors hover:text-emerald-400">
              <Monitor className="h-7 w-7" />
              <span className="text-[11px] uppercase tracking-wider">Web</span>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="relative px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium text-emerald-400">Funcionalidades</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
              Tudo o que você precisa, em um só lugar.
            </h2>
            <p className="mt-4 text-zinc-400">
              Ferramentas pensadas para quem leva a saúde financeira a sério.
            </p>
          </div>

          <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:border-emerald-500/30 hover:bg-white/[0.07] hover:shadow-[0_0_40px_rgba(16,185,129,0.15)]"
              >
                <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-emerald-500/0 blur-3xl transition-all duration-500 group-hover:bg-emerald-500/20" />
                <div className="relative">
                  <div className="grid h-11 w-11 place-items-center rounded-xl border border-emerald-500/20 bg-emerald-500/10">
                    <Icon className="h-5 w-5 text-emerald-400" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="relative px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium text-emerald-400">Preços</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
              Simples, transparente e justo.
            </h2>
            <p className="mt-4 text-zinc-400">
              Comece de graça. Faça o upgrade quando quiser controle total.
            </p>

            {/* Toggle */}
            <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 p-1.5 backdrop-blur-xl">
              <button
                onClick={() => setAnnual(false)}
                className={`rounded-full px-5 py-2 text-sm transition-all ${
                  !annual ? "bg-emerald-500 text-zinc-950 shadow-[0_0_20px_rgba(16,185,129,0.45)]" : "text-zinc-400 hover:text-white"
                }`}
              >
                Mensal
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`rounded-full px-5 py-2 text-sm transition-all ${
                  annual ? "bg-emerald-500 text-zinc-950 shadow-[0_0_20px_rgba(16,185,129,0.45)]" : "text-zinc-400 hover:text-white"
                }`}
              >
                Anual
              </button>
            </div>
            <div className="mt-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                <Sparkles className="h-3 w-3" />
                Economize 20% no Anual
              </span>
            </div>
          </div>

          <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
            {/* FREE */}
            <div className="relative rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl transition-all hover:scale-[1.01] hover:bg-white/[0.07]">
              <h3 className="text-sm font-medium text-zinc-400">Iniciante</h3>
              <p className="mt-1 text-xl font-semibold">Plano Free</p>
              <p className="mt-4 flex items-baseline gap-1">
                <span className="text-5xl font-semibold tracking-tight">R$ 0</span>
                <span className="text-zinc-500">/mês</span>
              </p>
              <p className="mt-2 text-sm text-zinc-500">Para quem está começando a se organizar.</p>

              <Link
                to="/auth"
                className="mt-8 block w-full rounded-xl border border-white/15 bg-white/5 py-3 text-center text-sm font-medium text-white transition-all hover:scale-[1.02] hover:bg-white/10"
              >
                Começar de Graça
              </Link>

              <ul className="mt-8 space-y-3 text-sm">
                {[
                  "Até 50 lançamentos mensais",
                  "2 contas bancárias",
                  "1 meta financeira",
                  "Suporte da comunidade",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-zinc-300">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* PRO */}
            <div className="relative rounded-2xl border border-emerald-500/50 bg-gradient-to-b from-emerald-500/10 to-white/[0.02] p-8 backdrop-blur-xl shadow-[0_0_60px_rgba(16,185,129,0.25)] transition-all hover:scale-[1.02]">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-zinc-950 shadow-[0_0_20px_rgba(16,185,129,0.6)]">
                  <Sparkles className="h-3 w-3" />
                  Mais Popular
                </span>
              </div>

              <h3 className="text-sm font-medium text-emerald-300">Controle Total</h3>
              <p className="mt-1 text-xl font-semibold">Plano Pro</p>
              <p className="mt-4 flex items-baseline gap-1">
                <span className="text-5xl font-semibold tracking-tight">{proPrice}</span>
                <span className="text-zinc-500">{proSuffix}</span>
              </p>
              <p className="mt-2 text-sm text-zinc-400">Tudo que você precisa para dominar suas finanças.</p>

              <Link
                to="/auth"
                className="mt-8 block w-full rounded-xl bg-emerald-500 py-3 text-center text-sm font-semibold text-zinc-950 shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all hover:scale-[1.02] hover:bg-emerald-400 hover:shadow-[0_0_50px_rgba(16,185,129,0.7)]"
              >
                Assinar o Pro
              </Link>

              <ul className="mt-8 space-y-3 text-sm">
                {[
                  "Lançamentos ilimitados",
                  "Contas e cartões ilimitados",
                  "Metas ilimitadas",
                  "Acesso às 160+ moedas globais",
                  "Proteção com Biometria",
                  "Suporte Prioritário",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-zinc-200">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative px-4 py-24">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <p className="text-sm font-medium text-emerald-400">FAQ</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Perguntas frequentes
            </h2>
          </div>

          <div className="mt-12 space-y-3">
            {faqs.map((f, i) => (
              <button
                key={f.q}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="block w-full rounded-2xl border border-white/10 bg-white/5 p-5 text-left backdrop-blur-xl transition-all hover:border-emerald-500/30"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium text-white">{f.q}</span>
                  <span className={`grid h-6 w-6 place-items-center rounded-full border border-white/10 text-emerald-400 transition-transform ${openFaq === i ? "rotate-45" : ""}`}>
                    +
                  </span>
                </div>
                {openFaq === i && (
                  <p className="mt-3 text-sm leading-relaxed text-zinc-400">{f.a}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative px-4 py-24">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-zinc-950 via-emerald-950/40 to-zinc-950 p-10 text-center shadow-[0_0_80px_rgba(16,185,129,0.2)] sm:p-16">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.25),transparent_60%)]" />
          <h2 className="mx-auto max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
            Pronto para mudar sua relação com o dinheiro?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-zinc-400">
            Junte-se a milhares de pessoas que conquistaram clareza financeira com o Vault Finance OS.
          </p>
          <div className="mt-10">
            <Link
              to="/auth"
              className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-8 py-5 text-base font-semibold text-zinc-950 shadow-[0_0_60px_rgba(16,185,129,0.6)] transition-all hover:scale-[1.04] hover:bg-emerald-400 hover:shadow-[0_0_80px_rgba(16,185,129,0.85)] sm:px-12 sm:py-6 sm:text-lg"
            >
              Criar minha conta grátis
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <p className="mt-4 text-xs text-zinc-500">Sem cartão de crédito • Cancele quando quiser</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 px-4 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-zinc-500 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600">
              <Shield className="h-4 w-4 text-zinc-950" strokeWidth={2.5} />
            </div>
            <span className="text-zinc-300">Vault Finance OS</span>
          </div>
          <p>© {new Date().getFullYear()} Vault Finance OS. Todos os direitos reservados.</p>
        </div>
      </footer>

      {/* Local animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
