import { Head } from "@inertiajs/react";
import { Breadcrumbs, Card, Heading, Text } from "@particle-academy/react-fancy";
import { Layout } from "../Layout";
import { ReactDashboardKit } from "./kits/ReactDashboardKit";
import { WorkflowStudioKit } from "./kits/WorkflowStudioKit";
import { CollabBoardKit } from "./kits/CollabBoardKit";
import { EmbeddedIdeKit } from "./kits/EmbeddedIdeKit";
import { SpreadsheetStudioKit } from "./kits/SpreadsheetStudioKit";
import { DiagramStudioKit } from "./kits/DiagramStudioKit";

type Kit = { slug: string; name: string; pkg: string; blurb: string };

const KITS: Record<string, () => JSX.Element> = {
    "react-fancy": ReactDashboardKit,
    "fancy-flow": WorkflowStudioKit,
    "fancy-whiteboard": CollabBoardKit,
    "fancy-code": EmbeddedIdeKit,
    "fancy-sheets": SpreadsheetStudioKit,
    "fancy-echarts": DiagramStudioKit,
};

export default function StarterKitsShow({ kit }: { kit: Kit }) {
    const KitDemo = KITS[kit.slug];

    return (
        <Layout>
            <Head title={`${kit.name} · Starter Kit`} />

            <Breadcrumbs>
                <Breadcrumbs.Item href="/starter-kits">Starter Kits</Breadcrumbs.Item>
                <Breadcrumbs.Item>{kit.name}</Breadcrumbs.Item>
            </Breadcrumbs>

            <div className="mt-3 mb-6">
                <Heading level={1} size="xl">{kit.name}</Heading>
                <Text className="mt-2 max-w-3xl">{kit.blurb}</Text>
                <Text size="xs" className="mt-2 !text-zinc-400 font-mono">
                    headline package: {kit.pkg}
                </Text>
            </div>

            {KitDemo ? (
                <KitDemo />
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
