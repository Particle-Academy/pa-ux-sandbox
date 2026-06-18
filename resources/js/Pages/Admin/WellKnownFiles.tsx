import { Head, router, usePage } from "@inertiajs/react";
import { Button, Callout, Icon, Text } from "@particle-academy/react-fancy";
import { XFilesManager, type XFilesModel } from "@particle-academy/fancy-x-files-ui";
import { useState } from "react";
import { adminLayout } from "./AdminLayout";
import { PageHeader } from "./ui";

type Props = {
    model: XFilesModel;
    protectedPaths: string[];
    isCustomized: boolean;
};

/**
 * Admin editor for the showcase's own well-known files, mounting
 * @particle-academy/fancy-x-files-ui's XFilesManager over the JSON model the
 * server (App\Support\XFilesFiles) renders into robots.txt / security.txt /
 * humans.txt. The model is controlled here and posted as JSON on save.
 */
function WellKnownFiles({ model: initial, protectedPaths, isCustomized }: Props) {
    const [model, setModel] = useState<XFilesModel>(initial);
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

    return (
        <>
            <Head title="Well-known files · Admin" />
            <PageHeader
                title="Well-known files"
                sub="Author robots.txt, security.txt, humans.txt, llms.txt, sitemap, and AGENTS — served by fancy-x-files. Humans and agents edit the same JSON model."
            />

            <Callout color="violet" icon={<Icon name="shield" />} className="mb-4">
                <Text size="sm">
                    The private paths{" "}
                    <code className="font-mono">{protectedPaths.join(", ") || "—"}</code> stay{" "}
                    <b>Disallowed for every bot</b> regardless of what you save here — enforced server-side, so an
                    edit can never expose them. Saving republishes robots/security/humans immediately.
                </Text>
            </Callout>

            {flash?.success && (
                <Callout color="emerald" icon={<Icon name="check" />} className="mb-4">
                    <Text size="sm">{flash.success}</Text>
                </Callout>
            )}

            <XFilesManager value={model} onChange={setModel} />

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
