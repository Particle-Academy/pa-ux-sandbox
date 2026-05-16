import { Head } from "@inertiajs/react";
import { Breadcrumbs, Card, Heading, Text } from "@particle-academy/react-fancy";
import { Layout } from "../Layout";

type Kit = { slug: string; name: string; pkg: string; blurb: string };

export default function StarterKitsShow({ kit }: { kit: Kit }) {
    return (
        <Layout>
            <Head title={`${kit.name} · Starter Kit`} />

            <Breadcrumbs>
                <Breadcrumbs.Item href="/starter-kits">Starter Kits</Breadcrumbs.Item>
                <Breadcrumbs.Item>{kit.name}</Breadcrumbs.Item>
            </Breadcrumbs>

            <Heading level={1} size="xl" className="mt-3">{kit.name}</Heading>
            <Text className="mt-2 max-w-3xl">{kit.blurb}</Text>

            <Card className="mt-6">
                <div className="grid place-items-center rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-16 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
                    Running starter kit embeds here. Built from <code className="font-mono">{kit.pkg}</code>.
                </div>
            </Card>
        </Layout>
    );
}
