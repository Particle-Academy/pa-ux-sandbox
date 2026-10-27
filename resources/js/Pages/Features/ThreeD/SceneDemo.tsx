import { Component, lazy, Suspense, useEffect, useMemo, useState, type ComponentType, type ErrorInfo, type ReactNode } from "react";
import { Canvas } from "@particle-academy/fancy-3d/canvas";
import { domAdapter } from "@particle-academy/fancy-3d/dom";
import type { ChartSpec, ProfileSpec, Scene } from "@particle-academy/fancy-3d";
import { Button, Callout, CodeView, Input, MultiSwitch, Select, Skeleton, Text } from "@particle-academy/react-fancy";
import type { EngineSceneProps } from "./engineProps";
import {
    hasWebGL,
    moveNode,
    resolveEngine,
    SEED_SCENE,
    setChartVariant,
    setKpiValue,
    setProfileStatus,
    type Engine,
} from "./sceneModel";

/**
 * One fancy-3d `Scene`, three renderers. The scene is page state; the engine
 * switch only changes who draws it. The DOM renderer (fancy-3d's built-in
 * `<Canvas>`) is always available; the Babylon.js and three.js renderers load
 * on demand, only when WebGL exists, and fall back to the DOM renderer if they
 * fail to start.
 */

const ENGINES: Record<Exclude<Engine, "dom">, ComponentType<EngineSceneProps>> = {
    babylon: lazy(() => import("./BabylonScene")),
    three: lazy(() => import("./ThreeScene")),
};

/** How far the camera swings, in radians, to the viewer's right (+) or left (-). */
const VIEWS = [
    { value: "left", label: "From the left", swing: -0.45 },
    { value: "front", label: "Front", swing: 0 },
    { value: "right", label: "From the right", swing: 0.45 },
] as const;

/**
 * Each engine's front-on camera angle, and which way a growing angle swings it.
 * Both adapters default to pi/2, but Babylon.js is left-handed and three.js
 * right-handed, so the same swing moves the camera opposite ways on screen.
 */
const CAMERA: Record<Exclude<Engine, "dom">, { front: number; rightward: 1 | -1 }> = {
    babylon: { front: Math.PI / 2, rightward: 1 },
    three: { front: Math.PI / 2, rightward: -1 },
};

type View = (typeof VIEWS)[number]["value"];

