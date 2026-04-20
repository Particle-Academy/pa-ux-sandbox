import { useState } from "react";
import {
  Spreadsheet, Sheet, SheetWorkbook,
  createEmptySheet, useSpreadsheet,
} from "@particle-academy/fancy-sheets";
import type { WorkbookData, SheetData, SpreadsheetContextMenuItem } from "@particle-academy/fancy-sheets";
import { DemoSection } from "../components/DemoSection";

// ---------------------------------------------------------------------------
// Sheet builders for the full workbook demo
// ---------------------------------------------------------------------------

function productsSheet(): SheetData {
  const s = createEmptySheet("products", "Products");
  s.frozenRows = 1;
  s.cells = {
    A1: { value: "Product",  format: { bold: true, backgroundColor: "#1e3a5f", color: "#ffffff", borderBottom: "#0f172a" } },
    B1: { value: "Category", format: { bold: true, backgroundColor: "#1e3a5f", color: "#ffffff", borderBottom: "#0f172a" } },
    C1: { value: "Price",    format: { bold: true, backgroundColor: "#1e3a5f", color: "#ffffff", borderBottom: "#0f172a" } },
    D1: { value: "Qty",      format: { bold: true, backgroundColor: "#1e3a5f", color: "#ffffff", borderBottom: "#0f172a" } },
    E1: { value: "Total",    format: { bold: true, backgroundColor: "#1e3a5f", color: "#ffffff", borderBottom: "#0f172a" } },
    A2: { value: "Widget Pro" },     B2: { value: "Hardware" },     C2: { value: 29.99 },  D2: { value: 100 }, E2: { value: null, formula: "C2*D2" },
    A3: { value: "Gadget X" },       B3: { value: "Electronics" },  C3: { value: 49.99 },  D3: { value: 50 },  E3: { value: null, formula: "C3*D3" },
    A4: { value: "Doohickey" },      B4: { value: "Hardware" },     C4: { value: 9.99 },   D4: { value: 200 }, E4: { value: null, formula: "C4*D4" },
    A5: { value: "Thingamajig" },    B5: { value: "Accessories" },  C5: { value: 14.99 },  D5: { value: 75 },  E5: { value: null, formula: "C5*D5" },
    A6: { value: "Gizmo Lite" },     B6: { value: "Electronics" },  C6: { value: 19.99 },  D6: { value: 150 }, E6: { value: null, formula: "C6*D6" },
    A7: { value: "Sprocket XL" },    B7: { value: "Hardware" },     C7: { value: 5.49 },   D7: { value: 500 }, E7: { value: null, formula: "C7*D7" },
    A9:  { value: "Summary", format: { bold: true, borderBottom: "#334155" } },
    A10: { value: "Total Revenue" }, E10: { value: null, formula: "SUM(E2:E7)" },
    A11: { value: "Avg Price" },     E11: { value: null, formula: "AVERAGE(C2:C7)" },
    A12: { value: "Total Units" },   E12: { value: null, formula: "SUM(D2:D7)" },
    A13: { value: "Product Count" }, E13: { value: null, formula: "COUNT(C2:C7)" },
  };
  return s;
}

function conditionalsSheet(): SheetData {
  const s = createEmptySheet("conditionals", "Conditionals");
  s.cells = {
    A1: { value: "Conditional Formulas", format: { bold: true } },
    A3: { value: "Region", format: { bold: true } }, B3: { value: "Sales", format: { bold: true } }, C3: { value: "Status", format: { bold: true } },
    A4: { value: "North" }, B4: { value: 1200 }, C4: { value: "Active" },
    A5: { value: "South" }, B5: { value: 850 },  C5: { value: "Active" },
    A6: { value: "East" },  B6: { value: 2100 }, C6: { value: "Inactive" },
    A7: { value: "West" },  B7: { value: 950 },  C7: { value: "Active" },
    A8: { value: "North" }, B8: { value: 1800 }, C8: { value: "Active" },
    E3: { value: "Analysis", format: { bold: true } },
    E4: { value: "North total:" },  F4: { value: null, formula: 'SUMIF(A4:A8,"North",B4:B8)' },
    E5: { value: "Active count:" }, F5: { value: null, formula: 'COUNTIF(C4:C8,"Active")' },
    E6: { value: "Avg (Active):" }, F6: { value: null, formula: 'AVERAGEIF(C4:C8,"Active",B4:B8)' },
  };
  return s;
}

