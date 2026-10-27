import { describe, expect, it } from "vitest";
import {
    actionById,
    award,
    leaderboard,
    levelFor,
    progressFor,
    seed,
    seededState,
    type State,
} from "../../resources/js/Pages/Features/Gamification/funlab";

/*
 * The /features/gamification demo models laravel-fun-lab's rules in the
 * browser. This asserts the model against the SAME parity fixture that
 * GamificationFeatureTest asserts the real PHP engine against, so a drift on
 * either side fails a test.
 */

const snapshot = (state: State, id: string) => ({
    total: state[id].total,
    levels: state[id].levels,
    achievements: [...state[id].achievements].sort(),
});

describe("fun-lab model", () => {
    it("levels by threshold, starting at 1", () => {
        expect(levelFor(0)).toBe(1);
        expect(levelFor(99)).toBe(1);
        expect(levelFor(100)).toBe(2);
        expect(levelFor(5000)).toBe(5);
        expect(progressFor(140)).toMatchObject({ level: 2, floor: 100, next: { level: 3, xp: 250 } });
        expect(progressFor(900).next).toBeNull();
    });

    it("matches the parity fixture for every seeded player", () => {
        const state = seededState();
        for (const [id, expected] of Object.entries(seed.parity.seeded)) {
            expect(snapshot(state, id), id).toEqual(expected);
        }
        expect(leaderboard(state, "xp").map((p) => p.id)).toEqual(seed.parity.leaderboardByXp);
    });

    it("matches the parity fixture after the scripted actions", () => {
        let state = seededState();
        for (const id of seed.parity.script) {
            const action = actionById(id);
            state = award(state, seed.you, action.metric, action.amount).state;
        }
        expect(snapshot(state, seed.you)).toEqual(seed.parity.afterScript);
    });

    it("announces a level-up and its achievement once, then never again", () => {
        const state = seededState();
        const first = award(state, "you", "build-xp", 60);
        expect(first.events.map((e) => e.kind)).toEqual(["xp", "level", "achievement"]);

        const second = award(first.state, "you", "build-xp", 10);
        expect(second.events.map((e) => e.kind)).toEqual(["xp"]);
    });

    it("grants every level jumped over in one award", () => {
        const { state, events } = award(seededState(), "sol", "build-xp", 600);
        expect(state.sol.levels["build-xp"]).toBe(4);
        expect(events.filter((e) => e.kind === "achievement").map((e) => (e as { slug: string }).slug)).toEqual(["shipped-it", "build-expert"]);
    });

    it("never mutates the state it was given", () => {
        const state = seededState();
        const before = JSON.stringify(state);
        award(state, "you", "docs-xp", 300);
        expect(JSON.stringify(state)).toBe(before);
    });

    it("ranks by achievements when asked", () => {
        const order = leaderboard(seededState(), "achievements").map((p) => p.id);
        expect(order[0]).toBe("mara");
        expect(order.slice(-2)).toEqual(["you", "sol"]);
    });
});
