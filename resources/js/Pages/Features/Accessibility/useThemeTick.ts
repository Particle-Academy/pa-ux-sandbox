import { useEffect, useState } from "react";

/**
 * A counter that moves whenever the page's light/dark theme changes (the
 * class or data-theme on <html>) and once after first paint, so a demo that
 * MEASURES the rendered page re-measures when the colours change.
 */
export function useThemeTick(): number {
    const [tick, setTick] = useState(0);

    useEffect(() => {
        const bump = () => requestAnimationFrame(() => setTick((t) => t + 1));
        bump();
        const observer = new MutationObserver(bump);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] });
        return () => observer.disconnect();
    }, []);

    return tick;
}
