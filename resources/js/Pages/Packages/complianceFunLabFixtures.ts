import type { ConsentSnapshot } from "@particle-academy/fancy-compliance-ui";
import type {
    FunLabAchievement,
    FunLabFeedItem,
    FunLabLeaderboardEntry,
    FunLabLevelReached,
    FunLabMetric,
    FunLabMetricProgress,
    FunLabProfile,
} from "@particle-academy/fancy-fun-lab-ui";

/*
 * Fixtures for the fancy-compliance-ui and fancy-fun-lab-ui demos and tiles,
 * shared so a component's demo and its thumbnail cannot drift apart.
 *
 * Every consent fixture is LOCAL state: the demos run their own
 * ConsentProvider and never post to /fancy-compliance, because a decision made
 * in a demo is not the visitor's consent to this site.
 */

const CONSENT_CATEGORIES: ConsentSnapshot["categories"] = [
    {
        key: "necessary",
        label: "fancy-compliance::categories.necessary.label",
        description: "fancy-compliance::categories.necessary.description",
        purposes: [{ key: "fancy-compliance::categories.necessary.purposes.session" }],
        required: true,
    },
    {
        key: "analytics",
        label: "fancy-compliance::categories.analytics.label",
        description: "fancy-compliance::categories.analytics.description",
        purposes: [{ key: "fancy-compliance::categories.analytics.purposes.usage" }],
        required: false,
    },
    {
        key: "marketing",
        label: "fancy-compliance::categories.marketing.label",
        description: "fancy-compliance::categories.marketing.description",
        purposes: [{ key: "fancy-compliance::categories.marketing.purposes.ads" }],
        required: false,
    },
];

/** A first visit: nothing decided, the banner shows. */
export const CONSENT_UNDECIDED: ConsentSnapshot = {
    policyVersion: "demo-1",
    categories: CONSENT_CATEGORIES,
    consent: null,
    needsConsent: true,
    routes: null,
};

/** The snapshot a decision produces, the way the server would answer. */
export function consentAfter(granted: string[], source: string): ConsentSnapshot {
    const optional = CONSENT_CATEGORIES.filter((c) => !c.required).map((c) => c.key);

    return {
        ...CONSENT_UNDECIDED,
        needsConsent: false,
        consent: {
            granted: ["necessary", ...granted.filter((k) => optional.includes(k))],
            refused: optional.filter((k) => !granted.includes(k)),
            policyVersion: CONSENT_UNDECIDED.policyVersion,
            decidedAt: "2026-11-05T12:00:00Z",
            source,
            current: true,
        },
    };
}

export const FL_PROFILE: FunLabProfile = {
    id: 7,
    awardable_type: "App\\Models\\User",
    awardable_id: 7,
    is_opted_in: true,
    total_xp: 1840,
    achievement_count: 5,
    prize_count: 1,
};

export const FL_METRICS: FunLabMetric[] = [
    { slug: "explorer-xp", name: "Explorer" },
    { slug: "builder-xp", name: "Builder" },
];

export const FL_METRIC_PROGRESS: FunLabMetricProgress[] = [
    { slug: "explorer-xp", name: "Explorer", total_xp: 1240, current_level: 4, level_name: "Pathfinder", current_level_xp: 1000, next_level_xp: 1600 },
    { slug: "builder-xp", name: "Builder", total_xp: 600, current_level: 2, level_name: "Tinkerer", current_level_xp: 400, next_level_xp: 900 },
];

export const FL_NAMES: Record<string, string> = { "3": "Ada", "7": "You", "9": "Bo", "12": "Cy", "15": "Di" };

/** One page of a leaderboard, by XP overall, as `GET /leaderboards/{type}` returns it. */
export const FL_ENTRIES: FunLabLeaderboardEntry[] = [
    { rank: 1, id: 3, awardable_type: "App\\Models\\User", awardable_id: 3, total_xp: 4210, achievement_count: 11, prize_count: 3 },
    { rank: 2, id: 9, awardable_type: "App\\Models\\User", awardable_id: 9, total_xp: 2980, achievement_count: 8, prize_count: 2 },
    { rank: 3, id: 7, awardable_type: "App\\Models\\User", awardable_id: 7, total_xp: 1840, achievement_count: 5, prize_count: 1 },
    { rank: 4, id: 12, awardable_type: "App\\Models\\User", awardable_id: 12, total_xp: 1205, achievement_count: 4, prize_count: 0 },
    { rank: 5, id: 15, awardable_type: "App\\Models\\User", awardable_id: 15, total_xp: 760, achievement_count: 2, prize_count: 0 },
];

/** The same board ranked on one gamed metric (laravel-fun-lab 0.7.0's `?metric=`). */
export function flEntriesFor(metric: string | null): FunLabLeaderboardEntry[] {
    if (metric === null) {
        return FL_ENTRIES;
    }
    const xp: Record<number, number> = metric === "builder-xp" ? { 3: 900, 9: 1400, 7: 600, 12: 150, 15: 40 } : { 3: 3310, 9: 1580, 7: 1240, 12: 1055, 15: 720 };

    return [...FL_ENTRIES]
        .sort((a, b) => xp[b.id] - xp[a.id] || a.id - b.id)
        .map((entry, i) => ({ ...entry, rank: i + 1, metric: { slug: metric, total_xp: xp[entry.id], current_level: Math.max(1, Math.floor(xp[entry.id] / 400)) } }));
}

export const FL_ACHIEVEMENTS: FunLabAchievement[] = [
    { id: 1, slug: "first-steps", name: "First steps", description: "Opened your first component page." },
    { id: 2, slug: "docs-diver", name: "Docs diver", description: "Read ten documentation pages." },
    { id: 3, slug: "demo-driver", name: "Demo driver", description: "Drove five interactive demos." },
    { id: 4, slug: "shipper", name: "Shipper", description: "Listed a project in the showcase." },
    { id: 5, slug: "connector", name: "Connector", description: "Connected an agent to a surface." },
    { id: 6, slug: "recruiter", name: "Recruiter", description: "Brought a friend in with your invite link." },
];

export const FL_EARNED = ["first-steps", "docs-diver", "demo-driver"];

export const FL_LEVEL_UP: FunLabLevelReached = {
    profile_id: 7,
    gamed_metric_id: 1,
    gamed_metric_slug: "explorer-xp",
    gamed_metric_name: "Explorer",
    level: 5,
    level_name: "Cartographer",
    xp_threshold: 1600,
    total_xp: 1615,
    achievements: [{ id: 6, slug: "recruiter", name: "Recruiter" }],
    occurred_at: "2026-11-05T12:00:00Z",
};

export const FL_FEED: FunLabFeedItem[] = [
    {
        id: "xp-2",
        type: "xp.awarded",
        profile_id: 7,
        gamed_metric_id: 2,
        gamed_metric_slug: "builder-xp",
        gamed_metric_name: "Builder",
        amount: 40,
        total_xp: 600,
        current_level: 2,
        reason: "listed a project",
        occurred_at: "2026-11-05T11:58:00Z",
    },
    {
        id: "xp-1",
        type: "xp.awarded",
        profile_id: 7,
        gamed_metric_id: 1,
        gamed_metric_slug: "explorer-xp",
        gamed_metric_name: "Explorer",
        amount: 15,
        total_xp: 1240,
        current_level: 4,
        reason: "read the Modal docs",
        occurred_at: "2026-11-05T11:52:00Z",
    },
];
