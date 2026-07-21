import { describe, expect, it } from "vitest";
import { fetchCatalogue, type McpComponent } from "../../tui-service/src/catalogue";
import type { McpClient } from "../../tui-service/src/mcp";

/**
 * The catalogue builder — how the real MCP `list-components` output becomes the
 * family/theme structure the browser navigates, and how previewability is
 * resolved. A fake client stands in for the MCP.
 */

function fakeMcp(items: McpComponent[], groups: string[]): McpClient {
    return {
        callTool: async () => ({ count: items.length, groups, items }),
    } as unknown as McpClient;
}

function item(over: Partial<McpComponent> & { name: string; package: string; group: string }): McpComponent {
    return {
        title: over.name,
        description: "",
        family: over.package,
        familyName: over.package,
        url: `/r/${over.name}.json`,
        ...over,
    };
}

describe("fetchCatalogue", () => {
    it("groups by family and orders themes as the MCP reports them", async () => {
        const mcp = fakeMcp(
            [
                item({ name: "button", package: "react-fancy", family: "fancy-core", familyName: "Fancy Core", group: "core" }),
                item({ name: "tui-badge", package: "fancy-tui", family: "fancy-tui", familyName: "fancy-tui", group: "tooling" }),
            ],
            ["core", "surfaces", "documents", "commerce", "platform", "tooling"],
        );

        const cat = await fetchCatalogue(mcp);

        expect(cat.total).toBe(2);
        // fancy-tui is hoisted out of tooling into the leading "terminal" theme.
        expect(cat.themes[0].group).toBe("terminal");
        expect(cat.themes[0].families[0].name).toBe("fancy-tui");
    });

    it("marks a fancy-tui component previewable when a captured frame exists", async () => {
        // `tui-badge` de-prefixes to `badge`, which fancy-tui's showcase captures.
        const mcp = fakeMcp(
            [item({ name: "tui-badge", package: "fancy-tui", family: "fancy-tui", familyName: "fancy-tui", group: "tooling" })],
            ["tooling"],
        );

        const cat = await fetchCatalogue(mcp);
        const badge = cat.families[0].components.find((c) => c.name === "tui-badge");

        expect(badge?.previewable).toBe(true);
        expect(badge?.previewFrame).toBeTruthy();
    });

    it("never marks a non-fancy-tui component previewable", async () => {
        const mcp = fakeMcp(
            [item({ name: "button", package: "react-fancy", family: "fancy-core", familyName: "Fancy Core", group: "core" })],
            ["core"],
        );

        const cat = await fetchCatalogue(mcp);
        expect(cat.families[0].components[0].previewable).toBe(false);
        expect(cat.previewableCount).toBe(0);
    });

    it("sorts previewable components ahead of web ones within a family", async () => {
        const mcp = fakeMcp(
            [
                item({ name: "fancy-tui", package: "fancy-tui", family: "fancy-tui", familyName: "fancy-tui", group: "tooling" }),
                item({ name: "tui-badge", package: "fancy-tui", family: "fancy-tui", familyName: "fancy-tui", group: "tooling" }),
            ],
            ["tooling"],
        );

        const cat = await fetchCatalogue(mcp);
        // `tui-badge` is previewable; the bare `fancy-tui` entry is not.
        expect(cat.families[0].components[0].name).toBe("tui-badge");
    });
});
