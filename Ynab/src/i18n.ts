import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import ptBR from "./locales/pt-BR.json";
import en from "./locales/en.json";
import es from "./locales/es.json";
import de from "./locales/de.json";
import fr from "./locales/fr.json";
import it from "./locales/it.json";
import nl from "./locales/nl.json";
import pl from "./locales/pl.json";
import zh from "./locales/zh.json";
import ar from "./locales/ar.json";
import ja from "./locales/ja.json";
import hi from "./locales/hi.json";

const resources = {
  "pt-BR": { translation: ptBR },
  en: { translation: en },
  es: { translation: es },
  de: { translation: de },
  fr: { translation: fr },
  it: { translation: it },
  nl: { translation: nl },
  pl: { translation: pl },
  zh: { translation: zh },
  ar: { translation: ar },
  ja: { translation: ja },
  hi: { translation: hi },
};

// Sync HTML dir attribute for RTL support (Arabic)
i18n.on("languageChanged", (lng) => {
  if (typeof document !== "undefined") {
    const dir = lng === "ar" ? "rtl" : "ltr";
    document.documentElement.dir = dir;
    document.documentElement.lang = lng;
  }
});

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "pt-BR",
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;
