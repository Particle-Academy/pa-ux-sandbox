// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DOCS } from "../../resources/js/Pages/Packages/ComponentDocs";
import { ComponentDemo } from "../../resources/js/Pages/Packages/ComponentDemo";
import { getComponentPreview } from "../../resources/js/Pages/Packages/ComponentPreviews";

/**
 * The react-fancy 6.20 / 6.21 components render on every surface the site shows
 * them on: each docs example, the interactive demo and the catalog preview.
 *
 * The PHP coverage tests only prove a page, a demo key and a preview key EXIST;
 * they cannot see React. A page that throws on render passes all of them, so
 * this mounts each one and looks for the component's own stable handle, and
 * fails on any console error raised while mounting.
 */

const COMPONENTS = [
    { slug: "content-reaction", name: "ContentReaction", handle: "[data-react-fancy-content-reaction]" },
    { slug: "image-pill", name: "ImagePill", handle: "[data-react-fancy-image-pill]" },
    { slug: "hotkey-capture", name: "HotkeyCapture", handle: "[data-react-fancy-hotkey-capture]" },
];

let host: HTMLDivElement;
let root: Root;
let errors: unknown[][];

beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    errors = [];
    vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
        errors.push(args);
    });
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
});

afterEach(() => {
    act(() => root.unmount());
    host.remove();
    vi.restoreAllMocks();
});

describe.each(COMPONENTS)("$name", ({ slug, name, handle }) => {
    it("has a docs entry whose every example renders the component", () => {
        const doc = DOCS[`react-fancy/${slug}`];
        expect(doc, `no docs entry for react-fancy/${slug}`).toBeDefined();
        expect(doc.examples.length).toBeGreaterThan(0);

        let withHandle = 0;
        for (const example of doc.examples) {
            act(() => root.render(createElement(() => <>{example.render()}</>)));
            if (host.querySelector(handle)) {
                withHandle++;
            }
        }

        // The pure-function example (toggleReaction) renders text, not the component.
        expect(withHandle).toBeGreaterThanOrEqual(doc.examples.length - 1);
        expect(errors).toEqual([]);
    });

    it("renders in the interactive demo", () => {
        act(() => root.render(createElement(ComponentDemo, { pkg: "react-fancy", slug, name })));
        expect(host.querySelector(handle)).not.toBeNull();
        expect(host.textContent).not.toContain("isn't wired yet");
        expect(errors).toEqual([]);
    });

    it("renders in the catalog preview", () => {
        const preview = getComponentPreview("react-fancy", slug);
        expect(preview).not.toBeNull();
        act(() => root.render(createElement(() => preview!())));
        expect(host.querySelector(handle)).not.toBeNull();
        expect(errors).toEqual([]);
    });
});
