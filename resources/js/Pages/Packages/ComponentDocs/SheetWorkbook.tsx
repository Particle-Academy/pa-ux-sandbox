import type { ComponentDoc } from "./types";
import { SheetWorkbook, createEmptyWorkbook } from "@particle-academy/fancy-sheets";
import { useState } from "react";

function SheetDemo() {
    const [workbook, setWorkbook] = useState(() => {
        const wb = createEmptyWorkbook();
        const sheet = wb.sheets[0];
        sheet.cells["A1"] = { value: "Item" };
        sheet.cells["B1"] = { value: "Qty" };
        sheet.cells["C1"] = { value: "Total" };
        sheet.cells["A2"] = { value: "Widget" };
        sheet.cells["B2"] = { value: 12 };
        sheet.cells["C2"] = { value: 48 };
        sheet.cells["A3"] = { value: "Sprocket" };
        sheet.cells["B3"] = { value: 4 };
        sheet.cells["C3"] = { value: 32 };
        return wb;
    });
    return (
        <div className="h-72 w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
            <SheetWorkbook data={workbook} onChange={setWorkbook} rowCount={20} columnCount={6} />
        </div>
    );
}

export const sheetWorkbookDoc: ComponentDoc = {
    intro: (
        <p>
            Multi-sheet spreadsheet with formulas, clipboard, CSV import/export, sheet tabs,
            and a toolbar. Controlled via the <code>data</code> prop (use{" "}
            <code>createEmptyWorkbook()</code> to start). Workbook shape is the standard{" "}
            <code>{`{ sheets: [{ name, cells: { "A1": { value }, … } }] }`}</code> structure.
        </p>
    ),
    examples: [
        {
            name: "Default",
            description: "A workbook with a single sheet and a small table.",
            render: () => <SheetDemo />,
            code: `import { SheetWorkbook, createEmptyWorkbook } from "@particle-academy/fancy-sheets";

const [workbook, setWorkbook] = useState(() => {
    const wb = createEmptyWorkbook();
    wb.sheets[0].cells["A1"] = { value: "Item" };
    wb.sheets[0].cells["B1"] = { value: "Qty" };
    return wb;
});

<SheetWorkbook data={workbook} onChange={setWorkbook} />`,
        },
        {
            name: "Read-only",
            description: "Skip the toolbar + disable editing for snapshot views.",
            render: () => (
                <div className="h-56 w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <SheetWorkbook defaultData={createEmptyWorkbook()} readOnly hideToolbar />
                </div>
            ),
            code: `<SheetWorkbook
    data={workbook}
    readOnly
    hideToolbar
    hideTabs
/>`,
        },
        {
            name: "Custom grid size",
            description: "Override default 26 columns × 100 rows.",
            render: () => (
                <div className="h-40 w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <SheetWorkbook defaultData={createEmptyWorkbook()} rowCount={10} columnCount={5} />
                </div>
            ),
            code: `<SheetWorkbook
    data={workbook}
    onChange={setWorkbook}
    rowCount={10}
    columnCount={5}
    rowHeight={32}
/>`,
        },
    ],
    props: [
        { name: "data", type: `WorkbookData`, default: "—", description: "Controlled workbook. Pair with `onChange`." },
        { name: "defaultData", type: `WorkbookData`, default: "—", description: "Default workbook (uncontrolled)." },
        { name: "onChange", type: `(data: WorkbookData) => void`, default: "—", description: "Called on any cell edit, formula update, sheet add/remove, column resize, etc." },
        { name: "columnCount", type: `number`, default: `26`, description: "Number of columns in the grid." },
        { name: "rowCount", type: `number`, default: `100`, description: "Number of rows in the grid." },
        { name: "defaultColumnWidth", type: `number`, default: `100`, description: "Default column width in px." },
        { name: "rowHeight", type: `number`, default: `28`, description: "Row height in px." },
        { name: "readOnly", type: `boolean`, default: `false`, description: "Disable cell editing and the toolbar." },
        { name: "hideToolbar", type: `boolean`, default: `false`, description: "Hide the toolbar above the grid." },
        { name: "hideTabs", type: `boolean`, default: `false`, description: "Hide the sheet tabs below the grid." },
        { name: "toolbarButtons", type: `ToolbarButton[]`, default: "all", description: "Which built-in buttons to show. Pass `[]` to show only `toolbarExtra`." },
        { name: "toolbarExtra", type: `ReactNode`, default: "—", description: "Content appended to the toolbar — drop in custom buttons / branding." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the root wrapper." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>Companion exports:</strong> <code>createEmptyWorkbook()</code> /
            <code>createEmptySheet()</code> for bootstrap, <code>parseCSV</code> /
            <code>csvToWorkbook</code> / <code>workbookToCSV</code> for import/export,
            <code>registerFunction</code> for custom formula functions.
        </p>
    ),
};
