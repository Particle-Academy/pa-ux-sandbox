import { useEffect } from "react";
import { usePage } from "@inertiajs/react";
import { attachHeuristicsSink } from "@particle-academy/agent-integrations";
import { useConsent } from "@particle-academy/fancy-compliance-ui";

type HeuristicsSelf = { siteKey: string; endpoint: string } | null;

/**
 * Mounts the agent-integrations heuristics sink for the lifetime of the app
 * shell. The sink subscribes to the in-page agent activity bus — the SAME
 * `fancy-auto-common` singleton the bridges emit into (it ships inside
 * agent-integrations, so there's no cross-bundle split) — and POSTs each agent
 * action to the showcase's /collect endpoint as `actor:"agent"`. That makes
 * agents driving ANY surface in this tab (Agent Playground, co-browse, demos)
 * show up in analytics next to humans. Headless relay agents (no collecting
 * tab) are covered server-side in AgentRelayController.
 *
 * No-ops until a Fancy Pixel tracker is configured (Admin → Settings), at which
 * point `heuristicsSelf` carries the site's own key + collect endpoint, AND until
 * the person has allowed `analytics`: it is the site's own analytics, so it
 * attaches only under that consent and detaches the moment it is withdrawn
 * (the effect's cleanup is the sink's own unsubscribe, so it genuinely stops).
 */
export function AgentAnalyticsSink() {
    const self = (usePage<{ heuristicsSelf?: HeuristicsSelf }>().props.heuristicsSelf ?? null) as HeuristicsSelf;
    const siteKey = self?.siteKey ?? null;
    const endpoint = self?.endpoint ?? null;
    const allowed = useConsent().allows("analytics");

    useEffect(() => {
        if (!allowed || !siteKey || !endpoint) return;
        return attachHeuristicsSink({ siteKey, endpoint, source: "all" });
    }, [allowed, siteKey, endpoint]);

    return null;
}
