import type { ReactNode } from "react";
import { Link } from "@inertiajs/react";
import { Badge, Button, Heading, Icon, Text } from "@particle-academy/react-fancy";
import type { FeatureCourse, FeatureNav } from "./types";

/**
 * The micro-site's opening: icon, name, a lede and the languages it ships in.
 *
 * When the Feature's course is published in the curriculum, the hero adds a
 * "Learn <Feature>" action after the page's own. The server sends `course` as
 * null whenever `/learn/{slug}` would not answer, so the link cannot 404.
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
    feature: FeatureNav & { course?: FeatureCourse | null };
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
                {(actions || feature.course) && (
                    <div className="feature-hero__actions">
                        {actions}
                        {feature.course && (
                            <Button
                                href={feature.course.href}
                                as={Link}
                                variant="ghost"
                                icon="graduation-cap"
                                data-feature-learn={feature.course.slug}
                            >
                                Learn {feature.name}
                            </Button>
                        )}
                    </div>
                )}
                {children}
            </div>
        </header>
    );
}
