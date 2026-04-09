import { useState } from "react";
import { Spreadsheet, createEmptyWorkbook } from "@particle-academy/fancy-sheets";
import type { WorkbookData } from "@particle-academy/fancy-sheets";
import { DemoSection } from "../components/DemoSection";

// Pre-populate with sample data
function createSampleWorkbook(): WorkbookData {
  const wb = createEmptyWorkbook();
  const sheet = wb.sheets[0];
  sheet.name = "Products";
  sheet.cells = {
    A1: { value: "Product" },
    B1: { value: "Category" },
    C1: { value: "Price" },
    D1: { value: "Qty" },
    E1: { value: "Total" },
    A2: { value: "Widget Pro" },
    B2: { value: "Hardware" },
    C2: { value: 29.99 },
    D2: { value: 100 },
    E2: { value: "=C2*D2", formula: "C2*D2" },
    A3: { value: "Gadget X" },
    B3: { value: "Electronics" },
    C3: { value: 49.99 },
    D3: { value: 50 },
    E3: { value: "=C3*D3", formula: "C3*D3" },
    A4: { value: "Doohickey" },
    B4: { value: "Hardware" },
    C4: { value: 9.99 },
    D4: { value: 200 },
    E4: { value: "=C4*D4", formula: "C4*D4" },
    A5: { value: "Thingamajig" },
    B5: { value: "Accessories" },
    C5: { value: 14.99 },
    D5: { value: 75 },
    E5: { value: "=C5*D5", formula: "C5*D5" },
    A7: { value: "Totals", format: { bold: true } },
    C7: { value: "=SUM(C2:C5)", formula: "SUM(C2:C5)" },
    D7: { value: "=SUM(D2:D5)", formula: "SUM(D2:D5)" },
    E7: { value: "=SUM(E2:E5)", formula: "SUM(E2:E5)" },
  };
  // Bold headers
  for (const key of ["A1", "B1", "C1", "D1", "E1"]) {
    sheet.cells[key] = { ...sheet.cells[key], format: { bold: true } };
  }
  return wb;
}

export function SpreadsheetDemo() {
  const [data, setData] = useState(createSampleWorkbook);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Spreadsheet</h1>

      <DemoSection
        title="Product Catalog"
        description="Full spreadsheet with cell editing, formatting, formula bar, keyboard navigation, multi-sheet tabs, and undo/redo. Click cells to select, double-click or type to edit, use arrow keys to navigate."
        code={`<Spreadsheet data={workbook} onChange={setWorkbook}>
  <Spreadsheet.Toolbar />
  <Spreadsheet.Grid />
  <Spreadsheet.SheetTabs />
</Spreadsheet>`}
      >
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700" style={{ height: 500 }}>
          <Spreadsheet
            data={data}
            onChange={setData}
            columnCount={10}
            rowCount={30}
          >
            <Spreadsheet.Toolbar />
            <Spreadsheet.Grid />
            <Spreadsheet.SheetTabs />
          </Spreadsheet>
        </div>
      </DemoSection>
    </div>
  );
}
