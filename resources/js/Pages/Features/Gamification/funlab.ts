/**
 * A browser-side model of the laravel-fun-lab rules this demo shows, over the
 * seed in `funlab-seed.json`. laravel-fun-lab is a PHP package, so the page
 * cannot call it; instead this mirrors the exact rules it implements, and
 * `GamificationFeatureTest` runs the REAL engine (LFL::setup / award) over the
 * same seed and asserts the same numbers, so the two cannot drift silently.
 *
 * Rules mirrored (laravel-fun-lab 0.6):
 *  - XP is awarded to a GamedMetric; a profile's total XP is the sum across
 *    metrics (GamedMetricService::awardXp).
 *  - A metric's level is the highest level whose threshold the XP has reached,
 *    starting at 1 (MetricLevelService::checkProgression, MetricLevel::isReached).
 *  - Achievements attached to a level are granted automatically when that
 *    level is first reached, once each (checkProgression's auto-award).
 *  - The leaderboard orders profiles by total XP, or by achievement count
 *    (LeaderboardBuilder::by('xp' | 'achievements')).
 */
import seed from "./funlab-seed.json";

export type Seed = typeof seed;
export type MetricSlug = string;

export type PlayerState = {
    id: string;
    name: string;
    xp: Record<MetricSlug, number>;
    levels: Record<MetricSlug, number>;
    /** Achievement slugs, in the order they were granted. */
    achievements: string[];
    total: number;
};

export type FunLabEvent =
    | { kind: "xp"; player: string; metric: MetricSlug; amount: number }
    | { kind: "level"; player: string; metric: MetricSlug; level: number; name: string }
    | { kind: "achievement"; player: string; slug: string; name: string };

export type State = Record<string, PlayerState>;

const LEVELS = [...seed.levels].sort((a, b) => a.level - b.level);

export function levelFor(xp: number): number {
    let reached = 1;
    for (const level of LEVELS) {
        if (xp >= level.xp) reached = Math.max(reached, level.level);
    }
    return reached;
}

/** Progress inside the current level: XP into it, XP the next level needs, and that level. */
export function progressFor(xp: number): { level: number; name: string; floor: number; next: { level: number; name: string; xp: number } | null } {
    const level = levelFor(xp);
    const current = LEVELS.find((l) => l.level === level)!;
    const next = LEVELS.find((l) => l.level > level) ?? null;
    return { level, name: current.name, floor: current.xp, next: next ? { level: next.level, name: next.name, xp: next.xp } : null };
}

function emptyPlayer(id: string, name: string): PlayerState {
    const xp: Record<string, number> = {};
    const levels: Record<string, number> = {};
    for (const metric of seed.metrics) {
        xp[metric.slug] = 0;
        levels[metric.slug] = 1;
    }
    return { id, name, xp, levels, achievements: [], total: 0 };
}

/** Award XP: returns the next state and what happened, in order. Never mutates. */
export function award(state: State, playerId: string, metric: MetricSlug, amount: number): { state: State; events: FunLabEvent[] } {
    const before = state[playerId];
    if (!before) throw new Error(`No player ${playerId}`);
    if (!seed.metrics.some((m) => m.slug === metric)) throw new Error(`No metric ${metric}`);

    const player: PlayerState = {
        ...before,
        xp: { ...before.xp, [metric]: before.xp[metric] + amount },
        levels: { ...before.levels },
        achievements: [...before.achievements],
        total: before.total + amount,
    };
    const events: FunLabEvent[] = [{ kind: "xp", player: playerId, metric, amount }];

    const current = player.levels[metric];
    const unlocked = LEVELS.filter((l) => l.level > current && player.xp[metric] >= l.xp);
    if (unlocked.length > 0) {
        player.levels[metric] = unlocked[unlocked.length - 1].level;
        for (const level of unlocked) {
            events.push({ kind: "level", player: playerId, metric, level: level.level, name: level.name });
            for (const achievement of seed.achievements) {
                if (achievement.metric !== metric || achievement.level !== level.level) continue;
                if (player.achievements.includes(achievement.slug)) continue;
                player.achievements.push(achievement.slug);
                events.push({ kind: "achievement", player: playerId, slug: achievement.slug, name: achievement.name });
            }
        }
    }

    return { state: { ...state, [playerId]: player }, events };
}

/** Every seeded player, built by awarding their seed XP metric by metric through the same rules. */
export function seededState(): State {
    let state: State = {};
    for (const player of seed.players) {
        state[player.id] = emptyPlayer(player.id, player.name);
        for (const metric of seed.metrics) {
            const amount = (player.xp as Record<string, number | undefined>)[metric.slug] ?? 0;
            if (amount > 0) state = award(state, player.id, metric.slug, amount).state;
        }
    }
    return state;
}

export type LeaderboardSort = "xp" | "achievements";

export function leaderboard(state: State, by: LeaderboardSort): (PlayerState & { rank: number })[] {
    const score = (p: PlayerState) => (by === "xp" ? p.total : p.achievements.length);
    return Object.values(state)
        .sort((a, b) => score(b) - score(a) || b.total - a.total || a.name.localeCompare(b.name))
        .map((player, index) => ({ ...player, rank: index + 1 }));
}

export function actionById(id: string) {
    const action = seed.actions.find((a) => a.id === id);
    if (!action) throw new Error(`No action ${id}`);
    return action;
}

export { seed };
