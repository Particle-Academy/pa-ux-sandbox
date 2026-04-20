import { useState, useCallback, useRef } from "react";
import {
  SheetWorkbook, createEmptySheet, registerFunction, toAddress,
} from "@particle-academy/fancy-sheets";
import type { WorkbookData, SheetData, CellValue, CellComment, SpreadsheetContextMenuItem } from "@particle-academy/fancy-sheets";
import { DemoSection } from "../components/DemoSection";

// ---------------------------------------------------------------------------
// Mock Comment API — simulates async CRUD with 300ms latency
// ---------------------------------------------------------------------------

const commentApi = {
  async add(sheetId: string, address: string, text: string, author = "You"): Promise<CellComment> {
    await new Promise((r) => setTimeout(r, 300));
    return { text, author, color: "#3b82f6" };
  },
  async update(sheetId: string, address: string, text: string, existing: CellComment): Promise<CellComment> {
    await new Promise((r) => setTimeout(r, 300));
    return { ...existing, text };
  },
  async remove(sheetId: string, address: string): Promise<void> {
    await new Promise((r) => setTimeout(r, 300));
  },
};

// ---------------------------------------------------------------------------
// Custom formula
// ---------------------------------------------------------------------------
registerFunction("BUDGET_STATUS", (args: CellValue[][]): CellValue => {
  const spent = Number(args[0]?.[0] ?? 0);
  const budget = Number(args[1]?.[0] ?? 0);
  if (isNaN(spent) || isNaN(budget) || budget === 0) return "N/A";
  const ratio = spent / budget;
  if (ratio > 1) return "Over Budget";
  if (ratio > 0.9) return "Near Limit";
  return "On Track";
});

// ---------------------------------------------------------------------------
// Data builders
// ---------------------------------------------------------------------------

const HEADER = { bold: true, backgroundColor: "#1e293b", color: "#ffffff" } as const;
const TOTAL_BORDER = { borderTop: "#475569", bold: true } as const;

const CATEGORIES = [
  { name: "Housing",        budget: 1500, color: "#93c5fd", textColor: "#1e3a5f" },
  { name: "Food",           budget: 600,  color: "#86efac", textColor: "#14532d" },
  { name: "Transport",      budget: 400,  color: "#fde047", textColor: "#713f12" },
  { name: "Entertainment",  budget: 200,  color: "#f9a8d4", textColor: "#831843" },
  { name: "Utilities",      budget: 250,  color: "#a5b4fc", textColor: "#312e81" },
];

const TRANSACTIONS = [
  { date: "2026-04-01", desc: "Rent",             category: "Housing",       amount: -1200, paid: true,  note: "Auto-pay via bank" },
  { date: "2026-04-02", desc: "Grocery Store",    category: "Food",          amount: -85,   paid: true },
  { date: "2026-04-03", desc: "Gas Station",      category: "Transport",     amount: -45,   paid: true },
  { date: "2026-04-05", desc: "Salary Deposit",   category: "",              amount: 4200,  paid: true,  note: "Monthly direct deposit" },
  { date: "2026-04-06", desc: "Electric Bill",    category: "Utilities",     amount: -120,  paid: true },
  { date: "2026-04-08", desc: "Movie Tickets",    category: "Entertainment", amount: -32,   paid: false },
  { date: "2026-04-10", desc: "Restaurant",       category: "Food",          amount: -65,   paid: true },
  { date: "2026-04-12", desc: "Internet",         category: "Utilities",     amount: -75,   paid: false },
  { date: "2026-04-14", desc: "Uber",             category: "Transport",     amount: -22,   paid: true },
  { date: "2026-04-15", desc: "Concert",          category: "Entertainment", amount: -95,   paid: false },
  { date: "2026-04-18", desc: "Groceries",        category: "Food",          amount: -110,  paid: true },
  { date: "2026-04-19", desc: "Parking",          category: "Transport",     amount: -15,   paid: true },
];

