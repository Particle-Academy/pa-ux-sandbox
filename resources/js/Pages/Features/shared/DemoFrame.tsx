import type { ReactNode } from "react";
import { Badge, Card, Text } from "@particle-academy/react-fancy";

/**
 * A framed, labelled area for a LIVE demo of the Feature's real surface.
 *
 * The frame only labels and borders; it never clips, transforms or traps
 * events, so a canvas, a terminal or an editor inside it behaves exactly as it
 * does on its own (no `overflow: hidden`, no stacking context of its own).
 */
export function DemoFrame({
    label,
    caption,
    status = "Live demo",
    id,
    children,
}: {
    /** What the demo is, e.g. "The Flow editor". */
    label: ReactNode;
    /** One line on what to try. */
    caption?: ReactNode;
    /** The badge in the frame's bar. */
    status?: ReactNode;
    /** Stable handle for the frame (`data-demo-frame`). */
    id?: string;
    children: ReactNode;
}) {
    return (
        <section className="feature-section" aria-label={typeof label === "string" ? label : undefined}>
            <Card variant="outlined" className="feature-demo" data-demo-frame={id ?? ""}>
                <Card.Header className="feature-demo__bar">
                    <span className="feature-demo__dots" aria-hidden>
                        <span />
                        <span />
                        <span />
                    </span>
                    <Text as="span" size="sm" weight="semibold">
                        {label}
                    </Text>
                    <Badge color="green" variant="soft" size="sm" dot>
                        {status}
                    </Badge>
                </Card.Header>
                <Card.Body className="feature-demo__stage">{children}</Card.Body>
                {caption && (
                    <Card.Footer className="feature-demo__caption">
                        <Text as="p" size="sm" color="muted">
                            {caption}
                        </Text>
                    </Card.Footer>
                )}
            </Card>
        </section>
    );
}
