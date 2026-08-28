// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { ADVENTURE, ADVENTURE_EFFECTS } from "../../resources/js/Pages/Flow/FlowStudio";
import { uiEffectExecutor } from "../../resources/flow-nodes/ui-effect/js/executor";

describe("Choose-your-own-adventure UI effects", () => {
  afterEach(() => {
    vi.useRealTimers();
    document.documentElement.className = "";
  });

  it("routes every ending through its own page-level ui_effect before recording it", () => {
    for (const [ending, effect] of Object.entries(ADVENTURE_EFFECTS)) {
      expect(ADVENTURE.nodes).toContainEqual(expect.objectContaining({
        id: effect.nodeId,
        type: "@particle-academy/ui_effect",
        data: expect.objectContaining({
          kind: "@particle-academy/ui_effect",
          config: expect.objectContaining({ target: "page", op: "add-class", value: effect.className }),
        }),
      }));
      expect(ADVENTURE.edges).toContainEqual(expect.objectContaining({ source: `e_${ending}`, target: effect.nodeId }));
      expect(ADVENTURE.edges).toContainEqual(expect.objectContaining({ source: effect.nodeId, target: "award" }));
      expect(ADVENTURE.edges).not.toContainEqual(expect.objectContaining({ source: `e_${ending}`, target: "award" }));
    }
  });

  it("uses the vendored executor to affect the whole page and then restore it", async () => {
    vi.useFakeTimers();
    const effect = ADVENTURE_EFFECTS.win;
    const node = ADVENTURE.nodes.find((candidate) => candidate.id === effect.nodeId)!;

    const pending = uiEffectExecutor({
      node,
      inputs: { in: { ending: "win" } },
      emit: vi.fn(),
    } as any);

    expect(document.documentElement.classList.contains(effect.className)).toBe(true);
    await vi.advanceTimersByTimeAsync(effect.durationMs);
    await expect(pending).resolves.toEqual(expect.objectContaining({ ending: "win", applied: true }));
    expect(document.documentElement.classList.contains(effect.className)).toBe(false);
  });
});
