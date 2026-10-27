import { describe, expect, it } from "vitest";
import {
    addNodeCommand,
    categoriesOf,
    filterNodes,
    runtimeLabel,
    type MarketplaceNode,
} from "../../resources/js/Pages/Features/Flow/marketplace";

/** Shaped like `/r/nodes/index.json` items (NodeRegistryController::index). */
const node = (over: Partial<MarketplaceNode>): MarketplaceNode => ({
    kind: "@particle-academy/x",
    title: "X",
    description: "",
    category: "io",
    runtimes: ["ts", "php"],
    url: "/r/nodes/particle-academy__x.json",
    ...over,
});

const ITEMS = [
    node({ kind: "@particle-academy/deep_research", title: "Deep Research", category: "ai", description: "Cited research" }),
    node({ kind: "@particle-academy/git_diff", title: "Diff", category: "io", description: "Diff a working copy" }),
    node({ kind: "@particle-academy/stripe_payment_intent", title: "Payment intent", category: "io", connector: true, service: "stripe" }),
    node({ kind: "@particle-academy/stripe_webhook_trigger", title: "Stripe webhook", category: "trigger", service: "stripe" }),
];

describe("flow feature: node marketplace", () => {
    it("builds the vendoring command the CLI documents, never a package install", () => {
        const command = addNodeCommand("@particle-academy/git_diff");

        expect(command).toBe("npx fancy-cli@latest add node @particle-academy/git_diff");
        expect(command).not.toMatch(/npm install|composer require/);
    });

    it("lists categories in the index's own order, once each", () => {
        expect(categoriesOf(ITEMS)).toEqual(["ai", "io", "trigger"]);
    });

    it("filters by category and by a case-insensitive query over kind, title, description and service", () => {
        expect(filterNodes(ITEMS, "", null)).toHaveLength(4);
        expect(filterNodes(ITEMS, "", "io").map((n) => n.title)).toEqual(["Diff", "Payment intent"]);
        expect(filterNodes(ITEMS, "STRIPE", null)).toHaveLength(2);
        expect(filterNodes(ITEMS, "stripe", "trigger").map((n) => n.title)).toEqual(["Stripe webhook"]);
        expect(filterNodes(ITEMS, "working copy", null).map((n) => n.title)).toEqual(["Diff"]);
        expect(filterNodes(ITEMS, "  ", "ai")).toHaveLength(1);
        expect(filterNodes(ITEMS, "nothing-matches", null)).toEqual([]);
    });

    it("labels runtimes and passes an unknown one through rather than guessing", () => {
        expect(["ts", "php", "py", "rs"].map(runtimeLabel)).toEqual(["TypeScript", "PHP", "Python", "rs"]);
    });
});
