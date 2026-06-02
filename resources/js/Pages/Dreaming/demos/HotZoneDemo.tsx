import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  Button,
  Switch,
  Select,
  Badge,
  Slider,
} from "@particle-academy/react-fancy";

/**
 * HotZone — react-fancy primitive that pulses once when wrapped
 * content changes, then settles. The simplest possible "look here"
 * affordance: a brief glow + scale pop, calibrated by tone
 * (info / change / risky), intensity, and decay duration.
 *
 * Two triggers:
 *   • change-detection: pass `value`, the zone pulses when it differs
 *     from the previous render
 *   • explicit:        pass `pulseKey`, the zone pulses when it
 *     increments (handy for "the agent did a thing, please notice")
 *
 * Tone palette:
 *   • info   — calm sky-blue ring
 *   • change — violet, the default for "an agent edited this"
 *   • risky  — amber/red, for "this changed and you should care"
 *
 * Auto-throttles so back-to-back changes don't strobe. After
 * `decay`, the ring fades out and the element is visually neutral.
 */
type Tone = "info" | "change" | "risky";

const TONE_RING: Record<Tone, string> = {
  info: "rgba(14, 165, 233, 0.55)",
  change: "rgba(168, 85, 247, 0.55)",
  risky: "rgba(245, 158, 11, 0.65)",
};

const TONE_BG: Record<Tone, string> = {
  info: "rgba(14, 165, 233, 0.18)",
  change: "rgba(168, 85, 247, 0.18)",
  risky: "rgba(245, 158, 11, 0.22)",
};

export function HotZoneDemo() {
  const [tone, setTone] = useState<Tone>("change");
  const [decay, setDecay] = useState(900);
  const [intensity, setIntensity] = useState(0.7);
  const [auto, setAuto] = useState(true);

  // Cells that change at varying cadences.
  const [cellA, setCellA] = useState("Acme");
  const [cellB, setCellB] = useState("$120k");
  const [cellC, setCellC] = useState("Active");
  const [pulseKey, setPulseKey] = useState(0);

  const log = useRef<Array<{ at: number; which: string }>>([]);
  const [logTick, setLogTick] = useState(0);
  const note = useCallback((which: string) => {
    log.current = [{ at: Date.now(), which }, ...log.current].slice(0, 8);
    setLogTick((t) => t + 1);
  }, []);

  // Autoplay: random mutations every 1–3s.
  useEffect(() => {
    if (!auto) return;
    const tick = () => {
      const r = Math.random();
      if (r < 0.33) {
        setCellA((cur) =>
          ["Acme", "Globex", "Initech", "Hooli"][
            (["Acme", "Globex", "Initech", "Hooli"].indexOf(cur) + 1) % 4
          ],
        );
        note("cellA");
      } else if (r < 0.66) {
        setCellB((cur) => {
          const opts = ["$120k", "$140k", "$95k", "$200k"];
          return opts[(opts.indexOf(cur) + 1) % opts.length];
        });
        note("cellB");
      } else {
        setCellC((cur) =>
          ["Active", "Renewal", "Trial", "Churned"][
            (["Active", "Renewal", "Trial", "Churned"].indexOf(cur) + 1) % 4
          ],
        );
        note("cellC");
      }
    };
    const id = window.setInterval(tick, 1100 + Math.random() * 1600);
    return () => window.clearInterval(id);
  }, [auto, note]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">HotZone</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Wrap any element so it pulses once when its content changes. Tone,
          intensity, and decay tune the loudness. The pulse fades out — no
          residue, no permanent badge.
        </p>
      </header>

      <Card>
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            label="Tone"
            list={[
              { value: "info", label: "info" },
              { value: "change", label: "change" },
              { value: "risky", label: "risky" },
            ]}
            value={tone}
            onValueChange={(v) => setTone(v as Tone)}
          />
          <Slider
            label="Decay"
            min={300}
            max={2200}
            step={50}
            value={decay}
            onValueChange={(v) => setDecay(typeof v === "number" ? v : v[0])}
            showValue
            suffix="ms"
          />
          <Slider
            label="Intensity"
            min={0.2}
            max={1}
            step={0.05}
            value={intensity}
            onValueChange={(v) =>
              setIntensity(typeof v === "number" ? v : v[0])
            }
            showValue
          />
          <div className="flex items-center gap-3 pt-5">
            <Switch checked={auto} onCheckedChange={setAuto} />
            <span className="text-sm text-zinc-700 dark:text-zinc-200">
              Auto-mutate
            </span>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">Change-detection (value-based)</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setCellA((cur) =>
                  ["Acme", "Globex", "Initech", "Hooli"][
                    (["Acme", "Globex", "Initech", "Hooli"].indexOf(cur) + 1) % 4
                  ],
                );
                note("cellA");
              }}
            >
              mutate A
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setCellB((cur) => {
                  const opts = ["$120k", "$140k", "$95k", "$200k"];
                  return opts[(opts.indexOf(cur) + 1) % opts.length];
                });
                note("cellB");
              }}
            >
              mutate B
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setCellC((cur) =>
                  ["Active", "Renewal", "Trial", "Churned"][
                    (["Active", "Renewal", "Trial", "Churned"].indexOf(cur) + 1) % 4
                  ],
                );
                note("cellC");
              }}
            >
              mutate C
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <HotZone value={cellA} tone={tone} decay={decay} intensity={intensity}>
              <Cell label="Account" value={cellA} />
            </HotZone>
            <HotZone value={cellB} tone={tone} decay={decay} intensity={intensity}>
              <Cell label="ARR" value={cellB} />
            </HotZone>
            <HotZone value={cellC} tone={tone} decay={decay} intensity={intensity}>
              <Cell label="Status" value={cellC} />
            </HotZone>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">Explicit (pulseKey-based)</span>
            <Button
              size="sm"
              color="violet"
              onClick={() => {
                setPulseKey((k) => k + 1);
                note("explicit");
              }}
            >
              ping the zone
            </Button>
            <span className="ml-2 text-[11px] text-zinc-500">
              key = {pulseKey}
            </span>
          </div>
          <HotZone
            pulseKey={pulseKey}
            tone={tone}
            decay={decay}
            intensity={intensity}
          >
            <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-950">
              The content doesn't actually change here. The host fires a pulse
              imperatively when something matters but the visible value stays
              the same (e.g. the agent finished re-validating it).
            </div>
          </HotZone>
        </div>
      </Card>

      <Card>
        <div className="p-4">
          <div className="mb-2 text-sm font-medium">Pulse log</div>
          {log.current.length === 0 ? (
            <div className="text-[11px] italic text-zinc-400">
              Nothing yet. Mutate a cell or ping the zone.
            </div>
          ) : (
            <ol
              key={logTick}
              className="space-y-0.5 font-mono text-[11px] text-zinc-600 dark:text-zinc-400"
            >
              {log.current.map((l, i) => (
                <li key={`${l.at}-${i}`} className="flex gap-2">
                  <span className="text-zinc-400">
                    {new Date(l.at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                  <Badge color="violet">{l.which}</Badge>
                </li>
              ))}
            </ol>
          )}
        </div>
      </Card>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="text-[10px] uppercase tracking-wider text-zinc-500">
        {label}
      </div>
      <div className="mt-0.5 font-mono text-[14px]">{value}</div>
    </div>
  );
}

