import type { ComponentDoc } from "./types";
import { Text } from "@particle-academy/react-fancy";

export const screenSystemDoc: ComponentDoc = {
    intro: (
        <p>
            Root provider for <code>fancy-screens</code>. Wrap your app once — it owns the
            registry of mounted screens and the per-screen Zustand store map. Without it,{" "}
            <code>&lt;Screen&gt;</code> and <code>useScreens()</code> throw.
        </p>
    ),
    examples: [
        {
            name: "Mount once at the root",
            description: "Drop it above your router / app shell. No props required.",
            render: () => (
                <Text size="sm" className="!text-zinc-500">
                    The provider has no visual output — its job is to host the registry.
                </Text>
            ),
            code: `import { ScreenSystem } from "@particle-academy/fancy-screens";

<ScreenSystem>
    <App />
</ScreenSystem>`,
        },
        {
            name: "Pair with useScreens",
            description: "From any descendant, query the screen registry — useful for an app-wide screen switcher / overview.",
            render: () => (
                <Text size="sm" className="!text-zinc-500">
                    <code>useScreens()</code> returns the list of mounted screens with their
                    <code>id</code> / <code>title</code> / <code>agentActivity</code> metadata.
                </Text>
            ),
            code: `import { useScreens } from "@particle-academy/fancy-screens";

function ScreenSwitcher() {
    const screens = useScreens();
    return (
        <ul>
            {screens.map((s) => (
                <li key={s.id}>{s.title ?? s.id}</li>
            ))}
        </ul>
    );
}`,
        },
    ],
    props: [
        { name: "children", type: `ReactNode`, default: "—", description: "Your app tree. Mount once near the root." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>State stores:</strong> consumers bring their own Zustand stores and
            register them via <code>useRegisterStore(name, store)</code> from any{" "}
            <code>&lt;Screen&gt;</code> child. The registry persists across route changes
            inside the same provider mount.
        </p>
    ),
};
