import { useMemo, useState } from "react";

export const USAGE = `import { FacetRail } from "@particle-academy/react-fancy";

<FacetRail
  schema={[
    { key: "kind",     label: "Type",         type: "checkbox", options: kinds },
    { key: "owner",    label: "Owner",        type: "checkbox", options: owners, searchable: true },
    { key: "priceCents", label: "Price",      type: "range",    min: 0, max: 50000, step: 500 },
  ]}
  value={facetValues}                       // { [facetKey]: string[] | [number, number] }
  onChange={setFacetValues}
/>

// Bridge sketch:
// registerFacetRailBridge(server, { adapter })
//   → facet_list()  facet_set(key, value)  facet_clear(key?)
`;

type Option = { value: string; label: string; count?: number };

type Facet =
  | { key: string; label: string; type: "checkbox"; options: Option[]; searchable?: boolean }
  | { key: string; label: string; type: "range"; min: number; max: number; step?: number; format?: (n: number) => string };

type FacetValues = Record<string, string[] | [number, number]>;

/**
 * FacetRail — faceted filter sidebar from a JSON facet schema.
 * Supports checkbox groups (with optional in-facet search) and range
 * sliders. value is a plain JSON bag indexed by facet key; agents read
 * and patch it via the bridge.
 */
function FacetRail({
  schema,
  value,
  onChange,
}: {
  schema: Facet[];
  value: FacetValues;
  onChange: (next: FacetValues) => void;
}) {
  const setKey = (key: string, next: string[] | [number, number] | null) => {
    const out = { ...value };
    if (next === null) delete out[key];
    else out[key] = next;
    onChange(out);
  };

  const selectedChips: { facet: Facet; chips: string[] }[] = schema.map((f) => {
    if (f.type === "checkbox") {
      const v = (value[f.key] as string[]) ?? [];
      return { facet: f, chips: v.map((val) => f.options.find((o) => o.value === val)?.label ?? val) };
    }
    const v = value[f.key] as [number, number] | undefined;
    if (!v) return { facet: f, chips: [] };
    const fmt = f.format ?? ((n: number) => String(n));
    return { facet: f, chips: [`${fmt(v[0])}–${fmt(v[1])}`] };
  });
  const anySelected = selectedChips.some((s) => s.chips.length > 0);

  return (
    <aside data-fancy="facet-rail" className="space-y-3 text-sm">
      {anySelected && (
        <div className="rounded-md border border-violet-200 bg-violet-50 p-2 dark:border-violet-700 dark:bg-violet-500/10">
          <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wider text-violet-700 dark:text-violet-300">
            <span>Active filters</span>
            <button onClick={() => onChange({})} className="hover:underline">
              clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {selectedChips.flatMap(({ facet, chips }) =>
              chips.map((c, i) => (
                <span
                  key={`${facet.key}-${i}`}
                  className="rounded-full bg-violet-200 px-2 py-0.5 text-[10px] font-medium text-violet-900 dark:bg-violet-500/30 dark:text-violet-100"
                >
                  {facet.label}: {c}
                </span>
              )),
            )}
          </div>
        </div>
      )}

      {schema.map((f) =>
        f.type === "checkbox" ? (
          <CheckboxFacet key={f.key} facet={f} value={(value[f.key] as string[]) ?? []} onChange={(v) => setKey(f.key, v.length === 0 ? null : v)} />
        ) : (
          <RangeFacet key={f.key} facet={f} value={value[f.key] as [number, number] | undefined} onChange={(v) => setKey(f.key, v)} />
        ),
      )}
    </aside>
  );
}

