// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { ADVENTURE, ADVENTURE_EFFECTS } from "../../resources/js/Pages/Flow/FlowStudio";
import { uiEffectExecutor } from "../../resources/flow-nodes/ui-effect/js/executor";

describe("Choose-your-own-adventure UI effects", () => {
  afterEach(() => {
    vi.useRealTimers();
    document.documentElement.className = "";
  });

  it("keeps each page effect active across the native outcome UX step, then removes it", () => {
    for (const [ending, effect] of Object.entries(ADVENTURE_EFFECTS)) {
      expect(ADVENTURE.nodes).toContainEqual(expect.objectContaining({
        id: effect.nodeId,
        type: "@particle-academy/ui_effect",
        data: expect.objectContaining({
          kind: "@particle-academy/ui_effect",
          config: expect.objectContaining({ target: "page", op: "add-class", value: effect.className, durationMs: 0 }),
        }),
      }));
      expect(ADVENTURE.edges).toContainEqual(expect.objectContaining({ source: `e_${ending}`, target: effect.nodeId }));
      expect(ADVENTURE.edges).toContainEqual(expect.objectContaining({ source: effect.nodeId, target: "ux_adventure_outcome" }));
      expect(ADVENTURE.nodes).toContainEqual(expect.objectContaining({
        id: effect.clearNodeId,
        type: "@particle-academy/ui_effect",
        data: expect.objectContaining({ config: expect.objectContaining({ op: "remove-class", value: effect.className }) }),
      }));
      expect(ADVENTURE.edges).toContainEqual(expect.objectContaining({ source: "clear_route", target: effect.clearNodeId, sourceHandle: ending }));
      expect(ADVENTURE.edges).toContainEqual(expect.objectContaining({ source: effect.clearNodeId, target: "award" }));
      expect(ADVENTURE.edges).not.toContainEqual(expect.objectContaining({ source: `e_${ending}`, target: "award" }));
    }
    expect(ADVENTURE.nodes).toContainEqual(expect.objectContaining({ id: "ux_adventure_outcome", type: "ux_adventure_outcome" }));
    expect(ADVENTURE.edges).toContainEqual(expect.objectContaining({ source: "ux_adventure_outcome", target: "clear_route" }));
  });

  it("uses the vendored executor with no timer so the page effect stays active", async () => {
    vi.useFakeTimers();
    const effect = ADVENTURE_EFFECTS.win;
    const node = ADVENTURE.nodes.find((candidate) => candidate.id === effect.nodeId)!;

    const pending = uiEffectExecutor({
      node,
      inputs: { in: { ending: "win" } },
      emit: vi.fn(),
    } as any);

    expect(document.documentElement.classList.contains(effect.className)).toBe(true);
    await vi.advanceTimersByTimeAsync(5000);
    await expect(pending).resolves.toEqual(expect.objectContaining({ ending: "win", applied: true }));
    expect(document.documentElement.classList.contains(effect.className)).toBe(true);
  });
});
