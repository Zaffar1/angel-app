import { useTranslation } from "react-i18next";
import { LANGUAGES, DEFAULT_LANGUAGE } from "../i18n";

/**
 * The single entry point components use for localization.
 *
 *   const { t, language, locale, dir, isRTL, changeLanguage } = useLocale("mission");
 *
 * - `namespace` is the feature's locale file (src/i18n/locales/<lang>/<namespace>.json):
 *   "mission", "organization", "volunteer", "volunteerGroup", "feed", "auth", ...
 *   Keys from other features are still reachable with a prefix: t("common:actions.save").
 * - Re-renders the component whenever the language changes.
 * - `locale` is the BCP-47 tag for Intl / toLocale*String ("en-US" | "he-IL").
 */
export default function useLocale(namespace) {
  const { t, i18n } = useTranslation(namespace);
  const base = String(i18n.resolvedLanguage || i18n.language || DEFAULT_LANGUAGE).split("-")[0];
  const language = LANGUAGES[base] ? base : DEFAULT_LANGUAGE;
  const { locale, dir } = LANGUAGES[language];

  return {
    t,
    i18n,
    language,
    locale,
    dir,
    isRTL: dir === "rtl",
    languages: LANGUAGES,
    changeLanguage: (lng) => i18n.changeLanguage(lng),
  };
}
