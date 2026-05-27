import { useMemo, useState } from "react";
import {
  Action,
  Badge,
  Card,
  Switch,
  Timeline,
} from "@particle-academy/react-fancy";
import { Stage, Monitor } from "@particle-academy/fancy-3d-babylon/react";

function DashboardScreenContents() {
  const [count, setCount] = useState(0);
  return (
    <Card className="h-full">
      <Card.Header>
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">System status</div>
          <Badge color="emerald">live</Badge>
        </div>
      </Card.Header>
      <Card.Body className="flex h-full flex-col gap-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">
            <div className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">P95</div>
            <div className="mt-1 text-xl font-bold">142ms</div>
          </div>
          <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">
            <div className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">RPM</div>
            <div className="mt-1 text-xl font-bold">8,402</div>
          </div>
          <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">
            <div className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">Errors</div>
            <div className="mt-1 text-xl font-bold text-emerald-600">0.02%</div>
          </div>
        </div>
        <div className="mt-auto flex items-center justify-between">
          <span className="text-sm">Click count: <strong>{count}</strong></span>
          <Action color="indigo" size="sm" onClick={() => setCount((c) => c + 1)}>
            Increment
          </Action>
        </div>
      </Card.Body>
    </Card>
  );
}

function SettingsScreenContents() {
  const [autoDeploy, setAutoDeploy] = useState(true);
  const [notifications, setNotifications] = useState(false);
  return (
    <Card className="h-full">
      <Card.Header>
        <div className="text-sm font-semibold">Settings</div>
      </Card.Header>
      <Card.Body className="flex h-full flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Auto-deploy on merge</div>
            <div className="text-xs text-zinc-500">Push to main triggers a build</div>
          </div>
          <Switch checked={autoDeploy} onCheckedChange={setAutoDeploy} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Slack notifications</div>
            <div className="text-xs text-zinc-500">Alerts when builds fail</div>
          </div>
          <Switch checked={notifications} onCheckedChange={setNotifications} />
        </div>
        <div className="mt-auto flex gap-2">
          <Action color="indigo" size="sm">
            Save
          </Action>
          <Action variant="ghost" size="sm">
            Cancel
          </Action>
        </div>
      </Card.Body>
    </Card>
  );
}

function ActivityScreenContents() {
  const events = useMemo(
    () => [
      { date: "10:42", title: "Deploy succeeded", description: "v1.42.0 → production" },
      { date: "10:31", title: "Build passed", description: "All 124 tests green" },
      { date: "10:18", title: "PR #482 merged", description: "feat: invoice export" },
      { date: "09:55", title: "Migration applied", description: "0042_user_schema.sql" },
    ],
    []
  );
  return (
    <Card className="h-full">
      <Card.Header>
        <div className="text-sm font-semibold">Activity</div>
      </Card.Header>
      <Card.Body className="h-full overflow-auto">
        <Timeline events={events} />
      </Card.Body>
    </Card>
  );
}

export function ScreenStageDemo() {
  return (
    <div>
      <div className="mb-4">
        <h1 className="mb-1 text-2xl font-bold">Stage + Monitor</h1>
        <p className="max-w-3xl text-sm text-zinc-500">
          A 3D stage hosting interactive monitors. Each <code>&lt;Monitor&gt;</code> is a
          real Babylon mesh; its surface is a live React tree of{" "}
          <code>react-fancy</code> components — clickable, focusable, fully
          interactive. The overlay tracks the mesh's projected screen-space
          rect each frame so the panel stays anchored as the camera orbits.
          Drag to orbit, scroll to zoom.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800" style={{ height: 720 }}>
        <Stage
          cameraRadius={11}
          cameraTarget={[0, 1.5, 0]}
          className="h-full w-full"
        >
          {/* Center screen — primary, closest to a front-facing camera */}
          <Monitor position={[0, 1.6, 0]} width={3.2} height={2}>
            <DashboardScreenContents />
          </Monitor>

          {/* Left screen — set BACK (negative z) and angled inward toward
              the center, so the bigger primary screen is always in front
              from a front-facing viewer. */}
          <Monitor
            position={[-3.2, 1.6, -1]}
            width={2.4}
            height={1.6}
            rotationY={Math.PI / 5}
          >
            <SettingsScreenContents />
          </Monitor>

          {/* Right screen — set back, angled inward */}
          <Monitor
            position={[3.2, 1.6, -1]}
            width={2.4}
            height={1.6}
            rotationY={-Math.PI / 5}
          >
            <ActivityScreenContents />
          </Monitor>
        </Stage>
      </div>
    </div>
  );
}
