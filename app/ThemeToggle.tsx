"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const getStoredTheme = (): Theme | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const value = window.localStorage.getItem("theme");
  return value === "dark" || value === "light" ? value : null;
};

const setDocumentTheme = (theme: Theme) => {
  document.documentElement.dataset.theme = theme;
  if (document.body) {
    document.body.dataset.theme = theme;
  }
};

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = getStoredTheme();
    if (stored) {
      setTheme(stored);
      setDocumentTheme(stored);
      return;
    }

    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const systemTheme: Theme = prefersDark ? "dark" : "light";
    setTheme(systemTheme);
    setDocumentTheme(systemTheme);

    if (process.env.NODE_ENV !== "production") {
      console.info(
        "Theme toggle note: if Safari seems stuck, try a hard reload (Cmd+Shift+R)."
      );
    }
  }, []);

  const handleToggle = () => {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    setDocumentTheme(nextTheme);
    window.localStorage.setItem("theme", nextTheme);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-sand-200 bg-white/80 text-ink-600 shadow-sm transition hover:border-ink-900 hover:text-ink-900"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
          <path
            d="M12 4.75v2.5M12 16.75v2.5M4.75 12h2.5M16.75 12h2.5M6.57 6.57l1.77 1.77M15.66 15.66l1.77 1.77M17.43 6.57l-1.77 1.77M8.34 15.66l-1.77 1.77"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle
            cx="12"
            cy="12"
            r="3.5"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
          <path
            d="M15.5 3.8A8.5 8.5 0 1 0 20.2 15c-3.5.6-7.2-1.7-8.4-5.2-1.1-3.2.1-6.6 3.7-6z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
