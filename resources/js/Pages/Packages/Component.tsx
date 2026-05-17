import { Head } from "@inertiajs/react";
import { useState } from "react";
import {
    Action,
    Breadcrumbs,
    Card,
    
    
    Heading,
    Text,
} from "@particle-academy/react-fancy";
import { Layout } from "../Layout";
import { ComponentDemo } from "./ComponentDemo";

type Props = {
    package: { slug: string; name: string; npm?: string; composer?: string };
    component: { slug: string; name: string; blurb?: string };
    usage: string | null;
};

export default function PackagesComponent({ package: pkg, component, usage }: Props) {
    const [copied, setCopied] = useState(false);
    const importLine = pkg.npm
        ? `import { ${component.name} } from "${pkg.npm}";`
        : `// ${component.name} ships in ${pkg.composer ?? pkg.slug}`;

    const codeToShow = usage ?? importLine;

    return (
        <Layout>
            <Head title={`${component.name} · ${pkg.name}`} />

            <Breadcrumbs>
                <Breadcrumbs.Item href="/packages">Packages</Breadcrumbs.Item>
                <Breadcrumbs.Item href={`/packages/${pkg.slug}`}>{pkg.name}</Breadcrumbs.Item>
                <Breadcrumbs.Item>{component.name}</Breadcrumbs.Item>
            </Breadcrumbs>

            <Heading level={1} size="xl" className="mt-3">{component.name}</Heading>
            {component.blurb && <Text className="mt-2 max-w-3xl">{component.blurb}</Text>}

            <Card className="mt-6">
                <Card.Header>
                    <Text size="xs" className="font-semibold uppercase tracking-wider text-zinc-500">
                        Live demo
                    </Text>
                </Card.Header>
                <Card.Body>
                    <ComponentDemo slug={component.slug} name={component.name} pkg={pkg.slug} />
                </Card.Body>
            </Card>

            <Card className="mt-6">
                <Card.Header>
                    <div className="flex items-center justify-between">
                        <Text size="xs" className="font-semibold uppercase tracking-wider text-zinc-500">
                            Usage in your project
                        </Text>
                        <Action
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                navigator.clipboard.writeText(codeToShow).then(() => {
                                    setCopied(true);
                                    window.setTimeout(() => setCopied(false), 1200);
                                });
                            }}
                        >
                            {copied ? "copied" : "copy"}
                        </Action>
                    </div>
                </Card.Header>
                <Card.Body>
                    <pre className="overflow-x-auto rounded-md bg-zinc-950 p-3 text-xs text-zinc-100">
                        {codeToShow}
                    </pre>
                </Card.Body>
            </Card>
        </Layout>
    );
}
