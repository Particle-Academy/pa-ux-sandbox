import type { Doc, TableRow } from "@particle-academy/last-word-ui";

/**
 * Sample last-word Docs for the last-word-ui `DocViewer` demo and its grid tile.
 *
 * Pure data, no DOM: a TYPE-only import, so this module costs the SSR bundle
 * nothing. The viewer itself measures the DOM and is only ever mounted on the
 * client (ComponentDemo is `clientOnly`, the tile lives in HeavyPreviews).
 *
 * The letterhead mark is an embedded PNG on purpose: the viewer draws images
 * only from `data:image/(png|jpeg|gif|webp|bmp);base64` and never requests a
 * remote `src` (it is untrusted-document input). An SVG data URL is NOT drawn.
 * A 96x96 "N" monogram, about 450 bytes.
 */
export const LW_LOGO_PNG =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAABh0lEQVR42u3d0U0DMRRE0S2Cf/pIM3" +
    "RHDXQHDURsILFn1j4r+Rfx7lFEwHY4jief99vH987rmPnsHjuGImoIQsQghHBBBMGCCEIFEQQKI4gTBBAmjCBKEECQMIIYAABYAP" +
    "YEECKMIAIAANbCAI8+swdv+b5qAGYjAAgjAADQCTALAUB4cADh4QEA6AcYGQBAGAFAGAEAgGsBvDoGgDACgDuDzowCAEDnfsCsMA" +
    "B+GXRGHAAng44OBABA/57wyEgAHhx0VCgAfxh0RCwAAK51LujVwQD8Y9DWr7XVybjWV9RWRxNbf64AAHCd9/EAwr/NAgj/TQcAgH" +
    "UuaLTuOWx1Q6Z1522rK0qt+88AAPSd9wFQcOoNQMHZTwAA1r2LBaDg3QaAC90HAwBg3btYAMKDtt7a3+7jagAA8IFNWwFYAABYAA" +
    "BYAPYEePv6vPQCAAAAgJUBRv8PAQAn8QEsDmABAGCdAEAIxwdQAAAhHB9AAQCEcHwIBfEhFMSHUBAfREF4ECXhoYyL/QPKPMH/zp" +
    "xVdwAAAABJRU5ErkJggg==";

const NAVY = "#1F3A5F";
const MUTED = "#6B7280";

export type LwPaper = "letter" | "a4";

const LEDGER: Array<[string, string, string, number]> = [
    ["2026-07-03", "INV-4101", "Platform licence, Q3", 18400],
    ["2026-07-09", "INV-4102", "Onboarding workshop (2 days)", 4200],
    ["2026-07-15", "INV-4107", "Seat expansion, 40 seats", 9600],
    ["2026-07-22", "CR-0311", "Service credit, July incident", -1250],
    ["2026-07-30", "INV-4119", "Data residency add-on", 3100],
    ["2026-08-04", "INV-4124", "Support plan, premium tier", 5400],
    ["2026-08-11", "INV-4131", "API overage, July", 870],
    ["2026-08-18", "INV-4138", "Custom connector build", 12750],
    ["2026-08-25", "INV-4142", "Training: admin cohort", 2300],
    ["2026-08-29", "CR-0318", "Credit, duplicate seat billing", -480],
    ["2026-09-02", "INV-4150", "API overage, August", 1140],
    ["2026-09-08", "INV-4156", "Sandbox environment", 2600],
    ["2026-09-12", "INV-4161", "Seat expansion, 15 seats", 3600],
    ["2026-09-16", "INV-4165", "Audit log retention, 7 years", 1900],
    ["2026-09-19", "INV-4168", "Single sign-on module", 2750],
    ["2026-09-23", "INV-4172", "Training: analyst cohort", 2300],
    ["2026-09-26", "INV-4175", "Migration assistance", 6800],
    ["2026-09-29", "INV-4179", "API overage, September", 960],
    ["2026-09-30", "INV-4180", "Quarterly business review", 1500],
    ["2026-09-30", "CR-0322", "Goodwill credit, migration delay", -900],
    ["2026-10-01", "INV-4183", "Platform licence, Q4 (advance)", 18400],
    ["2026-10-03", "INV-4186", "Workflow automation pack", 4450],
];

const usd = (n: number) => (n < 0 ? "-" : "") + "$" + Math.abs(n).toLocaleString("en-US");

const cell = (text: string, opts: { align?: "left" | "right"; bold?: boolean; color?: string; shading?: string } = {}) => ({
    ...(opts.shading ? { shading: opts.shading } : {}),
    blocks: [
        {
            type: "paragraph" as const,
            spaceAfter: 0,
            ...(opts.align ? { align: opts.align } : {}),
            runs: [{ text, ...(opts.bold ? { bold: true } : {}), ...(opts.color ? { color: opts.color } : {}) }],
        },
    ],
});

