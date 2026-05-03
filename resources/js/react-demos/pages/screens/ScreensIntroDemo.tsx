import { Screen, useScreens, useScreenPort } from "@particle-academy/fancy-screens";
import { Action, Card, Badge, Input } from "@particle-academy/react-fancy";
import { DemoSection } from "../../components/DemoSection";

function UserPanel() {
  const [user, setUser] = useScreenPort<{ name: string; email: string }>("user");
  const [filter, setFilter] = useScreenPort<string>("filter");

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <Card.Header>
          <h3 className="font-semibold">user (in port)</h3>
        </Card.Header>
        <Card.Body className="space-y-2">
          <Input
            placeholder="Name"
            value={user?.name ?? ""}
            onChange={(e) => setUser({ name: e.target.value, email: user?.email ?? "" })}
          />
          <Input
            placeholder="Email"
            value={user?.email ?? ""}
            onChange={(e) => setUser({ name: user?.name ?? "", email: e.target.value })}
          />
          <pre className="rounded bg-zinc-100 p-2 text-xs dark:bg-zinc-800">
            {JSON.stringify(user, null, 2)}
          </pre>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <h3 className="font-semibold">filter (out port)</h3>
        </Card.Header>
        <Card.Body className="space-y-2">
          <div className="flex gap-2">
            {["all", "active", "archived"].map((f) => (
              <Action
                key={f}
                size="sm"
                color={filter === f ? "indigo" : "zinc"}
                onClick={() => setFilter(f)}
              >
                {f}
              </Action>
            ))}
          </div>
          <div className="text-sm text-zinc-500">
            Current: <code className="rounded bg-zinc-100 px-1 py-0.5 dark:bg-zinc-800">{filter ?? "(none)"}</code>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}

function RegistryPanel() {
  const screens = useScreens();
  return (
    <Card>
      <Card.Header>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">useScreens() — agent introspection</h3>
          <Badge color="blue">{screens.length} mounted</Badge>
        </div>
      </Card.Header>
      <Card.Body>
        <pre className="overflow-auto rounded bg-zinc-100 p-3 text-xs dark:bg-zinc-800">
          {JSON.stringify(screens, null, 2)}
        </pre>
      </Card.Body>
    </Card>
  );
}

export function ScreensIntroDemo() {
  return (
    <Screen.System>
      <div>
        <h1 className="mb-2 text-2xl font-bold">Screens — intro</h1>
        <p className="mb-6 max-w-3xl text-sm text-zinc-500">
          A single <code>&lt;Screen&gt;</code> with two declared ports. Children
          read and write port state via <code>useScreenPort()</code>; the global
          registry is queryable from anywhere via <code>useScreens()</code> —
          including from outside any screen.
        </p>

        <DemoSection
          title="Single screen, two ports"
          description="Edit the user fields and pick a filter — both are scoped to this screen by design. The registry panel below shows the live state from useScreens()."
          code={`<Screen.System>
  <Screen id="profile" title="Profile">
    <Screen.Port name="user" direction="in"
      schema={{ kind: "object", shape: { name: "string", email: "string" } }} />
    <Screen.Port name="filter" direction="out" defaultValue="all" />
    <Screen.Body>
      <UserPanel />
    </Screen.Body>
  </Screen>
</Screen.System>

// inside UserPanel:
const [user, setUser] = useScreenPort("user");
const [filter, setFilter] = useScreenPort("filter");`}
        >
          <Screen id="profile" title="Profile">
            <Screen.Port
              name="user"
              direction="in"
              schema={{
                kind: "object",
                shape: { name: "string", email: "string" },
              }}
              defaultValue={{ name: "", email: "" }}
            />
            <Screen.Port name="filter" direction="out" defaultValue="all" />
            <Screen.Body>
              <UserPanel />
            </Screen.Body>
          </Screen>
        </DemoSection>

        <DemoSection
          title="Registry hook"
          description="useScreens() returns a typed, live snapshot of every mounted screen — its id, title, lifecycle, declared port names, and current port values. This is the agent's window into the running app."
        >
          <RegistryPanel />
        </DemoSection>
      </div>
    </Screen.System>
  );
}
