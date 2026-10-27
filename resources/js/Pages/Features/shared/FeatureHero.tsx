import type { ReactNode } from "react";
import { Badge, Heading, Icon, Text } from "@particle-academy/react-fancy";
import type { FeatureNav } from "./types";

/**
 * The micro-site's opening: icon, name, a lede and the languages it ships in.
 * Type and colour come from the Feature's identity (features.css), so the same
 * hero reads differently on every site without a prop for it.
 *
 * `title` and `lede` default to the Feature's own name and tagline — the
 * server's words, so the hero cannot drift from the nav and the meta.
 */
export function FeatureHero({
    feature,
    eyebrow = "Feature",
    title,
    lede,
    languages = [],
    actions,
    children,
}: {
    feature: FeatureNav;
    eyebrow?: ReactNode;
    title?: ReactNode;
    lede?: ReactNode;
    /** Shown as badges, e.g. the Feature's `languages`. */
    languages?: string[];
    /** Buttons under the lede. */
    actions?: ReactNode;
    /** Anything else the hero should hold (a stat strip, an illustration). */
    children?: ReactNode;
}) {
    return (
        <header className="feature-hero" data-feature-hero="">
            <div className="feature-hero__glyph" aria-hidden>
                <Icon name={feature.icon} size="lg" />
            </div>
            <div className="feature-hero__main">
                <Text as="div" size="sm" weight="semibold" className="feature-hero__eyebrow">
                    {eyebrow}
                </Text>
                <Heading as="h1" size="4xl" weight="bold" className="feature-display">
                    {title ?? feature.name}
                </Heading>
                <Text as="p" size="lg" color="muted" className="feature-hero__lede">
                    {lede ?? feature.tagline}
                </Text>
                {languages.length > 0 && (
                    <div className="feature-hero__meta">
                        {languages.map((language) => (
                            <Badge key={language} variant="outline">
                                {language}
                            </Badge>
                        ))}
                    </div>
                )}
                {actions && <div className="feature-hero__actions">{actions}</div>}
                {children}
            </div>
        </header>
    );
}