function ledgerRows(): TableRow[] {
    const header: TableRow = {
        header: true,
        cells: [
            cell("Date", { bold: true, color: "#FFFFFF", shading: NAVY }),
            cell("Reference", { bold: true, color: "#FFFFFF", shading: NAVY }),
            cell("Description", { bold: true, color: "#FFFFFF", shading: NAVY }),
            cell("Amount", { bold: true, color: "#FFFFFF", shading: NAVY, align: "right" }),
        ],
    };
    const body: TableRow[] = LEDGER.map(([date, ref, desc, amount], i) => ({
        cells: [
            cell(date, { shading: i % 2 ? "#F3F4F6" : undefined }),
            cell(ref, { shading: i % 2 ? "#F3F4F6" : undefined }),
            cell(desc, { shading: i % 2 ? "#F3F4F6" : undefined }),
            cell(usd(amount), { align: "right", color: amount < 0 ? "#B91C1C" : undefined, shading: i % 2 ? "#F3F4F6" : undefined }),
        ],
    }));
    const total = LEDGER.reduce((s, r) => s + r[3], 0);
    const footer: TableRow = {
        cells: [cell(""), cell(""), cell("Balance due", { bold: true }), cell(usd(total), { bold: true, align: "right" })],
    };
    return [header, ...body, footer];
}

const BODY =
    "This statement covers every invoice and credit raised on the Northwind account between July and early October 2026. " +
    "Amounts are in US dollars and exclude sales tax, which is shown on each invoice. Credits reduce the balance on the date they were issued.";

/**
 * A two-page account statement (letter or A4): letterhead with a logo, running footer with
 * live page numbers, a 24-row table that splits and repeats its header row,
 * and two footnotes. Build it ONCE per paper size and keep the reference:
 * footnote numbering is keyed by run identity.
 */
export function lastWordSampleDoc(paper: LwPaper = "letter"): Doc {
    return {
        title: "Statement of account",
        page: {
            size: paper,
            margins: { top: 96, header: 30 },
            header: {
                blocks: [
                    {
                        type: "table",
                        widths: [1, 6],
                        borders: { bottom: { style: "single", width: 1, color: NAVY } },
                        rows: [
                            {
                                cells: [
                                    { valign: "center", blocks: [{ type: "image", src: LW_LOGO_PNG, widthPx: 40, heightPx: 40, alt: "Northwind logo" }] },
                                    {
                                        valign: "center",
                                        blocks: [
                                            { type: "paragraph", spaceAfter: 0, runs: [{ text: "Northwind Analytics", bold: true, size: 13, color: NAVY }] },
                                            { type: "paragraph", spaceAfter: 0, runs: [{ text: "1 Example Plaza, Springfield  |  billing@example.com", size: 8, color: MUTED }] },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
            footer: { left: "Statement NW-2026-Q3", center: "Confidential", right: "Page {page} of {pages}" },
        },
        blocks: [
            { type: "heading", level: 1, runs: [{ text: "Statement of account", color: NAVY }] },
            {
                type: "paragraph",
                runs: [
                    { text: "Prepared for " },
                    { text: "Contoso Retail Group", bold: true },
                    { text: ", account 00-4471, on 3 October 2026." },
                ],
            },
            {
                type: "paragraph",
                runs: [
                    { text: BODY + " The balance below is due within 30 days" },
                    { text: "", footnote: { blocks: [{ type: "paragraph", runs: [{ text: "Net 30 from the statement date. Late balances accrue 1% a month.", size: 8 }] }] } },
                    { text: "." },
                ],
            },
            {
                type: "paragraph",
                shading: "#EAF1FB",
                indentLeft: 12,
                borders: { left: { style: "single", width: 3, color: NAVY } },
                runs: [{ text: "Action: ", bold: true }, { text: "remit by 2 November 2026, quoting NW-2026-Q3." }],
            },
            { type: "heading", level: 2, runs: [{ text: "Transactions" }] },
            { type: "table", widths: [2, 2, 5, 2], rows: ledgerRows() },
            { type: "heading", level: 2, runs: [{ text: "Notes" }] },
            {
                type: "paragraph",
                runs: [
                    { text: "Service credits were applied under the availability commitment in the master agreement" },
                    { text: "", footnote: { blocks: [{ type: "paragraph", runs: [{ text: "Master Services Agreement, schedule 2, section 4.1.", size: 8 }] }] } },
                    { text: ". " + BODY },
                ],
            },
            {
                type: "list",
                items: [
                    { runs: [{ text: "Questions about a line: reply to billing@example.com with the reference." }] },
                    { runs: [{ text: "Pay by bank transfer; details are on each invoice." }] },
                    { runs: [{ text: "The Q4 licence is billed in advance and is not yet due." }] },
                ],
            },
            { type: "paragraph", runs: [{ text: BODY + " " + BODY }] },
        ],
    };
}

/** One page, for the grid tile: letterhead, footer, a short table, no split. */
export function lastWordTileDoc(): Doc {
    const full = lastWordSampleDoc("letter");
    return {
        ...full,
        blocks: [
            full.blocks[0],
            full.blocks[1],
            { type: "table", widths: [2, 2, 5, 2], rows: ledgerRows().slice(0, 6) },
        ],
    };
}