function createFullWorkbook(): WorkbookData {
  return { sheets: [productsSheet(), conditionalsSheet()], activeSheetId: "products" };
}

// ---------------------------------------------------------------------------
// Small sheet builders for individual feature demos
// ---------------------------------------------------------------------------

function styledSheet(): SheetData {
  const s = createEmptySheet("styled", "Styled");
  s.cells = {
    A1: { value: "Revenue", format: { bold: true, backgroundColor: "#059669", color: "#ffffff" } },
    B1: { value: "Expense", format: { bold: true, backgroundColor: "#dc2626", color: "#ffffff" } },
    C1: { value: "Profit",  format: { bold: true, backgroundColor: "#2563eb", color: "#ffffff" } },
    A2: { value: 12000 }, B2: { value: 8500 },  C2: { value: null, formula: "A2-B2" },
    A3: { value: 15000 }, B3: { value: 9200 },  C3: { value: null, formula: "A3-B3" },
    A4: { value: 11000 }, B4: { value: 11500 }, C4: { value: null, formula: "A4-B4", format: { color: "#dc2626" } },
    A5: { value: "Total", format: { bold: true, borderTop: "#334155" } },
    B5: { value: null, formula: "SUM(B2:B4)", format: { borderTop: "#334155" } },
    C5: { value: null, formula: "SUM(C2:C4)", format: { borderTop: "#334155" } },
  };
  return s;
}

function contextMenuSheet(): SheetData {
  const s = createEmptySheet("ctx", "Context Menu");
  s.cells = {
    A1: { value: "Name", format: { bold: true } }, B1: { value: "Status", format: { bold: true } },
    A2: { value: "Alice" }, B2: { value: "Active" },
    A3: { value: "Bob" },   B3: { value: "Pending" },
    A4: { value: "Carol" }, B4: { value: "Active" },
  };
  return s;
}

// ---------------------------------------------------------------------------
// Demo page
// ---------------------------------------------------------------------------

