import { useEffect } from "react";
import { usePage } from "@inertiajs/react";
import { attachHeuristicsSink } from "@particle-academy/agent-integrations";

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
 * point `heuristicsSelf` carries the site's own key + collect endpoint.
 */
export function AgentAnalyticsSink() {
    const self = (usePage<{ heuristicsSelf?: HeuristicsSelf }>().props.heuristicsSelf ?? null) as HeuristicsSelf;
    const siteKey = self?.siteKey ?? null;
    const endpoint = self?.endpoint ?? null;

    useEffect(() => {
        if (!siteKey || !endpoint) return;
        return attachHeuristicsSink({ siteKey, endpoint, source: "all" });
    }, [siteKey, endpoint]);

    return null;
}
