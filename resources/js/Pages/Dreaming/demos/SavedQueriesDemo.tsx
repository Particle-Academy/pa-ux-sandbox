import { useState } from "react";

export const USAGE = `import { SavedQueries } from "@particle-academy/react-fancy";

<SavedQueries
  queries={savedQueries}                       // [{ id, name, payload, pinned?, lastRun? }]
  onSave={({ name, payload }) => persistQuery({ name, payload })}
  onRun={(q) => runQuery(q.payload)}
  onPin={(id, pinned) => setPin(id, pinned)}
  onRename={(id, name) => rename(id, name)}
  onDelete={(id) => remove(id)}
/>

// Bridge sketch:
// registerSavedQueriesBridge(server, { adapter })
//   → query_list()  query_save({name, payload})  query_run(id)
//   → query_pin(id, true)  query_delete(id)
`;

/**
 * SavedQueries — pinned + recent named searches. Generic over payload
 * shape: payload can be a string, a structured query object, anything
 * JSON-serializable. Persists nothing internally — host owns storage,
 * which means the bridge can save/run on the agent's behalf and the
 * UI reflects it without coordination.
 */
type Query<P = unknown> = {
  id: string;
  name: string;
  payload: P;
  pinned?: boolean;
  lastRun?: string;
};

function SavedQueries<P>({
  queries,
  onSave,
  onRun,
  onPin,
  onRename,
  onDelete,
  draftPayload,
}: {
  queries: Query<P>[];
  onSave: (q: { name: string; payload: P }) => void;
  onRun: (q: Query<P>) => void;
  onPin: (id: string, pinned: boolean) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  /** Payload available right now to be saved as a new query. */
  draftPayload?: P;
}) {
  const [draftName, setDraftName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const pinned = queries.filter((q) => q.pinned);
  const recent = queries.filter((q) => !q.pinned);

  return (
    <div data-fancy="saved-queries" className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      {draftPayload !== undefined && (
        <div className="flex items-center gap-2 border-b border-zinc-100 bg-zinc-50 px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-950">
          <input
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            placeholder="Name this search…"
            className="flex-1 rounded border border-zinc-200 bg-transparent px-1.5 py-0.5 text-[11px] outline-none focus:border-violet-400 dark:border-zinc-700"
          />
          <button
            disabled={!draftName.trim()}
            onClick={() => {
              onSave({ name: draftName.trim(), payload: draftPayload });
              setDraftName("");
            }}
            className="rounded-md bg-violet-600 px-2.5 py-0.5 text-[11px] font-medium text-white disabled:opacity-40"
          >
            Save current
          </button>
        </div>
      )}

      <Section title="Pinned">
        {pinned.length === 0 ? (
          <Empty>Nothing pinned.</Empty>
        ) : (
          pinned.map((q) => (
            <QueryRow
              key={q.id}
              q={q}
              editingId={editingId}
              editingName={editingName}
              setEditingId={setEditingId}
              setEditingName={setEditingName}
              onRun={() => onRun(q)}
              onPin={() => onPin(q.id, false)}
              onRename={(name) => onRename(q.id, name)}
              onDelete={() => onDelete(q.id)}
            />
          ))
        )}
      </Section>

      <Section title="Recent">
        {recent.length === 0 ? (
          <Empty>No recent queries.</Empty>
        ) : (
          recent.map((q) => (
            <QueryRow
              key={q.id}
              q={q}
              editingId={editingId}
              editingName={editingName}
              setEditingId={setEditingId}
              setEditingName={setEditingName}
              onRun={() => onRun(q)}
              onPin={() => onPin(q.id, true)}
              onRename={(name) => onRename(q.id, name)}
              onDelete={() => onDelete(q.id)}
            />
          ))
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <header className="border-b border-zinc-100 bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
        {title}
      </header>
      <ul>{children}</ul>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <li className="px-3 py-3 text-[11px] italic text-zinc-400">{children}</li>;
}

function QueryRow<P>({
  q,
  editingId,
  editingName,
  setEditingId,
  setEditingName,
  onRun,
  onPin,
  onRename,
  onDelete,
}: {
  q: Query<P>;
  editingId: string | null;
  editingName: string;
  setEditingId: (id: string | null) => void;
  setEditingName: (name: string) => void;
  onRun: () => void;
  onPin: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  const editing = editingId === q.id;
  return (
    <li
      data-query-id={q.id}
      className="group flex items-center gap-2 border-b border-zinc-50 px-3 py-2 last:border-b-0 dark:border-zinc-800"
    >
      <button onClick={onPin} className={q.pinned ? "text-amber-500" : "text-zinc-300 hover:text-amber-500"}>
        ★
      </button>
      <div className="min-w-0 flex-1">
        {editing ? (
          <input
            autoFocus
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            onBlur={() => {
              onRename(editingName.trim() || q.name);
              setEditingId(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
            className="w-full rounded border border-violet-400 bg-transparent px-1 py-0 text-[12px] outline-none"
          />
        ) : (
          <button
            onClick={onRun}
            className="block w-full truncate text-left text-[12px] font-medium hover:text-violet-700 dark:hover:text-violet-300"
          >
            {q.name}
          </button>
        )}
        <div className="truncate text-[10px] text-zinc-500">
          {typeof q.payload === "string" ? q.payload : JSON.stringify(q.payload)}
        </div>
      </div>
      <div className="flex shrink-0 gap-1 text-[10px] text-zinc-400 opacity-0 transition group-hover:opacity-100">
        <button
          onClick={() => {
            setEditingId(q.id);
            setEditingName(q.name);
          }}
          className="hover:text-zinc-700 dark:hover:text-zinc-200"
        >
          rename
        </button>
        <button onClick={onDelete} className="hover:text-rose-600">
          delete
        </button>
      </div>
    </li>
  );
}

type Payload = { q: string; facets?: Record<string, string[]> };

const SEED: Query<Payload>[] = [
  { id: "q1", name: "My open tickets", payload: { q: "assignee:me state:open" }, pinned: true, lastRun: "5m ago" },
  { id: "q2", name: "Churn-risk customers", payload: { q: "kind:customer", facets: { health: ["risk"] } }, pinned: true },
  { id: "q3", name: "Stripe failures this week", payload: { q: "kind:event source:stripe status:failed" } },
  { id: "q4", name: "PRs needing review", payload: { q: "kind:pr state:open reviewer:me" } },
];

export function SavedQueriesDemo() {
  const [queries, setQueries] = useState<Query<Payload>[]>(SEED);
  const [draft, setDraft] = useState<Payload>({ q: "kind:doc author:rita" });
  const [log, setLog] = useState<string[]>([]);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_280px]">
      <SavedQueries<Payload>
        queries={queries}
        draftPayload={draft}
        onSave={({ name, payload }) =>
          setQueries((all) => [
            { id: `q-${Date.now().toString(36)}`, name, payload, lastRun: "just now" },
            ...all,
          ])
        }
        onRun={(q) => setLog((l) => [`run ${q.name}`, ...l].slice(0, 6))}
        onPin={(id, p) => setQueries((all) => all.map((x) => (x.id === id ? { ...x, pinned: p } : x)))}
        onRename={(id, name) => setQueries((all) => all.map((x) => (x.id === id ? { ...x, name } : x)))}
        onDelete={(id) => setQueries((all) => all.filter((x) => x.id !== id))}
      />

      <div className="space-y-3 text-xs">
        <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-1 font-medium">Current draft payload</div>
          <textarea
            value={JSON.stringify(draft)}
            onChange={(e) => {
              try {
                setDraft(JSON.parse(e.target.value));
              } catch {
                /* ignore until valid JSON */
              }
            }}
            className="w-full rounded border border-zinc-200 bg-transparent p-1 font-mono text-[10px] outline-none dark:border-zinc-700"
            rows={3}
          />
          <p className="mt-1 text-[10px] italic text-zinc-500">
            Edit, then "Save current" to capture as a named query.
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-1 font-medium">Run log</div>
          {log.length === 0 ? (
            <div className="italic text-zinc-400">Click any saved query to run.</div>
          ) : (
            <ol className="space-y-0.5 font-mono text-[10px] text-zinc-600 dark:text-zinc-300">
              {log.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
