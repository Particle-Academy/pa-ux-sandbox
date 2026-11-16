import { LiveBadge, type LiveStatus } from "@particle-academy/react-fancy";
import type { ComponentDoc } from "./types";

const STATUSES: LiveStatus[] = ["live", "starting", "offline", "ended"];

export function LiveBadgeExample() {
    return (
        <div className="flex flex-wrap items-center gap-3">
            {STATUSES.map((status) => (
                <LiveBadge key={status} status={status} />
            ))}
        </div>
    );
}

export const liveBadgeDoc: ComponentDoc = {
    intro: (
        <p>
            A live channel's status as a Badge: LIVE in red with a dot, Starting in amber, Offline and Ended in zinc. The status is
            yours to supply, from the provider's API or your stream server's status endpoint; the badge probes nothing.
        </p>
    ),
    examples: [
        {
            name: "Every status",
            description: "status defaults to \"live\".",
            render: () => <LiveBadgeExample />,
            code: `<LiveBadge status="live" />
<LiveBadge status="starting" />
<LiveBadge status="offline" />
<LiveBadge status="ended" />`,
        },
        {
            name: "Sizes, the dot, and labels",
            description: "size is sm (default), md or lg. dot is on while live unless you turn it off, and can be forced on for another status. labels translate every status.",
            render: () => (
                <div className="flex flex-wrap items-center gap-3">
                    <LiveBadge size="sm" />
                    <LiveBadge size="md" />
                    <LiveBadge size="lg" dot={false} />
                    <LiveBadge status="starting" dot />
                    <LiveBadge size="md" labels={{ live: "EN VIVO", starting: "Empezando", offline: "Sin señal", ended: "Terminado" }} />
                </div>
            ),
            code: `<LiveBadge size="md" />
<LiveBadge size="lg" dot={false} />
<LiveBadge status="starting" dot />
<LiveBadge labels={{ live: "EN VIVO", starting: "Empezando", offline: "Sin señal", ended: "Terminado" }} />`,
        },
    ],
    props: [
        { name: "status", type: `"live" | "starting" | "offline" | "ended"`, default: `"live"`, description: "What the host says the channel is doing." },
        { name: "dot", type: "boolean", default: "on while live", description: "Show the on-air dot." },
        { name: "size", type: `"sm" | "md" | "lg"`, default: `"sm"`, description: "Badge size." },
        { name: "labels", type: "Partial<LiveBadgeLabels>", default: "English", description: "live, starting, offline, ended." },
    ],
    notes: (
        <ul>
            <li>
                Handles: <code>data-react-fancy-live-badge</code>, <code>data-live-status</code>.
            </li>
        </ul>
    ),
};