function transactionsSheet(): SheetData {
  const s = createEmptySheet("transactions", "Transactions");
  s.frozenRows = 1;
  s.cells = {
    A1: { value: "Date",        format: { ...HEADER } },
    B1: { value: "Description", format: { ...HEADER } },
    C1: { value: "Category",    format: { ...HEADER } },
    D1: { value: "Amount",      format: { ...HEADER } },
    E1: { value: "Paid",        format: { ...HEADER } },
    F1: { value: "Balance",     format: { ...HEADER } },
  };
  TRANSACTIONS.forEach((t, i) => {
    const row = i + 2;
    const cat = CATEGORIES.find((c) => c.name === t.category);
    s.cells[`A${row}`] = {
      value: t.date,
      ...(t.note ? { comment: { text: t.note, author: "System" } } : {}),
    };
    s.cells[`B${row}`] = { value: t.desc };
    s.cells[`C${row}`] = { value: t.category, format: cat ? { backgroundColor: cat.color, color: cat.textColor } : undefined };
    s.cells[`D${row}`] = { value: t.amount, format: t.amount < 0 ? { color: "#dc2626" } : { color: "#16a34a" } };
    s.cells[`E${row}`] = {
      value: t.paid ? "Yes" : "No",
      ...(!t.paid ? { comment: { text: "Payment pending \u2014 follow up this week", author: "Budget Bot", color: "#ef4444" } } : {}),
    };
    s.cells[`F${row}`] = { value: null, formula: row === 2 ? `D${row}` : `F${row - 1}+D${row}` };
  });
  const totalRow = TRANSACTIONS.length + 3;
  s.cells[`C${totalRow}`] = { value: "Total", format: { ...TOTAL_BORDER } };
  s.cells[`D${totalRow}`] = { value: null, formula: `SUM(D2:D${TRANSACTIONS.length + 1})`, format: { ...TOTAL_BORDER } };
  return s;
}

function summarySheet(): SheetData {
  const s = createEmptySheet("summary", "Summary");
  s.cells = {
    A1: { value: "Budget Summary", format: { ...HEADER, fontSize: 14 } },
    B1: { value: "", format: { backgroundColor: "#1e293b" } },
    C1: { value: "", format: { backgroundColor: "#1e293b" } },
    D1: { value: "", format: { backgroundColor: "#1e293b" } },
    A3: { value: "Category", format: { bold: true, borderBottom: "#334155" } },
    B3: { value: "Budget",   format: { bold: true, borderBottom: "#334155" } },
    C3: { value: "Spent",    format: { bold: true, borderBottom: "#334155" } },
    D3: { value: "Status",   format: { bold: true, borderBottom: "#334155" } },
  };
  CATEGORIES.forEach((cat, i) => {
    const row = i + 4;
    s.cells[`A${row}`] = { value: cat.name, format: { backgroundColor: cat.color, color: cat.textColor } };
    s.cells[`B${row}`] = { value: cat.budget, format: { displayFormat: "currency" } };
    s.cells[`C${row}`] = { value: null, formula: `ABS(SUMIF(Transactions!C2:C${TRANSACTIONS.length + 1},"${cat.name}",Transactions!D2:D${TRANSACTIONS.length + 1}))`, format: { displayFormat: "currency" } };
    s.cells[`D${row}`] = { value: null, formula: `BUDGET_STATUS(C${row},B${row})` };
  });
  const totalRow = CATEGORIES.length + 5;
  s.cells[`A${totalRow}`] = { value: "Total", format: { ...TOTAL_BORDER } };
  s.cells[`B${totalRow}`] = { value: null, formula: `SUM(B4:B${CATEGORIES.length + 3})`, format: { ...TOTAL_BORDER, displayFormat: "currency" } };
  s.cells[`C${totalRow}`] = { value: null, formula: `SUM(C4:C${CATEGORIES.length + 3})`, format: { ...TOTAL_BORDER, displayFormat: "currency" } };
  s.cells[`A${totalRow + 2}`] = { value: "Income", format: { bold: true } };
  s.cells[`B${totalRow + 2}`] = { value: null, formula: `SUMIF(Transactions!D2:D${TRANSACTIONS.length + 1},">0")`, format: { color: "#16a34a", displayFormat: "currency" } };
  s.cells[`A${totalRow + 3}`] = { value: "Net", format: { bold: true } };
  s.cells[`B${totalRow + 3}`] = { value: null, formula: `B${totalRow + 2}-C${totalRow}`, format: { displayFormat: "currency" } };
  return s;
}

function createBudgetWorkbook(): WorkbookData {
  return { sheets: [transactionsSheet(), summarySheet()], activeSheetId: "transactions" };
}

// ---------------------------------------------------------------------------
// Comment editor floating panel
// ---------------------------------------------------------------------------

