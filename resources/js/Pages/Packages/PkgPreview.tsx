import { Badge, Icon } from "@particle-academy/react-fancy";
import { Fragment, type ReactNode } from "react";

/**
 * Per-package mini-visuals — a tiny, recognizable thumbnail of what each
 * package does, drawn from react-fancy primitives and the token layer rather
 * than a screenshot. Shared by the listing card, the family member rows and the
 * detail page's "next step" strip, which is why it lives here rather than
 * inside the listing: three surfaces rendering three drifting copies of the
 * same thumbnail is the failure this file exists to prevent.
 *
 * The literal hex values below are DEPICTION, not chrome: a sticky note is
 * yellow, a terminal is black, TypeScript is #3178c6. They describe the thing
 * being illustrated and read identically in both themes because they carry
 * their own foreground. Every surrounding surface — panel, border, text — goes
 * through tokens, which is what makes light/dark work.
 */
const VIOLET = "#8b5cf6";
const AMBER = "#f59e0b";
const SKY = "#0ea5e9";

/**
 * Per-package mini-visual — a tiny, recognizable thumbnail of what the package
 * does, rendered from primitives (no external screenshots). Ported from the
 * design mockup's `PkgPreview`. Unmapped UI packages fall back to a package glyph.
 */
export function PkgPreview({ slug }: { slug: string }): ReactNode {
    const map: Record<string, ReactNode> = {
        // The Fancy Core family leads with react-fancy, so it reuses its visual.
        "fancy-core": (
            <div className="mp" style={{ gap: 6, flexWrap: "wrap", maxWidth: 280 }}>
                <span style={{ background: VIOLET, color: "#fff", fontSize: 11, fontWeight: 600, padding: "5px 11px", borderRadius: 8, display: "inline-flex", gap: 5, alignItems: "center" }}><Icon name="plus" size="xs" />Button</span>
                <Badge color="emerald" dot size="sm">live</Badge>
                <Badge color="violet" size="sm">beta</Badge>
                <span className="mp-box" style={{ padding: "5px 9px", fontSize: 10 }}>Card</span>
                <span style={{ width: 26, height: 26, borderRadius: 999, background: VIOLET, color: "#fff", display: "grid", placeItems: "center", fontSize: 10, fontWeight: 600 }}>RK</span>
            </div>
        ),
        "agent-integrations": (
            <div className="mp" style={{ flexDirection: "column", gap: 7 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: AMBER, fontWeight: 600 }}><Icon name="bot" size="xs" />agent · MCP</span>
                <span className="mp" style={{ gap: 5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: VIOLET }} />
                    <span style={{ width: 22, height: 3, background: "var(--border-2)" }} />
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: AMBER }} />
                </span>
            </div>
        ),
        "fancy-whiteboard": (
            <div className="mp" style={{ gap: 6 }}>
                <span style={{ width: 50, height: 50, background: "#fde68a", borderRadius: 5, transform: "rotate(-5deg)", padding: 6, fontSize: 8, color: "#713f12" }}>Ship ✨</span>
                <span style={{ width: 50, height: 50, background: "#bae6fd", borderRadius: 5, transform: "rotate(4deg)", padding: 6, fontSize: 8, color: "#0c4a6e" }}>Review</span>
            </div>
        ),
        "fancy-flow": (
            <div className="mp" style={{ gap: 5 }}>
                {[0, 1, 2].map((i) => (
                    <Fragment key={i}>
                        <span className="mp-box" style={{ width: 26, height: 18 }} />
                        {i < 2 && <span style={{ width: 10, height: 2, background: "var(--border-2)" }} />}
                    </Fragment>
                ))}
            </div>
        ),
        "fancy-sheets": (
            <span className="mp-box" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 22px)" }}>
                    {Array.from({ length: 12 }, (_, i) => (
                        <span key={i} style={{ height: 16, borderRight: "1px solid var(--border-1)", borderBottom: "1px solid var(--border-1)", fontSize: 7, color: "var(--fg-4)", display: "grid", placeItems: "center" }}>{i === 5 ? "=Σ" : ""}</span>
                    ))}
                </div>
            </span>
        ),
        "fancy-slides": (
            <span className="mp-box" style={{ width: 90, height: 54, padding: 8 }}>
                <div style={{ width: "60%", height: 6, background: VIOLET, borderRadius: 2, marginBottom: 5 }} />
                <div style={{ width: "90%", height: 4, background: "var(--bg-3)", borderRadius: 2, marginBottom: 3 }} />
                <div style={{ width: "75%", height: 4, background: "var(--bg-3)", borderRadius: 2 }} />
            </span>
        ),
        "fancy-code": (
            <span className="mp-box" style={{ width: 110, padding: 8, fontFamily: "var(--font-mono)", fontSize: 8.5, lineHeight: 1.5 }}>
                <div><span style={{ color: VIOLET }}>const</span> <span style={{ color: AMBER }}>x</span> = <span style={{ color: "#10b981" }}>42</span>;</div>
                <div style={{ color: "var(--fg-4)" }}>// fancy-code</div>
            </span>
        ),
        "fancy-echarts": (
            <span className="mp" style={{ alignItems: "flex-end", gap: 3, height: 44 }}>
                {[40, 70, 35, 85, 55, 65, 45].map((h, i) => (
                    <span key={i} style={{ width: 7, height: `${h}%`, borderRadius: 2, background: i === 3 ? VIOLET : "var(--bg-3)" }} />
                ))}
            </span>
        ),
        "fancy-term": (
            <span className="mp-box" style={{ width: 120, padding: 8, fontFamily: "var(--font-mono)", fontSize: 9, background: "#0a0a0c", border: "1px solid #27272a", color: "#86efac" }}>
                <span style={{ color: "#71717a" }}>$</span> fancy --help<span className="mp-caret">▋</span>
            </span>
        ),
        "fancy-diff": (
            <span className="mp-box" style={{ width: 120, padding: 0, overflow: "hidden", fontFamily: "var(--font-mono)", fontSize: 8.5 }}>
                <div style={{ padding: "2px 7px", background: "color-mix(in oklch,#ef4444 12%,transparent)", color: "#dc2626" }}>- old line</div>
                <div style={{ padding: "2px 7px", background: "color-mix(in oklch,#10b981 12%,transparent)", color: "#059669" }}>+ new line</div>
            </span>
        ),
        "fancy-artboard": (
            <div className="mp" style={{ gap: 5 }}>
                {[0, 1, 2].map((i) => <span key={i} className="mp-box" style={{ width: 26, height: 34, transform: `rotate(${(i - 1) * 4}deg)` }} />)}
            </div>
        ),
        "fancy-screens": (
            <div className="mp" style={{ gap: 5 }}>
                <span className="mp-box" style={{ width: 36, height: 28 }} />
                <span className="mp-box" style={{ width: 36, height: 28 }} />
            </div>
        ),
        "fancy-pixel": (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 600, color: AMBER, border: `1px solid color-mix(in oklch,${AMBER} 35%,transparent)`, padding: "3px 9px", borderRadius: 999 }}><Icon name="badge-check" size="xs" />Verified</span>
        ),
        "fancy-3d": <Icon name="box" size="xl" style={{ color: VIOLET }} />,
        "fancy-3d-babylon": (
            <div className="mp" style={{ flexDirection: "column", gap: 4 }}>
                <Icon name="box" size="lg" style={{ color: VIOLET }} />
                <span style={{ fontSize: 9, fontWeight: 600, color: "var(--fg-3)" }}>Babylon.js</span>
            </div>
        ),
        "fancy-3d-three": (
            <div className="mp" style={{ flexDirection: "column", gap: 4 }}>
                <Icon name="box" size="lg" style={{ color: AMBER }} />
                <span style={{ fontSize: 9, fontWeight: 600, color: "var(--fg-3)" }}>three.js</span>
            </div>
        ),
        "fancy-mlm-ui": (
            // A tiny downline tree: root → two legs, tier-colored.
            <div className="mp" style={{ flexDirection: "column", gap: 3 }}>
                <span style={{ width: 12, height: 12, borderRadius: 999, background: "#14b8a6" }} />
                <span className="mp" style={{ gap: 0 }}>
                    <span style={{ width: 14, height: 2, background: "var(--border-2)", transform: "rotate(35deg)" }} />
                    <span style={{ width: 14, height: 2, background: "var(--border-2)", transform: "rotate(-35deg)" }} />
                </span>
                <span className="mp" style={{ gap: 14 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 999, background: AMBER }} />
                    <span style={{ width: 10, height: 10, borderRadius: 999, background: VIOLET }} />
                </span>
                <span style={{ fontSize: 8.5, fontWeight: 600, color: "#14b8a6" }}>+150 pts · L1</span>
            </div>
        ),
        "fancy-x-files-ui": (
            <span className="mp-box" style={{ width: 120, padding: 8, fontFamily: "var(--font-mono)", fontSize: 8.5, lineHeight: 1.6, textAlign: "left" }}>
                <div style={{ color: "var(--fg-4)" }}># robots.txt</div>
                <div>User-agent: <span style={{ color: VIOLET }}>*</span></div>
                <div>Disallow: <span style={{ color: "#dc2626" }}>/admin</span></div>
            </span>
        ),
        "fancy-cms-ui": (
            // The editor's three panes in miniature: layers | canvas | inspector.
            <div className="mp" style={{ gap: 4, alignItems: "stretch" }}>
                <span className="mp-box" style={{ width: 24, height: 56, padding: 4, display: "flex", flexDirection: "column", gap: 3 }}>
                    {[0, 1, 2, 3].map((i) => (
                        <span key={i} style={{ height: 4, borderRadius: 2, background: i === 0 ? SKY : "var(--bg-3)", marginLeft: i === 0 ? 0 : 4 }} />
                    ))}
                </span>
                <span className="mp-box" style={{ width: 62, height: 56, padding: 7, textAlign: "center" }}>
                    <div style={{ width: "72%", height: 6, background: "var(--fg-3)", borderRadius: 2, margin: "2px auto 4px" }} />
                    <div style={{ width: "88%", height: 4, background: "var(--bg-3)", borderRadius: 2, margin: "0 auto 3px" }} />
                    <div style={{ width: 26, height: 9, background: SKY, borderRadius: 3, margin: "4px auto 0" }} />
                </span>
                <span className="mp-box" style={{ width: 24, height: 56, padding: 4, display: "flex", flexDirection: "column", gap: 3 }}>
                    {[0, 1, 2].map((i) => (
                        <Fragment key={i}>
                            <span style={{ height: 2.5, width: "60%", borderRadius: 2, background: "var(--bg-3)" }} />
                            <span style={{ height: 4, borderRadius: 2, border: "1px solid var(--border-2)" }} />
                        </Fragment>
                    ))}
                </span>
            </div>
        ),
        "catalog-fms": (
            <div className="mp" style={{ gap: 6 }}>
                <span className="mp-box" style={{ padding: "6px 9px", textAlign: "center" }}>
                    <div style={{ fontSize: 11, fontWeight: 700 }}>$29</div>
                    <div style={{ fontSize: 7.5, color: "var(--fg-4)" }}>/month</div>
                </span>
                <span className="mp-box" style={{ padding: "6px 9px", textAlign: "center", borderColor: VIOLET }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: VIOLET }}>$99</div>
                    <div style={{ fontSize: 7.5, color: "var(--fg-4)" }}>/month</div>
                </span>
            </div>
        ),
        "fancy-inertia": (
            <span className="mp-box" style={{ width: 130, padding: 9 }}>
                <div style={{ fontSize: 9, color: "var(--fg-3)", marginBottom: 5 }}>useFancyForm()</div>
                <div className="mp-line" style={{ width: "100%", marginBottom: 4 }} />
                <span style={{ fontSize: 8, padding: "2px 7px", borderRadius: 5, background: VIOLET, color: "#fff" }}>Submit</span>
            </span>
        ),
        "fancy-map": (
            <span className="mp-box" style={{ width: 108, height: 56, padding: 0, overflow: "hidden", position: "relative", background: "color-mix(in oklch,#14b8a6 10%,var(--surface))" }}>
                <span style={{ position: "absolute", inset: 0, background: "linear-gradient(115deg, transparent 46%, color-mix(in oklch,#14b8a6 40%,transparent) 47%, transparent 49%)" }} />
                <span style={{ position: "absolute", left: 34, top: 16, color: "#0d9488" }}><Icon name="map-pin" size="sm" /></span>
            </span>
        ),
        "fancy-tui": (
            <span className="mp-box" style={{ width: 124, padding: 8, fontFamily: "var(--font-mono)", fontSize: 8.5, background: "#0a0a0c", border: "1px solid #27272a", color: "#a1a1aa", lineHeight: 1.6, textAlign: "left" }}>
                <div style={{ color: "#86efac" }}>? Pick a kit ›</div>
                <div style={{ color: "#e4e4e7" }}>❯ Human+ inbox</div>
                <div>&nbsp;&nbsp;Push workflow</div>
            </span>
        ),
        "fancy-motion": (
            <span className="mp" style={{ flexDirection: "column", gap: 6, width: 120 }}>
                <span className="mp-bar" style={{ width: "100%" }}><span style={{ width: "58%", background: "var(--fuchsia-500)" }} /></span>
                <span style={{ display: "flex", gap: 4, width: "100%" }}>
                    {[0, 1, 2, 3].map((i) => <span key={i} className="mp-box" style={{ flex: 1, height: 12, borderRadius: 3, opacity: i === 1 ? 1 : 0.5 }} />)}
                </span>
            </span>
        ),
        "fancy-brand-icons": (
            <div className="mp" style={{ gap: 8 }}>
                {[["Gh", "#6e5494"], ["St", "#635bff"], ["Sl", "#e01e5a"]].map(([t, c]) => (
                    <span key={t} className="mp-box" style={{ width: 30, height: 30, display: "grid", placeItems: "center", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: c }}>{t}</span>
                ))}
            </div>
        ),
        "fancy-git-ui": (
            <span className="mp-box" style={{ width: 122, padding: 9, fontFamily: "var(--font-mono)", fontSize: 8.5, textAlign: "left" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4, color: "var(--fg-2)" }}>
                    <Icon name="git-branch" size="xs" style={{ color: "#f97316" }} />feat/human-plus
                </div>
                <div style={{ color: "#059669" }}>+12</div>
                <div style={{ color: "#dc2626" }}>−3</div>
            </span>
        ),
        "fancy-passkeys-ui": (
            <span className="mp" style={{ flexDirection: "column", gap: 6 }}>
                <Icon name="fingerprint" size="lg" style={{ color: "#22c55e" }} />
                <span style={{ fontSize: 9, color: "var(--fg-3)" }}>Sign in with a passkey</span>
            </span>
        ),
        classroom: (
            <span className="mp-box" style={{ width: 118, padding: 9, textAlign: "left" }}>
                <div style={{ fontSize: 9, fontWeight: 600, marginBottom: 6, color: "var(--fg-2)" }}>Module 3 · Lesson 2</div>
                <span className="mp-bar" style={{ display: "block", width: "100%" }}><span style={{ width: "70%" }} /></span>
            </span>
        ),
        "job-board": (
            <span className="mp-box" style={{ width: 118, padding: 0, overflow: "hidden" }}>
                {["Senior Engineer", "Design Lead"].map((t, i) => (
                    <div key={t} style={{ padding: "7px 9px", fontSize: 9, borderBottom: i === 0 ? "1px solid var(--border-1)" : "none", display: "flex", justifyContent: "space-between", color: "var(--fg-2)" }}>
                        {t}<span style={{ color: "#0d9488" }}>Apply</span>
                    </div>
                ))}
            </span>
        ),
        "teachers-aid-ui": (
            <span className="mp-box" style={{ width: 122, padding: 9, fontSize: 9, textAlign: "left" }}>
                <div style={{ color: AMBER, fontWeight: 600, marginBottom: 5, display: "flex", alignItems: "center", gap: 4 }}>
                    <Icon name="bot" size="xs" />Proposal · 4 changes
                </div>
                <div style={{ display: "flex", gap: 5 }}>
                    <span style={{ padding: "2px 7px", borderRadius: 5, background: "#10b981", color: "#fff", fontSize: 8 }}>Accept</span>
                    <span style={{ padding: "2px 7px", borderRadius: 5, border: "1px solid var(--border-2)", fontSize: 8, color: "var(--fg-2)" }}>Reject</span>
                </div>
            </span>
        ),
    };
    map["react-fancy"] = map["fancy-core"];
    return map[slug] ?? <Icon name="package" size="lg" style={{ color: "var(--fg-4)" }} />;
}

