import { useEffect } from "react";
import { useConsentStore } from "@/store/useConsentStore";

/**
 * Hook de Consentimento Legal (LGPD/GDPR)
 * Condiciona a injeção e execução de scripts de terceiros (Analytics/Marketing)
 * de acordo com as preferências registradas pelo usuário na useConsentStore.
 */
export function useConsentTracker() {
  const { analyticsConsent, marketingConsent, hasAcceptedCookies } = useConsentStore();

  useEffect(() => {
    // Se o usuário ainda não respondeu ao consentimento, não carrega nada
    if (!hasAcceptedCookies) return;

    // --- 1. BLOCO DE COOKIES ANALÍTICOS (Ex: Google Analytics ou PostHog) ---
    if (analyticsConsent) {
      console.log("🛡️ [LGPD/GDPR] Inicializando scripts de performance e analytics autorizados...");
      
      // Simulação de injeção dinâmica de tag Google Analytics (gtag.js)
      if (!document.getElementById("google-analytics-script")) {
        const script = document.createElement("script");
        script.id = "google-analytics-script";
        script.async = true;
        script.src = "https://www.googletagmanager.com/gtag/js?id=UA-XXXXXXX-Y";
        document.head.appendChild(script);

        const initScript = document.createElement("script");
        initScript.id = "google-analytics-init";
        initScript.innerHTML = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'UA-XXXXXXX-Y', { 'anonymize_ip': true });
        `;
        document.head.appendChild(initScript);
      }
    } else {
      console.log("🛡️ [LGPD/GDPR] Cookies analíticos rejeitados pelo usuário. Removendo scripts se existirem...");
      // Remove scripts injetados caso o consentimento seja revogado retrospectivamente
      const script = document.getElementById("google-analytics-script");
      const initScript = document.getElementById("google-analytics-init");
      if (script) script.remove();
      if (initScript) initScript.remove();
    }

    // --- 2. BLOCO DE COOKIES DE MARKETING (Ex: Facebook Pixel ou LinkedIn Tag) ---
    if (marketingConsent) {
      console.log("🛡️ [LGPD/GDPR] Inicializando scripts de marketing autorizados...");
      if (!document.getElementById("facebook-pixel-script")) {
        const pixelScript = document.createElement("script");
        pixelScript.id = "facebook-pixel-script";
        pixelScript.innerHTML = `
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
          n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
          (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '123456789');
          fbq('track', 'PageView');
        `;
        document.head.appendChild(pixelScript);
      }
    } else {
      console.log("🛡️ [LGPD/GDPR] Cookies de marketing rejeitados. Removendo scripts se existirem...");
      const pixelScript = document.getElementById("facebook-pixel-script");
      if (pixelScript) pixelScript.remove();
    }

  }, [analyticsConsent, marketingConsent, hasAcceptedCookies]);
}
