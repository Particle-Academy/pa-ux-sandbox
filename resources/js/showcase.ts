/**
 * Showcase chrome JS — light/dark toggle and a couple of small helpers.
 * Kept dependency-free so it works on every showcase page including
 * stubs.
 */

const THEME_KEY = "fancy-ui.theme";
type Theme = "light" | "dark";

function readTheme(): Theme {
  const saved = localStorage.getItem(THEME_KEY) as Theme | null;
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.setAttribute("data-theme", theme);
  document
    .querySelectorAll<HTMLButtonElement>("[data-theme-toggle]")
    .forEach((btn) => {
      btn.setAttribute("data-theme-state", theme);
      btn.setAttribute(
        "aria-label",
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode",
      );
    });
}

function bindThemeToggle(): void {
  document
    .querySelectorAll<HTMLButtonElement>("[data-theme-toggle]")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        const next: Theme = document.documentElement.classList.contains("dark")
          ? "light"
          : "dark";
        localStorage.setItem(THEME_KEY, next);
        applyTheme(next);
      });
    });
}

// Apply ASAP to avoid flash.
applyTheme(readTheme());

document.addEventListener("DOMContentLoaded", () => {
  bindThemeToggle();
});
