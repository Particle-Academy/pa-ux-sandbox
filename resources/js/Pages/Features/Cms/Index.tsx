import { useCallback, useMemo, useState } from "react";
import { Link } from "@inertiajs/react";
import { Badge, Button, Callout, Card, CodeView, Grid, Heading, Stat, Tabs, Text } from "@particle-academy/react-fancy";
import { CmsPage, Editor, type PageDoc } from "@particle-academy/fancy-cms-ui";
import { DemoFrame } from "../shared/DemoFrame";
import { FeatureCta } from "../shared/FeatureCta";
import { FeatureHero } from "../shared/FeatureHero";
import { FeatureShell } from "../shared/FeatureShell";
import { FeatureTour } from "../shared/FeatureTour";
import { HowItFits } from "../shared/HowItFits";
import { InstallSteps } from "../shared/InstallSteps";
import { PackagesGrid } from "../shared/PackagesGrid";
import type { FeaturePageProps } from "../shared/types";
import { CMS_GUIDES, CMS_TOUR } from "./content";
import { CART_PAGE, CMS_ICONS, imageResolver } from "./seed";
import "./cms.css";

/**
 * /features/cms: the CMS micro-site.
 *
 * Identity: an editorial "proof sheet". Serif display type (the Feature's
 * `serif` font role), a ruled masthead and rose proof marks, because this is
 * the Feature about laying out pages.
 *
 * The demo is the real `Editor` from the installed
 * @particle-academy/fancy-cms-ui, on a seeded Stages document (./seed.ts),
 * with a `CmsPage` beside it rendering the same document as a published page,
 * and the document itself as JSON. Edits stay in this tab.
 */
export default function CmsFeature({ feature, versions }: FeaturePageProps) {
    const [doc, setDoc] = useState<PageDoc>(CART_PAGE);
    const [edits, setEdits] = useState(0);
    const [view, setView] = useState("edit");
    const [resetKey, setResetKey] = useState(0);

    // Stable identity: the Editor re-notifies when its onChange prop changes,
    // so an inline closure would loop (notify, setState, new closure).
    const handleChange = useCallback((next: PageDoc) => {
        setDoc(next);
        setEdits((n) => n + 1);
    }, []);

    const reset = () => {
        setDoc(CART_PAGE);
        setEdits(0);
        setResetKey((k) => k + 1);
    };

    const json = useMemo(() => JSON.stringify(doc, null, 2), [doc]);
    const nodeCount = Object.keys(doc.nodes).length;

    return (
        <FeatureShell feature={feature}>
            <div className="cms-site">
                <FeatureHero
                    feature={feature}
                    eyebrow="Feature · Early release"
                    title="Pages, edited in place"
                    lede="A WYSIWYG page editor in React, on one JSON page document that the PHP renderer in fancy-cms turns into the same HTML and CSS."
                    languages={feature.languages}
                    actions={
                        <>
                            <Button href="#cms-demo" icon="pen-line" color="rose">
                                Edit the page below
                            </Button>
                            <Button href="/cms/home" as={Link} variant="ghost" iconTrailing="arrow-right">
                                This site's home page, as a CMS document
                            </Button>
                        </>
                    }
                >
                    <Callout color="amber" className="cms-site__beta">
                        fancy-cms and fancy-cms-ui are 0.x, early-release packages. Expect rough edges and breaking
                        changes between minor releases; each changelog says what to do.
                    </Callout>
                </FeatureHero>

                <div id="cms-demo" className="cms-site__anchor">
                    <DemoFrame
                        id="cms"
                        label="fancy-cms-ui Editor"
                        caption="Select a node in the layers panel or on the canvas, drag it, or change its text and colour in the inspector. Then open Published to see the same document rendered by CmsPage. Nothing is saved."
                    >
                        <div className="cms-demo">
                            <div className="cms-demo__bar">
                                <Tabs activeTab={view} onTabChange={setView} variant="pills">
                                    <Tabs.List className="cms-demo__tabs">
                                        <Tabs.Tab value="edit">Editor</Tabs.Tab>
                                        <Tabs.Tab value="published">Published</Tabs.Tab>
                                        <Tabs.Tab value="json">Document JSON</Tabs.Tab>
                                    </Tabs.List>
                                </Tabs>
                                <Button variant="ghost" icon="rotate-ccw" onClick={reset} disabled={edits === 0}>
                                    Reset
                                </Button>
                            </div>

                            <Stat.Band columns={3} className="cms-demo__stats" data-cms-readout="">
                                <Stat size="sm" value={edits} label="edits from onChange" />
                                <Stat size="sm" value={doc.seq} label="document seq" />
                                <Stat size="sm" value={nodeCount} label="nodes" />
                            </Stat.Band>

                            {/* Kept mounted so editor history survives a look at the other views. */}
                            <div className="cms-demo__editor" hidden={view !== "edit"} data-cms-editor="">
                                <Editor
                                    key={resetKey}
                                    defaultValue={CART_PAGE}
                                    onChange={handleChange}
                                    icons={CMS_ICONS}
                                    imageResolver={imageResolver}
                                />
                            </div>

                            {view === "published" && (
                                <div className="cms-demo__published" data-cms-published="">
                                    <CmsPage doc={doc} icons={CMS_ICONS} imageResolver={imageResolver} />
                                </div>
                            )}

                            {view === "json" && (
                                <div className="cms-demo__json">
                                    <CodeView value={json} language="plaintext" readOnly minHeight={200} />
                                </div>
                            )}
                        </div>
                    </DemoFrame>
                </div>

                <FeatureTour
                    title="What it does"
                    intro="What ships today in fancy-cms-ui 0.13 and fancy-cms 0.8."
                    items={CMS_TOUR}
                />

                <section className="feature-section cms-guides">
                    <Heading as="h2" size="lg" weight="semibold" className="feature-display">
                        Read the webmaster guides
                    </Heading>
                    <Text as="p" color="muted" className="feature-section__intro">
                        Written for whoever builds and publishes pages, human or agent. They ship inside each package, so
                        the copy you install matches the code you run.
                    </Text>
                    <Grid cols={2} gap="md" className="feature-section__grid">
                        {CMS_GUIDES.map((guide) => (
                            <a
                                key={`${guide.repo}/${guide.file}`}
                                href={guide.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="cms-guides__link"
                            >
                                <Card variant="outlined" interactive className="cms-guides__card">
                                    <Card.Body>
                                        <Heading as="h3" size="sm" weight="semibold">
                                            {guide.title}
                                        </Heading>
                                        <div className="cms-guides__meta">
                                            <Badge variant="soft">
                                                {guide.repo}
                                            </Badge>
                                            <code className="feature-code">{guide.file}</code>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </a>
                        ))}
                    </Grid>
                </section>

                <HowItFits
                    members={feature.members}
                    bridges={feature.bridges}
                    intro="Author in React, render anywhere: the editor and the React renderer live in fancy-cms-ui, and fancy-cms renders and validates the same document in Laravel."
                />
                <InstallSteps members={feature.members} versions={versions} />
                <PackagesGrid members={feature.members} versions={versions} />

                <FeatureCta
                    title="Put a page editor in your Laravel app"
                    body="Start with the React editor and renderer, then add fancy-cms when the server should render and validate the pages."
                    primary={{ label: "fancy-cms-ui package", href: "/packages/fancy-cms-ui" }}
                    secondary={{ label: "fancy-cms package", href: "/packages/fancy-cms" }}
                />
            </div>
        </FeatureShell>
    );
}
