import type { ReactNode } from "react";
import { Link } from "@inertiajs/react";
import { Badge, Card, Grid, Heading, Text } from "@particle-academy/react-fancy";
import type { FeatureMember, FeatureVersions } from "./types";

/**
 * Every package in the Feature, each linking to its own page at
 * `/packages/{slug}`. Name, tagline and language are the registry's.
 */
export function PackagesGrid({
    members,
    versions,
    title = "The packages",
    intro,
}: {
    members: FeatureMember[];
    versions?: FeatureVersions;
    title?: ReactNode;
    intro?: ReactNode;
}) {
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
                {members.map((member) => {
                    const version = versions?.[member.slug] ?? null;
                    return (
                        <Link key={member.slug} href={member.href} className="feature-package" data-package={member.slug}>
                            <Card variant="outlined" interactive className="feature-package__card">
                                <Card.Body>
                                    <div className="feature-package__head">
                                        <Text as="span" weight="semibold" className="feature-package__name">
                                            {member.name}
                                        </Text>
                                        <Badge variant="soft" size="sm">
                                            {member.language}
                                        </Badge>
                                        {version && (
                                            <Badge color="blue" variant="soft" size="sm">
                                                v{version}
                                            </Badge>
                                        )}
                                    </div>
                                    <Text as="p" size="sm" color="muted" className="feature-package__tagline">
                                        {member.tagline}
                                    </Text>
                                </Card.Body>
                            </Card>
                        </Link>
                    );
                })}
            </Grid>
        </section>
    );
}
