import { useEffect, useState } from "react";
import { detectPlatform, modifierKeyLabel, type FancyPlatform } from "@particle-academy/react-fancy";

/**
 * The modifier key THIS visitor has, for a shortcut hint.
 *
 * The site told every visitor to press `⌘K`, hardcoded, in both the public
 * header and the admin toolbar — while the palette itself has always listened
 * for `metaKey || ctrlKey`. So the shortcut worked everywhere and the label was
 * wrong for most of the people reading it, naming a key that is not on a
 * Windows or Linux keyboard at all.
 *
 * Found the same bug in `PromptInput` the same day, reported by a consumer
 * running the kit in a Linux container (react-fancy 5.35.0). This is the
 * showcase paying its own fix back: `modifierKeyLabel` and `detectPlatform` are
 * exported from the kit, so the app does not get its own copy of the rule.
 *
 * **Resolved after mount, never during render.** This app server-renders
 * through Inertia SSR, where there is no `navigator` — reading it during render
 * would make the server's HTML disagree with the client's and leave React to
 * patch the difference. The first paint says `Ctrl`, which is pressable on
 * every platform including a Mac, and an Apple client swaps on the next tick.
 */
export function useModifierKey(): "⌘" | "Ctrl" {
    const [platform, setPlatform] = useState<FancyPlatform>("generic");

    useEffect(() => {
        setPlatform(detectPlatform(typeof navigator === "undefined" ? null : navigator));
    }, []);

    return modifierKeyLabel(platform);
}

/** The palette's shortcut, named for the keyboard in front of the reader. */
export function PaletteHint({ className = "kbd" }: { className?: string }) {
    const mod = useModifierKey();

    return <span className={className}>{mod}K</span>;
}
