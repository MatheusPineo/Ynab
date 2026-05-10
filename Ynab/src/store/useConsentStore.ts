import { create } from "zustand";

interface ConsentState {
  hasAcceptedCookies: boolean;
  analyticsConsent: boolean;
  marketingConsent: boolean;
  setConsent: (analytics: boolean, marketing: boolean) => void;
  acceptAll: () => void;
  rejectAll: () => void;
}

const safeGetItem = (key: string): string | null => {
  if (typeof window !== "undefined" && window.localStorage) {
    return localStorage.getItem(key);
  }
  return null;
};

const safeSetItem = (key: string, value: string) => {
  if (typeof window !== "undefined" && window.localStorage) {
    localStorage.setItem(key, value);
  }
};

export const useConsentStore = create<ConsentState>((set) => ({
  hasAcceptedCookies: safeGetItem("vault_consent_accepted") === "true",
  analyticsConsent: safeGetItem("vault_consent_analytics") === "true",
  marketingConsent: safeGetItem("vault_consent_marketing") === "true",

  setConsent: (analytics, marketing) => {
    safeSetItem("vault_consent_accepted", "true");
    safeSetItem("vault_consent_analytics", String(analytics));
    safeSetItem("vault_consent_marketing", String(marketing));
    set({
      hasAcceptedCookies: true,
      analyticsConsent: analytics,
      marketingConsent: marketing,
    });
    // Trigger any tracking systems based on user options
    if (analytics && typeof window !== "undefined" && (window as any).initAnalytics) {
      (window as any).initAnalytics();
    }
  },

  acceptAll: () => {
    safeSetItem("vault_consent_accepted", "true");
    safeSetItem("vault_consent_analytics", "true");
    safeSetItem("vault_consent_marketing", "true");
    set({
      hasAcceptedCookies: true,
      analyticsConsent: true,
      marketingConsent: true,
    });
    if (typeof window !== "undefined" && (window as any).initAnalytics) {
      (window as any).initAnalytics();
    }
  },

  rejectAll: () => {
    safeSetItem("vault_consent_accepted", "true");
    safeSetItem("vault_consent_analytics", "false");
    safeSetItem("vault_consent_marketing", "false");
    set({
      hasAcceptedCookies: true,
      analyticsConsent: false,
      marketingConsent: false,
    });
  },
}));
