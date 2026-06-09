import { useState } from "react";
import {
    SheetWorkbook,
    createEmptyWorkbook,
    type WorkbookData,
} from "@particle-academy/fancy-sheets";
import "@particle-academy/fancy-sheets/styles.css";

/**
 * Spreadsheet Studio — the real @particle-academy/fancy-sheets <SheetWorkbook>:
 * a multi-sheet workbook with a live formula engine (SUM, AVERAGE, …), cell
 * styling, sheet tabs, clipboard, and CSV import/export. Fully controlled via
 * `data` + `onChange`. Type a `=`-formula into any cell to watch it recompute.
 */

const HEADER = { bold: true, backgroundColor: "#1e3a5f", color: "#ffffff" } as const;

function seedWorkbook(): WorkbookData {
    const wb = createEmptyWorkbook();
    const sheet = wb.sheets[0];
    sheet.name = "Revenue";
    sheet.frozenRows = 1;
    sheet.cells = {
        A1: { value: "Product", format: { ...HEADER } },
        B1: { value: "Price", format: { ...HEADER } },
        C1: { value: "Qty", format: { ...HEADER } },
        D1: { value: "Total", format: { ...HEADER } },
        A2: { value: "Widget Pro" }, B2: { value: 29.99 }, C2: { value: 100 }, D2: { value: null, formula: "B2*C2" },
        A3: { value: "Gadget X" }, B3: { value: 49.99 }, C3: { value: 50 }, D3: { value: null, formula: "B3*C3" },
        A4: { value: "Doohickey" }, B4: { value: 9.99 }, C4: { value: 200 }, D4: { value: null, formula: "B4*C4" },
        A5: { value: "Sprocket XL" }, B5: { value: 5.49 }, C5: { value: 500 }, D5: { value: null, formula: "B5*C5" },
        A7: { value: "Total Revenue", format: { bold: true, borderTop: "#334155" } },
        D7: { value: null, formula: "SUM(D2:D5)", format: { bold: true, borderTop: "#334155" } },
        A8: { value: "Avg Price" }, D8: { value: null, formula: "AVERAGE(B2:B5)" },
        A9: { value: "Units Sold" }, D9: { value: null, formula: "SUM(C2:C5)" },
    };
    return wb;
}

export function SpreadsheetStudioKit() {
    const [workbook, setWorkbook] = useState(seedWorkbook);
    return (
        <div className="h-[440px] w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
            <SheetWorkbook data={workbook} onChange={setWorkbook} columnCount={8} rowCount={20} />
        </div>
    );
}
