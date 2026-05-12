import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useConsentStore } from "@/modules/auth/store/useConsentStore";
import { Cookie, Settings, ShieldAlert, Check } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { useTranslation } from "react-i18next";

type TranslationKeys = {
  title: string;
  tag: string;
  descPart1: string;
  descPart2: string;
  descPart3: string;
  descPart4: string;
  manage: string;
  reject: string;
  accept: string;
  back: string;
  save: string;
  note: string;
  analytics_title: string;
  analytics_desc: string;
  marketing_title: string;
  marketing_desc: string;
};

const TRANSLATIONS: Record<string, TranslationKeys> = {
  pt: {
    title: "Respeitamos a sua Privacidade",
    tag: "LGPD / GDPR Compliant",
    descPart1: "Utilizamos cookies estritamente necessários para autenticação e persistência de dados. Com o seu consentimento, também utilizamos cookies opcionais para analisar o desempenho do sistema e otimizar a experiência visual. Leia nossa ",
    descPart2: "Política de Privacidade",
    descPart3: " e ",
    descPart4: "Política de Cookies para saber mais.",
    manage: "Gerenciar Preferências",
    reject: "Rejeitar Todos",
    accept: "Aceitar Todos",
    back: "Voltar",
    save: "Salvar Preferências",
    note: "Sua privacidade é nossa prioridade soberana.",
    analytics_title: "Cookies de Performance e Analytics",
    analytics_desc: "Permite-nos registrar de forma anônima os cliques, erros de carregamento e tempo de permanência nos gráficos de Net Worth para correções de bugs.",
    marketing_title: "Cookies de Marketing e Personalização",
    marketing_desc: "Utilizados para adaptar ofertas especiais, newsletter e promoções comerciais do app de acordo com suas preferências.",
  },
  en: {
    title: "We Respect Your Privacy",
    tag: "LGPD / GDPR Compliant",
    descPart1: "We use strictly necessary cookies for authentication and data persistence. With your consent, we also use optional cookies to analyze system performance and optimize the visual experience. Read our ",
    descPart2: "Privacy Policy",
    descPart3: " and ",
    descPart4: "Cookie Policy to learn more.",
    manage: "Manage Preferences",
    reject: "Reject All",
    accept: "Accept All",
    back: "Back",
    save: "Save Preferences",
    note: "Your privacy is our sovereign priority.",
    analytics_title: "Performance & Analytics Cookies",
    analytics_desc: "Allows us to anonymously record clicks, loading errors, and dwell time in Net Worth charts for bug fixes.",
    marketing_title: "Marketing & Personalization Cookies",
    marketing_desc: "Used to adapt special offers, newsletters, and commercial promotions of the app according to your preferences.",
  },
  es: {
    title: "Respetamos su Privacidad",
    tag: "Conforme con LGPD / GDPR",
    descPart1: "Utilizamos cookies estrictamente necesarias para la autenticación y persistencia de datos. Con su consentimiento, también utilizamos cookies opcionales para analizar el rendimiento del sistema y optimizar la experiencia visual. Lea nuestra ",
    descPart2: "Política de Privacidad",
    descPart3: " y ",
    descPart4: "Política de Cookies para obtener más información.",
    manage: "Gestionar Preferencias",
    reject: "Rechazar Todo",
    accept: "Aceptar Todo",
    back: "Volver",
    save: "Guardar Preferencias",
    note: "Su privacidad es nuestra prioridad soberana.",
    analytics_title: "Cookies de Rendimiento y Analítica",
    analytics_desc: "Nos permite registrar de forma anónima los clics, errores de carga y tiempo de permanencia en los gráficos de Net Worth para correcciones de errores.",
    marketing_title: "Cookies de Marketing y Personalización",
    marketing_desc: "Utilizados para adaptar ofertas especiales, boletines informativos y promociones comerciales de la aplicación de acuerdo con sus preferencias.",
  },
  de: {
    title: "Wir respektieren Ihre Privatsphäre",
    tag: "LGPD / DSGVO-konform",
    descPart1: "Wir verwenden unbedingt erforderliche Cookies für die Authentifizierung und Datenpersistenz. Mit Ihrer Zustimmung verwenden wir auch optionale Cookies, um die Systemleistung zu analysieren und das visuelle Erlebnis zu optimieren. Lesen Sie unsere ",
    descPart2: "Datenschutzerklärung",
    descPart3: " und ",
    descPart4: "Cookie-Richtlinie, um mehr zu erfahren.",
    manage: "Präferenzen verwalten",
    reject: "Alle ablehnen",
    accept: "Alle akzeptieren",
    back: "Zurück",
    save: "Präferenzen speichern",
    note: "Ihre Privatsphäre ist unsere souveräne Priorität.",
    analytics_title: "Performance- & Analyse-Cookies",
    analytics_desc: "Ermöglicht uns die anonyme Erfassung von Klicks, Ladefehlern und Verweilzeiten in Net-Worth-Diagrammen für Fehlerbehebungen.",
    marketing_title: "Marketing- & Personalisierungs-Cookies",
    marketing_desc: "Verwendet, um Sonderangebote, Newsletter und kommerzielle Werbeaktionen der App an Ihre Präferenzen anzupassen.",
  },
  fr: {
    title: "Nous respectons votre vie privée",
    tag: "Conforme au RGPD / LGPD",
    descPart1: "Nous utilisons des cookies strictement nécessaires à l'authentification et à la persistance des données. Avec votre consentement, nous utilisons également des cookies optionnels pour analyser les performances du système et optimiser l'expérience visuelle. Lisez notre ",
    descPart2: "Politique de confidentialité",
    descPart3: " et ",
    descPart4: "Politique de cookies pour en savoir plus.",
    manage: "Gérer les préférences",
    reject: "Tout rejeter",
    accept: "Tout accepter",
    back: "Retour",
    save: "Enregistrer les préférences",
    note: "Votre vie privée est notre priorité souveraine.",
    analytics_title: "Cookies de performance et d'analyse",
    analytics_desc: "Nous permet d'enregistrer de manière anonyme les clics, les erreurs de chargement et le temps de séjour dans les graphiques de Net Worth pour les corrections de bugs.",
    marketing_title: "Cookies de marketing et de personnalisation",
    marketing_desc: "Utilisés para adapter les offres spéciales, les newsletters et les promotions de l'application selon vos préférences.",
  },
};

