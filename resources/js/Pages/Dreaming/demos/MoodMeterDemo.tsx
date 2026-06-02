import { useCallback, useMemo, useRef, useState } from "react";
import {
  Card,
  Button,
  Switch,
  Select,
  Badge,
  Slider,
} from "@particle-academy/react-fancy";

/**
 * MoodMeter — react-fancy primitive that captures a value AND the
 * confidence in that value, in a single 2D draggable pad.
 *
 *   • x-axis maps to the value range (min..max)
 *   • y-axis maps to confidence (0..1) — top is more sure
 *   • a halo around the handle scales inversely with confidence,
 *     so low-confidence values literally look fuzzier
 *
 * Why pair them in one control? Because confidence is what humans
 * keep asking about when an AI posts a number ("how sure are you?").
 * Making the agent commit a confidence alongside the value — and
 * letting the human drag either independently — turns vague "AI
 * suggestion" UX into something you can argue with precisely.
 *
 * The demo shows three contexts (price, temperature, probability)
 * each with a posted (value, confidence) and the live state.
 */
type Scale = { id: string; label: string; min: number; max: number; step: number; suffix?: string; prefix?: string };

const SCALES: Scale[] = [
  { id: "price", label: "Renewal price (k)", min: 30, max: 200, step: 1, prefix: "$", suffix: "k" },
  { id: "temp", label: "LLM temperature", min: 0, max: 1, step: 0.01 },
  { id: "prob", label: "Win probability", min: 0, max: 1, step: 0.01, suffix: "%" },
];

const AGENT_POSTS: Record<string, { value: number; confidence: number; reason: string }> = {
  price: { value: 60, confidence: 0.74, reason: "expansion path with renewals stacked" },
  temp: { value: 0.35, confidence: 0.88, reason: "user wants tight, factual answers" },
  prob: { value: 0.62, confidence: 0.41, reason: "mixed signals from QBR transcript" },
};

const PAD_W = 320;
const PAD_H = 220;

