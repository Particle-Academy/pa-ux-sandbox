import type { CSSProperties, ReactNode } from "react";
import { Avatar, cn } from "@particle-academy/react-fancy";
import {
    avatarFrameClass,
    bannerStyle,
    nameColorClass,
    type CosmeticSlots,
} from "../lib/cosmetics";

/**
 * The one place the showcase turns "a user" into pixels.
 *
 * Every surface that shows a person — nav chip, leaderboard, profile hero,
 * live presence pills, referral invite, admin tables — renders through these
 * components, so a purchased cosmetic lands everywhere at once. Adding a new
 * cosmetic slot means editing `lib/cosmetics.ts` plus the one component here
 * that draws that part of a person; it never means revisiting call sites.
 *
 * The payload is produced server-side by `App\Support\PlayerIdentity` and
 * always arrives under an `identity` key.
 */
export type PlayerIdentityData = {
    /** Public display name (GitHub handle when there is one). */
    name: string;
    avatarUrl: string | null;
    /** Owned cosmetic slots, `{ "avatar-frame": "gold", … }`. */
    cosmetics?: CosmeticSlots | null;
};

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

/** Up to two initials, used when a player has no avatar image. */
export function playerInitials(name: string): string {
    return name
        .split(/[\s._-]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("");
}

export function PlayerAvatar({
    player,
    size = "md",
    className,
    fallbackRingClassName,
    fallbackSrc,
    glow,
    status,
}: {
    player: PlayerIdentityData;
    size?: AvatarSize;
    /** Layout/size overrides. Merged with tailwind-merge, so `h-16 w-16` wins. */
    className?: string;
    /**
     * Decorative ring to use only when the player owns no avatar-frame
     * cosmetic — a purchased frame always takes precedence over page chrome.
     */
    fallbackRingClassName?: string;
    /** Image to show when the player has no avatar (falls back to initials). */
    fallbackSrc?: string;
    glow?: boolean | "xp" | "achievement";
    status?: "online" | "offline" | "busy" | "away";
}) {
    const frame = avatarFrameClass(player.cosmetics);

    return (
        <Avatar
            src={player.avatarUrl ?? fallbackSrc ?? undefined}
            alt={player.name}
            fallback={playerInitials(player.name)}
            size={size}
            glow={glow}
            status={status}
            className={cn(className, frame || fallbackRingClassName)}
        />
    );
}

/**
 * A player's display name with their name-color cosmetic applied. Pass
 * `children` to show different text (the admin tables show the account's real
 * name) while still picking up the cosmetic.
 */
export function PlayerName({
    player,
    className,
    style,
    children,
}: {
    player: PlayerIdentityData;
    className?: string;
    style?: CSSProperties;
    children?: ReactNode;
}) {
    const cosmetic = nameColorClass(player.cosmetics);

    // An equipped name colour always wins over the caller's own colour —
    // both for the class path (tailwind-merge puts the cosmetic last) and
    // here for inline styles. The rainbow variant in particular needs
    // `color: transparent` to survive so the clipped gradient shows.
    const resolvedStyle = cosmetic && style ? { ...style, color: undefined } : style;

    return (
        <span className={cn(className, cosmetic)} style={resolvedStyle}>
            {children ?? player.name}
        </span>
    );
}

/** Avatar + name in a row — the default way to show a person inline. */
export function PlayerIdentityRow({
    player,
    size = "md",
    className,
    nameClassName,
    subtitle,
    avatarClassName,
    fallbackSrc,
}: {
    player: PlayerIdentityData;
    size?: Exclude<AvatarSize, "xs" | "xl">;
    className?: string;
    nameClassName?: string;
    subtitle?: ReactNode;
    avatarClassName?: string;
    fallbackSrc?: string;
}) {
    const gap = size === "sm" ? "gap-2" : size === "lg" ? "gap-4" : "gap-3";
    const nameSize = size === "sm" ? "text-sm" : size === "lg" ? "text-lg" : "text-base";

    return (
        <span className={cn("flex items-center", gap, className)}>
            <PlayerAvatar player={player} size={size} className={avatarClassName} fallbackSrc={fallbackSrc} />
            <span className="flex min-w-0 flex-col">
                <PlayerName
                    player={player}
                    className={cn("truncate font-medium text-zinc-900 dark:text-zinc-100", nameSize, nameClassName)}
                />
                {subtitle && (
                    <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</span>
                )}
            </span>
        </span>
    );
}

/**
 * The banner strip across a profile header. Falls back to whatever the
 * caller's own class paints when the player owns no banner cosmetic.
 */
export function PlayerBanner({
    player,
    className,
    style,
}: {
    player: PlayerIdentityData;
    className?: string;
    style?: CSSProperties;
}) {
    return <div className={className} style={{ ...style, ...bannerStyle(player.cosmetics) }} />;
}
