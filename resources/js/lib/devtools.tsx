import {
    FancyDevtools,
    createDevtoolsStore,
    installBrowserDiagnostics,
} from "@particle-academy/fancy-devtools";
import "@particle-academy/fancy-devtools/styles.css";

export const sandboxDevtoolsStore = createDevtoolsStore();

sandboxDevtoolsStore.setEnvironment({
    application: "Fancy UI Sandbox",
    kitVersion: __KIT_VERSION__,
    mode: import.meta.env.MODE,
});

if (typeof window !== "undefined") {
    const uninstallBrowserDiagnostics = installBrowserDiagnostics(sandboxDevtoolsStore);
    import.meta.hot?.dispose(uninstallBrowserDiagnostics);
}

export function SandboxDevtools() {
    return <FancyDevtools store={sandboxDevtoolsStore} />;
}
