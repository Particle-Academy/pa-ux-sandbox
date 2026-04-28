import { useCallback, useMemo, useState } from "react";
import {
  Action,
  Avatar,
  Badge,
  Card,
  Callout,
  ContextMenu,
  Dropdown,
  Icon,
  Input,
  Kanban,
  MultiSwitch,
  Progress,
  Tooltip,
} from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

// ─────────────────────────────────────────────────────────────────────────
// Data model
// ─────────────────────────────────────────────────────────────────────────

type Priority = "low" | "med" | "high" | "urgent";

interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

interface KCard {
  id: string;
  title: string;
  description?: string;
  priority?: Priority;
  assignees?: string[];
  due?: string;
  /** "overdue" | "soon" | "later" — drives the due-date pill color in fancy mode */
  dueState?: "overdue" | "soon" | "later";
  labels?: string[];
  cover?: string;
  comments?: number;
  attachments?: number;
  subtasks?: Subtask[];
  points?: number;
}

type BoardState = Record<string, KCard[]>;

const PRIORITY_COLOR: Record<Priority, "zinc" | "blue" | "amber" | "red"> = {
  low: "zinc",
  med: "blue",
  high: "amber",
  urgent: "red",
};

const PRIORITY_BAR: Record<Priority, string> = {
  low: "bg-zinc-300 dark:bg-zinc-600",
  med: "bg-blue-400",
  high: "bg-amber-400",
  urgent: "bg-red-500",
};

