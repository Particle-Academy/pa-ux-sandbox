import { Head, Link } from "@inertiajs/react";
import { useState } from "react";
import { Button, Badge, Breadcrumbs, Card, FauxClient, Heading, Text } from "@particle-academy/react-fancy";
import { Layout } from "../Layout";
import { ReactDashboardKit } from "./kits/ReactDashboardKit";
import { WorkflowStudioKit } from "./kits/WorkflowStudioKit";
import { CollabBoardKit } from "./kits/CollabBoardKit";
import { EmbeddedIdeKit } from "./kits/EmbeddedIdeKit";
import { SpreadsheetStudioKit } from "./kits/SpreadsheetStudioKit";
import { DiagramStudioKit } from "./kits/DiagramStudioKit";
import { RealtimeChatKit } from "./kits/RealtimeChatKit";
import { ShopNSubKit } from "./kits/ShopNSubKit";

type Kit = { slug: string; name: string; pkg: string; blurb: string };

const KITS: Record<string, () => JSX.Element> = {
    "fancy-query": RealtimeChatKit,
    "react-fancy": ReactDashboardKit,
    "fancy-flow": WorkflowStudioKit,
    "fancy-whiteboard": CollabBoardKit,
    "fancy-code": EmbeddedIdeKit,
    "fancy-sheets": SpreadsheetStudioKit,
    "fancy-echarts": DiagramStudioKit,
    "shop-n-sub": ShopNSubKit,
};

export default function StarterKitsShow({ kit }: { kit: Kit }) {
    const KitDemo = KITS[kit.slug];
    const downloadUrl = `/starter-kits/${kit.slug}/download.zip`;
    const [copied, setCopied] = useState(false);

    return (
        <Layout>
            <Head title={`${kit.name} · Starter Kit`} />

            <Breadcrumbs>
                <Breadcrumbs.Item href="/starter-kits">Starter Kits</Breadcrumbs.Item>
                <Breadcrumbs.Item>{kit.name}</Breadcrumbs.Item>
            </Breadcrumbs>

            <div className="mt-3 mb-6 flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <Heading as="h1" size="xl" className="!text-zinc-900 dark:!text-zinc-100">{kit.name}</Heading>
                        <Badge color="violet" size="sm">starter kit</Badge>
                    </div>
                    <Text className="mt-2 max-w-3xl !text-zinc-600 dark:!text-zinc-300">{kit.blurb}</Text>
                    <Text size="xs" className="mt-2 !font-mono !text-zinc-500">
                        built with{" "}
                        <Link href={`/packages/${kit.pkg}`} className="!font-medium !text-violet-500 hover:underline">
                            {kit.pkg}
                        </Link>
                    </Text>
                </div>
                <div className="flex flex-wrap items-stretch gap-2">
                    <Button as="a" href={downloadUrl} color="violet" icon="arrow-down-tray">
                        Download zip
                    </Button>
                </div>
            </div>

            <Card className="mb-6">
                <Card.Body className="!py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                            <Text size="xs" className="!font-semibold !uppercase !tracking-wider !text-zinc-500">Get it locally</Text>
                            <div className="mt-1 flex items-center gap-3 rounded-md bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-100">
                                <span className="text-zinc-500">$</span>
                                <code className="truncate">curl -L https://ui.particle.academy/starter-kits/{kit.slug}/download.zip -o {kit.slug}.zip &amp;&amp; unzip {kit.slug}.zip &amp;&amp; cd {kit.slug}-starter &amp;&amp; npm install &amp;&amp; npm run dev</code>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(`curl -L https://ui.particle.academy/starter-kits/${kit.slug}/download.zip -o ${kit.slug}.zip && unzip ${kit.slug}.zip && cd ${kit.slug}-starter && npm install && npm run dev`).then(() => {
                                            setCopied(true);
                                            window.setTimeout(() => setCopied(false), 1200);
                                        });
                                    }}
                                    className="shrink-0 rounded border border-zinc-700 px-2 py-0.5 text-[10px] font-medium text-zinc-300 hover:bg-zinc-800"
                                >
                                    {copied ? "copied" : "copy"}
                                </button>
                            </div>
                        </div>
                    </div>
                    <Text size="xs" className="mt-2 !text-zinc-500">
                        Self-contained Vite + React 19 + Tailwind v4 project. ~12 KB. Edit{" "}
                        <code className="rounded bg-zinc-100 px-1 font-mono text-[10px] dark:bg-zinc-800">src/Kit.tsx</code>{" "}
                        to make it yours. MIT.
                    </Text>
                </Card.Body>
            </Card>

            {/* Each kit demo is a full desktop app layout. Render it in a FauxClient
                browser frame at its natural desktop width and let scale="fit" shrink
                the WHOLE preview to the container — so on mobile you see the complete
                app, proportional, instead of a crushed/clipped layout. */}
            {KitDemo ? (
                <FauxClient
                    variant="browser"
                    url={`localhost:5173 · ${kit.name}`}
                    meta="dev"
                    width={1240}
                    scale="fit"
                >
                    <KitDemo />
                </FauxClient>
            ) : (
                <Card>
                    <div className="grid place-items-center rounded-md p-16 text-sm text-zinc-500">
                        Starter kit not wired up yet.
                    </div>
                </Card>
            )}
        </Layout>
    );
}
