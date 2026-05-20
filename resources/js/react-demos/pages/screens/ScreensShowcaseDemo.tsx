import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Screen, useScreens, useRegisterStore } from "@particle-academy/fancy-screens";
import { Action, Card, Badge } from "@particle-academy/react-fancy";
import { registerAll } from "@particle-academy/fancy-echarts";
import { create, type StoreApi, type UseBoundStore } from "zustand";

// EChartsShowcase relies on echarts modules being registered. The
// /echarts-* routes do this via EChartsLayout, but we lazy-import a
// chart-bearing demo from outside that layout — register here too.
// registerAll is idempotent.
registerAll();

const EChartsShowcase = lazy(() =>
  import("../echarts/EChartsShowcase").then((m) => ({ default: m.EChartsShowcase })),
);
const AppSheetDemo = lazy(() =>
  import("../AppSheetDemo").then((m) => ({ default: m.AppSheetDemo })),
);
const IdeDemo = lazy(() =>
  import("../IdeDemo").then((m) => ({ default: m.IdeDemo })),
);

type DemoEntry = {
  id: string;
  title: string;
  summary: string;
  Component: React.ComponentType;
};

const DEMOS: DemoEntry[] = [
  {
    id: "dashboard",
    title: "Sales Dashboard",
    summary: "Six chart types + KPIs + ContextMenus + drill-down modal",
    Component: EChartsShowcase,
  },
  {
    id: "appsheet",
    title: "AppSheet",
    summary: "Spreadsheet integration with cell types and formula evaluation",
    Component: AppSheetDemo,
  },
  {
    id: "ide",
    title: "IDE",
    summary: "Multi-panel editor pattern with file tree + tabs + terminal",
    Component: IdeDemo,
  },
];

type LifecycleState = {
  summary: string;
  mountedAt: number | null;
  renders: number;
  setMountedAt: (t: number) => void;
  bumpRenders: () => void;
};

const lifecycleStoreFactory = (summary: string) =>
  create<LifecycleState>((set) => ({
    summary,
    mountedAt: null,
    renders: 0,
    setMountedAt: (mountedAt) => set({ mountedAt }),
    bumpRenders: () => set((s) => ({ renders: s.renders + 1 })),
  }));

/**
 * Wraps an embedded full-page demo in a `<Screen>`. Each demo gets its
 * own per-instance Zustand store with lifecycle telemetry so the
 * registry panel has interesting payload to render.
 */
function DemoScreen({ entry }: { entry: DemoEntry }) {
  return (
    <Screen id={entry.id} title={entry.title}>
      <DemoBody entry={entry} />
    </Screen>
  );
}

function DemoBody({ entry }: { entry: DemoEntry }) {
  // Per-instance store — created once per demo mount; the ref keeps the
  // same store stable across re-renders.
  const storeRef = useRef<UseBoundStore<StoreApi<LifecycleState>> | null>(null);
  if (storeRef.current === null) {
    storeRef.current = lifecycleStoreFactory(entry.summary);
  }
  const store = storeRef.current;

  useRegisterStore("lifecycle", store);

  useEffect(() => {
    store.getState().setMountedAt(Date.now());
    store.getState().bumpRenders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const Component = entry.Component;
  return (
    <Screen.Body>
      <Suspense
        fallback={
          <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
            Loading demo…
          </div>
        }
      >
        <Component />
      </Suspense>
    </Screen.Body>
  );
}

function RegistryPanel() {
  const screens = useScreens();
  return (
    <Card className="sticky top-4">
      <Card.Header>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">useScreens() — live registry</h3>
          <Badge color={screens.length > 0 ? "green" : "zinc"}>
            {screens.length} active
          </Badge>
        </div>
      </Card.Header>
      <Card.Body>
        {screens.length === 0 ? (
          <p className="text-sm text-zinc-500">No screen mounted.</p>
        ) : (
          <div className="space-y-3">
            {screens.map((s) => (
              <div key={s.id} className="rounded border border-zinc-200 p-2 dark:border-zinc-700">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-xs text-zinc-500">{s.id}</div>
                  <Badge color="blue">{s.lifecycle}</Badge>
                </div>
                <div className="mt-1 text-sm font-semibold">{s.title}</div>
                <div className="mt-1 text-xs text-zinc-500">
                  stores: <code>{s.storeKeys.join(", ") || "(none)"}</code>
                </div>
                <pre className="mt-2 overflow-auto rounded bg-zinc-100 p-1.5 text-[11px] dark:bg-zinc-800">
                  {JSON.stringify(s.storeValues, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

export function ScreensShowcaseDemo() {
  const [activeId, setActiveId] = useState<string>(DEMOS[0].id);
  const active = DEMOS.find((d) => d.id === activeId)!;

  return (
    <Screen.System>
      <div>
        <h1 className="mb-2 text-2xl font-bold">Screens — full demos as Screens</h1>
        <p className="mb-4 max-w-3xl text-sm text-zinc-500">
          Each demo is wrapped in a <code>&lt;Screen&gt;</code> with its own Zustand store
          for lifecycle telemetry. The tab strip swaps which one is mounted, so the
          registry below always shows the currently-active screen.
        </p>

        <div className="mb-4 flex flex-wrap gap-2">
          {DEMOS.map((d) => (
            <Action
              key={d.id}
              size="sm"
              color={d.id === activeId ? "indigo" : "zinc"}
              onClick={() => setActiveId(d.id)}
            >
              {d.title}
            </Action>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="min-w-0">
            <Card>
              <Card.Header>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{active.title}</h3>
                    <p className="text-xs text-zinc-500">{active.summary}</p>
                  </div>
                  <Badge color="violet">screen.id = {active.id}</Badge>
                </div>
              </Card.Header>
              <Card.Body>
                <DemoScreen entry={active} />
              </Card.Body>
            </Card>
          </div>

          <div>
            <RegistryPanel />
          </div>
        </div>
      </div>
    </Screen.System>
  );
}