export default function CookieBanner() {
  const { hasAcceptedCookies, analyticsConsent, marketingConsent, setConsent, acceptAll, rejectAll } = useConsentStore();
  const [isManaging, setIsManaging] = useState(false);
  const [analytics, setAnalytics] = useState(analyticsConsent);
  const [marketing, setMarketing] = useState(marketingConsent);
  const { i18n } = useTranslation();

  // Determine active language prefix (e.g. "pt-BR" -> "pt", "en-US" -> "en")
  const rawLang = i18n.language || "pt";
  const langKey = rawLang.startsWith("pt")
    ? "pt"
    : rawLang.startsWith("es")
    ? "es"
    : rawLang.startsWith("de")
    ? "de"
    : rawLang.startsWith("fr")
    ? "fr"
    : "en"; // Default fallback to English for other languages

  const t = TRANSLATIONS[langKey] || TRANSLATIONS.en;

  if (hasAcceptedCookies) {
    return null;
  }

  const handleSaveCustom = () => {
    setConsent(analytics, marketing);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-6 md:right-6 md:bottom-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-slate-900 border border-slate-800 rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 max-w-5xl mx-auto backdrop-blur-md bg-opacity-95">
        <div className="flex flex-col gap-4">
          
          {/* Main header / description */}
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 shrink-0">
              <Cookie className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-slate-100 flex flex-wrap items-center gap-2">
                {t.title} <span className="text-[10px] sm:text-xs font-mono py-0.5 px-2 bg-slate-950 text-slate-500 rounded-full border border-slate-800">{t.tag}</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-4xl">
                {t.descPart1}
                <Link to="/legal?tab=privacidade" className="text-emerald-400 hover:underline">
                  {t.descPart2}
                </Link>
                {t.descPart3}
                <Link to="/legal?tab=cookies" className="text-emerald-400 hover:underline">
                  {t.descPart4}
                </Link>
              </p>
            </div>
          </div>

          {/* Expanded Management Panel */}
          {isManaging && (
            <div className="border-t border-slate-800 pt-4 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-250">
              
              {/* Option A: Analytics */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-start gap-3 hover:border-slate-700 transition-colors">
                <div className="pt-0.5">
                  <input
                    type="checkbox"
                    id="consent-analytics"
                    checked={analytics}
                    onChange={(e) => setAnalytics(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-800 text-emerald-500 bg-slate-950 focus:ring-emerald-500 cursor-pointer"
                  />
                </div>
                <div>
                  <label htmlFor="consent-analytics" className="text-xs sm:text-sm font-bold text-slate-100 cursor-pointer flex items-center gap-2">
                    {t.analytics_title}
                  </label>
                  <p className="text-[11px] sm:text-xs text-slate-400 mt-1 leading-relaxed">
                    {t.analytics_desc}
                  </p>
                </div>
              </div>

              {/* Option B: Marketing */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-start gap-3 hover:border-slate-700 transition-colors">
                <div className="pt-0.5">
                  <input
                    type="checkbox"
                    id="consent-marketing"
                    checked={marketing}
                    onChange={(e) => setMarketing(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-800 text-emerald-500 bg-slate-950 focus:ring-emerald-500 cursor-pointer"
                  />
                </div>
                <div>
                  <label htmlFor="consent-marketing" className="text-xs sm:text-sm font-bold text-slate-100 cursor-pointer flex items-center gap-2">
                    {t.marketing_title}
                  </label>
                  <p className="text-[11px] sm:text-xs text-slate-400 mt-1 leading-relaxed">
                    {t.marketing_desc}
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* Action buttons bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800/80 pt-4 mt-2">
            
            {/* Left link side */}
            <div className="text-[11px] sm:text-xs text-slate-500 flex items-center gap-1.5 font-mono">
              <ShieldAlert className="w-3.5 h-3.5 text-slate-600" />
              {t.note}
            </div>

            {/* Right button side */}
            <div className="flex flex-wrap items-center justify-end gap-2 w-full sm:w-auto">
              {isManaging ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsManaging(false)}
                    className="border-slate-800 text-slate-400 hover:text-slate-200 text-xs py-1.5 h-8"
                  >
                    {t.back}
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSaveCustom}
                    className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs py-1.5 h-8 flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> {t.save}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsManaging(true)}
                    className="text-slate-400 hover:text-slate-200 text-xs py-1.5 h-8 flex items-center gap-1 hover:bg-slate-800"
                  >
                    <Settings className="w-3.5 h-3.5" /> {t.manage}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={rejectAll}
                    className="border-slate-800 text-slate-300 hover:text-slate-100 text-xs py-1.5 h-8 hover:bg-slate-850"
                  >
                    {t.reject}
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={acceptAll}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs py-1.5 h-8 flex items-center gap-1"
                  >
                    {t.accept}
                  </Button>
                </>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
