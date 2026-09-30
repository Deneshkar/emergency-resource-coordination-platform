import { createContext, useContext, useState, useEffect } from "react";
import { LANGUAGES, TRANSLATIONS } from "./translations";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem("ercp_language") || "en";
  });

  const setLanguage = (langCode) => {
    if (TRANSLATIONS[langCode]) {
      setLanguageState(langCode);
      localStorage.setItem("ercp_language", langCode);
      document.documentElement.setAttribute("lang", langCode);
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute("lang", language);
  }, [language]);

  const t = (key, defaultText = "") => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS.en[key] || defaultText || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
