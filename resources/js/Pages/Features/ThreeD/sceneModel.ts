import type { ChartSpec, KpiSpec, ProfileSpec, Scene, SceneNode } from "@particle-academy/fancy-3d";

/**
 * The 3D demo's one scene: plain fancy-3d `Scene` JSON, owned by the page and
 * handed to whichever renderer is selected. Every edit goes through a pure
 * function here, so the renderers only ever read.
 */

export type Engine = "dom" | "babylon" | "three";

export const SEED_SCENE: Scene = {
    nodes: [
        {
            id: "revenue",
            position: { x: 0, y: 40 },
            size: { w: 240, h: 150 },
            widget: { kind: "kpi", label: "Revenue", value: "$48.2k", delta: "+12.4%", trend: "up" },
        },
        {
            id: "signups",
            position: { x: 300, y: 0 },
            size: { w: 300, h: 220 },
            widget: { kind: "chart", title: "Signups", variant: "area", series: [3, 7, 5, 9, 12, 10, 15, 14, 18], color: "#8b5cf6" },
        },
        {
            id: "owner",
            position: { x: 660, y: 40 },
            size: { w: 240, h: 150 },
            widget: { kind: "profile", name: "Ava Wu", role: "Admin", initials: "AW", status: "online" },
        },
    ],
    edges: [],
};

function updateWidget<K extends SceneNode["widget"]["kind"]>(
    scene: Scene,
    kind: K,
    patch: (widget: Extract<SceneNode["widget"], { kind: K }>) => Extract<SceneNode["widget"], { kind: K }>,
): Scene {
    return {
        ...scene,
        nodes: scene.nodes.map((node) =>
            node.widget.kind === kind ? { ...node, widget: patch(node.widget as Extract<SceneNode["widget"], { kind: K }>) } : node,
        ),
    };
}

export function setKpiValue(scene: Scene, value: string): Scene {
    return updateWidget(scene, "kpi", (w: KpiSpec) => ({ ...w, value }));
}

export function setChartVariant(scene: Scene, variant: ChartSpec["variant"]): Scene {
    return updateWidget(scene, "chart", (w: ChartSpec) => ({ ...w, variant }));
}

export function setProfileStatus(scene: Scene, status: NonNullable<ProfileSpec["status"]>): Scene {
    return updateWidget(scene, "profile", (w: ProfileSpec) => ({ ...w, status }));
}

export function moveNode(scene: Scene, id: string, x: number, y: number): Scene {
    return {
        ...scene,
        nodes: scene.nodes.map((node) => (node.id === id ? { ...node, position: { ...node.position, x: Math.round(x), y: Math.round(y) } } : node)),
    };
}

/** Pixels in the 2D scene per world unit in the 3D one. */
export const PX_PER_UNIT = 110;

export type WorldPlacement = { id: string; x: number; y: number; z: number; width: number; height: number };

/**
 * Map a 2D scene node onto a wall facing the camera: the scene's centre lands
 * at the origin, 2D y grows downward so 3D y is flipped, and the wall's centre
 * sits at `eyeHeight` so the default camera looks straight at it.
 */
export function toWorld(scene: Scene, eyeHeight = 1.5): WorldPlacement[] {
    if (scene.nodes.length === 0) return [];
    const size = (n: SceneNode) => n.size ?? { w: 240, h: 150 };
    const left = Math.min(...scene.nodes.map((n) => n.position.x));
    const right = Math.max(...scene.nodes.map((n) => n.position.x + size(n).w));
    const top = Math.min(...scene.nodes.map((n) => n.position.y));
    const bottom = Math.max(...scene.nodes.map((n) => n.position.y + size(n).h));
    const midX = (left + right) / 2;
    const midY = (top + bottom) / 2;

    return scene.nodes.map((n) => {
        const { w, h } = size(n);
        const cx = n.position.x + w / 2;
        const cy = n.position.y + h / 2;
        return {
            id: n.id,
            x: round((cx - midX) / PX_PER_UNIT),
            y: round(eyeHeight - (cy - midY) / PX_PER_UNIT),
            z: round((n.position.z ?? 0) / PX_PER_UNIT),
            width: round(w / PX_PER_UNIT),
            height: round(h / PX_PER_UNIT),
        };
    });
}

function round(n: number): number {
    return Math.round(n * 1000) / 1000;
}

/**
 * Can this browser give us a WebGL context? Asked once, by creating a
 * throwaway canvas: a GPU-less machine, a blocklisted driver or a privacy
 * setting all answer "no" here, and the demo stays on the DOM renderer.
 */
export function hasWebGL(doc: Document | undefined = typeof document === "undefined" ? undefined : document): boolean {
    if (!doc) return false;
    try {
        const canvas = doc.createElement("canvas");
        const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
        return gl !== null && gl !== undefined;
    } catch {
        return false;
    }
}

/** The engine to show: a WebGL engine without WebGL is never chosen. */
export function resolveEngine(requested: Engine, webgl: boolean): Engine {
    return requested !== "dom" && !webgl ? "dom" : requested;
}