export default function SceneDemo() {
    const [scene, setScene] = useState<Scene>(SEED_SCENE);
    const [requested, setRequested] = useState<Engine>("dom");
    const [webgl, setWebgl] = useState<boolean | null>(null);
    const [failed, setFailed] = useState<string | null>(null);
    const [view, setView] = useState<View>("front");

    useEffect(() => setWebgl(hasWebGL()), []);

    const engine = resolveEngine(requested, webgl === true);
    const kpi = scene.nodes.find((n) => n.widget.kind === "kpi")?.widget;
    const chart = scene.nodes.find((n) => n.widget.kind === "chart")?.widget as ChartSpec | undefined;
    const profile = scene.nodes.find((n) => n.widget.kind === "profile")?.widget as ProfileSpec | undefined;
    const json = useMemo(() => JSON.stringify(scene, null, 2), [scene]);
    const swing = VIEWS.find((v) => v.value === view)?.swing ?? 0;
    const alpha = engine === "dom" ? undefined : CAMERA[engine].front + CAMERA[engine].rightward * swing;

    const engineList = [
        { value: "dom" as Engine, label: "DOM / CSS-3D" },
        { value: "babylon" as Engine, label: "Babylon.js", disabled: webgl === false },
        { value: "three" as Engine, label: "three.js", disabled: webgl === false },
    ];

    return (
        <div className="threed-demo" data-threed-demo="" data-engine={engine}>
            <div className="threed-demo__controls">
                <MultiSwitch
                    label="Renderer"
                    list={engineList}
                    value={engine}
                    onValueChange={(next) => {
                        setFailed(null);
                        setRequested(next);
                    }}
                    data-threed-engine=""
                />
                {webgl === false && (
                    <Text as="p" size="sm" color="muted">
                        This browser has no WebGL, so the scene stays on the DOM renderer, which needs none.
                    </Text>
                )}
                {failed && (
                    <Callout color="amber">
                        {failed} could not start here, so the scene is back on the DOM renderer.
                    </Callout>
                )}
            </div>

            <div className="threed-demo__stage" data-threed-stage={engine}>
                {engine === "dom" ? (
                    <Canvas className="threed-canvas" showGrid gridStyle="dots" fitOnMount>
                        {scene.nodes.map((node) => (
                            <Canvas.Node
                                key={node.id}
                                id={node.id}
                                x={node.position.x}
                                y={node.position.y}
                                draggable
                                onPositionChange={(x, y) => setScene((s) => moveNode(s, node.id, x, y))}
                                className={`threed-node threed-node--${node.widget.kind}`}
                            >
                                {domAdapter.render(node.widget, { nodeId: node.id, selected: false })}
                            </Canvas.Node>
                        ))}
                        <Canvas.Controls />
                    </Canvas>
                ) : (
                    <EngineBoundary
                        key={`${engine}-${view}`}
                        onFail={() => {
                            setFailed(engine === "babylon" ? "Babylon.js" : "three.js");
                            setRequested("dom");
                        }}
                    >
                        <Suspense fallback={<Skeleton className="threed-demo__skeleton" />}>
                            <EngineView engine={engine} scene={scene} cameraAlpha={alpha} />
                        </Suspense>
                    </EngineBoundary>
                )}
            </div>

            <div className="threed-demo__edit">
                <Input label="Revenue (the KPI node)" value={kpi?.kind === "kpi" ? kpi.value : ""} onValueChange={(v) => setScene((s) => setKpiValue(s, v))} />
                <Select
                    label="Signups chart"
                    list={[
                        { value: "area", label: "Area" },
                        { value: "line", label: "Line" },
                        { value: "bar", label: "Bar" },
                    ]}
                    value={chart?.variant ?? "area"}
                    onValueChange={(v) => setScene((s) => setChartVariant(s, v as ChartSpec["variant"]))}
                />
                <Select
                    label="Owner status"
                    list={[
                        { value: "online", label: "Online" },
                        { value: "away", label: "Away" },
                        { value: "offline", label: "Offline" },
                    ]}
                    value={profile?.status ?? "online"}
                    onValueChange={(v) => setScene((s) => setProfileStatus(s, v as NonNullable<ProfileSpec["status"]>))}
                />
                <Select
                    label="Camera (WebGL renderers)"
                    list={VIEWS.map((v) => ({ value: v.value, label: v.label }))}
                    value={view}
                    onValueChange={(v) => setView(v as View)}
                    disabled={engine === "dom"}
                />
                <div className="threed-demo__reset">
                    <Button icon="rotate-ccw" onClick={() => setScene(SEED_SCENE)}>
                        Reset the scene
                    </Button>
                </div>
            </div>

            <div className="threed-demo__json">
                <Text as="p" size="sm" weight="semibold">
                    The whole scene, as the renderer receives it
                </Text>
                <CodeView value={json} readOnly maxHeight={260} minHeight={120} />
            </div>
        </div>
    );
}

function EngineView({ engine, scene, cameraAlpha }: { engine: Exclude<Engine, "dom"> } & EngineSceneProps) {
    const Renderer = ENGINES[engine];
    return <Renderer scene={scene} cameraAlpha={cameraAlpha} />;
}

/** A WebGL engine that throws while starting hands the scene back to the DOM. */
class EngineBoundary extends Component<{ onFail: () => void; children: ReactNode }, { failed: boolean }> {
    state = { failed: false };

    static getDerivedStateFromError() {
        return { failed: true };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.warn("fancy-3d engine failed to start; falling back to the DOM renderer.", error, info.componentStack);
        this.props.onFail();
    }

    render() {
        return this.state.failed ? null : this.props.children;
    }
}
