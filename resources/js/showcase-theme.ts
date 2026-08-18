/**
 * Theme entry point for the showcase.
 *
 * The mechanics moved into react-fancy (`initTheme` / `useTheme` /
 * `setThemePreference`) — this app was one of the hand-rolled copies that had no
 * live OS listener and no way back to "follow my system" once you clicked the
 * toggle. What is left here is the app's own bootstrap plus the one bit of
 * policy that is genuinely ours: what the toggle button does.
 *
 * The pre-paint script in `showcase-app.blade.php` still runs first and sets the
 * class before React exists, which is what stops the flash. It deliberately
 * mirrors these semantics: **a stored value means an explicit choice, and its
 * absence means follow the system.**
 */
import {
    getThemePreference,
    initTheme,
    resolveTheme,
    setThemePreference,
    type ResolvedTheme,
    type ThemePreference,
} from "@particle-academy/react-fancy";

export type { ResolvedTheme, ThemePreference };

/**
 * Cycle light → dark → system.
 *
 * A two-state toggle cannot express "follow my OS" at all, so the showcase was
 * demonstrating a theming story it did not actually offer: one click and a
 * visitor was pinned to a manual choice forever.
 */
export function cycleTheme(): ThemePreference {
    const preference = getThemePreference();

    // Leaving "system" steps to the OPPOSITE of what is on screen. Stepping to a
    // fixed first entry instead looks broken half the time: a visitor whose OS is
    // already light clicks a theme button and nothing visibly changes, because
    // "system (light)" and "light" paint the same page.
    const next: ThemePreference =
        preference === "system" ? (resolveTheme() === "dark" ? "light" : "dark")
        : preference === "dark" ? "light"
        : "system";

    setThemePreference(next);
    return next;
}

/** The theme actually on screen, as opposed to the preference behind it. */
export function currentTheme(): ResolvedTheme {
    return resolveTheme();
}

// Apply, and start following the OS. The blade script has already painted the
// right colours; this is what keeps them right when the OS changes later.
if (typeof window !== "undefined") {
    initTheme();
}
