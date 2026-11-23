"use client";

import { createContext, useContext, useSyncExternalStore } from "react";

export type Language = "en" | "id";
export const PanelLanguage = createContext<Language>("id");

const storageKey = "starter-language-choice";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(storageKey, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(storageKey, onChange);
  };
}

function readLanguage() {
  const value = localStorage.getItem(storageKey);
  return value === "en" || value === "id" ? value : undefined;
}

export function savePanelLanguage(value: Language) {
  localStorage.setItem(storageKey, value);
  window.dispatchEvent(new Event(storageKey));
}

export function usePanelLanguagePreference() {
  return useSyncExternalStore(subscribe, readLanguage, () => undefined);
}

export function usePanelTranslation() {
  const language = useContext(PanelLanguage);
  return (en: string, id: string) => (language === "id" ? id : en);
}
