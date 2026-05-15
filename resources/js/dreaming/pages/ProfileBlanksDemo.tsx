import { useMemo, useState } from "react";

export const USAGE = `import { ProfileBlanks } from "@particle-academy/react-fancy";

<ProfileBlanks
  fields={[
    { key: "name",      label: "Display name", placeholder: "Glenn Wagner" },
    { key: "email",     label: "Work email",   placeholder: "you@co.com", type: "email",
      validate: (v) => /^\\S+@\\S+\\.\\S+$/.test(v) ? null : "Looks malformed." },
    { key: "role",      label: "Your role",    placeholder: "Founder, designer, …" },
    { key: "team_size", label: "Team size",    placeholder: "5", type: "tel" },
  ]}
  values={profile}
  onSave={(key, value) => updateProfile({ [key]: value })}
/>`;

/**
 * ProfileBlanks — slim profile-completion bar that always surfaces the
 * single next missing field as an inline mini-form. Fill, validate,
 * advance. No detour to a settings page; the bar collapses to a
 * "100% complete" pat-on-the-back when everything is filled.
 */
type Field = {
  key: string;
  label: string;
  placeholder: string;
  type?: "text" | "email" | "tel";
  validate?: (v: string) => string | null;
};

const FIELDS: Field[] = [
  { key: "name", label: "Display name", placeholder: "Glenn Wagner" },
  {
    key: "email",
    label: "Work email",
    placeholder: "you@company.com",
    type: "email",
    validate: (v) => (/^\S+@\S+\.\S+$/.test(v) ? null : "Looks malformed."),
  },
  { key: "role", label: "Your role", placeholder: "Founder, designer, …" },
  { key: "team_size", label: "Team size", placeholder: "5", type: "tel" },
  { key: "avatar", label: "Avatar URL", placeholder: "https://…" },
];

export function ProfileBlanksDemo() {
  const [values, setValues] = useState<Record<string, string>>({
    name: "Glenn Wagner",
    email: "glenn@impactivism.net",
  });
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const next = useMemo(() => FIELDS.find((f) => !values[f.key]), [values]);
  const filledCount = FIELDS.filter((f) => !!values[f.key]).length;
  const pct = Math.round((filledCount / FIELDS.length) * 100);

  const commit = () => {
    if (!next) return;
    if (next.validate) {
      const err = next.validate(draft);
      if (err) {
        setError(err);
        return;
      }
    }
    setValues((v) => ({ ...v, [next.key]: draft }));
    setDraft("");
    setError(null);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-medium text-zinc-600 dark:text-zinc-300">
            Profile completion
          </span>
          <span className="font-mono text-zinc-500">{pct}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-sky-400 transition-[width] duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>

        {next ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label className="shrink-0 text-xs text-zinc-500">{next.label}</label>
            <input
              type={next.type ?? "text"}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && commit()}
              placeholder={next.placeholder}
              autoFocus
              className={`flex-1 rounded-md border bg-transparent px-2 py-1 text-xs outline-none ${
                error
                  ? "border-rose-400 focus:border-rose-500"
                  : "border-zinc-200 focus:border-violet-400 dark:border-zinc-700"
              }`}
            />
            <button
              onClick={commit}
              disabled={!draft.trim()}
              className="rounded-md bg-violet-600 px-3 py-1 text-xs font-medium text-white disabled:opacity-40"
            >
              Save & continue
            </button>
            {error && <div className="w-full text-[10px] text-rose-500">{error}</div>}
          </div>
        ) : (
          <div className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            ✓ Profile complete. You're all set.
          </div>
        )}
      </div>

      <details className="rounded-lg border border-zinc-200 bg-white p-3 text-xs dark:border-zinc-800 dark:bg-zinc-900">
        <summary className="cursor-pointer font-medium">Filled so far</summary>
        <ul className="mt-2 space-y-1 font-mono text-[11px]">
          {FIELDS.map((f) => (
            <li
              key={f.key}
              className={
                values[f.key] ? "text-zinc-700 dark:text-zinc-200" : "text-zinc-400"
              }
            >
              {f.key} = {values[f.key] ?? "·"}
            </li>
          ))}
        </ul>
        {filledCount > 0 && (
          <button
            onClick={() => setValues({})}
            className="mt-2 text-[10px] text-zinc-400 underline-offset-2 hover:underline"
          >
            clear all
          </button>
        )}
      </details>
    </div>
  );
}
