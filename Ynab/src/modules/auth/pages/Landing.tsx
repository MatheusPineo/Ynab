import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import packageJson from "../../../../package.json";
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
  ChevronDown,
} from "lucide-react";

const footerTranslations: Record<string, Record<string, string>> = {
  "pt-BR": {
    slogan: "O ecossistema definitivo para planejamento financeiro, orçamentos base-zero e inteligência patrimonial corporativa global.",
    product: "Produto",
    features: "Funcionalidades",
    pricing: "Preços e Planos",
    access_web: "Acessar Web App",
    download_mobile: "Download App Móvel",
    legal: "Legal & Compliance",
    terms: "Termos de Uso",
    privacy: "Política de Privacidade",
    cookies: "Política de Cookies",
    sla: "SLA de Disponibilidade",
    support: "Suporte e DPO",
    dpo: "Encarregado de Dados (DPO)",
    faq: "Perguntas Frequentes (FAQ)",
    secure_channel: "Canal de Segurança Integrado"
  },
  en: {
    slogan: "The ultimate ecosystem for financial planning, zero-based budgeting, and global corporate wealth intelligence.",
    product: "Product",
    features: "Features",
    pricing: "Pricing & Plans",
    access_web: "Access Web App",
    download_mobile: "Download Mobile App",
    legal: "Legal & Compliance",
    terms: "Terms of Use",
    privacy: "Privacy Policy",
    cookies: "Cookie Policy",
    sla: "Availability SLA",
    support: "Support & DPO",
    dpo: "Data Protection Officer (DPO)",
    faq: "Frequently Asked Questions (FAQ)",
    secure_channel: "Integrated Security Channel"
  },
  es: {
    slogan: "El ecosistema definitivo para la planificación financiera, presupuestos de base cero e inteligencia patrimonial corporativa global.",
    product: "Producto",
    features: "Funcionalidades",
    pricing: "Precios y Planes",
    access_web: "Acceder Web App",
    download_mobile: "Descargar App Móvil",
    legal: "Legal y Cumplimiento",
    terms: "Términos de Uso",
    privacy: "Política de Privacidad",
    cookies: "Política de Cookies",
    sla: "SLA de Disponibilidad",
    support: "Soporte y DPO",
    dpo: "Delegado de Protección de Datos (DPO)",
    faq: "Preguntas Frecuentes (FAQ)",
    secure_channel: "Canal de Seguridad Integrado"
  },
  fr: {
    slogan: "L'écosystème ultime pour la planification financière, la budgétisation base zéro et l'intelligence patrimoniale d'entreprise globale.",
    product: "Produit",
    features: "Fonctionnalités",
    pricing: "Tarifs et Plans",
    access_web: "Accéder à l'application Web",
    download_mobile: "Télécharger l'application mobile",
    legal: "Légal et Conformité",
    terms: "Conditions d'Utilisation",
    privacy: "Politique de Confidentialité",
    cookies: "Politique relative aux Cookies",
    sla: "SLA de Disponibilité",
    support: "Support et DPO",
    dpo: "Délégué à la Protection des Données (DPO)",
    faq: "Questions Fréquentes (FAQ)",
    secure_channel: "Canal de Sécurité Intégré"
  },
  de: {
    slogan: "Das ultimative Ökosystem für Finanzplanung, Nullbasis-Budgetierung und globale Vermögensintelligenz für Unternehmen.",
    product: "Produkt",
    features: "Funktionen",
    pricing: "Preise & Pläne",
    access_web: "Web-App öffnen",
    download_mobile: "Mobile App herunterladen",
    legal: "Rechtliches & Compliance",
    terms: "Nutzungsbedingungen",
    privacy: "Datenschutzerklärung",
    cookies: "Cookie-Richtlinie",
    sla: "Verfügbarkeits-SLA",
    support: "Support & DPO",
    dpo: "Datenschutzbeauftragter (DPO)",
    faq: "Häufig gestellte Fragen (FAQ)",
    secure_channel: "Integrierter Sicherheitskanal"
  },
  it: {
    slogan: "L'ecosistema definitivo per la pianificazione finanziaria, il budget a base zero e l'intelligence patrimoniale aziendale globale.",
    product: "Prodotto",
    features: "Funzionalità",
    pricing: "Prezzi e Piani",
    access_web: "Accedi all'App Web",
    download_mobile: "Scarica l'App Mobile",
    legal: "Legale e Conformità",
    terms: "Termini di Utilizzo",
    privacy: "Informativa sulla Privacy",
    cookies: "Informativa sui Cookie",
    sla: "SLA di Disponibilidade",
    support: "Supporto e DPO",
    dpo: "Responsabile della Protezione dei Dati (DPO)",
    faq: "Domande Frequenti (FAQ)",
    secure_channel: "Canale di Sicurezza Integrato"
  },
  nl: {
    slogan: "Het ultieme ecosysteem voor financiële planning, zero-based budgetteren en wereldwijde vermogensintelligentie voor bedrijven.",
    product: "Product",
    features: "Functies",
    pricing: "Prijzen & Plannen",
    access_web: "Open Web App",
    download_mobile: "Download Mobiele App",
    legal: "Juridisch & Compliance",
    terms: "Gebruiksvoorwaarden",
    privacy: "Privacybeleid",
    cookies: "Cookiebeleid",
    sla: "Beschikbaarheid SLA",
    support: "Ondersteuning & DPO",
    dpo: "Functionaris voor Gegevensbescherming (DPO)",
    faq: "Veelgestelde Vragen (FAQ)",
    secure_channel: "Geïntegreerd Beveiligingskanaal"
  },
  pl: {
    slogan: "Najlepszy ekosystem do planowania finansowego, budżetowania zerowego i globalnej analizy majątku korporacyjnego.",
    product: "Produkt",
    features: "Funkcje",
    pricing: "Ceny i Plany",
    access_web: "Dostęp do Web App",
    download_mobile: "Pobierz Aplikację Mobilną",
    legal: "Kwestie Prawne i Zgodność",
    terms: "Warunki Korzystania",
    privacy: "Polityka Prywatności",
    cookies: "Polityka Cookies",
    sla: "SLA Dostępności",
    support: "Wsparcie i DPO",
    dpo: "Inspektor Ochrony Danych (DPO)",
    faq: "Najczęściej Zadawane Pytania (FAQ)",
    secure_channel: "Zintegrowany Kanał Bezpieczeństwa"
  },
  ar: {
    slogan: "النظام البيئي النهائي للتخطيط المالي، والميزانية الصفرية، وذكاء الثروة المؤسسية العالمية.",
    product: "المنتج",
    features: "الميزات",
    pricing: "الأسعار والخطط",
    access_web: "الدخول إلى تطبيق الويب",
    download_mobile: "تحميل تطبيق الهاتف",
    legal: "القانون والامتثال",
    terms: "شروط الاستخدام",
    privacy: "سياسة الخصوصية",
    cookies: "سياسة ملفات تعريف الارتباط",
    sla: "اتفاقية مستوى الخدمة للإتاحة",
    support: "الدعم والمسؤول عن حماية البيانات",
    dpo: "مسؤول حماية البيانات (DPO)",
    faq: "الأسئلة الشائعة",
    secure_channel: "قناة أمنية متكاملة"
  },
  ja: {
    slogan: "財務計画、ゼロベースの予算管理、およびグローバルな企業資産インテリジェンスのための究極のエコシステム。",
    product: "製品",
    features: "機能",
    pricing: "料金とプラン",
    access_web: "ウェブアプリにアクセス",
    download_mobile: "モバイルアプリをダウンロード",
    legal: "法的情報とコンプライアンス",
    terms: "利用規約",
    privacy: "プライバシーポリシー",
    cookies: "クッキーポリシー",
    sla: "可用性SLA",
    support: "サポートとDPO",
    dpo: "データ保護オフィサー (DPO)",
    faq: "よくある質問 (FAQ)",
    secure_channel: "統合セキュリティチャネル"
  },
  zh: {
    slogan: "财务规划、零基预算和全球企业财富智能的终极生态系统。",
    product: "产品",
    features: "功能",
    pricing: "价格与方案",
    access_web: "访问网页应用",
    download_mobile: "下载移动应用",
    legal: "法律与合规",
    terms: "使用条款",
    privacy: "隐私政策",
    cookies: "Cookie 政策",
    sla: "可用性 SLA",
    support: "支持与 DPO",
    dpo: "数据保护官 (DPO)",
    faq: "常见问题 (FAQ)",
    secure_channel: "集成安全通道"
  },
  hi: {
    slogan: "वित्तीय नियोजन, शून्य-आधारित बजट, और वैश्विक कॉर्पोरेट धन खुफिया के लिए अंतिम पारिस्थितिकी तंत्र।",
    product: "उत्पाद",
    features: "विशेषताएं",
    pricing: "मूल्य निर्धारण और योजनाएं",
    access_web: "वेब ऐप एक्सेस करें",
    download_mobile: "मोबाइल ऐप डाउनलोड करें",
    legal: "कानूनी और अनुपालन",
    terms: "उपयोग की शर्तें",
    privacy: "गोपनीयता नीति",
    cookies: "कुकी नीति",
    sla: "उपलब्धता एसएलए",
    support: "सहायता और डीपीओ",
    dpo: "डेटा सुरक्षा अधिकारी (DPO)",
    faq: "अक्सर पूछे जाने वाले प्रश्न (FAQ)",
    secure_channel: "एकीकृत सुरक्षा चैनल"
  }
};