/**
 * The actual primitive. In a real react-fancy build this would be a
 * standalone file + a `useHotZone()` hook for imperative triggering.
 */
function HotZone({
  value,
  pulseKey,
  tone = "change",
  decay = 900,
  intensity = 0.7,
  children,
}: {
  value?: unknown;
  pulseKey?: number;
  tone?: Tone;
  decay?: number;
  intensity?: number;
  children: React.ReactNode;
}) {
  const [pulse, setPulse] = useState(0);
  const lastValRef = useRef(value);
  const lastKeyRef = useRef(pulseKey);
  const firstRenderRef = useRef(true);
  const decayTimer = useRef<number | null>(null);

  // Throttle: ignore further pulses while one is in flight.
  const trigger = useCallback(() => {
    setPulse((p) => p + 1);
    if (decayTimer.current) window.clearTimeout(decayTimer.current);
    decayTimer.current = window.setTimeout(() => setPulse(0), decay);
  }, [decay]);

  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      lastValRef.current = value;
      lastKeyRef.current = pulseKey;
      return;
    }
    if (value !== undefined && value !== lastValRef.current) {
      lastValRef.current = value;
      trigger();
      return;
    }
    if (pulseKey !== undefined && pulseKey !== lastKeyRef.current) {
      lastKeyRef.current = pulseKey;
      trigger();
    }
  }, [value, pulseKey, trigger]);

  const active = pulse > 0;
  const style = useMemo<React.CSSProperties>(() => {
    if (!active) {
      return {
        boxShadow: "0 0 0 0 rgba(0,0,0,0)",
        transform: "scale(1)",
        transition: `box-shadow ${decay}ms ease-out, transform ${decay}ms ease-out`,
        borderRadius: 8,
      };
    }
    return {
      boxShadow: `0 0 0 ${4 + intensity * 8}px ${TONE_RING[tone]}, 0 0 ${
        20 + intensity * 30
      }px ${TONE_BG[tone]}`,
      transform: `scale(${1 + 0.012 * intensity})`,
      transition: "box-shadow 100ms ease-out, transform 120ms ease-out",
      borderRadius: 8,
    };
  }, [active, tone, intensity, decay]);

  return (
    <div style={style} className="relative">
      {children}
    </div>
  );
}
