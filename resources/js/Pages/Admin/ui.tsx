import { type ReactNode } from "react";
import { Card, Icon } from "@particle-academy/react-fancy";

/** Page title + subtitle + right-aligned actions — the standard admin screen header. */
export function PageHeader({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) {
    return (
        <div className="admin-ph fancy-fade-in">
            <div>
                <h1>{title}</h1>
                {sub && <p>{sub}</p>}
            </div>
            {actions && <div className="admin-ph-actions">{actions}</div>}
        </div>
    );
}

/** A single dashboard metric tile. */
export function StatCard({ label, value, icon, delta, up, sub }: { label: string; value: ReactNode; icon: string; delta?: string; up?: boolean | null; sub?: string }) {
    return (
        <Card style={{ padding: 15 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <span className="admin-stat-label">{label}</span>
                <span className="admin-statcard-ico"><Icon name={icon} size="sm" /></span>
            </div>
            <div className="admin-stat-value">{value}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                {up != null && delta && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 12, fontWeight: 600, color: up ? "var(--emerald-600, #059669)" : "#dc2626" }}>
                        <Icon name={up ? "trending-up" : "trending-down"} size="xs" />
                        {delta}
                    </span>
                )}
                {sub && <span style={{ fontSize: 12, color: "var(--fg-3)" }}>{sub}</span>}
            </div>
        </Card>
    );
}

/** A status pill mapping a Stripe-sync / active boolean to a Badge color. */
export function StatusDot({ ok, on = "Synced", off = "Not synced" }: { ok: boolean; on?: string; off?: string }) {
    return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: ok ? "var(--emerald-600, #059669)" : "var(--fg-3)" }}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: ok ? "var(--emerald-500, #10b981)" : "var(--fg-4)" }} />
            {ok ? on : off}
        </span>
    );
}

/** Empty-state row for a card/table with no data yet. */
export function EmptyRow({ children }: { children: ReactNode }) {
    return <div style={{ padding: "28px 16px", textAlign: "center", color: "var(--fg-3)", fontSize: 13 }}>{children}</div>;
}
