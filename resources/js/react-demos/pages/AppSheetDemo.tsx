import { useState, useCallback } from "react";
import {
  SheetWorkbook, createEmptySheet, registerFunction, toAddress,
} from "@particle-academy/fancy-sheets";
import type { WorkbookData, SheetData, CellValue, SpreadsheetContextMenuItem } from "@particle-academy/fancy-sheets";
import { DemoSection } from "../components/DemoSection";

// ---------------------------------------------------------------------------
// Custom formula: BUDGET_STATUS — returns "Over" / "Under" / "On Track"
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
  { date: "2026-04-01", desc: "Rent",             category: "Housing",       amount: -1200, paid: true, note: "Auto-pay via bank" },
  { date: "2026-04-02", desc: "Grocery Store",    category: "Food",          amount: -85,   paid: true },
  { date: "2026-04-03", desc: "Gas Station",      category: "Transport",     amount: -45,   paid: true },
  { date: "2026-04-05", desc: "Salary Deposit",   category: "",              amount: 4200,  paid: true, note: "Monthly direct deposit" },
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
    A1: { value: "Date",     format: { ...HEADER } },
    B1: { value: "Description", format: { ...HEADER } },
    C1: { value: "Category", format: { ...HEADER } },
    D1: { value: "Amount",   format: { ...HEADER } },
    E1: { value: "Paid",     format: { ...HEADER } },
    F1: { value: "Balance",  format: { ...HEADER } },
  };
  TRANSACTIONS.forEach((t, i) => {
    const row = i + 2;
    const cat = CATEGORIES.find((c) => c.name === t.category);
    s.cells[`A${row}`] = { value: t.date,
      ...((t as any).note ? { comment: { text: (t as any).note, author: "System" } } : {}),
    };
    s.cells[`B${row}`] = { value: t.desc };
    s.cells[`C${row}`] = { value: t.category, format: cat ? { backgroundColor: cat.color, color: cat.textColor } : undefined };
    s.cells[`D${row}`] = { value: t.amount, format: t.amount < 0 ? { color: "#dc2626" } : { color: "#16a34a" } };
    s.cells[`E${row}`] = { value: t.paid ? "Yes" : "No",
      ...(!t.paid ? { comment: { text: "Payment pending — follow up this week", author: "Budget Bot", color: "#ef4444" } } : {}),
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
// AppSheet Demo
// ---------------------------------------------------------------------------

export function AppSheetDemo() {
  const [data, setData] = useState(createBudgetWorkbook);

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
      newCells[`D${nextRow}`] = { value: type === "income" ? 0 : 0, format: type === "expense" ? { color: "#dc2626" } : { color: "#16a34a" } };
      newCells[`E${nextRow}`] = { value: "No" };
      newCells[`F${nextRow}`] = { value: null, formula: `F${nextRow - 1}+D${nextRow}` };
      return {
        ...prev,
        sheets: prev.sheets.map((s) => s.id === "transactions" ? { ...s, cells: newCells } : s),
      };
    });
  }, []);

  const contextItems: SpreadsheetContextMenuItem[] = [
    {
      label: "Mark as Paid",
      onClick: (addr) => {
        const col = addr.replace(/[0-9]+/, "");
        const row = addr.replace(/[A-Z]+/, "");
        if (parseInt(row) < 2) return;
        setData((prev) => {
          const sheet = prev.sheets.find((s) => s.id === "transactions");
          if (!sheet) return prev;
          const paidAddr = `E${row}`;
          return {
            ...prev,
            sheets: prev.sheets.map((s) =>
              s.id === "transactions"
                ? { ...s, cells: { ...s.cells, [paidAddr]: { value: "Yes" } } }
                : s,
            ),
          };
        });
      },
    },
    {
      label: "Delete row",
      danger: true,
      onClick: (addr) => {
        const row = parseInt(addr.replace(/[A-Z]+/, ""), 10);
        if (row < 2) return;
        setData((prev) => {
          const sheet = prev.sheets.find((s) => s.id === "transactions");
          if (!sheet) return prev;
          const newCells = { ...sheet.cells };
          ["A", "B", "C", "D", "E", "F"].forEach((c) => delete newCells[`${c}${row}`]);
          return {
            ...prev,
            sheets: prev.sheets.map((s) =>
              s.id === "transactions" ? { ...s, cells: newCells } : s,
            ),
          };
        });
      },
    },
  ];

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
      <p className="mb-6 text-sm text-zinc-500">
        A micro-app built entirely with fancy-sheets components. Demonstrates custom cell
        styling, context menu extensions, toolbar extras, custom formulas (BUDGET_STATUS),
        cross-sheet references, and the SheetWorkbook convenience component.
      </p>

      <DemoSection
        title="Budget Tracker"
        description="Transactions sheet with colored categories, red/green amounts, running balance. Summary sheet uses SUMIF cross-sheet refs + custom BUDGET_STATUS formula. Right-click for Mark as Paid / Delete row. Toolbar has +Income / +Expense buttons."
        code={`<SheetWorkbook
  data={data}
  onChange={setData}
  columnCount={7}
  rowCount={25}
  toolbarExtra={toolbarExtra}
  contextMenuItems={contextItems}
/>`}
      >
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700" style={{ height: 600 }}>
          <SheetWorkbook
            data={data}
            onChange={setData}
            columnCount={7}
            rowCount={25}
            toolbarExtra={toolbarExtra}
            contextMenuItems={contextItems}
          />
        </div>
      </DemoSection>
    </div>
  );
}
