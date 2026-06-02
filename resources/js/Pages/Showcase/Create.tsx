import { Head, Link } from "@inertiajs/react";
import { useFancyForm } from "@particle-academy/fancy-inertia";
import {
    Button,
    Badge,
    Breadcrumbs,
    Card,
    
    Heading,
    Text,
} from "@particle-academy/react-fancy";
import { Layout } from "../Layout";

type Form = {
    kind: "website" | "repo";
    url: string;
    title: string;
    description: string;
};

export default function ShowcaseCreate() {
    const form = useFancyForm<Form>({
        kind: "website",
        url: "",
        title: "",
        description: "",
    });

    return (
        <Layout>
            <Head title="Submit · Designer Showcase" />

            <Breadcrumbs>
                <Breadcrumbs.Item href="/showcase">Showcase</Breadcrumbs.Item>
                <Breadcrumbs.Item>Submit</Breadcrumbs.Item>
            </Breadcrumbs>

            <Heading level={1} size="xl" className="mt-3">Submit a site or repo</Heading>
            <Text className="mt-2 max-w-2xl">
                We'll fetch your URL and check for Fancy UI usage before listing it on the showcase.
            </Text>

            <Card className="mt-6 max-w-xl">
                <Card.Body>
                    <form
                        method="POST"
                        action="/showcase/submit"
                        onSubmit={(e) => {
                            e.preventDefault();
                            form.post("/showcase/submit");
                        }}
                        className="space-y-4"
                    >
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                                Kind
                            </label>
                            <div className="mt-1 inline-flex overflow-hidden rounded-md border border-zinc-300 dark:border-zinc-700">
                                {(["website", "repo"] as const).map((k) => (
                                    <label
                                        key={k}
                                        className={`cursor-pointer px-3 py-1.5 text-xs ${
                                            form.data.kind === k
                                                ? "bg-violet-600 text-white"
                                                : "text-zinc-600 dark:text-zinc-300"
                                        } ${k === "repo" ? "border-l border-zinc-300 dark:border-zinc-700" : ""}`}
                                    >
                                        <input
                                            type="radio"
                                            name="kind"
                                            value={k}
                                            checked={form.data.kind === k}
                                            onChange={() => form.setData("kind", k)}
                                            className="sr-only"
                                        />
                                        {k === "website" ? "Website" : "Repo"}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                                URL
                            </label>
                            <input
                                type="url"
                                required
                                maxLength={255}
                                value={form.data.url}
                                onChange={(e) => form.setData("url", e.target.value)}
                                placeholder="https://your-site.com or https://github.com/you/your-app"
                                className="mt-1 w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-violet-500 dark:border-zinc-700"
                            />
                            {form.errors.url && (
                                <Text size="xs" className="mt-1 text-red-600">{form.errors.url}</Text>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                                Title <Badge color="zinc" size="sm">optional</Badge>
                            </label>
                            <input
                                type="text"
                                maxLength={120}
                                value={form.data.title}
                                onChange={(e) => form.setData("title", e.target.value)}
                                className="mt-1 w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-violet-500 dark:border-zinc-700"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                                Description <Badge color="zinc" size="sm">optional</Badge>
                            </label>
                            <textarea
                                rows={3}
                                maxLength={600}
                                value={form.data.description}
                                onChange={(e) => form.setData("description", e.target.value)}
                                className="mt-1 w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-violet-500 dark:border-zinc-700"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <Button as={Link} href="/showcase" variant="ghost">Cancel</Button>
                            <Button type="submit" color="violet" disabled={form.processing}>
                                Submit for review
                            </Button>
                        </div>
                    </form>
                </Card.Body>
            </Card>
        </Layout>
    );
}