export function MoodMeterDemo() {
  const [scaleId, setScaleId] = useState<string>("price");
  const [showGrid, setShowGrid] = useState(true);

  const scale = SCALES.find((s) => s.id === scaleId)!;
  const posted = AGENT_POSTS[scaleId];

  const [value, setValue] = useState<number>(posted.value);
  const [conf, setConf] = useState<number>(posted.confidence);

  const onAdoptAgent = useCallback(() => {
    setValue(posted.value);
    setConf(posted.confidence);
  }, [posted]);

  const onScaleChange = (id: string) => {
    setScaleId(id);
    setValue(AGENT_POSTS[id].value);
    setConf(AGENT_POSTS[id].confidence);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">MoodMeter</h1>
        <p className="mt-1 text-sm text-zinc-500">
          A 2D pad that captures value + confidence in one motion. Drag the
          handle horizontally to set the value, vertically to set how sure you
          are. The halo around the handle widens as confidence drops, so
          uncertain choices literally look fuzzier.
        </p>
      </header>

      <Card>
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3">
          <Select
            label="Scale"
            list={SCALES.map((s) => ({ value: s.id, label: s.label }))}
            value={scaleId}
            onValueChange={onScaleChange}
          />
          <div className="flex items-center gap-3 pt-5">
            <Switch checked={showGrid} onCheckedChange={setShowGrid} />
            <span className="text-sm text-zinc-700 dark:text-zinc-200">
              Show grid + agent post
            </span>
          </div>
          <div className="flex items-center justify-end gap-2 pt-4">
            <Button size="sm" variant="outline" onClick={onAdoptAgent}>
              adopt agent post
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-[auto_1fr]">
          <div className="flex justify-center">
            <Pad
              scale={scale}
              value={value}
              confidence={conf}
              postedValue={posted.value}
              postedConfidence={posted.confidence}
              showGrid={showGrid}
              onChange={(v, c) => {
                setValue(v);
                setConf(c);
              }}
            />
          </div>

          <div className="space-y-4">
            <div className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
              <div className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-wider text-zinc-500">
                <span>Agent posted</span>
                <Badge color="violet">Forecaster</Badge>
              </div>
              <div className="text-sm">
                <span className="font-mono">
                  {fmt(scale, posted.value)}
                </span>
                <span className="ml-2 text-zinc-500">
                  · {(posted.confidence * 100).toFixed(0)}% confident
                </span>
              </div>
              <div className="mt-1 text-[12px] italic text-zinc-500">
                "{posted.reason}"
              </div>
            </div>

            <div className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
              <div className="mb-1 text-[11px] uppercase tracking-wider text-zinc-500">
                Your reading
              </div>
              <div className="text-sm">
                <span className="font-mono">{fmt(scale, value)}</span>
                <span className="ml-2 text-zinc-500">
                  · {(conf * 100).toFixed(0)}% confident
                </span>
              </div>
              <div className="mt-2 space-y-2">
                <Slider
                  label="Value"
                  min={scale.min}
                  max={scale.max}
                  step={scale.step}
                  value={value}
                  onValueChange={(v) => setValue(typeof v === "number" ? v : v[0])}
                  showValue
                  prefix={scale.prefix}
                  suffix={scale.suffix}
                />
                <Slider
                  label="Confidence"
                  min={0}
                  max={1}
                  step={0.01}
                  value={conf}
                  onValueChange={(v) => setConf(typeof v === "number" ? v : v[0])}
                  showValue
                />
              </div>
            </div>

            <Delta
              scale={scale}
              postedValue={posted.value}
              postedConfidence={posted.confidence}
              value={value}
              confidence={conf}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}

function Pad({
  scale,
  value,
  confidence,
  postedValue,
  postedConfidence,
  showGrid,
  onChange,
}: {
  scale: Scale;
  value: number;
  confidence: number;
  postedValue: number;
  postedConfidence: number;
  showGrid: boolean;
  onChange: (value: number, confidence: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const set = useCallback(
    (clientX: number, clientY: number) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = clamp((clientX - rect.left) / rect.width, 0, 1);
      const y = clamp((clientY - rect.top) / rect.height, 0, 1);
      const v = scale.min + x * (scale.max - scale.min);
      // Snap value to step
      const snapped =
        Math.round((v - scale.min) / scale.step) * scale.step + scale.min;
      const c = clamp(1 - y, 0, 1);
      onChange(round(snapped, scale.step), Math.round(c * 100) / 100);
    },
    [scale, onChange],
  );

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setDragging(true);
    set(e.clientX, e.clientY);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    set(e.clientX, e.clientY);
  };
  const onPointerUp = () => setDragging(false);

  const xPct = ((value - scale.min) / (scale.max - scale.min)) * 100;
  const yPct = (1 - confidence) * 100;
  const haloR = 18 + (1 - confidence) * 70;

  const pxPct = ((postedValue - scale.min) / (scale.max - scale.min)) * 100;
  const pyPct = (1 - postedConfidence) * 100;
  const pHaloR = 16 + (1 - postedConfidence) * 60;

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="relative cursor-crosshair touch-none select-none overflow-hidden rounded-md border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"
      style={{ width: PAD_W, height: PAD_H }}
    >
      {showGrid && (
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden
        >
          {[0.25, 0.5, 0.75].map((p, i) => (
            <line
              key={`v${i}`}
              x1={`${p * 100}%`}
              x2={`${p * 100}%`}
              y1="0"
              y2="100%"
              stroke="#a1a1aa"
              strokeOpacity={0.18}
              strokeDasharray="3 4"
            />
          ))}
          {[0.25, 0.5, 0.75].map((p, i) => (
            <line
              key={`h${i}`}
              x1="0"
              x2="100%"
              y1={`${p * 100}%`}
              y2={`${p * 100}%`}
              stroke="#a1a1aa"
              strokeOpacity={0.18}
              strokeDasharray="3 4"
            />
          ))}
        </svg>
      )}

      {/* Axis labels */}
      <div className="pointer-events-none absolute left-1.5 top-1.5 text-[10px] uppercase tracking-wider text-zinc-400">
        ↑ sure
      </div>
      <div className="pointer-events-none absolute bottom-1.5 left-1.5 text-[10px] uppercase tracking-wider text-zinc-400">
        ↓ unsure
      </div>
      <div className="pointer-events-none absolute right-1.5 top-1.5 text-[10px] uppercase tracking-wider text-zinc-400">
        {fmt(scale, scale.max)} →
      </div>
      <div className="pointer-events-none absolute bottom-1.5 right-1.5 text-[10px] uppercase tracking-wider text-zinc-400">
        ← {fmt(scale, scale.min)}
      </div>

      {/* Agent post */}
      {showGrid && (
        <Handle
          xPct={pxPct}
          yPct={pyPct}
          haloR={pHaloR}
          color="#a855f7"
          dashed
          label="agent"
        />
      )}

      {/* User handle */}
      <Handle
        xPct={xPct}
        yPct={yPct}
        haloR={haloR}
        color="#0ea5e9"
        label={fmt(scale, value)}
      />
    </div>
  );
}

