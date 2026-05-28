/**
 * Maps purchased cosmetic slot values (stored on users.cosmetic_slots,
 * shared via auth.user.player.cosmetics) to Tailwind classes / inline
 * styles. Keep the slot/value keys in sync with database/seeders/ShopSeeder.
 */

export type CosmeticSlots = Record<string, string>;

/** Ring/border classes for an avatar frame. */
export function avatarFrameClass(slots: CosmeticSlots | undefined | null): string {
    switch (slots?.["avatar-frame"]) {
        case "bronze":
            return "ring-2 ring-amber-700/70 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950";
        case "silver":
            return "ring-2 ring-zinc-400 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950";
        case "gold":
            return "ring-2 ring-yellow-400 ring-offset-2 ring-offset-white shadow-[0_0_12px_rgba(250,204,21,0.5)] dark:ring-offset-zinc-950";
        default:
            return "";
    }
}

/**
 * Class for the display-name color cosmetic. The rainbow variant uses a
 * clipped gradient (defined in showcase.css as `.cosmetic-name-rainbow`).
 */
export function nameColorClass(slots: CosmeticSlots | undefined | null): string {
    switch (slots?.["name-color"]) {
        case "blue":
            return "text-sky-500 dark:text-sky-400";
        case "rainbow":
            return "cosmetic-name-rainbow";
        default:
            return "";
    }
}

/** Inline gradient style for a profile banner, or null if none owned. */
export function bannerStyle(slots: CosmeticSlots | undefined | null): { backgroundImage: string } | undefined {
    switch (slots?.["banner"]) {
        case "sunset":
            return { backgroundImage: "linear-gradient(120deg, #f97316 0%, #ec4899 60%, #8b5cf6 100%)" };
        case "aurora":
            return { backgroundImage: "linear-gradient(120deg, #10b981 0%, #06b6d4 50%, #8b5cf6 100%)" };
        default:
            return undefined;
    }
}

export function hasBanner(slots: CosmeticSlots | undefined | null): boolean {
    return bannerStyle(slots) !== undefined;
}
