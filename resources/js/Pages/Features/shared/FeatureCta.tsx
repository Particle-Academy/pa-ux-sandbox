import type { ReactNode } from "react";
import { Link } from "@inertiajs/react";
import { Button, Card, Heading, Text } from "@particle-academy/react-fancy";

export type FeatureCtaAction = {
    label: string;
    href: string;
    /** A Lucide icon name. */
    icon?: string;
    /** Off-site links open in a new tab and skip the Inertia router. */
    external?: boolean;
};

/** The closing call to action: one primary step, optionally a second. */
export function FeatureCta({
    title,
    body,
    primary,
    secondary,
}: {
    title: ReactNode;
    body?: ReactNode;
    primary: FeatureCtaAction;
    secondary?: FeatureCtaAction;
}) {
    return (
        <section className="feature-section">
            <Card variant="soft" className="feature-cta">
                <Card.Body>
                    <Heading as="h2" size="xl" weight="bold" className="feature-display">
                        {title}
                    </Heading>
                    {body && (
                        <Text as="p" color="muted" className="feature-cta__body">
                            {body}
                        </Text>
                    )}
                    <div className="feature-cta__actions">
                        <CtaButton action={primary} primary />
                        {secondary && <CtaButton action={secondary} />}
                    </div>
                </Card.Body>
            </Card>
        </section>
    );
}

function CtaButton({ action, primary = false }: { action: FeatureCtaAction; primary?: boolean }) {
    if (action.external) {
        return (
            <Button href={action.href} target="_blank" rel="noopener noreferrer" iconTrailing={action.icon ?? "arrow-up-right"} color={primary ? "brand" : undefined} variant={primary ? "default" : "ghost"} data-feature-cta={primary ? "primary" : "secondary"}>
                {action.label}
            </Button>
        );
    }

    return (
        <Button href={action.href} as={Link} iconTrailing={action.icon ?? "arrow-right"} color={primary ? "brand" : undefined} variant={primary ? "default" : "ghost"} data-feature-cta={primary ? "primary" : "secondary"}>
            {action.label}
        </Button>
    );
}
