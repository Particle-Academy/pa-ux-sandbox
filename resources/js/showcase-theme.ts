/**
 * Light/dark theme bootstrap for the showcase Inertia app. Applies the
 * persisted theme synchronously before paint to avoid FOUC, then exposes
 * a global helper any page can call.
 */
const THEME_KEY = "fancy-ui.theme";
type Theme = "light" | "dark";

function readTheme(): Theme {
    if (typeof window === "undefined") return "light";
    const saved = window.localStorage.getItem(THEME_KEY) as Theme | null;
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(theme: Theme): void {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.setAttribute("data-theme", theme);
}

export function toggleTheme(): Theme {
    const next: Theme = document.documentElement.classList.contains("dark") ? "light" : "dark";
    window.localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
    window.dispatchEvent(new CustomEvent("fancy-theme-change", { detail: next }));
    return next;
}

export function currentTheme(): Theme {
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

// Apply ASAP at module import.
if (typeof window !== "undefined") {
    applyTheme(readTheme());
}
