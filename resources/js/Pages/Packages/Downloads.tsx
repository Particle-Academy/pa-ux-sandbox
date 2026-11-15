import { Badge, StatList } from "@particle-academy/react-fancy";
import { formatCount, type Downloads } from "../../lib/downloads";

/**
 * Download counts on a package or family page: this month, plus all-time where
 * every source the package publishes to keeps one.
 *
 * Renders NOTHING when there is no measurement. A zero here would be a claim,
 * and an unmeasured package has not earned it.
 */
export function DownloadStats({ downloads, className }: { downloads: Downloads | undefined; className?: string }) {
    if (!downloads) return null;

    const items = [
        { key: "downloads-month", value: <span title={downloads.monthly.toLocaleString("en-US")}>{formatCount(downloads.monthly)}</span>, label: "downloads this month" },
    ];
    if (downloads.total !== null) {
        items.push({
            key: "downloads-total",
            value: <span title={downloads.total.toLocaleString("en-US")}>{formatCount(downloads.total)}</span>,
            label: "downloads all-time",
        });
    }

    return <StatList className={className} align="start" items={items} data-downloads="" />;
}

/** The compact form for a listing card: one Badge, or nothing. */
export function DownloadsBadge({ downloads, className }: { downloads: Downloads | undefined; className?: string }) {
    if (!downloads) return null;

    return (
        <Badge color="zinc" className={className} data-downloads-badge="">
            <span title={downloads.monthly.toLocaleString("en-US")}>{formatCount(downloads.monthly)}</span>
            {" downloads/mo"}
        </Badge>
    );
}
