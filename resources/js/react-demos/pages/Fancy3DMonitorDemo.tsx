import { useEffect } from "react";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { createMonitor, createPanel } from "@particle-academy/fancy-3d-babylon";
import { Stage, useStage } from "@particle-academy/fancy-3d-babylon/react";

function MonitorScene() {
  const { scene } = useStage();
  useEffect(() => {
    // Three monitors on a virtual desk
    const center = createMonitor({
      scene,
      name: "monitor-center",
      width: 2.6, height: 1.6, depth: 0.18,
      bezel: "#0b0f17",
      standHeight: 0.6,
      screen: {
        type: "widget",
        widget: { kind: "kanban", columns: [
          { title: "Todo", cards: ["Auth flow", "Onboarding"] },
          { title: "Doing", cards: ["Billing"] },
          { title: "Done", cards: ["Setup"] },
        ] },
      },
    });
    center.root.position = new Vector3(0, 1.2, 0);

    const left = createMonitor({
      scene, name: "monitor-left",
      width: 2.0, height: 1.3, depth: 0.16,
      bezel: "#0b0f17",
      standHeight: 0.4,
      screen: {
        type: "widget",
        widget: { kind: "chart", title: "Throughput", variant: "area", series: [12, 18, 14, 22, 28, 24, 32, 38, 34, 44, 48, 52], color: "#22d3ee" },
      },
    });
    left.root.position = new Vector3(-2.7, 1.0, 0.4);
    left.root.rotation.y = Math.PI / 6;

    const right = createMonitor({
      scene, name: "monitor-right",
      width: 2.0, height: 1.3, depth: 0.16,
      bezel: "#0b0f17",
      standHeight: 0.4,
      screen: {
        type: "widget",
        widget: { kind: "timeline", title: "Activity", events: [
          { at: "10:42", label: "Deploy succeeded" },
          { at: "10:31", label: "Build passed" },
          { at: "10:18", label: "PR merged" },
        ] },
      },
    });
    right.root.position = new Vector3(2.7, 1.0, 0.4);
    right.root.rotation.y = -Math.PI / 6;

    // Desk surface
    const desk = createPanel({ scene, name: "desk", width: 8, height: 3, surface: { type: "color", color: "#0b1220" } });
    desk.rotation.x = Math.PI / 2;
    desk.position.y = 0.18;

    return () => {
      center.root.dispose(false, true);
      left.root.dispose(false, true);
      right.root.dispose(false, true);
      desk.dispose();
    };
  }, [scene]);
  return null;
}

export function Fancy3DMonitorDemo() {
  return (
    <div>
      <div className="mb-4">
        <h1 className="mb-1 text-2xl font-bold">createMonitor</h1>
        <p className="max-w-3xl text-sm text-zinc-500">
          A 3D display: extruded bezel + recessed screen face + optional kickstand.
          Each monitor's screen surface is any <code className="text-xs">WidgetSpec</code> —
          the same painters that power Canvas Studio in DOM mode render kanban boards,
          charts, timelines onto the screen face. Drag to orbit, scroll to zoom.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800" style={{ height: 600 }}>
        <Stage cameraRadius={8} cameraTarget={[0, 1.0, 0]} cameraAlpha={Math.PI / 2} cameraBeta={Math.PI / 2.4} className="h-full w-full">
          <MonitorScene />
        </Stage>
      </div>
    </div>
  );
}
