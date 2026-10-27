import { Link } from "@inertiajs/react";
import { Badge, Card, Grid, Heading, Icon, Text } from "@particle-academy/react-fancy";
import { ServerSeo } from "@/lib/ServerSeo";
import { Layout } from "../Layout";
import { FeatureIdentity } from "./shared/FeatureIdentity";
import type { FeatureSiteCard } from "./shared/types";

/**
 * /features — every Feature as a card, each in its own identity. Names and
 * taglines are the same server strings the nav dropdown shows.
 */
export default function FeaturesIndex({ sites }: { sites: FeatureSiteCard[] }) {
    return (
        <Layout>
            <ServerSeo />
            <header className="features-index__hero">
                <Text as="div" size="sm" weight="semibold" color="accent">
                    Features
                </Text>
                <Heading as="h1" size="3xl" weight="bold">
                    The platforms in the kit
                </Heading>
                <Text as="p" size="lg" color="muted" className="feature-section__intro">
                    Most of Fancy UI is components you drop into an app. These are whole platforms: several packages,
                    often in more than one language, that ship one capability end to end.
                </Text>
            </header>

            <Grid cols={4} gap="md" className="features-index__grid">
                {sites.map((site) => (
                    <FeatureIdentity key={site.slug} slug={site.slug} theme={site.theme}>
                        <Link href={site.href} className="features-index__card" data-feature-card={site.slug}>
                            <Card variant="outlined" interactive className="features-index__card-inner">
                                <Card.Body>
                                    <div className="features-index__card-head">
                                        <span className="feature-hero__glyph" aria-hidden>
                                            <Icon name={site.icon} size="md" />
                                        </span>
                                        <Heading as="h2" size="md" weight="bold" className="feature-display">
                                            {site.name}
                                        </Heading>
                                    </div>
                                    <Text as="p" size="sm" color="muted">
                                        {site.tagline}
                                    </Text>
                                    <div className="features-index__meta">
                                        <Badge variant="soft" size="sm">
                                            {site.memberCount} {site.memberCount === 1 ? "package" : "packages"}
                                        </Badge>
                                        {site.languages.map((language) => (
                                            <Badge key={language} variant="outline" size="sm">
                                                {language}
                                            </Badge>
                                        ))}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Link>
                    </FeatureIdentity>
                ))}
            </Grid>
        </Layout>
    );
}
