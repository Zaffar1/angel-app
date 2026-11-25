import { useEffect, useRef, useState } from "react";
import { FaGlobe, FaChevronDown, FaCheck } from "react-icons/fa";
import useLocale from "../hooks/useLocale";

/**
 * Language dropdown. The choice is persisted (localStorage, see src/i18n) so it survives a reload.
 * `compact` hides the language name on small screens (icon + chevron only).
 */
export default function LanguageSwitcher({ className = "", compact = false }) {
  const { t, language, languages, changeLanguage } = useLocale("common");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const select = (code) => {
    if (code !== language) changeLanguage(code);
    setOpen(false);
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("language.label")}
        title={t("language.label")}
        className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-all"
      >
        <FaGlobe className="text-base" />
        <span className={compact ? "hidden sm:inline" : ""}>{languages[language].nativeLabel}</span>
        <FaChevronDown className={`text-[10px] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={t("language.label")}
          className="absolute end-0 top-full mt-1 min-w-[10rem] bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden z-50"
        >
          {Object.entries(languages).map(([code, lang]) => {
            const active = code === language;
            return (
              <li key={code} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => select(code)}
                  lang={code}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-start transition-colors ${
                    active ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span>{lang.nativeLabel}</span>
                  {active && <FaCheck className="text-xs" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
