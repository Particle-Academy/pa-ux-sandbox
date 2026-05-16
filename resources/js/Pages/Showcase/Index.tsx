import { Head, Link, usePage } from "@inertiajs/react";
import { Action, Card, Heading, Text } from "@particle-academy/react-fancy";
import { Layout } from "../Layout";

type Submission = {
    id: number;
    kind: "website" | "repo";
    url: string;
    title: string | null;
    description: string | null;
    thumbnail_url: string | null;
};

export default function ShowcaseIndex({ submissions }: { submissions: Submission[] }) {
    const { props } = usePage<{ auth: { user: unknown } }>();
    const isAuth = !!props.auth?.user;

    return (
        <Layout>
            <Head title="Designer Showcase · Fancy UI" />

            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <Heading level={1} size="xl">Designer Showcase</Heading>
                    <Text className="mt-2 max-w-3xl">
                        Live sites and public repos built with Fancy UI. Every submission is scanned for
                        <code className="mx-1 font-mono">@particle-academy/*</code> /
                        <code className="mx-1 font-mono">particle-academy/*</code> usage before listing.
                    </Text>
                </div>
                {isAuth ? (
                    <Action as={Link} href="/showcase/submit" color="violet">
                        Submit a site or repo
                    </Action>
                ) : (
                    <Action as="a" href="/auth/github" color="zinc">
                        Sign in to submit
                    </Action>
                )}
            </div>

            {submissions.length === 0 ? (
                <Card className="mt-6">
                    <div className="p-10 text-center text-sm text-zinc-500">
                        No verified submissions yet. Be the first — sign in and submit your site.
                    </div>
                </Card>
            ) : (
                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {submissions.map((s) => (
                        <a
                            key={s.id}
                            href={s.url}
                            target="_blank"
                            rel="noopener"
                            className="block"
                        >
                            <Card className="overflow-hidden transition hover:-translate-y-px hover:shadow-md">
                                {s.thumbnail_url ? (
                                    <img src={s.thumbnail_url} alt="" className="h-32 w-full object-cover" />
                                ) : (
                                    <div className="grid h-32 place-items-center bg-zinc-50 text-sm text-zinc-500 dark:bg-zinc-900">
                                        {s.kind === "repo" ? "⎇ repo" : "🌐 site"}
                                    </div>
                                )}
                                <Card.Body>
                                    <Heading level={2} size="sm">
                                        {s.title ?? new URL(s.url).hostname}
                                    </Heading>
                                    {s.description && (
                                        <Text size="xs" className="mt-1">{s.description}</Text>
                                    )}
                                </Card.Body>
                            </Card>
                        </a>
                    ))}
                </div>
            )}
        </Layout>
    );
}