function CommentEditor({
  address,
  initial,
  saving,
  onSave,
  onDelete,
  onCancel,
}: {
  address: string;
  initial?: CellComment;
  saving: boolean;
  onSave: (text: string) => void;
  onDelete?: () => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState(initial?.text ?? "");
  return (
    <div className="absolute right-0 top-full z-50 mt-1 w-64 rounded-lg border border-zinc-300 bg-white p-3 shadow-xl dark:border-zinc-600 dark:bg-zinc-800">
      <div className="mb-2 text-[11px] font-semibold text-zinc-400">{initial ? "Edit" : "Add"} comment on {address}</div>
      <textarea
        autoFocus
        rows={3}
        className="w-full rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-[12px] outline-none focus:border-blue-400 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type your comment..."
        disabled={saving}
      />
      <div className="mt-2 flex items-center justify-between">
        <div>
          {initial && onDelete && (
            <button
              className="text-[11px] text-red-500 hover:text-red-600 disabled:opacity-50"
              onClick={onDelete}
              disabled={saving}
            >
              Delete
            </button>
          )}
        </div>
        <div className="flex gap-1.5">
          <button
            className="rounded px-2 py-0.5 text-[11px] text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            className="rounded bg-blue-500 px-2 py-0.5 text-[11px] font-medium text-white hover:bg-blue-600 disabled:opacity-50"
            onClick={() => onSave(text)}
            disabled={saving || !text.trim()}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper: update a cell within workbook data immutably
// ---------------------------------------------------------------------------

function updateCell(prev: WorkbookData, sheetId: string, address: string, patch: Record<string, unknown>): WorkbookData {
  return {
    ...prev,
    sheets: prev.sheets.map((s) =>
      s.id === sheetId
        ? { ...s, cells: { ...s.cells, [address]: { ...s.cells[address], ...patch } } }
        : s,
    ),
  };
}

function removeCellKey(prev: WorkbookData, sheetId: string, address: string, key: string): WorkbookData {
  return {
    ...prev,
    sheets: prev.sheets.map((s) => {
      if (s.id !== sheetId) return s;
      const cell = { ...s.cells[address] };
      delete (cell as any)[key];
      return { ...s, cells: { ...s.cells, [address]: cell } };
    }),
  };
}

// ---------------------------------------------------------------------------
// AppSheet Demo
// ---------------------------------------------------------------------------

export function AppSheetDemo() {
  const [data, setData] = useState(createBudgetWorkbook);
  const [commentEditor, setCommentEditor] = useState<{ address: string; sheetId: string; existing?: CellComment } | null>(null);
  const [saving, setSaving] = useState(false);

  const addTransaction = useCallback((type: "income" | "expense") => {
    setData((prev) => {
      const sheet = prev.sheets.find((s) => s.id === "transactions");
      if (!sheet) return prev;
      const existingRows = Object.keys(sheet.cells)
        .map((k) => parseInt(k.replace(/[A-Z]+/, ""), 10))
        .filter((n) => !isNaN(n));
      const nextRow = Math.max(...existingRows) + 2;
      const today = new Date().toISOString().split("T")[0];
      const newCells = { ...sheet.cells };
      newCells[`A${nextRow}`] = { value: today };
      newCells[`B${nextRow}`] = { value: type === "income" ? "New Income" : "New Expense" };
      newCells[`C${nextRow}`] = { value: "" };
      newCells[`D${nextRow}`] = { value: 0, format: type === "expense" ? { color: "#dc2626" } : { color: "#16a34a" } };
      newCells[`E${nextRow}`] = { value: "No" };
      newCells[`F${nextRow}`] = { value: null, formula: `F${nextRow - 1}+D${nextRow}` };
      return {
        ...prev,
        sheets: prev.sheets.map((s) => s.id === "transactions" ? { ...s, cells: newCells } : s),
      };
    });
  }, []);

  const handleSaveComment = useCallback(async (text: string) => {
    if (!commentEditor) return;
    setSaving(true);
    const { address, sheetId, existing } = commentEditor;
    const comment = existing
      ? await commentApi.update(sheetId, address, text, existing)
      : await commentApi.add(sheetId, address, text);
    setData((prev) => updateCell(prev, sheetId, address, { comment }));
    setSaving(false);
    setCommentEditor(null);
  }, [commentEditor]);

  const handleDeleteComment = useCallback(async () => {
    if (!commentEditor) return;
    setSaving(true);
    const { address, sheetId } = commentEditor;
    await commentApi.remove(sheetId, address);
    setData((prev) => removeCellKey(prev, sheetId, address, "comment"));
    setSaving(false);
    setCommentEditor(null);
  }, [commentEditor]);

  const contextItems = useCallback((address: string): SpreadsheetContextMenuItem[] => {
    const activeSheetId = data.activeSheetId;
    const sheet = data.sheets.find((s) => s.id === activeSheetId);
    const cell = sheet?.cells[address];
    const hasComment = !!cell?.comment;
    const row = parseInt(address.replace(/[A-Z]+/, ""), 10);

    const items: SpreadsheetContextMenuItem[] = [];

    if (hasComment) {
      items.push({
        label: "Edit Comment",
        onClick: (addr) => setCommentEditor({ address: addr, sheetId: activeSheetId, existing: cell!.comment }),
      });
      items.push({
        label: "Delete Comment",
        danger: true,
        onClick: async (addr) => {
          await commentApi.remove(activeSheetId, addr);
          setData((prev) => removeCellKey(prev, activeSheetId, addr, "comment"));
        },
      });
    } else {
      items.push({
        label: "Add Comment",
        onClick: (addr) => setCommentEditor({ address: addr, sheetId: activeSheetId }),
      });
    }

    if (row >= 2) {
      items.push({
        label: "Mark as Paid",
        onClick: (addr) => {
          const r = addr.replace(/[A-Z]+/, "");
          setData((prev) => updateCell(prev, "transactions", `E${r}`, { value: "Yes", comment: undefined }));
        },
      });
      items.push({
        label: "Delete row",
        danger: true,
        onClick: (addr) => {
          const r = parseInt(addr.replace(/[A-Z]+/, ""), 10);
          setData((prev) => {
            const sheet = prev.sheets.find((s) => s.id === "transactions");
            if (!sheet) return prev;
            const newCells = { ...sheet.cells };
            ["A", "B", "C", "D", "E", "F"].forEach((c) => delete newCells[`${c}${r}`]);
            return { ...prev, sheets: prev.sheets.map((s) => s.id === "transactions" ? { ...s, cells: newCells } : s) };
          });
        },
      });
    }

    return items;
  }, [data]);

  const toolbarExtra = (
    <>
      <button
        className="inline-flex items-center rounded bg-green-600 px-2 py-0.5 text-[11px] font-medium text-white hover:bg-green-700"
        onClick={() => addTransaction("income")}
      >
        + Income
      </button>
      <button
        className="inline-flex items-center rounded bg-red-500 px-2 py-0.5 text-[11px] font-medium text-white hover:bg-red-600 ml-1"
        onClick={() => addTransaction("expense")}
      >
        + Expense
      </button>
    </>
  );

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">AppSheet: Budget Tracker</h1>
      <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
        A micro-app built with fancy-sheets. Right-click any cell for Add/Edit/Delete Comment
        (powered by a mock API with 300ms latency). Comments show as a triangle indicator +
        colored border; hover to read. Also: custom toolbar buttons, context-aware menus,
        custom formulas, cross-sheet references, and styled cells.
      </p>

      <DemoSection
        title="Budget Tracker"
        description="Right-click any cell to Add Comment (or Edit/Delete if one exists). Comments are persisted via mock API. Hover the triangle indicators to read existing comments."
        code={`// Mock API
const commentApi = {
  add: (sheet, addr, text) => fetch('/api/comments', { method: 'POST', body: ... }),
  update: (sheet, addr, text) => fetch(\`/api/comments/\${addr}\`, { method: 'PATCH', body: ... }),
  remove: (sheet, addr) => fetch(\`/api/comments/\${addr}\`, { method: 'DELETE' }),
};

// Context menu wires API to cell data
contextMenuItems={(addr) => {
  const hasComment = !!sheet.cells[addr]?.comment;
  return hasComment
    ? [{ label: "Edit Comment", onClick: ... }, { label: "Delete Comment", danger: true, onClick: ... }]
    : [{ label: "Add Comment", onClick: ... }];
}}`}
      >
        <div className="relative rounded-lg border border-zinc-200 dark:border-zinc-700" style={{ height: 600 }}>
          <SheetWorkbook
            data={data}
            onChange={setData}
            columnCount={7}
            rowCount={25}
            toolbarExtra={toolbarExtra}
            contextMenuItems={contextItems}
          />
          {commentEditor && (
            <CommentEditor
              address={commentEditor.address}
              initial={commentEditor.existing}
              saving={saving}
              onSave={handleSaveComment}
              onDelete={commentEditor.existing ? handleDeleteComment : undefined}
              onCancel={() => setCommentEditor(null)}
            />
          )}
        </div>
      </DemoSection>
    </div>
  );
}