function CheckboxFacet({
  facet,
  value,
  onChange,
}: {
  facet: Extract<Facet, { type: "checkbox" }>;
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [q, setQ] = useState("");
  const opts = useMemo(
    () => (q ? facet.options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase())) : facet.options),
    [facet.options, q],
  );

  const toggle = (val: string) =>
    onChange(value.includes(val) ? value.filter((v) => v !== val) : [...value, val]);

  return (
    <details open className="rounded-lg border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900" data-facet-key={facet.key}>
      <summary className="cursor-pointer text-xs font-semibold text-zinc-700 dark:text-zinc-200">
        {facet.label}
        {value.length > 0 && (
          <span className="ml-1 rounded bg-violet-100 px-1 text-[10px] text-violet-700 dark:bg-violet-500/20 dark:text-violet-200">
            {value.length}
          </span>
        )}
      </summary>
      {facet.searchable && facet.options.length > 6 && (
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="search…"
          className="mt-2 w-full rounded border border-zinc-200 bg-transparent px-1.5 py-0.5 text-[11px] outline-none focus:border-violet-400 dark:border-zinc-700"
        />
      )}
      <ul className="mt-1 max-h-44 overflow-y-auto">
        {opts.map((o) => (
          <li key={o.value} data-option-value={o.value}>
            <label className="flex cursor-pointer items-center gap-1.5 rounded px-1 py-0.5 text-[12px] hover:bg-zinc-50 dark:hover:bg-zinc-800">
              <input
                type="checkbox"
                checked={value.includes(o.value)}
                onChange={() => toggle(o.value)}
                className="h-3 w-3 accent-violet-600"
              />
              <span className="flex-1 truncate">{o.label}</span>
              {o.count !== undefined && (
                <span className="text-[10px] text-zinc-400">{o.count}</span>
              )}
            </label>
          </li>
        ))}
      </ul>
    </details>
  );
}

function RangeFacet({
  facet,
  value,
  onChange,
}: {
  facet: Extract<Facet, { type: "range" }>;
  value: [number, number] | undefined;
  onChange: (next: [number, number] | null) => void;
}) {
  const cur = value ?? [facet.min, facet.max];
  const fmt = facet.format ?? ((n: number) => String(n));
  return (
    <details open className="rounded-lg border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900" data-facet-key={facet.key}>
      <summary className="cursor-pointer text-xs font-semibold text-zinc-700 dark:text-zinc-200">
        {facet.label}
        {value && (
          <span className="ml-1 text-[10px] text-zinc-400">
            {fmt(cur[0])}–{fmt(cur[1])}
          </span>
        )}
      </summary>
      <div className="mt-2 flex items-center gap-2 text-[10px] text-zinc-500">
        <input
          type="range"
          min={facet.min}
          max={facet.max}
          step={facet.step ?? 1}
          value={cur[0]}
          onChange={(e) => onChange([Math.min(parseInt(e.target.value), cur[1]), cur[1]])}
          className="flex-1 accent-violet-600"
        />
        <input
          type="range"
          min={facet.min}
          max={facet.max}
          step={facet.step ?? 1}
          value={cur[1]}
          onChange={(e) => onChange([cur[0], Math.max(parseInt(e.target.value), cur[0])])}
          className="flex-1 accent-violet-600"
        />
      </div>
    </details>
  );
}

const SCHEMA: Facet[] = [
  {
    key: "kind",
    label: "Type",
    type: "checkbox",
    options: [
      { value: "doc", label: "Document", count: 42 },
      { value: "board", label: "Board", count: 11 },
      { value: "sheet", label: "Sheet", count: 7 },
      { value: "ticket", label: "Ticket", count: 138 },
    ],
  },
  {
    key: "owner",
    label: "Owner",
    type: "checkbox",
    searchable: true,
    options: [
      { value: "ada", label: "Ada" },
      { value: "sam", label: "Sam" },
      { value: "rita", label: "Rita" },
      { value: "ayo", label: "Ayo" },
      { value: "priya", label: "Priya" },
      { value: "leo", label: "Leo" },
      { value: "maya", label: "Maya" },
    ],
  },
  {
    key: "priceCents",
    label: "Price",
    type: "range",
    min: 0,
    max: 50000,
    step: 500,
    format: (n) => `$${(n / 100).toFixed(0)}`,
  },
];

export function FacetRailDemo() {
  const [value, setValue] = useState<FacetValues>({});
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[260px_1fr]">
      <FacetRail schema={SCHEMA} value={value} onChange={setValue} />
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-xs dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-1 font-medium">Current value</div>
        <pre className="overflow-x-auto rounded bg-white p-2 font-mono text-[11px] dark:bg-zinc-900">
          {JSON.stringify(value, null, 2) || "{}"}
        </pre>
        <p className="mt-2 text-[11px] italic text-zinc-500">
          Plain JSON — an agent bridge sets/clears facets by key without touching the DOM.
        </p>
      </div>
    </div>
  );
}
