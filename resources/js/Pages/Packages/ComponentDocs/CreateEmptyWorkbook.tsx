import type { ComponentDoc } from "./types";
import { Text } from "@particle-academy/react-fancy";

export const createEmptyWorkbookDoc: ComponentDoc = {
    intro: (
        <p>
            Factory functions that bootstrap a fresh workbook (one sheet, no cells) or a
            fresh sheet for adding to an existing workbook. Match the{" "}
            <code>WorkbookData</code> / <code>SheetData</code> shapes expected by{" "}
            <code>SheetWorkbook</code>.
        </p>
    ),
    examples: [
        {
            name: "Bootstrap a workbook",
            description: "The standard pattern — initialize state with a factory result.",
            render: () => (
                <Text size="sm" className="!text-zinc-500">
                    Use inside a <code>useState</code> initializer so it only runs once.
                </Text>
            ),
            code: `import { SheetWorkbook, createEmptyWorkbook } from "@particle-academy/fancy-sheets";
import "@particle-academy/fancy-sheets/styles.css";

const [workbook, setWorkbook] = useState(() => {
    const wb = createEmptyWorkbook();
    wb.sheets[0].cells["A1"] = { value: "Hello" };
    return wb;
});

<SheetWorkbook data={workbook} onChange={setWorkbook} />`,
        },
        {
            name: "Add a sheet",
            description: "`createEmptySheet()` returns a new sheet ready to push into `wb.sheets`.",
            render: () => (
                <Text size="sm" className="!text-zinc-500">
                    Pair with <code>setWorkbook</code> to add tabs at runtime.
                </Text>
            ),
            code: `import { createEmptySheet } from "@particle-academy/fancy-sheets";

setWorkbook((wb) => ({
    ...wb,
    sheets: [...wb.sheets, createEmptySheet("Q2")],
}));`,
        },
    ],
    props: [
        { name: "createEmptyWorkbook()", type: `() => WorkbookData`, default: "—", description: "Returns a workbook with a single empty sheet named \"Sheet1\"." },
        { name: "createEmptySheet(name?)", type: `(name?: string) => SheetData`, default: "—", description: "Returns a single empty sheet — pass a name or let the caller fill it in." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>WorkbookData shape:</strong>{" "}
            <code>{`{ sheets: SheetData[], activeSheetIndex?: number }`}</code>.{" "}
            <strong>SheetData shape:</strong>{" "}
            <code>{`{ name: string, cells: { [address: string]: { value, formula? } }, columnWidths?, rowHeights? }`}</code>.
        </p>
    ),
};
