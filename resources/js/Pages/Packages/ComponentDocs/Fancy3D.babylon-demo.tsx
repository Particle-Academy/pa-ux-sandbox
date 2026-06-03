import { useState } from "react";
import { Stage, Monitor } from "@particle-academy/fancy-3d-babylon/react";
import { createCard3D, createSign } from "@particle-academy/fancy-3d-babylon";
import type { WidgetSpec } from "@particle-academy/fancy-3d";
import { Card, Button, Badge } from "@particle-academy/react-fancy";

/**
 * Live Babylon demos for the fancy-3d-babylon docs pages (Stage / Monitor /
 * Card3D). Lazy-loaded from each doc page so @babylonjs/core (~13MB) only loads
 * when a visitor actually opens one of these pages.
 */

export type BabylonExample = "stage" | "monitor" | "card3d";

const kpi: WidgetSpec = { kind: "kpi", label: "Revenue", value: "$48.2k", delta: "+12.4%", trend: "up" };
const chart: WidgetSpec = { kind: "chart", title: "Signups", variant: "area", series: [3, 7, 5, 9, 12, 10, 15, 14, 18], color: "#8b5cf6" };
const profile: WidgetSpec = { kind: "profile", name: "Ava Wu", role: "Admin", initials: "AW", status: "online" };

const frame = "h-[440px] w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800";

/** A live, interactive React card — proves Monitor renders real DOM, not a texture snapshot. */
function LiveCard() {
    const [n, setN] = useState(3);
    return (
        <Card padding="md" className="!h-full">
            <Card.Header>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    Live dashboard <Badge color="emerald" dot>online</Badge>
                </span>
            </Card.Header>
            <Card.Body>
                <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em" }}>{n.toLocaleString()} sessions</div>
                <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                    <Button color="violet" size="sm" icon="plus" onClick={() => setN((v) => v + 1)}>Add</Button>
                    <Button variant="ghost" size="sm" onClick={() => setN(0)}>Reset</Button>
                </div>
            </Card.Body>
        </Card>
    );
}

export default function Fancy3DBabylonDemo({ example }: { example: BabylonExample }) {
    if (example === "monitor") {
        return (
            <div className={frame}>
                <Stage cameraRadius={6.5} cameraTarget={[0, 1.4, 0]} clearColor="#0b1220" style={{ height: "100%" }}>
                    <Monitor position={[0, 1.4, 0]} width={3.4} height={2.1} bezel="#0b0f17">
                        <LiveCard />
                    </Monitor>
                </Stage>
            </div>
        );
    }

    if (example === "card3d") {
        // Texture mode — painted widget surfaces on extruded Card3D meshes.
        return (
            <div className={frame}>
                <Stage cameraRadius={8} cameraTarget={[0, 1.2, 0]} clearColor="#0b1220" style={{ height: "100%" }}
                    onReady={(scene) => {
                        const specs: WidgetSpec[] = [chart, kpi, profile];
                        specs.forEach((w, i) => {
                            const m = createCard3D({ scene, width: 2.2, height: 1.4, depth: 0.08, front: { type: "widget", widget: w } });
                            m.position.set((i - 1) * 2.6, 1.2, 0);
                        });
                    }}
                />
            </div>
        );
    }

    // "stage" — the full scene: a live Monitor flanked by a painted Card3D + a Sign.
    return (
        <div className={frame}>
            <Stage cameraRadius={9} cameraTarget={[0, 1.5, 0]} clearColor="#0b1220" style={{ height: "100%" }}
                onReady={(scene) => {
                    const card = createCard3D({ scene, width: 2.2, height: 1.5, depth: 0.08, front: { type: "widget", widget: chart } });
                    card.position.set(-3.4, 1.5, 0.2);
                    card.rotation.y = 0.5;
                    const { root } = createSign({ scene, width: 1.8, height: 1.1, surface: { type: "widget", widget: kpi }, postHeight: 0.9 });
                    root.position.set(3.4, 0, 0.2);
                    root.rotation.y = -0.5;
                }}
            >
                <Monitor position={[0, 1.7, 0]} width={3} height={1.9} bezel="#0b0f17">
                    <LiveCard />
                </Monitor>
            </Stage>
        </div>
    );
}
