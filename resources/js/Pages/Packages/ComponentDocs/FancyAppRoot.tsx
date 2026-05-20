import type { ComponentDoc } from "./types";
import { Text } from "@particle-academy/react-fancy";

export const fancyAppRootDoc: ComponentDoc = {
    intro: (
        <p>
            Composite top-level provider for the Fancy UI set under Inertia. Mounts once in
            your Inertia app entry — sets up the Toast provider, the{" "}
            <code>ScreenSystem</code>, and auto-registers ECharts modules + built-in themes.
            Survives Inertia page swaps, so toasts persist across navigations and the screen
            registry stays put.
        </p>
    ),
    examples: [
        {
            name: "Standard Inertia bootstrap",
            description: "Wrap your Inertia app root once — typically in `resources/js/app.tsx`.",
            render: () => (
                <Text size="sm" className="!text-zinc-500">
                    Subsequent page swaps preserve the providers — toasts survive navigation, the screen registry persists, ECharts modules don't re-register.
                </Text>
            ),
            code: `import { createInertiaApp } from "@inertiajs/react";
import { FancyAppRoot } from "@particle-academy/fancy-inertia";

createInertiaApp({
    resolve: (name) => resolvePageComponent(\`./Pages/\${name}.tsx\`, …),
    setup: ({ el, App, props }) => {
        createRoot(el).render(
            <FancyAppRoot>
                <App {...props} />
            </FancyAppRoot>,
        );
    },
});`,
        },
        {
            name: "Skip screens / echarts",
            description: "Disable the providers you don't need for a smaller bundle.",
            render: () => (
                <Text size="sm" className="!text-zinc-500">
                    Useful when you only use a subset of Fancy UI in your app shell.
                </Text>
            ),
            code: `<FancyAppRoot withScreens={false} withECharts={false}>
    <App {...props} />
</FancyAppRoot>`,
        },
        {
            name: "Toast position",
            render: () => (
                <Text size="sm" className="!text-zinc-500">
                    Defaults to bottom-right. Override for app-specific layouts.
                </Text>
            ),
            code: `<FancyAppRoot toastPosition="top-right">
    <App {...props} />
</FancyAppRoot>`,
        },
    ],
    props: [
        { name: "children", type: `ReactNode`, default: "—", description: "Your Inertia App outlet." },
        { name: "toastPosition", type: `"top-left" | "top-right" | "bottom-left" | "bottom-right"`, default: `"bottom-right"`, description: "Where the toast stack anchors on screen." },
        { name: "withScreens", type: `boolean`, default: `true`, description: "Mount the `ScreenSystem` provider. Set `false` if your app doesn't use fancy-screens." },
        { name: "withECharts", type: `boolean`, default: `true`, description: "Auto-register ECharts modules + built-in themes on mount. Disable if you call `registerCharts(...)` yourself for tree-shaking control." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>Mount once:</strong> place above the Inertia <code>&lt;App&gt;</code>{" "}
            outlet so it survives page transitions. Adding it on individual pages would
            destroy and re-create the providers on every navigation.
        </p>
    ),
};
