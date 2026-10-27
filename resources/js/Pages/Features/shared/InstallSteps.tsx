import { useState, type ReactNode } from "react";
import { Badge, Button, Card, Heading, Text } from "@particle-academy/react-fancy";
import type { FeatureMember, FeatureVersions } from "./types";

/**
 * Install commands, one step per package, rendered from registry data.
 *
 * The commands are built server-side from each member's `npm` / `composer` /
 * `pypi` id (`FeatureSites::member()`); the versions are the deferred
 * `versions` prop. A member the registry gives no install id is left out
 * rather than given an invented command.
 */
export function InstallSteps({
    members,
    versions,
    title = "Install",
    intro,
}: {
    /** Usually a subset: the packages a reader installs first. */
    members: FeatureMember[];
    versions?: FeatureVersions;
    title?: ReactNode;
    intro?: ReactNode;
}) {
    const steps = members.filter((member) => member.install !== null);
    if (steps.length === 0) return null;

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
            <ol className="feature-steps">
                {steps.map((member, index) => (
                    <li key={member.slug} className="feature-steps__item">
                        <span className="feature-steps__n" aria-hidden>
                            {index + 1}
                        </span>
                        <InstallCommand member={member} version={versions?.[member.slug] ?? null} />
                    </li>
                ))}
            </ol>
        </section>
    );
}

function InstallCommand({ member, version }: { member: FeatureMember; version: string | null }) {
    const [copied, setCopied] = useState(false);
    const command = member.install ?? "";

    const copy = () => {
        void navigator.clipboard.writeText(command).then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1200);
        });
    };

    return (
        <Card variant="outlined" padding="sm" className="feature-steps__card" data-install={member.slug}>
            <div className="feature-steps__meta">
                <Text as="span" size="sm" weight="semibold">
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
            <div className="feature-steps__cmd">
                <code className="feature-code">
                    <span aria-hidden className="feature-code__sigil">
                        ${" "}
                    </span>
                    {command}
                </code>
                <Button
                    variant="ghost"
                    size="sm"
                    icon={copied ? "check" : "copy"}
                    onClick={copy}
                    aria-label={`Copy: ${command}`}
                >
                    {copied ? "Copied" : "Copy"}
                </Button>
            </div>
        </Card>
    );
}
