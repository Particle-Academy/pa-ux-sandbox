import type { ReactNode } from "react";
import { Card, Grid, Heading, Icon, Text } from "@particle-academy/react-fancy";

export type FeatureTourItem = {
    /** A Lucide icon name. */
    icon: string;
    title: string;
    body: ReactNode;
};

/**
 * Three to six real capabilities, one card each. More than six stops being a
 * tour; fewer than three is a list. Every claim must be checkable against the
 * package.
 */
export function FeatureTour({
    title = "What it does",
    intro,
    items,
}: {
    title?: ReactNode;
    intro?: ReactNode;
    /** 3 to 6 items. */
    items: FeatureTourItem[];
}) {
    if (import.meta.env.DEV && (items.length < 3 || items.length > 6)) {
        console.warn(`FeatureTour expects 3 to 6 items, got ${items.length}.`);
    }

    return (
        <section className="feature-section">
            <Heading as="h2" size="lg" weight="semibold" className="feature-display">
                {title}
            </Heading>
            {intro && (
                <Text as="p" color="muted" className="feature-section__intro">
                    {intro}
                </Text>
            )}
            <Grid cols={3} gap="md" className="feature-section__grid">
                {items.map((item) => (
                    <Card key={item.title} variant="outlined" className="feature-tour__card">
                        <Card.Body>
                            <div className="feature-tour__head">
                                <span className="feature-tour__icon" aria-hidden>
                                    <Icon name={item.icon} size="sm" />
                                </span>
                                <Heading as="h3" size="sm" weight="semibold">
                                    {item.title}
                                </Heading>
                            </div>
                            <Text as="p" size="sm" color="muted">
                                {item.body}
                            </Text>
                        </Card.Body>
                    </Card>
                ))}
            </Grid>
        </section>
    );
}
