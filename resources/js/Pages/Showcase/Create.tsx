import { Head, Link } from "@inertiajs/react";
import { useFancyForm } from "@particle-academy/fancy-inertia";
import {
    Button,
    Badge,
    Breadcrumbs,
    Callout,
    Card,
    Heading,
    Icon,
    Text,
} from "@particle-academy/react-fancy";
import { Layout } from "../Layout";

type Style = "badge" | "mark" | "beacon";
type Mode = "placed" | "floating";

type Form = {
    kind: "website" | "repo";
    url: string;
    title: string;
    description: string;
    style: Style;
    mode: Mode;
};

const STYLES: { value: Style; label: string; hint: string }[] = [
    { value: "badge", label: "Badge", hint: "“Powered by Fancy UI” pill" },
    { value: "mark", label: "Mark", hint: "compact logo mark" },
    { value: "beacon", label: "Beacon", hint: "minimal dot" },
];

const MODES: { value: Mode; label: string; hint: string }[] = [
    { value: "floating", label: "Floating", hint: "fixed corner overlay" },
    { value: "placed", label: "Placed", hint: "inline where you drop it" },
];

function Segmented<T extends string>({
    options,
    value,
    onChange,
    name,
}: {
    options: { value: T; label: string; hint: string }[];
    value: T;
    onChange: (v: T) => void;
    name: string;
}) {
    return (
        <div className="mt-1 grid gap-2 sm:grid-cols-3">
            {options.map((o) => {
                const active = value === o.value;
                return (
                    <label
                        key={o.value}
                        className={`cursor-pointer rounded-lg border px-3 py-2 text-left transition ${
                            active
                                ? "border-violet-500 bg-violet-50 dark:bg-violet-950/40"
                                : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-700"
                        }`}
                    >
                        <input
                            type="radio"
                            name={name}
                            value={o.value}
                            checked={active}
                            onChange={() => onChange(o.value)}
                            className="sr-only"
                        />
                        <span className="block text-sm font-semibold">{o.label}</span>
                        <span className="block text-[11px] text-zinc-500">{o.hint}</span>
                    </label>
                );
            })}
        </div>
    );
}

export default function ShowcaseCreate() {
    const form = useFancyForm<Form>({
        kind: "website",
        url: "",
        title: "",
        description: "",
        style: "badge",
        mode: "floating",
    });

    const isWebsite = form.data.kind === "website";

    return (
        <Layout>
            <Head title="Register · Designer Showcase" />

            <Breadcrumbs>
                <Breadcrumbs.Item href="/showcase">Showcase</Breadcrumbs.Item>
                <Breadcrumbs.Item>Register</Breadcrumbs.Item>
            </Breadcrumbs>

            <Heading level={1} size="xl" className="mt-3">
                Register your site
            </Heading>
            <Text className="mt-2 max-w-2xl">
                Register your site and we&apos;ll generate your Fancy Pixel snippet. Your
                site appears in the Showcase once the pixel is verified — just like adding
                an analytics tag.
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
                        className="space-y-5"
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
                                <Text size="xs" className="mt-1 text-red-600">
                                    {form.errors.url}
                                </Text>
                            )}
                        </div>

                        {isWebsite && (
                            <>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                                        Pixel style
                                    </label>
                                    <Segmented
                                        name="style"
                                        options={STYLES}
                                        value={form.data.style}
                                        onChange={(v) => form.setData("style", v)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                                        Placement
                                    </label>
                                    <Segmented
                                        name="mode"
                                        options={MODES}
                                        value={form.data.mode}
                                        onChange={(v) => form.setData("mode", v)}
                                    />
                                </div>

                                <Callout color="violet" icon={<Icon name="sparkles" />}>
                                    <Text size="xs">
                                        We&apos;ll generate a one-line snippet on the next step.
                                        Paste it in your <code className="rounded bg-violet-100 px-1 dark:bg-violet-900/40">&lt;head&gt;</code>{" "}
                                        and we detect it automatically — no review queue, no
                                        blocking.
                                    </Text>
                                </Callout>
                            </>
                        )}

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
                            <Button as={Link} href="/showcase" variant="ghost">
                                Cancel
                            </Button>
                            <Button type="submit" color="violet" disabled={form.processing}>
                                Register site
                            </Button>
                        </div>
                    </form>
                </Card.Body>
            </Card>
        </Layout>
    );
}