const getFooterText = (key: string, language: string) => {
  let langKey = language || "en";
  if (langKey.startsWith("pt")) langKey = "pt-BR";
  if (!footerTranslations[langKey]) langKey = "en";
  return footerTranslations[langKey][key] || footerTranslations["en"][key] || "";
};

export default function Landing() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || "en";
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: "pt-BR", label: "Português" },
    { code: "en", label: "English" },
    { code: "es", label: "Español" },
    { code: "de", label: "Deutsch" },
    { code: "fr", label: "Français" },
    { code: "it", label: "Italiano" },
    { code: "nl", label: "Nederlands" },
    { code: "pl", label: "Polski" },
    { code: "zh", label: "简体中文" },
    { code: "ja", label: "日本語" },
    { code: "ar", label: "العربية" },
    { code: "hi", label: "हिन्दी" },
  ];

  const currentLanguageLabel = languages.find(l => l.code === i18n.language)?.label || "Português";

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setLangDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const features = [
    {
      icon: Wallet,
      title: t("landing.feature_budget_title"),
      desc: t("landing.feature_budget_desc"),
    },
    {
      icon: Globe2,
      title: t("landing.feature_global_title"),
      desc: t("landing.feature_global_desc"),
    },
    {
      icon: HandCoins,
      title: t("landing.feature_debts_title"),
      desc: t("landing.feature_debts_desc"),
    },
    {
      icon: CreditCard,
      title: t("landing.feature_accounts_title"),
      desc: t("landing.feature_accounts_desc"),
    },
    {
      icon: Target,
      title: t("landing.feature_goals_title"),
      desc: t("landing.feature_goals_desc"),
    },
    {
      icon: EyeOff,
      title: t("landing.feature_privacy_title"),
      desc: t("landing.feature_privacy_desc"),
    },
  ];

  const faqs = [
    {
      q: t("landing.faq_q1"),
      a: t("landing.faq_a1"),
    },
    {
      q: t("landing.faq_q2"),
      a: t("landing.faq_a2"),
    },
    {
      q: t("landing.faq_q3"),
      a: t("landing.faq_a3"),
    },
    {
      q: t("landing.faq_q4"),
      a: t("landing.faq_a4"),
    },
  ];

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
            <a href="#features" className="text-sm text-zinc-400 transition-colors hover:text-white">{t("landing.nav_features")}</a>
            <a href="#pricing" className="text-sm text-zinc-400 transition-colors hover:text-white">{t("landing.nav_pricing")}</a>
            <a href="#faq" className="text-sm text-zinc-400 transition-colors hover:text-white">{t("landing.nav_faq")}</a>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            {/* Custom Premium Language Dropdown */}
            <div ref={dropdownRef} className="relative mr-2">
              <button
                type="button"
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-all hover:bg-white/10 hover:border-white/20"
              >
                <Globe2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>{currentLanguageLabel}</span>
                <ChevronDown className={`h-3 w-3 text-zinc-500 transition-transform duration-200 ${langDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 max-h-[220px] w-40 overflow-y-auto rounded-xl border border-white/10 bg-zinc-950/95 p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200 scrollbar-thin scrollbar-thumb-white/10">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        i18n.changeLanguage(lang.code);
                        localStorage.setItem("vault_lang_explicit", "true");
                        setLangDropdownOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                        i18n.language === lang.code
                          ? "bg-emerald-500/10 text-emerald-400 font-semibold"
                          : "text-zinc-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span>{lang.label}</span>
                      {i18n.language === lang.code && <Check className="h-3 w-3" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Link
              to="/auth"
              className="rounded-lg px-4 py-2 text-sm text-zinc-300 transition-colors hover:text-white"
            >
              {t("landing.nav_login")}
            </Link>
            <Link
              to="/auth"
              className="group relative rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 transition-all hover:scale-[1.03] hover:bg-emerald-400 hover:shadow-[0_0_25px_rgba(16,185,129,0.6)]"
            >
              {t("landing.nav_start_free")}
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
              <a onClick={() => setMenuOpen(false)} href="#features" className="rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-white/5">{t("landing.nav_features")}</a>
              <a onClick={() => setMenuOpen(false)} href="#pricing" className="rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-white/5">{t("landing.nav_pricing")}</a>
              <a onClick={() => setMenuOpen(false)} href="#faq" className="rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-white/5">{t("landing.nav_faq")}</a>
              <div className="my-3 border-t border-white/5 pt-3">
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1.5">
                  <Globe2 className="h-3.5 w-3.5 text-emerald-400" />
                  {t("landing.nav_language", "Idioma")}
                </p>
                <div className="grid grid-cols-2 gap-1 px-3 py-1 max-h-[160px] overflow-y-auto scrollbar-thin">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        i18n.changeLanguage(lang.code);
                        localStorage.setItem("vault_lang_explicit", "true");
                      }}
                      className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                        i18n.language === lang.code
                          ? "bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/15"
                          : "bg-white/5 text-zinc-400 border border-transparent hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span>{lang.label}</span>
                      {i18n.language === lang.code && <Check className="h-3 w-3" />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Link to="/auth" className="rounded-lg border border-white/10 px-3 py-2 text-center text-sm text-zinc-200" onClick={() => setMenuOpen(false)}>{t("landing.nav_login")}</Link>
                <Link to="/auth" className="rounded-lg bg-emerald-500 px-3 py-2 text-center text-sm font-medium text-zinc-950" onClick={() => setMenuOpen(false)}>{t("landing.nav_start_free")}</Link>
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
            {t("landing.hero_badge")}
          </div>

          <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
            {t("landing.hero_title_part1")}{" "}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-500 bg-clip-text text-transparent">
                {t("landing.hero_title_highlight")}
              </span>
              <span className="absolute inset-0 -z-10 blur-2xl bg-emerald-500/30" />
            </span>{" "}
            {t("landing.hero_title_part2")}
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base text-zinc-400 sm:text-lg">
            {t("landing.hero_subtitle")}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/auth"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-semibold text-zinc-950 shadow-[0_0_40px_rgba(16,185,129,0.45)] transition-all hover:scale-[1.03] hover:bg-emerald-400 hover:shadow-[0_0_60px_rgba(16,185,129,0.7)]"
            >
              {t("landing.hero_create_account")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-semibold text-zinc-100 backdrop-blur-xl transition-all hover:scale-[1.03] hover:bg-white/10"
            >
              {t("landing.hero_demo")}
            </a>
          </div>

          {/* Platform availability badges */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
            <a href="#" className="group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-200 backdrop-blur-xl transition-all hover:scale-[1.04] hover:border-emerald-500/30 hover:bg-white/10">
              <svg className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 384 512" fill="url(#apple-grad-hero)">
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-48.7-19.1-77.5-19.1-37.9 0-77.5 21.4-97.5 56.2-40.4 70.3-10.4 174.4 29 230.1 19.4 27.9 42.4 58.4 72.8 57.2 29.1-1.1 40.2-18.7 75.3-18.7 35 0 45.1 18.7 75.3 18.1 30.8-.5 50.8-27.9 69.8-55.5 22.1-32.1 31.1-63.1 31.5-64.7-.6-.2-61.1-23.4-61.5-93.5zM279.1 76.2c16.1-19.5 26.9-46.7 23.9-73.8-23.3 1-51.4 15.5-68.1 34.9-14.9 17-28 44.5-24.3 71 25.9 2 52.4-12.6 68.5-32.1z" />
                <defs>
                  <linearGradient id="apple-grad-hero" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="flex flex-col leading-tight text-left">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">{t("landing.download_on")}</span>
                <span className="font-bold">App Store</span>
              </span>
            </a>
            <a href="#" className="group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-200 backdrop-blur-xl transition-all hover:scale-[1.04] hover:border-emerald-500/30 hover:bg-white/10">
              <svg className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 512 512" fill="url(#play-grad-hero)">
                <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z" />
                <defs>
                  <linearGradient id="play-grad-hero" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#047857" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="flex flex-col leading-tight text-left">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">{t("landing.get_it_on")}</span>
                <span className="font-bold">Google Play</span>
              </span>
            </a>
            <a href="#" className="group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-200 backdrop-blur-xl transition-all hover:scale-[1.04] hover:border-emerald-500/30 hover:bg-white/10">
              <svg className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 512 512" fill="url(#web-grad-hero)">
                <path d="M336.5 160C322 70.7 287.8 8 248 8s-74 62.7-88.5 152h177zM152 256c0 22.2 1.2 43.5 3.3 64h185.3c2.1-20.5 3.3-41.8 3.3-64s-1.2-43.5-3.3-64H155.3c-2.1 20.5-3.3 41.8-3.3 64zm324.7-96c-28.6-67.9-86.5-120.4-158-141.6 24.4 33.8 41.2 84.7 50 141.6h108zM177.2 18.4C105.8 39.6 47.8 92.1 19.3 160h108c8.7-56.9 25.5-107.8 49.9-141.6zM487.4 192H372.7c2.1 21 3.3 42.5 3.3 64s-1.2 43-3.3 64h114.6c5.5-20.5 8.6-41.8 8.6-64s-3.1-43.5-8.5-64zM120 256c0-21.5 1.2-43 3.3-64H8.6C3.2 212.5 0 233.8 0 256s3.2 43.5 8.6 64h114.6c-2-21-3.2-42.5-3.2-64zm39.5 96c14.5 89.3 48.7 152 88.5 152s74-62.7 88.5-152h-177zm159.3 141.6c71.4-21.2 129.4-73.7 158-141.6h-108c-8.8 56.9-25.6 107.8-50 141.6zM19.3 352c28.6 67.9 86.5 120.4 158 141.6-24.4-33.8-41.2-84.7-50-141.6h-108z" />
                <defs>
                  <linearGradient id="web-grad-hero" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#047857" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="flex flex-col leading-tight text-left">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">{t("landing.access_web")}</span>
                <span className="font-bold">Web App</span>
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
              <span className="text-xs font-medium">{t("landing.mockup_currencies")}</span>
            </div>
            <div className="absolute -right-2 top-32 hidden animate-float rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:flex items-center gap-2 z-20">
              <Fingerprint className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-medium">{t("landing.mockup_biometrics")}</span>
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
                      <p className="text-xs text-zinc-500">{t("landing.mockup_net_worth")}</p>
                      <p className="mt-2 text-xl font-semibold tabular-nums sm:text-2xl">R$ 84.230,50</p>
                      <p className="mt-1 text-xs text-emerald-400">{t("landing.mockup_net_worth_trend")}</p>
                    </div>
                    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                      <p className="text-xs text-zinc-500">{t("landing.mockup_income")}</p>
                      <p className="mt-2 text-xl font-semibold tabular-nums sm:text-2xl">R$ 12.500</p>
                      <p className="mt-1 text-xs text-zinc-500">{t("landing.mockup_income_categories")}</p>
                    </div>
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-4">
                      <p className="text-xs text-emerald-300/80">{t("landing.mockup_goal")}</p>
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
                    <p className="text-[8px] text-emerald-300/80">{t("landing.mockup_total_balance")}</p>
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
                      { l: t("landing.mockup_market"), v: "-R$ 240" },
                      { l: t("landing.mockup_salary"), v: "+R$ 5.200", up: true },
                      { l: t("landing.mockup_netflix"), v: "-R$ 39" },
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
            {t("landing.banner_text")}
          </p>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="flex flex-col items-center p-5 rounded-2xl bg-white/[0.02] border border-white/10 text-center transition-all duration-300 hover:bg-white/[0.05] hover:border-emerald-500/20 hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(16,185,129,0.05)]">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400 mb-4 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                <Globe2 className="h-5 w-5" />
              </div>
              <span className="text-sm font-semibold text-zinc-200">{t("landing.banner_sync_title", "Sincronização em Tempo Real")}</span>
              <p className="mt-2 text-xs text-zinc-400 leading-relaxed max-w-[240px]">{t("landing.banner_sync_desc", "Seus lançamentos, metas e saldos atualizados de forma instantânea em todos os seus dispositivos.")}</p>
            </div>
            <div className="flex flex-col items-center p-5 rounded-2xl bg-white/[0.02] border border-white/10 text-center transition-all duration-300 hover:bg-white/[0.05] hover:border-emerald-500/20 hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(16,185,129,0.05)]">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400 mb-4 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                <Shield className="h-5 w-5" />
              </div>
              <span className="text-sm font-semibold text-zinc-200">{t("landing.banner_security_title", "Conexão Segura e Criptografada")}</span>
              <p className="mt-2 text-xs text-zinc-400 leading-relaxed max-w-[240px]">{t("landing.banner_security_desc", "Seus dados trafegam de forma 100% segura via HTTPS com criptografia SSL/TLS de ponta e backups em nuvem.")}</p>
            </div>
            <div className="flex flex-col items-center p-5 rounded-2xl bg-white/[0.02] border border-white/10 text-center transition-all duration-300 hover:bg-white/[0.05] hover:border-emerald-500/20 hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(16,185,129,0.05)]">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400 mb-4 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                <Fingerprint className="h-5 w-5" />
              </div>
              <span className="text-sm font-semibold text-zinc-200">{t("landing.banner_biometrics_title", "Proteção Biométrica")}</span>
              <p className="mt-2 text-xs text-zinc-400 leading-relaxed max-w-[240px]">{t("landing.banner_biometrics_desc", "Mantenha seus saldos e contas protegidos e ocultos a qualquer momento de forma nativa e integrada.")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="relative px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium text-emerald-400">{t("landing.features_label")}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
              {t("landing.features_title")}
            </h2>
            <p className="mt-4 text-zinc-400">
              {t("landing.features_subtitle")}
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
            <p className="text-sm font-medium text-emerald-400">{t("landing.pricing_label")}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
              {t("landing.pricing_title")}
            </h2>
            <p className="mt-4 text-zinc-400">
              {t("landing.pricing_subtitle")}
            </p>

            {/* Toggle */}
            <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 p-1.5 backdrop-blur-xl">
              <button
                onClick={() => setAnnual(false)}
                className={`rounded-full px-5 py-2 text-sm transition-all ${
                  !annual ? "bg-emerald-500 text-zinc-950 shadow-[0_0_20px_rgba(16,185,129,0.45)]" : "text-zinc-400 hover:text-white"
                }`}
              >
                {t("landing.pricing_monthly")}
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`rounded-full px-5 py-2 text-sm transition-all ${
                  annual ? "bg-emerald-500 text-zinc-950 shadow-[0_0_20px_rgba(16,185,129,0.45)]" : "text-zinc-400 hover:text-white"
                }`}
              >
                {t("landing.pricing_annual")}
              </button>
            </div>
            <div className="mt-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                <Sparkles className="h-3 w-3" />
                {t("landing.pricing_save_annual")}
              </span>
            </div>
          </div>

          <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
            {/* FREE */}
            <div className="relative rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl transition-all hover:scale-[1.01] hover:bg-white/[0.07] flex flex-col h-full">
              <div className="min-h-[200px] sm:min-h-[180px] flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-medium text-zinc-400">{t("landing.pricing_free_tier")}</h3>
                  <p className="mt-1 text-xl font-semibold">{t("landing.pricing_free_name")}</p>
                </div>
                <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="text-5xl font-semibold tracking-tight whitespace-nowrap">R$ 0</span>
                  <span className="text-xs sm:text-sm text-zinc-500">{t("landing.pricing_monthly")}</span>
                </div>
                <p className="mt-2 text-sm text-zinc-500">{t("landing.pricing_free_desc")}</p>
              </div>

              <Link
                to="/auth"
                className="mt-8 block w-full rounded-xl border border-white/15 bg-white/5 py-3 text-center text-sm font-medium text-white transition-all hover:scale-[1.02] hover:bg-white/10"
              >
                {t("landing.pricing_free_cta")}
              </Link>

              <ul className="mt-8 space-y-3 text-sm">
                {[
                  t("landing.pricing_free_f1"),
                  t("landing.pricing_free_f2"),
                  t("landing.pricing_free_f3"),
                  t("landing.pricing_free_f4"),
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-zinc-300">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* PRO */}
            <div className="relative rounded-2xl border border-emerald-500/50 bg-gradient-to-b from-emerald-500/10 to-white/[0.02] p-8 backdrop-blur-xl shadow-[0_0_60px_rgba(16,185,129,0.25)] transition-all hover:scale-[1.02] flex flex-col h-full">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-zinc-950 shadow-[0_0_20px_rgba(16,185,129,0.6)]">
                  <Sparkles className="h-3 w-3" />
                  {t("landing.pricing_pro_badge")}
                </span>
              </div>
              <div className="min-h-[200px] sm:min-h-[180px] flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-medium text-emerald-300">{t("landing.pricing_pro_tier")}</h3>
                  <p className="mt-1 text-xl font-semibold">{t("landing.pricing_pro_name")}</p>
                </div>
                <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="text-5xl font-semibold tracking-tight whitespace-nowrap">{proPrice}</span>
                  <span className="text-xs sm:text-sm text-zinc-500">{proSuffix}</span>
                </div>
                <p className="mt-2 text-sm text-zinc-400">{t("landing.pricing_pro_desc")}</p>
              </div>

              <Link
                to="/auth"
                className="mt-8 block w-full rounded-xl bg-emerald-500 py-3 text-center text-sm font-semibold text-zinc-950 shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all hover:scale-[1.02] hover:bg-emerald-400 hover:shadow-[0_0_50px_rgba(16,185,129,0.7)]"
              >
                {t("landing.pricing_pro_cta")}
              </Link>

              <ul className="mt-8 space-y-3 text-sm">
                {[
                  t("landing.pricing_pro_f1"),
                  t("landing.pricing_pro_f2"),
                  t("landing.pricing_pro_f3"),
                  t("landing.pricing_pro_f4"),
                  t("landing.pricing_pro_f5"),
                  t("landing.pricing_pro_f6"),
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
            <p className="text-sm font-medium text-emerald-400">{t("landing.faq_label")}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("landing.faq_title")}
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
                  <span className="grid h-6 w-6 place-items-center rounded-full border border-white/10 text-emerald-400">
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${openFaq === i ? "rotate-180" : ""}`} />
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
            {t("landing.cta_title")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-zinc-400">
            {t("landing.cta_subtitle")}
          </p>
          <div className="mt-10">
            <Link
              to="/auth"
              className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-8 py-5 text-base font-semibold text-zinc-950 shadow-[0_0_60px_rgba(16,185,129,0.6)] transition-all hover:scale-[1.04] hover:bg-emerald-400 hover:shadow-[0_0_80px_rgba(16,185,129,0.85)] sm:px-12 sm:py-6 sm:text-lg"
            >
              {t("landing.cta_button")}
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <p className="mt-4 text-xs text-zinc-500">{t("landing.cta_note")}</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 bg-[#070708] px-4 py-16 text-zinc-400">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-4 sm:grid-cols-2">
            
            {/* Column 1: Brand & Slogan */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center h-5"> {/* Alinhamento com a altura de linha dos h4 nas outras colunas */}
                <Link to="/" className="flex items-center gap-2 group">
                  <div className="relative grid h-6 w-6 place-items-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 transition-transform group-hover:scale-105">
                    <Shield className="h-3.5 w-3.5 text-zinc-950" strokeWidth={2.5} />
                  </div>
                  <span className="text-sm font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                    Vault <span className="text-emerald-400">Finance OS</span>
                  </span>
                </Link>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed mt-1">
                {getFooterText("slogan", lang)}
              </p>
              <div className="text-[10px] text-zinc-600 font-mono space-y-1 mt-1">
                <p>Vault Finance Ltd. — CNPJ: 99.999.999/0001-99</p>
                <p>Av. Paulista, 1000 - Bela Vista, São Paulo/SP</p>
              </div>
            </div>


            {/* Column 2: Product Quick links */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-300">{getFooterText("product", lang)}</h4>
              <ul className="space-y-2 text-xs">
                <li><a href="#features" className="hover:text-emerald-400 transition-colors">{getFooterText("features", lang)}</a></li>
                <li><a href="#pricing" className="hover:text-emerald-400 transition-colors">{getFooterText("pricing", lang)}</a></li>
                <li><Link to="/auth" className="hover:text-emerald-400 transition-colors">{getFooterText("access_web", lang)}</Link></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">{getFooterText("download_mobile", lang)}</a></li>
              </ul>
            </div>

            {/* Column 3: Legal & Compliance */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-300">{getFooterText("legal", lang)}</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link to="/legal" className="hover:text-emerald-400 transition-colors font-semibold text-emerald-400 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {lang === "pt" ? "Central Legal (Legal Center)" : "Legal Center"}
                  </Link>
                </li>
                <li>
                  <Link to="/legal?tab=termos" className="hover:text-emerald-400 transition-colors font-medium">
                    {getFooterText("terms", lang)}
                  </Link>
                </li>
                <li>
                  <Link to="/legal?tab=privacidade" className="hover:text-emerald-400 transition-colors font-medium">
                    {getFooterText("privacy", lang)}
                  </Link>
                </li>
                <li>
                  <Link to="/legal?tab=cookies" className="hover:text-emerald-400 transition-colors font-medium">
                    {getFooterText("cookies", lang)}
                  </Link>
                </li>
                <li>
                  <Link to="/legal?tab=termos" className="hover:text-emerald-400 transition-colors text-zinc-500">
                    {getFooterText("sla", lang)}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Contact & Help */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-300">{getFooterText("support", lang)}</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link to="/help-center" className="hover:text-emerald-400 transition-colors font-semibold text-emerald-400 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {lang === "pt" ? "Central de Ajuda (Help Center)" : "Help Center"}
                  </Link>
                </li>
                <li>
                  <Link to="/help-center?tab=articles" className="hover:text-emerald-400 transition-colors font-medium">
                    {lang === "pt" ? "Artigos de Ajuda e FAQ" : "Help Articles & FAQ"}
                  </Link>
                </li>
                <li>
                  <Link to="/help-center?tab=support" className="hover:text-emerald-400 transition-colors font-medium">
                    {lang === "pt" ? "Abrir Ticket de Suporte" : "Open Support Ticket"}
                  </Link>
                </li>
                <li>
                  <Link to="/help-center?tab=feedback" className="hover:text-emerald-400 transition-colors font-medium">
                    {lang === "pt" ? "Enviar Feedback e Sugestões" : "Submit Feedback & Ideas"}
                  </Link>
                </li>
                <li><a href="mailto:suporte@vaultfinance.os" className="hover:text-emerald-400 transition-colors">suporte@vaultfinance.os</a></li>
                <li><a href="mailto:dpo@vaultfinance.os" className="hover:text-emerald-400 transition-colors">{getFooterText("dpo", lang)}</a></li>
                <li><a href="#faq" className="hover:text-emerald-400 transition-colors">{getFooterText("faq", lang)}</a></li>
                <li className="text-[10px] text-zinc-600">{getFooterText("secure_channel", lang)}</li>
              </ul>
            </div>

          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 text-xs text-zinc-600 sm:flex-row">
            <p>© {new Date().getFullYear()} Vault Finance OS. {t("landing.footer_rights")}</p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-[10px] font-mono py-0.5 px-2.5 bg-zinc-950 rounded-full border border-white/5 text-zinc-500">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Vercel Production Stable v{packageJson.version}
              </span>
            </div>
          </div>
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
