import { Head, useForm } from "@inertiajs/react";
import { Button, Callout, Card, Icon, Text, Textarea } from "@particle-academy/react-fancy";
import { adminLayout } from "./AdminLayout";
import { PageHeader } from "./ui";

function Settings({ trackerCode }: { trackerCode: string }) {
    const f = useForm({ tracker_code: trackerCode });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        f.post("/admin/settings", { preserveScroll: true });
    };

    return (
        <>
            <Head title="Settings · Admin" />
            <PageHeader title="Settings" sub="Admin-editable site configuration." />

            <form onSubmit={submit}>
                <Card>
                    <Card.Body>
                        <Text weight="semibold">Site tracker / Fancy Pixel</Text>
                        <Text size="sm" color="muted" className="mt-1">
                            Paste the snippet you got after registering this site in the Showcase. It&apos;s
                            injected into every page on first byte — exactly like an external site embedding our
                            pixel. Leave blank to remove it.
                        </Text>

                        <div className="mt-4">
                            <Textarea
                                label="Tracker snippet"
                                value={f.data.tracker_code}
                                onValueChange={(v) => f.setData("tracker_code", v)}
                                error={f.errors.tracker_code}
                                autoResize
                                minRows={4}
                                spellCheck={false}
                                placeholder={'<script src="https://unpkg.com/@particle-academy/fancy-pixel/dist/fancy-pixel.global.min.js" data-site="YOUR_KEY" data-style="badge" data-mode="floating" data-endpoint="https://your.site/heuristics"></script>'}
                            />
                        </div>

                        <Callout color="violet" icon={<Icon name="info" />} className="mt-4">
                            <Text size="sm">
                                How to get this: register your site at{" "}
                                <a href="/showcase/submit" className="font-medium underline">/showcase/submit</a>,
                                copy the snippet from the install page, and paste it here.
                            </Text>
                        </Callout>

                        <div className="mt-4">
                            <Button type="submit" icon="check" disabled={f.processing}>
                                {f.processing ? "Saving…" : "Save settings"}
                            </Button>
                        </div>
                    </Card.Body>
                </Card>
            </form>
        </>
    );
}

Settings.layout = adminLayout;
export default Settings;
