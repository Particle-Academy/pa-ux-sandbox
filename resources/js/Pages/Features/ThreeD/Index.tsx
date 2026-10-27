import { Card, Skeleton, Text } from "@particle-academy/react-fancy";
import { clientOnly } from "@/lib/clientOnly";
import { DemoFrame } from "../shared/DemoFrame";
import { FeatureCta } from "../shared/FeatureCta";
import { FeatureHero } from "../shared/FeatureHero";
import { FeatureShell } from "../shared/FeatureShell";
import { FeatureTour } from "../shared/FeatureTour";
import { HowItFits } from "../shared/HowItFits";
import { InstallSteps } from "../shared/InstallSteps";
import { PackagesGrid } from "../shared/PackagesGrid";
import type { FeaturePageProps } from "../shared/types";

/**
 * /features/3d — one Scene, any renderer.
 *
 * The directory is `ThreeD` because the slug starts with a digit.
 *
 * The demo is client-only: the WebGL engines need `window`, and the DOM
 * renderer measures layout, so there is nothing true to render on the server.
 */
const SceneDemo = clientOnly(() => import("./SceneDemo"), SceneDemoFallback);

function SceneDemoFallback() {
    return (
        <div className="threed-demo" aria-busy="true">
            <Skeleton className="threed-demo__skeleton" />
        </div>
    );
}

const LAYERS = [
    { name: "three.js", note: "fancy-3d-three" },
    { name: "Babylon.js", note: "fancy-3d-babylon" },
    { name: "DOM / CSS-3D", note: "fancy-3d" },
];

export default function ThreeDFeature({ feature, versions }: FeaturePageProps) {
    return (
        <FeatureShell feature={feature}>
            <FeatureHero
                feature={feature}
                eyebrow="One scene, any renderer"
                title="3D that does not pick an engine for you"
                lede="Describe a scene as plain JSON. Render it in the DOM with no WebGL at all, or hand the same data to Babylon.js or three.js through an adapter you install only if you want it."
                languages={feature.languages}
            >
                <div className="threed-hero__stack" aria-hidden>
                    {LAYERS.map((layer) => (
                        <Card key={layer.name} variant="outlined" padding="sm" className="threed-hero__layer">
                            <Text as="span" size="sm" weight="semibold">
                                {layer.name}
                            </Text>
                            <Text as="span" size="sm" color="muted">
                                {layer.note}
                            </Text>
                        </Card>
                    ))}
                </div>
            </FeatureHero>

            <DemoFrame
                label="One fancy-3d Scene, three renderers"
                id="3d"
                caption="Switch the renderer and the scene stays the same, because it is the same data. Drag nodes in the DOM view, change the widgets below, then pick Babylon.js or three.js: the KPI is a live Monitor, the others are painted Card3D meshes. Without WebGL the WebGL renderers are disabled and the DOM view remains."
            >
                <SceneDemo />
            </DemoFrame>

            <FeatureTour
                title="What it does"
                items={[
                    {
                        icon: "braces",
                        title: "A scene is JSON",
                        body: "A Scene is nodes and edges. Each node has a position, a size and a widget: fourteen kinds, from kpi, chart and profile to kanban, table, timeline and form. An agent can write one without touching an engine API.",
                    },
                    {
                        icon: "layers",
                        title: "An engine-pluggable Canvas",
                        body: "<Canvas> defaults to engine=\"dom\", a CSS matrix projection with pan, zoom, a grid and draggable nodes. Pass babylonEngine, threeEngine or your own CanvasEngine to put a WebGL scene alongside the same node graph.",
                    },
                    {
                        icon: "feather",
                        title: "No WebGL in the core",
                        body: "fancy-3d's only peers are React and react-fancy. @babylonjs/core is a peer of fancy-3d-babylon and three is a peer of fancy-3d-three, so you install an engine only if you pick one.",
                    },
                    {
                        icon: "monitor",
                        title: "Stage, Monitor and Card3D",
                        body: "Each adapter's /react entry ships <Stage> and <Monitor>, which mounts live, interactive React onto a mesh. createCard3D paints a widget onto an extruded card. The three.js adapter mirrors the Babylon.js one, call for call.",
                    },
                    {
                        icon: "bot",
                        title: "A scene bridge for agents",
                        body: "registerSceneBridge gives an agent scene_describe, scene_get_state, scene_add_object, scene_update_object, scene_delete_object, scene_set_camera and scene_set_background, over a scene of primitive objects your app owns. Every write broadcasts an agent-activity event, so presence layers see what changed.",
                    },
                ]}
            />

            <HowItFits
                members={feature.members}
                bridges={feature.bridges}
                intro="The core is engine-agnostic; each adapter is an optional sibling that brings one WebGL engine."
            />
            <InstallSteps members={feature.members} versions={versions} intro="The core alone renders in the DOM. Add an adapter (and its engine) only for WebGL." />
            <PackagesGrid members={feature.members} versions={versions} />

            <FeatureCta
                title="Start with the DOM, add an engine when you need one"
                body="The Canvas page shows the DOM and Babylon.js engines side by side; the Stage, Monitor and Card3D pages run each adapter live."
                primary={{ label: "The Canvas", href: "/packages/fancy-3d/canvas" }}
                secondary={{ label: "Stage on three.js", href: "/packages/fancy-3d-three/stage" }}
            />
        </FeatureShell>
    );
}
