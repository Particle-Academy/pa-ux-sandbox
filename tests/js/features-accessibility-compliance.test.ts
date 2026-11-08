import { describe, expect, it } from "vitest";
import { composite, contrastRatio, formatRatio, hexToRgb } from "../../resources/js/Pages/Features/Accessibility/contrast";
import { meetsTarget } from "../../resources/js/Pages/Features/Accessibility/targets";
import { decide, initialConsentState, publishNewPolicy, withdraw } from "../../resources/js/Pages/Features/Compliance/ledger";

/*
 * The pure halves of the Accessibility and Compliance demos. The contrast
 * maths is checked against ratios react-fancy's own changelog quotes, so a
 * wrong formula cannot make the live table read "passes".
 */

describe("contrast", () => {
    it("matches the ratios react-fancy 6.15.0 quotes for zinc-500", () => {
        const zinc500 = hexToRgb("#71717a");
        expect(contrastRatio(zinc500, [255, 255, 255])).toBeCloseTo(4.83, 1);
        expect(contrastRatio(zinc500, hexToRgb("#1e1e24"))).toBeCloseTo(3.44, 1);
        expect(contrastRatio(zinc500, hexToRgb("#18181b"))).toBeCloseTo(3.67, 1);
    });

    it("matches the 1.27:1 the old zinc-200 outline measured on white", () => {
        expect(contrastRatio(hexToRgb("#e4e4e7"), [255, 255, 255])).toBeCloseTo(1.27, 1);
    });

    it("is 21:1 for black on white, in either order", () => {
        expect(contrastRatio([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 5);
        expect(contrastRatio([255, 255, 255], [0, 0, 0])).toBeCloseTo(21, 5);
    });

    it("composites a translucent colour over what is behind it", () => {
        expect(composite([0, 0, 0, 0.5], [255, 255, 255])).toEqual([128, 128, 128]);
        expect(composite([10, 20, 30, 1], [255, 255, 255])).toEqual([10, 20, 30]);
    });

    it("never rounds a failing ratio up to a pass", () => {
        expect(formatRatio(2.999)).toBe("2.99:1");
    });
});

describe("target sizes", () => {
    it("needs both sides at the minimum", () => {
        expect(meetsTarget(44, 44, 44)).toBe(true);
        expect(meetsTarget(80, 32, 44)).toBe(false);
        expect(meetsTarget(24, 24, 24)).toBe(true);
    });
});

describe("the consent ledger", () => {
    const at = "2026-11-07T12:00:00Z";

    it("records nothing until the person decides", () => {
        const state = initialConsentState();
        expect(state.ledger).toEqual([]);
        expect(state.snapshot.needsConsent).toBe(true);
    });

    it("appends a decision with necessary always granted and every optional category placed", () => {
        const state = decide(initialConsentState(), ["analytics"], "banner", at);
        expect(state.ledger).toEqual([
            { n: 1, action: "decision", granted: ["necessary", "analytics"], refused: ["marketing"], policyVersion: "demo-1", source: "banner" },
        ]);
        expect(state.snapshot.needsConsent).toBe(false);
    });

    it("records a withdrawal as a new row and leaves the earlier one alone", () => {
        const decided = decide(initialConsentState(), ["analytics", "marketing"], "banner", at);
        const state = withdraw(decided, ["analytics"], "preferences", at);
        expect(state.ledger).toHaveLength(2);
        expect(state.ledger[0]).toEqual(decided.ledger[0]);
        expect(state.ledger[1]).toMatchObject({ action: "withdrawal", granted: ["necessary", "marketing"], refused: ["analytics"] });
        expect(withdraw(decided, null, "preferences", at).snapshot.consent?.granted).toEqual(["necessary"]);
    });

    it("asks again under a new policy version, keeping the record", () => {
        const decided = decide(initialConsentState(), ["analytics"], "banner", at);
        const state = publishNewPolicy(decided);
        expect(state.snapshot.needsConsent).toBe(true);
        expect(state.snapshot.policyVersion).toBe("demo-2");
        expect(state.snapshot.consent?.current).toBe(false);
        expect(state.ledger).toEqual(decided.ledger);
        expect(decide(state, [], "banner", at).ledger[1]).toMatchObject({ policyVersion: "demo-2", refused: ["analytics", "marketing"] });
    });
});
