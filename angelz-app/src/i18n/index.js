import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

export const LANGUAGES = {
  en: { label: "English", nativeLabel: "English", dir: "ltr", locale: "en-US" },
  he: { label: "Hebrew", nativeLabel: "עברית", dir: "rtl", locale: "he-IL" },
};
export const DEFAULT_LANGUAGE = "en";
export const LANGUAGE_STORAGE_KEY = "app_language";

/**
 * Every JSON file in ./locales/<lang>/<namespace>.json is auto-registered.
 * To add a new namespace just drop `<namespace>.json` in both language folders.
 */
const modules = import.meta.glob("./locales/*/*.json", { eager: true });
const resources = {};
const namespaces = new Set();
for (const [path, mod] of Object.entries(modules)) {
  const [, lang, file] = path.match(/\.\/locales\/([^/]+)\/([^/]+)\.json$/);
  const ns = file;
  namespaces.add(ns);
  resources[lang] = resources[lang] || {};
  resources[lang][ns] = mod.default ?? mod;
}

const normalize = (lng) => {
  const base = String(lng || DEFAULT_LANGUAGE).split("-")[0];
  return LANGUAGES[base] ? base : DEFAULT_LANGUAGE;
};

export const getLanguage = () => normalize(i18n.resolvedLanguage || i18n.language);
export const getDir = () => LANGUAGES[getLanguage()].dir;
export const isRTL = () => getDir() === "rtl";
/** BCP-47 locale for Intl / toLocale*String, e.g. "he-IL" */
export const getLocale = () => LANGUAGES[getLanguage()].locale;

const applyDocumentLanguage = (lng) => {
  const lang = normalize(lng);
  document.documentElement.lang = lang;
  document.documentElement.dir = LANGUAGES[lang].dir;
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    ns: [...namespaces],
    defaultNS: "common",
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: Object.keys(LANGUAGES),
    nonExplicitSupportedLngs: true,
    load: "languageOnly",
    interpolation: { escapeValue: false }, // React already escapes
    // English is the default: the language is only changed by an explicit user choice,
    // which is persisted in localStorage and restored on reload (browser language is ignored).
    detection: {
      order: ["localStorage"],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ["localStorage"],
    },
    react: { useSuspense: false },
  });

applyDocumentLanguage(i18n.resolvedLanguage || i18n.language);
i18n.on("languageChanged", applyDocumentLanguage);

export default i18n;