export function SpreadsheetDemo() {
  const [workbook, setWorkbook] = useState(createFullWorkbook);
  const [styled, setStyled] = useState(styledSheet);
  const [ctxData, setCtxData] = useState(contextMenuSheet);
  const [wbData, setWbData] = useState(createFullWorkbook);
  const [hideToolbar, setHideToolbar] = useState(false);
  const [hideTabs, setHideTabs] = useState(false);
  const [singleSheet, setSingleSheet] = useState(() => createEmptySheet("single", "Sheet1"));

  const contextItems: SpreadsheetContextMenuItem[] = [
    {
      label: "Highlight yellow",
      onClick: (addr) => {
        setCtxData((prev) => ({
          ...prev,
          cells: { ...prev.cells, [addr]: { ...prev.cells[addr], format: { ...prev.cells[addr]?.format, backgroundColor: "#fef08a" } } },
        }));
      },
    },
    {
      label: "Clear formatting",
      onClick: (addr) => {
        setCtxData((prev) => {
          const cell = prev.cells[addr];
          if (!cell) return prev;
          const { format: _, ...rest } = cell;
          return { ...prev, cells: { ...prev.cells, [addr]: rest } };
        });
      },
    },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Spreadsheet</h1>

      {/* Full Workbook */}
      <DemoSection
        title="Full Workbook"
        description="Multi-sheet workbook with styled headers, formulas, frozen rows. Switch tabs to see Conditionals sheet."
        code={`<Spreadsheet data={workbook} onChange={setWorkbook}>
  <Spreadsheet.Toolbar />
  <Spreadsheet.Grid />
  <Spreadsheet.SheetTabs />
</Spreadsheet>`}
      >
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700" style={{ height: 480 }}>
          <Spreadsheet data={workbook} onChange={setWorkbook} columnCount={10} rowCount={20}>
            <Spreadsheet.Toolbar />
            <Spreadsheet.Grid />
            <Spreadsheet.SheetTabs />
          </Spreadsheet>
        </div>
      </DemoSection>

      {/* Custom Cell Styling */}
      <DemoSection
        title="Custom Cell Styling"
        description="Cells support backgroundColor, color, fontSize, and per-side borders. Negative profit is red; total row has a top border."
        code={`{ value: 12000, format: { backgroundColor: "#059669", color: "#fff" } }
{ value: null, formula: "SUM(C2:C4)", format: { borderTop: "#334155" } }`}
      >
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700" style={{ height: 220 }}>
          <Sheet data={styled} onChange={setStyled} columnCount={4} rowCount={8} />
        </div>
      </DemoSection>

      {/* Custom Context Menu */}
      <DemoSection
        title="Custom Context Menu"
        description="Right-click any cell to see custom items (Highlight yellow, Clear formatting) below the built-in items."
        code={`<Sheet data={data} onChange={setData}
  contextMenuItems={[
    { label: "Highlight yellow", onClick: (addr) => ... },
    { label: "Clear formatting", onClick: (addr) => ... },
  ]}
/>`}
      >
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700" style={{ height: 200 }}>
          <Sheet data={ctxData} onChange={setCtxData} columnCount={4} rowCount={6} contextMenuItems={contextItems} />
        </div>
      </DemoSection>

      {/* Toolbar Extra */}
      <DemoSection
        title="Toolbar Extra Buttons"
        description="The extra prop injects content after the default toolbar buttons."
        code={`<Spreadsheet data={data} onChange={setData}>
  <Spreadsheet.Toolbar extra={<button>Custom</button>} />
  <Spreadsheet.Grid />
</Spreadsheet>`}
      >
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700" style={{ height: 280 }}>
          <Spreadsheet data={workbook} onChange={setWorkbook} columnCount={10} rowCount={10}>
            <Spreadsheet.Toolbar extra={
              <button
                className="inline-flex items-center rounded bg-blue-500 px-2 py-0.5 text-[11px] font-medium text-white hover:bg-blue-600"
                onClick={() => alert("Custom toolbar action")}
              >
                Custom Action
              </button>
            } />
            <Spreadsheet.Grid />
          </Spreadsheet>
        </div>
      </DemoSection>

      {/* SheetWorkbook */}
      <DemoSection
        title="SheetWorkbook (Convenience)"
        description="Single component with hideToolbar and hideTabs props. Toggle below:"
        code={`<SheetWorkbook data={data} onChange={setData}
  hideToolbar={false} hideTabs={false} />`}
      >
        <div className="mb-3 flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={hideToolbar} onChange={(e) => setHideToolbar(e.target.checked)} />
            Hide toolbar
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={hideTabs} onChange={(e) => setHideTabs(e.target.checked)} />
            Hide tabs
          </label>
        </div>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700" style={{ height: 350 }}>
          <SheetWorkbook data={wbData} onChange={setWbData} columnCount={10} rowCount={15} hideToolbar={hideToolbar} hideTabs={hideTabs} />
        </div>
      </DemoSection>

      {/* Single Sheet */}
      <DemoSection
        title="Single Sheet (Lean API)"
        description="The Sheet component takes SheetData directly — no workbook wrapper, no tabs, no toolbar. Just a grid."
        code={`<Sheet data={sheetData} onChange={setSheetData}
  columnCount={6} rowCount={10} />`}
      >
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700" style={{ height: 280 }}>
          <Sheet data={singleSheet} onChange={setSingleSheet} columnCount={6} rowCount={10} />
        </div>
      </DemoSection>
    </div>
  );
}