const DUE_PILL: Record<NonNullable<KCard["dueState"]>, string> = {
  overdue: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  soon: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  later: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

const COLUMNS = [
  { id: "backlog", title: "Backlog", emoji: "🗂️", wipLimit: undefined, accent: "#a1a1aa" },
  { id: "todo", title: "Todo", emoji: "📝", wipLimit: 4, accent: "#3b82f6" },
  { id: "doing", title: "In Progress", emoji: "🚧", wipLimit: 2, accent: "#f59e0b" },
  { id: "review", title: "Review", emoji: "🔍", wipLimit: 3, accent: "#8b5cf6" },
  { id: "done", title: "Done", emoji: "✅", wipLimit: undefined, accent: "#10b981" },
] as const;

const SPRINT_BOARD: BoardState = {
  backlog: [
    {
      id: "c1",
      title: "Add invoice export to PDF",
      description: "Use Puppeteer for the rendering layer; reuse the existing print template.",
      priority: "med",
      assignees: ["Avery"],
      due: "Apr 30",
      dueState: "later",
      labels: ["billing"],
      comments: 3,
      attachments: 2,
      points: 5,
      subtasks: [
        { id: "s1", title: "Pick HTML→PDF lib", done: true },
        { id: "s2", title: "Wire to Catalog/Invoice", done: false },
        { id: "s3", title: "Style print template", done: false },
      ],
    },
    {
      id: "c2",
      title: "Deprecate v1 webhook signatures",
      priority: "low",
      assignees: ["Sam"],
      labels: ["api", "tech-debt"],
      points: 2,
    },
    {
      id: "c3",
      title: "Localize onboarding strings",
      description: "es-MX, pt-BR, fr-FR.",
      priority: "low",
      assignees: ["Mira"],
      labels: ["i18n"],
      points: 3,
    },
  ],
  todo: [
    {
      id: "c4",
      title: "Wire Stripe Tax for EU customers",
      description: "Backfill tax_id on existing customers, add VAT-ID validation step to checkout.",
      priority: "high",
      assignees: ["Avery", "Sam"],
      due: "Apr 28",
      dueState: "soon",
      labels: ["billing", "tax"],
      comments: 8,
      points: 8,
      subtasks: [
        { id: "s1", title: "Stripe Tax bootstrap", done: true },
        { id: "s2", title: "VAT-ID input", done: false },
      ],
    },
    {
      id: "c5",
      title: "Add WIP limit to Kanban columns",
      priority: "med",
      assignees: ["You"],
      labels: ["frontend"],
      comments: 1,
      points: 3,
    },
  ],
  doing: [
    {
      id: "c6",
      title: "Migrate sessions to Redis",
      description: "Cutover plan with rolling deploy; smoke-test against staging.",
      priority: "urgent",
      assignees: ["Jules"],
      due: "Apr 26",
      dueState: "overdue",
      labels: ["infra"],
      comments: 12,
      attachments: 1,
      points: 13,
      subtasks: [
        { id: "s1", title: "Provision Redis", done: true },
        { id: "s2", title: "Session driver swap", done: true },
        { id: "s3", title: "Staging smoke test", done: false },
        { id: "s4", title: "Prod cutover", done: false },
      ],
    },
  ],
  review: [
    {
      id: "c7",
      title: "AccordionPanel a11y audit",
      priority: "med",
      assignees: ["Mira"],
      labels: ["frontend", "a11y"],
      comments: 4,
      points: 2,
    },
  ],
  done: [
    {
      id: "c8",
      title: "Ship Stripe webhook signing",
      priority: "high",
      assignees: ["Sam"],
      labels: ["billing", "security"],
      points: 5,
    },
    {
      id: "c9",
      title: "Theme River chart fix",
      priority: "low",
      assignees: ["You"],
      labels: ["frontend"],
      points: 1,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

function moveCard(
  state: BoardState,
  cardId: string,
  fromColumn: string,
  toColumn: string,
  toIndex: number,
): BoardState {
  const from = [...(state[fromColumn] ?? [])];
  const idx = from.findIndex((c) => c.id === cardId);
  if (idx === -1) return state;
  const [card] = from.splice(idx, 1);
  if (fromColumn === toColumn) {
    from.splice(Math.min(toIndex, from.length), 0, card!);
    return { ...state, [fromColumn]: from };
  }
  const to = [...(state[toColumn] ?? [])];
  to.splice(Math.min(toIndex, to.length), 0, card!);
  return { ...state, [fromColumn]: from, [toColumn]: to };
}

function moveColumn<T extends string>(
  order: T[],
  columnId: T,
  toIndex: number,
): T[] {
  const next = [...order];
  const from = next.indexOf(columnId);
  if (from === -1) return order;
  next.splice(from, 1);
  next.splice(Math.min(toIndex, next.length), 0, columnId);
  return next;
}

function subtaskProgress(card: KCard): { done: number; total: number } | null {
  if (!card.subtasks || card.subtasks.length === 0) return null;
  const done = card.subtasks.filter((s) => s.done).length;
  return { done, total: card.subtasks.length };
}

function pointsFor(cards: KCard[]): number {
  return cards.reduce((sum, c) => sum + (c.points ?? 0), 0);
}

// ─────────────────────────────────────────────────────────────────────────
// Card renderers
// ─────────────────────────────────────────────────────────────────────────

function SimpleCardBody({ card }: { card: KCard }) {
  return (
    <div className="space-y-1">
      <div className="flex items-start gap-2">
        <p className="flex-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {card.title}
        </p>
        {card.priority && (
          <Badge color={PRIORITY_COLOR[card.priority]} size="sm">
            {card.priority}
          </Badge>
        )}
      </div>
      {card.assignees && card.assignees.length > 0 && (
        <p className="text-xs text-zinc-500">{card.assignees.join(", ")}</p>
      )}
    </div>
  );
}

function FancyCardBody({
  card,
  onAction,
}: {
  card: KCard;
  onAction?: (action: string) => void;
}) {
  const progress = subtaskProgress(card);

  return (
    <Card variant="elevated" padding="none" className="overflow-hidden">
      {/* Priority cover stripe */}
      {card.priority && (
        <div className={`h-1 ${PRIORITY_BAR[card.priority]}`} />
      )}

      <div className="space-y-3 p-3">
        {/* Title row + dropdown menu */}
        <div className="flex items-start gap-2">
          <p className="flex-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {card.title}
          </p>
          <Dropdown placement="bottom-end">
            <Dropdown.Trigger>
              <Action variant="ghost" size="xs" icon="more-horizontal" />
            </Dropdown.Trigger>
            <Dropdown.Items>
              <Dropdown.Item onClick={() => onAction?.("edit")}>
                Edit card
              </Dropdown.Item>
              <Dropdown.Item onClick={() => onAction?.("duplicate")}>
                Duplicate
              </Dropdown.Item>
              <Dropdown.Separator />
              <Dropdown.Item onClick={() => onAction?.("archive")}>
                Archive
              </Dropdown.Item>
            </Dropdown.Items>
          </Dropdown>
        </div>

        {card.description && (
          <p className="text-xs leading-relaxed text-zinc-500 line-clamp-2">
            {card.description}
          </p>
        )}

        {/* Labels */}
        {card.labels && card.labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {card.labels.map((l) => (
              <span
                key={l}
                className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
              >
                #{l}
              </span>
            ))}
          </div>
        )}

        {/* Sub-task progress */}
        {progress && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-wide text-zinc-500">
              <span>Subtasks</span>
              <span>{progress.done}/{progress.total}</span>
            </div>
            <Progress
              value={progress.done}
              max={progress.total}
              size="sm"
              color={progress.done === progress.total ? "green" : "blue"}
            />
          </div>
        )}

        {/* Footer: assignees + meta */}
        <div className="flex items-center justify-between">
          <div className="flex items-center -space-x-1.5">
            {(card.assignees ?? []).map((name) => (
              <Tooltip key={name} content={name}>
                <span className="rounded-full ring-2 ring-white dark:ring-zinc-900">
                  <Avatar fallback={name} size="sm" />
                </span>
              </Tooltip>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            {card.priority && (
              <Badge color={PRIORITY_COLOR[card.priority]} size="sm" variant="soft">
                {card.priority}
              </Badge>
            )}
            {typeof card.points === "number" && (
              <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {card.points} pt
              </span>
            )}
            {card.comments ? (
              <span className="inline-flex items-center gap-0.5">
                <Icon name="message-circle" size="xs" /> {card.comments}
              </span>
            ) : null}
            {card.attachments ? (
              <span className="inline-flex items-center gap-0.5">
                <Icon name="paperclip" size="xs" /> {card.attachments}
              </span>
            ) : null}
            {card.due && card.dueState && (
              <span
                className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${DUE_PILL[card.dueState]}`}
              >
                {card.due}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Column header renderers
// ─────────────────────────────────────────────────────────────────────────

function SimpleColumnHeader({
  title,
  count,
}: {
  title: string;
  count: number;
}) {
  return (
    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
      <span>{title}</span>
      <span className="rounded-full bg-zinc-200 px-1.5 py-0.5 text-[10px] dark:bg-zinc-700">
        {count}
      </span>
    </h3>
  );
}

function FancyColumnHeader({
  emoji,
  title,
  count,
  wipLimit,
  accent,
  totalPoints,
  onAdd,
  onClear,
}: {
  emoji: string;
  title: string;
  count: number;
  wipLimit?: number;
  accent: string;
  totalPoints: number;
  onAdd?: () => void;
  onClear?: () => void;
}) {
  const overWip = wipLimit !== undefined && count > wipLimit;

  return (
    <div className="mb-3 space-y-2">
      <div className="flex items-center gap-2">
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ background: accent }}
          aria-hidden
        />
        <span className="text-base">{emoji}</span>
        <h3 className="flex-1 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          {title}
        </h3>
        <span
          className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
            overWip
              ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
              : "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300"
          }`}
          title={
            wipLimit !== undefined
              ? `${count} cards (limit ${wipLimit})`
              : `${count} cards`
          }
        >
          {count}
          {wipLimit !== undefined ? `/${wipLimit}` : ""}
        </span>
        <Dropdown placement="bottom-end">
          <Dropdown.Trigger>
            <Action variant="ghost" size="xs" icon="more-horizontal" />
          </Dropdown.Trigger>
          <Dropdown.Items>
            <Dropdown.Item onClick={onAdd}>Add card</Dropdown.Item>
            <Dropdown.Item>Sort by priority</Dropdown.Item>
            <Dropdown.Separator />
            <Dropdown.Item onClick={onClear}>Clear column</Dropdown.Item>
          </Dropdown.Items>
        </Dropdown>
      </div>

      <div className="flex items-center gap-2 px-1 text-[10px] uppercase tracking-wider text-zinc-500">
        <span>{totalPoints} pts total</span>
        {overWip && (
          <span className="font-semibold text-red-600 dark:text-red-400">
            · over WIP limit
          </span>
        )}
      </div>

      <Action
        variant="ghost"
        size="xs"
        icon="plus"
        onClick={onAdd}
        className="w-full justify-start text-zinc-500"
      >
        Add card
      </Action>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Board (renders both modes)
// ─────────────────────────────────────────────────────────────────────────

type Mode = "simple" | "fancy";

function FullKanbanBoard() {
  const [mode, setMode] = useState<Mode>("fancy");
  const [board, setBoard] = useState<BoardState>(SPRINT_BOARD);
  const [columnOrder, setColumnOrder] = useState<readonly string[]>(
    COLUMNS.map((c) => c.id),
  );
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<string | null>(null);

  const handleMove = useCallback(
    (id: string, from: string, to: string, toIndex: number) => {
      setBoard((prev) => {
        const next = moveCard(prev, id, from, to, toIndex);
        const card = prev[from]?.find((c) => c.id === id);
        if (card) {
          setRecent(
            from === to
              ? `${card.title} reordered to #${toIndex + 1}`
              : `${card.title} → ${to} #${toIndex + 1}`,
          );
        }
        return next;
      });
    },
    [],
  );

  const handleColumnMove = useCallback(
    (columnId: string, toIndex: number) => {
      setColumnOrder((prev) => moveColumn([...prev], columnId, toIndex));
      setRecent(`column ${columnId} → #${toIndex + 1}`);
    },
    [],
  );

  const handleAdd = useCallback((columnId: string) => {
    const id = `c-${Date.now()}`;
    setBoard((prev) => ({
      ...prev,
      [columnId]: [
        ...(prev[columnId] ?? []),
        {
          id,
          title: "New card",
          priority: "low",
          points: 1,
        },
      ],
    }));
  }, []);

  const handleClear = useCallback((columnId: string) => {
    setBoard((prev) => ({ ...prev, [columnId]: [] }));
  }, []);

  const handleCardAction = useCallback(
    (cardId: string, action: string) => {
      setRecent(`${action} on ${cardId}`);
      if (action === "archive") {
        setBoard((prev) => {
          const next: BoardState = {};
          for (const k of Object.keys(prev)) {
            next[k] = (prev[k] ?? []).filter((c) => c.id !== cardId);
          }
          return next;
        });
      }
    },
    [],
  );

  const filtered = useMemo<BoardState>(() => {
    if (!query.trim()) return board;
    const q = query.toLowerCase();
    const out: BoardState = {};
    for (const col of COLUMNS) {
      out[col.id] = (board[col.id] ?? []).filter((c) =>
        [c.title, c.description, ...(c.assignees ?? []), ...(c.labels ?? [])]
          .filter(Boolean)
          .some((s) => s!.toLowerCase().includes(q)),
      );
    }
    return out;
  }, [board, query]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <MultiSwitch
          value={mode}
          onValueChange={(v) => setMode(v as Mode)}
          list={[
            { value: "simple", label: "Simple" },
            { value: "fancy", label: "Fancy" },
          ]}
          size="sm"
        />
        <Input
          placeholder="Filter…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
        {recent && (
          <span className="text-xs text-zinc-500">last: {recent}</span>
        )}
      </div>

      {/* Board — column order is consumer-controlled state, fed back via onColumnMove */}
      <Kanban
        onCardMove={handleMove}
        onColumnMove={handleColumnMove}
        className="!p-0"
      >
        {columnOrder
          .map((id) => COLUMNS.find((c) => c.id === id))
          .filter((c): c is (typeof COLUMNS)[number] => Boolean(c))
          .map((col) => {
          const cards = filtered[col.id] ?? [];
          const totalPts = pointsFor(cards);
          const header =
            mode === "simple" ? (
              <SimpleColumnHeader title={col.title} count={cards.length} />
            ) : (
              <FancyColumnHeader
                emoji={col.emoji}
                title={col.title}
                count={cards.length}
                wipLimit={col.wipLimit}
                accent={col.accent}
                totalPoints={totalPts}
                onAdd={() => handleAdd(col.id)}
                onClear={() => handleClear(col.id)}
              />
            );
          return (
            <Kanban.Column
              key={col.id}
              id={col.id}
              unstyled
              wipLimit={col.wipLimit}
              className="w-80 rounded-xl bg-zinc-50 p-3 ring-1 ring-zinc-200 dark:bg-zinc-900/60 dark:ring-zinc-800"
            >
              {/* Column drag handle wraps the header so users grab the
                  title to reorder. Using ColumnHandle pulls in the
                  column-reorder DnD wiring at the root. */}
              <Kanban.ColumnHandle>{header}</Kanban.ColumnHandle>

              {cards.length === 0 ? (
                <div className="rounded-lg border border-dashed border-zinc-300 px-3 py-6 text-center text-xs text-zinc-400 dark:border-zinc-700">
                  Drop a card here
                </div>
              ) : (
                cards.map((card) => (
                  <ContextMenu key={card.id}>
                    <ContextMenu.Trigger>
                      <Kanban.Card id={card.id} unstyled>
                        {mode === "simple" ? (
                          <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
                            <SimpleCardBody card={card} />
                          </div>
                        ) : (
                          <FancyCardBody
                            card={card}
                            onAction={(a) => handleCardAction(card.id, a)}
                          />
                        )}
                      </Kanban.Card>
                    </ContextMenu.Trigger>
                    <ContextMenu.Content>
                      <ContextMenu.Item onClick={() => handleCardAction(card.id, "edit")}>
                        Edit
                      </ContextMenu.Item>
                      <ContextMenu.Item onClick={() => handleCardAction(card.id, "duplicate")}>
                        Duplicate
                      </ContextMenu.Item>
                      <ContextMenu.Separator />
                      <ContextMenu.Item onClick={() => handleCardAction(card.id, "archive")}>
                        Archive
                      </ContextMenu.Item>
                    </ContextMenu.Content>
                  </ContextMenu>
                ))
              )}
            </Kanban.Column>
          );
        })}
      </Kanban>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Async-with-rollback demo
// ─────────────────────────────────────────────────────────────────────────

function AsyncBoard() {
  const [board, setBoard] = useState<BoardState>({
    pending: [{ id: "a1", title: "Approve refund #2841", priority: "med" }],
    approved: [],
  });
  const [status, setStatus] = useState<string | null>(null);

  const handleMove = useCallback(
    async (id: string, from: string, to: string, toIndex: number) => {
      const prev = board;
      setBoard((s) => moveCard(s, id, from, to, toIndex));
      setStatus("Saving…");
      await new Promise((r) => setTimeout(r, 700));
      const failed = Math.random() < 0.3;
      if (failed) {
        setBoard(prev);
        setStatus("Network error. Reverted.");
      } else {
        setStatus("Saved.");
      }
      setTimeout(() => setStatus(null), 1500);
    },
    [board],
  );

  return (
    <div className="space-y-2">
      <Kanban onCardMove={handleMove}>
        <Kanban.Column id="pending" title="Pending">
          {board.pending.map((c) => (
            <Kanban.Card key={c.id} id={c.id}>
              <SimpleCardBody card={c} />
            </Kanban.Card>
          ))}
        </Kanban.Column>
        <Kanban.Column id="approved" title="Approved">
          {board.approved.map((c) => (
            <Kanban.Card key={c.id} id={c.id}>
              <SimpleCardBody card={c} />
            </Kanban.Card>
          ))}
        </Kanban.Column>
      </Kanban>
      {status && (
        <p className="px-4 text-xs text-zinc-500">{status}</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────

export function KanbanDemo() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Kanban</h1>
      <p className="mb-8 max-w-2xl text-sm text-zinc-500">
        Compound drag-and-drop board. Cards accept arbitrary children, so
        you have full creative control over what each card looks like.
        Toggle between a stripped-down "Simple" rendering and a
        "Fancy" one composed of other react-fancy primitives — Card,
        Avatar, Badge, Progress, Tooltip, Dropdown, ContextMenu.
      </p>

      <DemoSection
        title="Full sprint board"
        description="Switch Simple / Fancy in the toolbar. In Fancy mode each card is a Card with a priority-colored cover stripe, sub-task Progress, label tags, assignee Tooltips, point counter, due-date pill, comments / attachments meta, a Dropdown ⋯ menu, and a right-click ContextMenu. Columns get an emoji + accent dot, count chip, WIP-limit indicator, points sum, and their own Dropdown menu."
      >
        <FullKanbanBoard />
      </DemoSection>

      <DemoSection
        title="Async move with rollback"
        description="onCardMove can be async. Apply the move optimistically; on failure, restore prior state. ~30 % of moves fail to demo the rollback path."
        code={`const handleMove = async (id, from, to, toIndex) => {
  const prev = board;
  setBoard(s => moveCard(s, id, from, to, toIndex));
  try {
    await api.move(id, to, toIndex);
  } catch {
    setBoard(prev);
    toast.error("Move failed");
  }
};`}
      >
        <AsyncBoard />
      </DemoSection>

      <Callout color="green" icon={<Icon name="check-circle" size="sm" />}>
        <div className="space-y-1">
          <p className="text-sm font-semibold">Shipped in v2.8.0</p>
          <ul className="mt-2 space-y-1 list-disc pl-5 text-xs text-zinc-700 dark:text-zinc-200">
            <li>
              Within-column reorder — <code>onCardMove</code> now receives a{" "}
              <code className="mx-1">toIndex</code> argument; drop position
              tracks the mouse Y.
            </li>
            <li>Drop-position indicator — a blue line shows where the card lands.</li>
            <li>
              Column reordering — drag a <code>{"<Kanban.ColumnHandle>"}</code>{" "}
              to reorder; new <code className="mx-1">onColumnMove</code>{" "}
              callback fires with the new index.
            </li>
            <li>
              First-class WIP limits — <code>wipLimit</code> on{" "}
              <code className="mx-1">Kanban.Column</code>; header pill turns red
              over capacity.
            </li>
            <li>
              <code>hideWhenEmpty</code> on <code>Kanban.Column</code> — clean
              column collapse for filter UIs.
            </li>
            <li>
              ARIA roles — <code>role="application"</code> on board,{" "}
              <code>role="group"</code> on columns. (Full keyboard nav still
              pending.)
            </li>
          </ul>
        </div>
      </Callout>

      <Callout color="amber" icon={<Icon name="alert-triangle" size="sm" />}>
        <div className="space-y-1">
          <p className="text-sm font-semibold">Still pending</p>
          <ul className="mt-2 space-y-1 list-disc pl-5 text-xs text-zinc-700 dark:text-zinc-200">
            <li>Touch / mobile — HTML5 DnD is desktop-only.</li>
            <li>Full keyboard navigation — arrow-key / space-to-lift move.</li>
            <li>Custom drag preview (browser default ghost).</li>
            <li>Multi-select drag.</li>
            <li>Swimlanes / row grouping.</li>
          </ul>
        </div>
      </Callout>
    </div>
  );
}
