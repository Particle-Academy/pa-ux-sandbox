import { Head, router, usePage } from "@inertiajs/react";
import { Button, Callout, Icon, Tabs, Text } from "@particle-academy/react-fancy";
import {
    HumansTxtEditor,
    RobotsEditor,
    SecurityTxtEditor,
    XFilePreview,
    emptyHumansTxt,
    emptyRobots,
    emptySecurityTxt,
    type XFilesModel,
} from "@particle-academy/fancy-x-files-ui";
import { type ReactNode, useState } from "react";
import { adminLayout } from "./AdminLayout";
import { SitemapControls, type SitemapControlsModel, type SitemapUrl } from "./SitemapControls";
import { PageHeader } from "./ui";

/** The aggregate model is the x-files model + our dynamic-sitemap controls. */
type WkModel = XFilesModel & { sitemapControls?: SitemapControlsModel };

type Props = {
    model: WkModel;
    protectedPaths: string[];
    isCustomized: boolean;
    sitemapUrls: SitemapUrl[];
};

/**
 * Admin editor for the showcase's own well-known files. One tab strip spans
 * robots.txt / security.txt / humans.txt (fancy-x-files-ui editors + live
 * preview) and sitemap.xml (our dynamic SitemapControls), so the sitemap is a
 * first-class peer rather than a card floating under the text files. The model
 * is controlled here and posted as JSON on save; everything is served by
 * fancy-x-files.
 */
function WellKnownFiles({ model: initial, protectedPaths, isCustomized, sitemapUrls }: Props) {
    const [model, setModel] = useState<WkModel>(initial);
    const [tab, setTab] = useState("robots");
    const [saving, setSaving] = useState(false);
    const flash = usePage<{ flash?: { success?: string } }>().props.flash;

    const save = () => {
        setSaving(true);
        router.post(
            "/admin/well-known-files",
            { model: JSON.stringify(model) },
            { preserveScroll: true, onFinish: () => setSaving(false) },
        );
    };

    const reset = () => {
        if (!window.confirm("Revert to the default well-known files? Your saved edits will be discarded.")) return;
        router.post("/admin/well-known-files/reset", {}, { preserveScroll: true });
    };

    const pane = (editor: ReactNode, preview: ReactNode) => (
        <div className="grid items-start gap-4 md:grid-cols-2">
            <div>{editor}</div>
            <div className="md:sticky md:top-4">{preview}</div>
        </div>
    );

    return (
        <>
            <Head title="Well-known files · Admin" />
            <PageHeader
                title="Well-known files"
                sub="Author robots.txt, security.txt, and humans.txt, and tune the dynamic sitemap.xml — one tab each. All served by fancy-x-files; humans and agents edit the same JSON model."
            />

            <Callout color="violet" icon={<Icon name="shield" />} className="mb-4">
                <Text size="sm">
                    The private paths{" "}
                    <code className="font-mono">{protectedPaths.join(", ") || "—"}</code> stay{" "}
                    <b>Disallowed for every bot</b> and out of the sitemap regardless of what you save here —
                    enforced server-side, so an edit can never expose them.
                </Text>
            </Callout>

            {flash?.success && (
                <Callout color="emerald" icon={<Icon name="check" />} className="mb-4">
                    <Text size="sm">{flash.success}</Text>
                </Callout>
            )}

            <Tabs activeTab={tab} onTabChange={setTab}>
                <Tabs.List>
                    <Tabs.Tab value="robots">robots.txt</Tabs.Tab>
                    <Tabs.Tab value="securityTxt">security.txt</Tabs.Tab>
                    <Tabs.Tab value="humansTxt">humans.txt</Tabs.Tab>
                    <Tabs.Tab value="sitemap">sitemap.xml</Tabs.Tab>
                </Tabs.List>
                <Tabs.Panels>
                    <Tabs.Panel value="robots">
                        {pane(
                            <RobotsEditor
                                value={model.robots ?? emptyRobots()}
                                onChange={(m) => setModel((prev) => ({ ...prev, robots: m }))}
                            />,
                            <XFilePreview kind="robots" model={model.robots ?? emptyRobots()} />,
                        )}
                    </Tabs.Panel>
                    <Tabs.Panel value="securityTxt">
                        {pane(
                            <SecurityTxtEditor
                                value={model.securityTxt ?? emptySecurityTxt()}
                                onChange={(m) => setModel((prev) => ({ ...prev, securityTxt: m }))}
                            />,
                            <XFilePreview kind="securityTxt" model={model.securityTxt ?? emptySecurityTxt()} />,
                        )}
                    </Tabs.Panel>
                    <Tabs.Panel value="humansTxt">
                        {pane(
                            <HumansTxtEditor
                                value={model.humansTxt ?? emptyHumansTxt()}
                                onChange={(m) => setModel((prev) => ({ ...prev, humansTxt: m }))}
                            />,
                            <XFilePreview kind="humansTxt" model={model.humansTxt ?? emptyHumansTxt()} />,
                        )}
                    </Tabs.Panel>
                    <Tabs.Panel value="sitemap">
                        <SitemapControls
                            urls={sitemapUrls}
                            value={model.sitemapControls ?? {}}
                            onChange={(sc) => setModel((prev) => ({ ...prev, sitemapControls: sc }))}
                        />
                    </Tabs.Panel>
                </Tabs.Panels>
            </Tabs>

            <div className="mt-5 flex items-center gap-3">
                <Button icon="check" onClick={save} disabled={saving}>
                    {saving ? "Publishing…" : "Save & publish"}
                </Button>
                {isCustomized && (
                    <Button variant="ghost" icon="rotate-ccw" onClick={reset} disabled={saving}>
                        Reset to default
                    </Button>
                )}
            </div>
        </>
    );
}

WellKnownFiles.layout = adminLayout;
export default WellKnownFiles;
