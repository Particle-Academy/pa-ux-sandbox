import { Screen, useScreens, useRegisterStore } from "@particle-academy/fancy-screens";
import { Action, Card, Badge, Input } from "@particle-academy/react-fancy";
import { CodeEditor } from "@particle-academy/fancy-code";
import { create } from "zustand";
import { DemoSection } from "../../components/DemoSection";

type UserState = {
  name: string;
  email: string;
  setName: (name: string) => void;
  setEmail: (email: string) => void;
};

const useUserStore = create<UserState>((set) => ({
  name: "",
  email: "",
  setName: (name) => set({ name }),
  setEmail: (email) => set({ email }),
}));

type FilterState = {
  filter: "all" | "active" | "archived";
  setFilter: (f: FilterState["filter"]) => void;
};

const useFilterStore = create<FilterState>((set) => ({
  filter: "all",
  setFilter: (filter) => set({ filter }),
}));

function UserPanel() {
  useRegisterStore("user", useUserStore);
  useRegisterStore("filter", useFilterStore);

  const { name, email, setName, setEmail } = useUserStore();
  const { filter, setFilter } = useFilterStore();

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <Card.Header>
          <h3 className="font-semibold">user store</h3>
        </Card.Header>
        <Card.Body className="space-y-2">
          <Input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="overflow-hidden rounded">
            <CodeEditor
              value={JSON.stringify({ name, email }, null, 2)}
              language="json"
              theme="auto"
              readOnly
              lineNumbers={false}
              minHeight={50}
              maxHeight={140}
            >
              <CodeEditor.Panel />
            </CodeEditor>
          </div>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <h3 className="font-semibold">filter store</h3>
        </Card.Header>
        <Card.Body className="space-y-2">
          <div className="flex gap-2">
            {(["all", "active", "archived"] as const).map((f) => (
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
            Current: <code className="rounded bg-zinc-100 px-1 py-0.5 dark:bg-zinc-800">{filter}</code>
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
        <div className="overflow-hidden rounded">
          <CodeEditor
            value={JSON.stringify(screens, null, 2)}
            language="json"
            theme="auto"
            readOnly
            lineNumbers={false}
            minHeight={80}
            maxHeight={360}
          >
            <CodeEditor.Panel />
          </CodeEditor>
        </div>
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
          A single <code>&lt;Screen&gt;</code> with two Zustand stores registered to it. Children
          read and write state directly via the store hooks; <code>useRegisterStore</code> makes
          each store discoverable from <code>useScreens()</code> — including from outside any screen.
        </p>

        <DemoSection
          title="Single screen, two stores"
          description="Edit the user fields and pick a filter — both stores are registered under the 'profile' screen. The registry panel below shows the live snapshot from useScreens()."
          code={`import { create } from "zustand";
import { Screen, useRegisterStore } from "@particle-academy/fancy-screens";

const useUserStore = create((set) => ({
  name: "", email: "",
  setName: (name) => set({ name }),
  setEmail: (email) => set({ email }),
}));

const useFilterStore = create((set) => ({
  filter: "all",
  setFilter: (filter) => set({ filter }),
}));

<Screen.System>
  <Screen id="profile" title="Profile">
    <Screen.Body>
      <UserPanel />
    </Screen.Body>
  </Screen>
</Screen.System>

function UserPanel() {
  useRegisterStore("user", useUserStore);
  useRegisterStore("filter", useFilterStore);
  const { name, setName } = useUserStore();
  const { filter, setFilter } = useFilterStore();
  // ...
}`}
        >
          <Screen id="profile" title="Profile">
            <Screen.Body>
              <UserPanel />
            </Screen.Body>
          </Screen>
        </DemoSection>

        <DemoSection
          title="Registry hook"
          description="useScreens() returns a typed, live snapshot of every mounted screen — its id, title, lifecycle, registered store names, and current store values. This is the agent's window into the running app."
        >
          <RegistryPanel />
        </DemoSection>
      </div>
    </Screen.System>
  );
}
