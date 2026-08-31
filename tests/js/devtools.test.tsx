import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { SandboxDevtools, sandboxDevtoolsStore } from "../../resources/js/lib/devtools";

describe("sandbox Fancy Devtools integration", () => {
    afterEach(() => {
        document.body.innerHTML = "";
        sandboxDevtoolsStore.clear();
    });

    it("mounts the native floating surface with sandbox environment facts", async () => {
        const container = document.createElement("div");
        document.body.append(container);
        const root = createRoot(container);

        await act(async () => root.render(<SandboxDevtools />));

        expect(container.querySelector('[data-fancy-devtools="launcher"]')).not.toBeNull();
        expect(sandboxDevtoolsStore.getSnapshot().environment).toMatchObject({
            application: "Fancy UI Sandbox",
            kitVersion: __KIT_VERSION__,
        });

        await act(async () => root.unmount());
    });
});
/** @vitest-environment jsdom */
