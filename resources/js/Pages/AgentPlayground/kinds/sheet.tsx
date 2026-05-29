/**
 * sheet kind — fancy-sheets <SheetWorkbook> driven by registerSheetsBridge.
 */
import { SheetWorkbook, createEmptyWorkbook, type WorkbookData } from "@particle-academy/fancy-sheets";
import "@particle-academy/fancy-sheets/styles.css";
import { registerSheetsBridge } from "@particle-academy/agent-integrations/bridges/sheets";
import type { KindModule, SurfaceProps, KindBridgeContext } from "./types";

export type SheetState = { workbook: WorkbookData };

const seed = (): SheetState => {
  const wb = createEmptyWorkbook();
  const sheet = wb.sheets[0];
  const set = (a: string, v: string | number) => {
    sheet.cells[a] = { value: v } as never;
  };
  set("A1", "Item");
  set("B1", "Value");
  set("A2", "Ask the agent");
  set("B2", "sheet_set_cell");
  return { workbook: wb };
};

function SheetSurface({ state, onChange }: SurfaceProps) {
  const s = state as SheetState;
  return (
    <div style={{ height: 480 }} className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
      <SheetWorkbook data={s.workbook} onChange={(workbook) => onChange({ workbook })} />
    </div>
  );
}

export const sheetKind: KindModule = {
  kind: "sheet",
  label: "Sheet",
  description: "A multi-sheet spreadsheet workbook. Drive it with sheet_* tools.",
  status: "wired",
  createState: seed,
  register: (server, ctx: KindBridgeContext) => {
    const read = () => (ctx.getActiveState() as SheetState) ?? seed();
    return registerSheetsBridge(server, {
      adapter: {
        // The bridge declares its own loose WorkbookData mirror; cast at the
        // boundary since the live fancy-sheets type is structurally compatible.
        getWorkbook: () => read().workbook as never,
        setWorkbook: (workbook) => ctx.setActiveState({ workbook: workbook as never }),
      },
      agent: ctx.agent,
    });
  },
  Surface: SheetSurface,
};
