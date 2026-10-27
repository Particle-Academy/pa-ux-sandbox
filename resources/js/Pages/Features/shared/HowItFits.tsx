import type { ReactNode } from "react";
import { Link } from "@inertiajs/react";
import { Badge, Card, Grid, Heading, Icon, Text } from "@particle-academy/react-fancy";
import type { FeatureBridge, FeatureMember } from "./types";

/** Server mirrors first, then the UI, then anything unlabelled. */
const LANGUAGE_ORDER = ["PHP", "Node / TypeScript", "Python", "React"];

/**
 * How the Feature's packages fit together: which languages it ships in (the
 * PHP / Node / Python mirrors and the React UI) and, where one exists, the
 * Human+ bridge an agent drives its surface through.
 *
 * Everything shown is the members' and bridges' own data; nothing is typed.
 */
export function HowItFits({
    members,
    bridges,
    title = "How it fits",
    intro,
}: {
    members: FeatureMember[];
    bridges: FeatureBridge[];
    title?: ReactNode;
    intro?: ReactNode;
}) {
    const byLanguage = new Map<string, FeatureMember[]>();
    for (const member of members) {
        byLanguage.set(member.language, [...(byLanguage.get(member.language) ?? []), member]);
    }
    const languages = [...byLanguage.keys()].sort(
        (a, b) => rank(a) - rank(b) || a.localeCompare(b),
    );

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

            <Grid cols={Math.min(4, Math.max(languages.length, 1))} gap="md" className="feature-section__grid">
                {languages.map((language) => (
                    <Card key={language} variant="muted" data-language={language}>
                        <Card.Header>
                            <Badge variant="outline" size="sm">
                                {language}
                            </Badge>
                        </Card.Header>
                        <Card.Body>
                            <ul className="feature-fits__list">
                                {(byLanguage.get(language) ?? []).map((member) => (
                                    <li key={member.slug}>
                                        <Link href={member.href} className="feature-link">
                                            {member.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </Card.Body>
                    </Card>
                ))}
            </Grid>

            {bridges.length > 0 && (
                <Card variant="outlined" className="feature-fits__bridge">
                    <Card.Body>
                        <div className="feature-tour__head">
                            <span className="feature-tour__icon" aria-hidden>
                                <Icon name="bot" size="sm" />
                            </span>
                            <Heading as="h3" size="sm" weight="semibold">
                                Human+ bridge
                            </Heading>
                        </div>
                        <Text as="p" size="sm" color="muted">
                            An agent drives this surface over MCP, through the same state a person sees, never the DOM.
                        </Text>
                        <ul className="feature-fits__bridges">
                            {bridges.map((bridge) => (
                                <li key={bridge.name}>
                                    <code className="feature-code">
                                        {`import { ${bridge.name} } from "${bridge.import}";`}
                                    </code>
                                    <Text as="span" size="xs" color="muted">
                                        tools: {bridge.tools}
                                    </Text>
                                </li>
                            ))}
                        </ul>
                    </Card.Body>
                </Card>
            )}
        </section>
    );
}

function rank(language: string): number {
    const index = LANGUAGE_ORDER.indexOf(language);
    return index === -1 ? LANGUAGE_ORDER.length : index;
}
