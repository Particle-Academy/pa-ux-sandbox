import type { ReactNode } from "react";
import { Badge, Card, Grid, Heading, Text } from "@particle-academy/react-fancy";

export type Criterion = {
    /** The WCAG 2.2 success criterion number, e.g. "1.4.11". */
    code: string;
    name: string;
    level: "A" | "AA" | "AAA";
};

/**
 * One lesson on the Accessibility page: the principle in plain words with its
 * WCAG criteria, then how Fancy UI meets it (each point checkable against a
 * react-fancy release), then a live demo where one is possible.
 */
export function Lesson({
    id,
    title,
    criteria,
    principle,
    fancy,
    children,
}: {
    id: string;
    title: string;
    criteria: Criterion[];
    principle: ReactNode;
    fancy: ReactNode[];
    children?: ReactNode;
}) {
    return (
        <section id={id} className="feature-section a11y-lesson" data-a11y-lesson={id} aria-labelledby={`${id}-title`}>
            <Heading as="h2" size="lg" weight="semibold" className="feature-display" id={`${id}-title`}>
                {title}
            </Heading>
            <div className="a11y-criteria">
                {criteria.length === 0 && (
                    <Badge variant="outline" data-wcag="">
                        Not a WCAG criterion: a Fancy UI rule
                    </Badge>
                )}
                {criteria.map((c) => (
                    <Badge key={c.code} variant="outline" data-wcag={c.code}>
                        WCAG {c.code} {c.name} ({c.level})
                    </Badge>
                ))}
            </div>
            <Grid cols={2} gap="md" className="feature-section__grid a11y-lesson__grid">
                <Card variant="muted">
                    <Card.Body>
                        <Heading as="h3" size="sm" weight="semibold">
                            The principle
                        </Heading>
                        <Text as="div" size="sm" className="a11y-lesson__copy">
                            {principle}
                        </Text>
                    </Card.Body>
                </Card>
                <Card variant="outlined">
                    <Card.Body>
                        <Heading as="h3" size="sm" weight="semibold">
                            How Fancy UI does it
                        </Heading>
                        <ul className="a11y-lesson__list">
                            {fancy.map((point, i) => (
                                <li key={i}>
                                    <Text as="span" size="sm">
                                        {point}
                                    </Text>
                                </li>
                            ))}
                        </ul>
                    </Card.Body>
                </Card>
            </Grid>
            {children}
        </section>
    );
}
