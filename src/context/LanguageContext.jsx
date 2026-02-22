"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { translations } from "@/lib/translations";

const STORAGE_KEY = "fairshare-lang";

const LanguageContext = createContext({
  lang: "my",
  setLang: () => {},
  t: translations.my,
});

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState("my");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "en" || stored === "my") setLangState(stored);
    } catch {}
  }, []);

  const setLang = (value) => {
    const next = value === "en" ? "en" : "my";
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
      if (typeof document !== "undefined") document.documentElement.lang = next === "en" ? "en" : "my";
    } catch {}
  };

  useEffect(() => {
    if (!mounted) return;
    if (typeof document !== "undefined") document.documentElement.lang = lang === "en" ? "en" : "my";
  }, [lang, mounted]);

  const t = translations[lang] || translations.my;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
