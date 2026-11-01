/** @vitest-environment jsdom */
import { readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { Button } from "@particle-academy/react-fancy";
import { act } from "react";
import { createRoot } from "react-dom/client";
import ts from "typescript";
import { afterEach, describe, expect, it } from "vitest";

/**
 * react-fancy 6.0.0: `Button` defaults to `type="button"`. Under 5.x a bare
 * `<Button>` rendered a bare `<button>`, whose HTML default is `submit`, so
 * every Button in a `<form>` submitted it — and every form here that relied on
 * that silently stops submitting on 6.x.
 *
 * Two halves:
 *  1. Pin the runtime default the audit below relies on (fails on 5.x).
 *  2. Statically audit every `<form>` in resources/js: each one has a Button
 *     that is explicitly `type="submit"`, and no non-anchor Button inside a
 *     form leaves its `type` to the default.
 */

const ROOT = resolve(__dirname, "../..");
const JS = join(ROOT, "resources/js");

describe("react-fancy Button type default", () => {
    afterEach(() => {
        document.body.innerHTML = "";
    });

    async function renderInForm(node: React.ReactNode): Promise<{ form: HTMLFormElement; unmount: () => Promise<void> }> {
        const container = document.createElement("div");
        document.body.append(container);
        const root = createRoot(container);
        await act(async () => root.render(<form>{node}</form>));
        return { form: container.querySelector("form")!, unmount: () => act(async () => root.unmount()) };
    }

    it("renders an untyped Button as type=button, so it does not submit its form", async () => {
        const { form, unmount } = await renderInForm(<Button>Cancel</Button>);
        let submitted = 0;
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            submitted++;
        });

        const button = form.querySelector("button")!;
        expect(button.getAttribute("type")).toBe("button");
        await act(async () => button.click());
        expect(submitted).toBe(0);
        await unmount();
    });

    it("keeps an explicit type=submit, which does submit", async () => {
        const { form, unmount } = await renderInForm(<Button type="submit">Save</Button>);
        let submitted = 0;
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            submitted++;
        });

        const button = form.querySelector("button")!;
        expect(button.getAttribute("type")).toBe("submit");
        await act(async () => button.click());
        expect(submitted).toBe(1);
        await unmount();
    });

    it("renders an href Button as an anchor, which is why the audit skips it", async () => {
        const { form, unmount } = await renderInForm(<Button href="/back">Back</Button>);
        expect(form.querySelector("a")).not.toBeNull();
        expect(form.querySelector("button")).toBeNull();
        await unmount();
    });
});

type FormFinding = { at: string; submits: number; untyped: string[] };

function tsxFiles(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        const p = join(dir, e.name);
        if (e.isDirectory()) return tsxFiles(p);
        return p.endsWith(".tsx") ? [p] : [];
    });
}

function auditForms(): FormFinding[] {
    const findings: FormFinding[] = [];

    for (const file of tsxFiles(JS)) {
        const src = readFileSync(file, "utf8");
        if (!/<form\b/.test(src)) continue;

        const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
        const rel = relative(ROOT, file).replace(/\\/g, "/");
        const where = (n: ts.Node) => `${rel}:${sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1}`;

        const tagOf = (n: ts.Node) =>
            ts.isJsxElement(n) ? n.openingElement : ts.isJsxSelfClosingElement(n) ? n : null;

        const visit = (n: ts.Node, current: FormFinding | null): void => {
            const tag = tagOf(n);
            if (tag) {
                const name = tag.tagName.getText(sf);
                if (name === "form") {
                    const finding: FormFinding = { at: where(n), submits: 0, untyped: [] };
                    findings.push(finding);
                    ts.forEachChild(n, (c) => visit(c, finding));
                    return;
                }
                if (current && (name === "Button" || name === "Action")) {
                    const attrs = new Map<string, string>();
                    for (const a of tag.attributes.properties) {
                        if (ts.isJsxAttribute(a)) attrs.set(a.name.getText(sf), a.initializer?.getText(sf) ?? "true");
                    }
                    const anchor = attrs.has("href") || attrs.has("as");
                    if (attrs.get("type") === '"submit"') current.submits++;
                    else if (!attrs.has("type") && !anchor) current.untyped.push(where(n));
                }
            }
            ts.forEachChild(n, (c) => visit(c, current));
        };
        visit(sf, null);
    }

    return findings;
}

describe("forms in resources/js under react-fancy 6", () => {
    const forms = auditForms();

    it("finds the forms (the audit is not looking at nothing)", () => {
        // 26 on 2026-11-01. A floor rather than an exact count, so adding a form
        // does not fail this — but a broken walker that finds none does.
        expect(forms.length).toBeGreaterThanOrEqual(20);
        expect(forms.map((f) => f.at)).toEqual(
            expect.arrayContaining([
                expect.stringMatching(/^resources\/js\/Pages\/Profile\/Show\.tsx:/),
                expect.stringMatching(/^resources\/js\/Pages\/Showcase\/Create\.tsx:/),
            ]),
        );
    });

    it("gives every form a Button with an explicit type=\"submit\"", () => {
        const withoutSubmit = forms.filter((f) => f.submits === 0).map((f) => f.at);
        expect(withoutSubmit).toEqual([]);
    });

    it("leaves no non-anchor Button inside a form on the default type", () => {
        const untyped = forms.flatMap((f) => f.untyped);
        expect(untyped).toEqual([]);
    });
});