function Handle({
  xPct,
  yPct,
  haloR,
  color,
  dashed = false,
  label,
}: {
  xPct: number;
  yPct: number;
  haloR: number;
  color: string;
  dashed?: boolean;
  label: string;
}) {
  return (
    <>
      <div
        className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          left: `${xPct}%`,
          top: `${yPct}%`,
          width: haloR * 2,
          height: haloR * 2,
          background: color + (dashed ? "11" : "22"),
          border: dashed ? `1px dashed ${color}` : "none",
        }}
      />
      <div
        className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white dark:ring-zinc-900"
        style={{
          left: `${xPct}%`,
          top: `${yPct}%`,
          width: 14,
          height: 14,
          background: color,
          opacity: dashed ? 0.6 : 1,
        }}
      />
      <div
        className="pointer-events-none absolute -translate-x-1/2 rounded px-1.5 py-0.5 text-[10px] font-mono"
        style={{
          left: `${xPct}%`,
          top: `calc(${yPct}% + 14px)`,
          color,
        }}
      >
        {label}
      </div>
    </>
  );
}

function Delta({
  scale,
  postedValue,
  postedConfidence,
  value,
  confidence,
}: {
  scale: Scale;
  postedValue: number;
  postedConfidence: number;
  value: number;
  confidence: number;
}) {
  const dv = value - postedValue;
  const dc = confidence - postedConfidence;
  const same = Math.abs(dv) < scale.step / 2 && Math.abs(dc) < 0.01;
  return (
    <div className="rounded-md border border-dashed border-zinc-300 p-3 text-[12px] dark:border-zinc-700">
      <div className="mb-1 text-[10px] uppercase tracking-wider text-zinc-500">
        Delta vs agent
      </div>
      {same ? (
        <div className="italic text-zinc-500">matches agent post.</div>
      ) : (
        <ul className="space-y-0.5 font-mono">
          <li>
            value:{" "}
            <span className={dv > 0 ? "text-emerald-600" : "text-rose-600"}>
              {dv > 0 ? "+" : ""}
              {fmt(scale, dv, true)}
            </span>
          </li>
          <li>
            confidence:{" "}
            <span className={dc > 0 ? "text-emerald-600" : "text-rose-600"}>
              {dc > 0 ? "+" : ""}
              {(dc * 100).toFixed(0)}%
            </span>
          </li>
        </ul>
      )}
    </div>
  );
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function round(n: number, step: number) {
  if (step >= 1) return Math.round(n);
  return Math.round(n / step) * step;
}

function fmt(scale: Scale, v: number, signed = false) {
  const sign = signed && v >= 0 ? "+" : "";
  const num = scale.step < 1 ? v.toFixed(2) : Math.round(v).toString();
  return `${sign}${scale.prefix ?? ""}${num}${scale.suffix ?? ""}`;
}
