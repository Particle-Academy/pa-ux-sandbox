import { Head } from "@inertiajs/react";
import { Badge, Card, Heading, Text } from "@particle-academy/react-fancy";
import { Layout } from "../Layout";

type Archive = {
    id: number;
    slug: string;
    title: string;
    blurb: string | null;
    pkg: string | null;
    theme: string | null;
    up_votes: number;
    down_votes: number;
    reason: string;
    archived_at: string;
};

export default function DreamingArchived({ archives }: { archives: Archive[] }) {
    return (
        <Layout>
            <Head title="Archived dreams · Fancy UI" />

            <Heading level={1} size="xl">Archived dreams</Heading>
            <Text className="mt-2 max-w-3xl">
                Dreams whose net votes went negative are archived here. We keep them so
                we know what's already been considered and rejected.
            </Text>

            {archives.length === 0 ? (
                <Card className="mt-6">
                    <div className="p-10 text-center text-sm text-zinc-500">Nothing archived yet.</div>
                </Card>
            ) : (
                <Card className="mt-6">
                    <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {archives.map((a) => (
                            <li key={a.id} className="px-4 py-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Heading level={2} size="sm">{a.title}</Heading>
                                    {a.pkg && <Badge color="zinc" size="sm">{a.pkg}</Badge>}
                                    {a.theme && <Text size="xs" className="text-zinc-500">— {a.theme}</Text>}
                                </div>
                                {a.blurb && <Text size="sm" className="mt-0.5">{a.blurb}</Text>}
                                <Text size="xs" className="mt-1 text-zinc-500">
                                    archived {new Date(a.archived_at).toLocaleDateString()} · {a.up_votes} 👍 / {a.down_votes} 👎 · reason: <code className="font-mono">{a.reason}</code>
                                </Text>
                            </li>
                        ))}
                    </ul>
                </Card>
            )}
        </Layout>
    );
}
