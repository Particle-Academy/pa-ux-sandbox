import { useState } from "react";
import { Spreadsheet, createEmptySheet } from "@particle-academy/fancy-sheets";
import type { WorkbookData, SheetData } from "@particle-academy/fancy-sheets";
import { DemoSection } from "../components/DemoSection";

// ---------------------------------------------------------------------------
// Sheet 1: Product Catalog — basic formulas, formatting, totals
// ---------------------------------------------------------------------------

function productsSheet(): SheetData {
  const s = createEmptySheet("products", "Products");
  s.frozenRows = 1; // Freeze header row
  s.cells = {
    A1: { value: "Product", format: { bold: true } },
    B1: { value: "Category", format: { bold: true } },
    C1: { value: "Price", format: { bold: true } },
    D1: { value: "Qty", format: { bold: true } },
    E1: { value: "Total", format: { bold: true } },
    A2: { value: "Widget Pro" },     B2: { value: "Hardware" },     C2: { value: 29.99 },  D2: { value: 100 }, E2: { value: null, formula: "C2*D2" },
    A3: { value: "Gadget X" },       B3: { value: "Electronics" },  C3: { value: 49.99 },  D3: { value: 50 },  E3: { value: null, formula: "C3*D3" },
    A4: { value: "Doohickey" },      B4: { value: "Hardware" },     C4: { value: 9.99 },   D4: { value: 200 }, E4: { value: null, formula: "C4*D4" },
    A5: { value: "Thingamajig" },    B5: { value: "Accessories" },  C5: { value: 14.99 },  D5: { value: 75 },  E5: { value: null, formula: "C5*D5" },
    A6: { value: "Gizmo Lite" },     B6: { value: "Electronics" },  C6: { value: 19.99 },  D6: { value: 150 }, E6: { value: null, formula: "C6*D6" },
    A7: { value: "Sprocket XL" },    B7: { value: "Hardware" },     C7: { value: 5.49 },   D7: { value: 500 }, E7: { value: null, formula: "C7*D7" },
    A9:  { value: "Summary", format: { bold: true } },
    A10: { value: "Total Revenue" }, E10: { value: null, formula: "SUM(E2:E7)" },
    A11: { value: "Avg Price" },     E11: { value: null, formula: "AVERAGE(C2:C7)" },
    A12: { value: "Total Units" },   E12: { value: null, formula: "SUM(D2:D7)" },
    A13: { value: "Product Count" }, E13: { value: null, formula: "COUNT(C2:C7)" },
    A14: { value: "Min Price" },     E14: { value: null, formula: "MIN(C2:C7)" },
    A15: { value: "Max Price" },     E15: { value: null, formula: "MAX(C2:C7)" },
    A16: { value: "Median Price" },  E16: { value: null, formula: "MEDIAN(C2:C7)" },
  };
  return s;
}

// ---------------------------------------------------------------------------
// Sheet 2: Conditional Formulas — SUMIF, COUNTIF, AVERAGEIF, etc.
// ---------------------------------------------------------------------------

function conditionalsSheet(): SheetData {
  const s = createEmptySheet("conditionals", "Conditionals");
  s.cells = {
    A1: { value: "Conditional Formulas", format: { bold: true } },
    A3: { value: "Region", format: { bold: true } },
    B3: { value: "Sales", format: { bold: true } },
    C3: { value: "Status", format: { bold: true } },
    A4: { value: "North" }, B4: { value: 1200 }, C4: { value: "Active" },
    A5: { value: "South" }, B5: { value: 850 },  C5: { value: "Active" },
    A6: { value: "East" },  B6: { value: 2100 }, C6: { value: "Inactive" },
    A7: { value: "West" },  B7: { value: 950 },  C7: { value: "Active" },
    A8: { value: "North" }, B8: { value: 1800 }, C8: { value: "Active" },
    A9: { value: "South" }, B9: { value: 600 },  C9: { value: "Inactive" },
    A10: { value: "East" }, B10: { value: 1500 }, C10: { value: "Active" },
    A11: { value: "West" }, B11: { value: 700 },  C11: { value: "Active" },
    E3: { value: "Analysis", format: { bold: true } },
    E4: { value: "North total sales:" },       F4: { value: null, formula: 'SUMIF(A4:A11,"North",B4:B11)' },
    E5: { value: "Active regions count:" },    F5: { value: null, formula: 'COUNTIF(C4:C11,"Active")' },
    E6: { value: "Avg sales (Active):" },      F6: { value: null, formula: 'AVERAGEIF(C4:C11,"Active",B4:B11)' },
    E7: { value: "Sales > 1000 count:" },      F7: { value: null, formula: 'COUNTIF(B4:B11,">1000")' },
    E8: { value: "Sum sales > 1000:" },        F8: { value: null, formula: 'SUMIF(B4:B11,">1000")' },
    E9: { value: "Min (Active):" },            F9: { value: null, formula: 'MINIFS(B4:B11,C4:C11,"Active")' },
    E10: { value: "Max (Active):" },           F10: { value: null, formula: 'MAXIFS(B4:B11,C4:C11,"Active")' },
  };
  return s;
}

// ---------------------------------------------------------------------------
// Sheet 3: Text Functions — string manipulation showcase
// ---------------------------------------------------------------------------

function textSheet(): SheetData {
  const s = createEmptySheet("text", "Text Functions");
  s.cells = {
    A1: { value: "Text Function Showcase", format: { bold: true } },
    A3: { value: "Input", format: { bold: true } },
    B3: { value: "Formula", format: { bold: true } },
    C3: { value: "Result", format: { bold: true } },
    A4: { value: "hello world" },     B4: { value: '=UPPER(A4)', format: { italic: true } },   C4: { value: null, formula: "UPPER(A4)" },
    A5: { value: "HELLO WORLD" },     B5: { value: '=LOWER(A5)', format: { italic: true } },   C5: { value: null, formula: "LOWER(A5)" },
    A6: { value: "hello world" },     B6: { value: '=PROPER(A6)', format: { italic: true } },  C6: { value: null, formula: "PROPER(A6)" },
    A7: { value: "hello world" },     B7: { value: '=LEN(A7)', format: { italic: true } },     C7: { value: null, formula: "LEN(A7)" },
    A8: { value: "hello world" },     B8: { value: '=LEFT(A8,5)', format: { italic: true } },  C8: { value: null, formula: "LEFT(A8,5)" },
    A9: { value: "hello world" },     B9: { value: '=RIGHT(A9,5)', format: { italic: true } }, C9: { value: null, formula: "RIGHT(A9,5)" },
    A10: { value: "hello world" },    B10: { value: '=MID(A10,7,5)', format: { italic: true } }, C10: { value: null, formula: "MID(A10,7,5)" },
    A11: { value: "hello world" },    B11: { value: '=FIND("world",A11)', format: { italic: true } }, C11: { value: null, formula: 'FIND("world",A11)' },
    A12: { value: "foo-bar-baz" },    B12: { value: '=SUBSTITUTE(A12,"-","_")', format: { italic: true } }, C12: { value: null, formula: 'SUBSTITUTE(A12,"-","_")' },
    A13: { value: "*" },              B13: { value: '=REPT(A13,10)', format: { italic: true } },  C13: { value: null, formula: "REPT(A13,10)" },
    A14: { value: "42" },             B14: { value: '=VALUE(A14)*2', format: { italic: true } },  C14: { value: null, formula: "VALUE(A14)*2" },
    A15: { value: 65 },               B15: { value: '=CHAR(A15)', format: { italic: true } },     C15: { value: null, formula: "CHAR(A15)" },
    A16: { value: "A" },              B16: { value: '=CODE(A16)', format: { italic: true } },     C16: { value: null, formula: "CODE(A16)" },
    A18: { value: "String Building", format: { bold: true } },
    A19: { value: "John" },  B19: { value: "Doe" },
    C19: { value: null, formula: 'CONCAT(A19," ",B19)' },
    A20: { value: "Full name:" },
    C20: { value: null, formula: 'PROPER(CONCAT(A19," ",B19))' },
  };
  return s;
}

// ---------------------------------------------------------------------------
// Sheet 4: Math & Logic — advanced math, conditional logic
// ---------------------------------------------------------------------------

function mathSheet(): SheetData {
  const s = createEmptySheet("math", "Math & Logic");
  s.cells = {
    A1: { value: "Math Functions", format: { bold: true } },
    A3: { value: "Function", format: { bold: true } },   B3: { value: "Result", format: { bold: true } },
    A4: { value: "=SQRT(144)" },      B4: { value: null, formula: "SQRT(144)" },
    A5: { value: "=POWER(2,10)" },    B5: { value: null, formula: "POWER(2,10)" },
    A6: { value: "=MOD(17,5)" },      B6: { value: null, formula: "MOD(17,5)" },
    A7: { value: "=FACT(6)" },        B7: { value: null, formula: "FACT(6)" },
    A8: { value: "=PI()" },           B8: { value: null, formula: "PI()" },
    A9: { value: "=ROUND(PI(),4)" },  B9: { value: null, formula: "ROUND(PI(),4)" },
    A10: { value: "=EXP(1)" },       B10: { value: null, formula: "EXP(1)" },
    A11: { value: "=LN(EXP(1))" },   B11: { value: null, formula: "LN(EXP(1))" },
    A12: { value: "=LOG(1000)" },     B12: { value: null, formula: "LOG(1000)" },
    A13: { value: "=FLOOR(7.8,1)" },  B13: { value: null, formula: "FLOOR(7.8,1)" },
    A14: { value: "=CEILING(7.2,1)" },B14: { value: null, formula: "CEILING(7.2,1)" },
    A15: { value: "=SIGN(-42)" },     B15: { value: null, formula: "SIGN(-42)" },
    A16: { value: "=INT(9.99)" },     B16: { value: null, formula: "INT(9.99)" },
    D1: { value: "Logic Functions", format: { bold: true } },
    D3: { value: "Formula", format: { bold: true } },     E3: { value: "Result", format: { bold: true } },
    D4: { value: '=IF(10>5,"Yes","No")' },    E4: { value: null, formula: 'IF(10>5,"Yes","No")' },
    D5: { value: "=AND(TRUE,TRUE)" },          E5: { value: null, formula: "AND(TRUE,TRUE)" },
    D6: { value: "=OR(FALSE,TRUE)" },          E6: { value: null, formula: "OR(FALSE,TRUE)" },
    D7: { value: "=NOT(FALSE)" },              E7: { value: null, formula: "NOT(FALSE)" },
    D8: { value: "=IFERROR(1/0,0)" },         E8: { value: null, formula: "IFERROR(1/0,0)" },
    D9: { value: '=CHOOSE(2,"a","b","c")' },  E9: { value: null, formula: 'CHOOSE(2,"a","b","c")' },
    D10: { value: '=SWITCH(1,1,"One",2,"Two")' }, E10: { value: null, formula: 'SWITCH(1,1,"One",2,"Two")' },
    D12: { value: "Info Functions", format: { bold: true } },
    D13: { value: "=ISBLANK(A20)" },  E13: { value: null, formula: "ISBLANK(A20)" },
    D14: { value: "=ISNUMBER(42)" },  E14: { value: null, formula: "ISNUMBER(42)" },
    D15: { value: '=ISTEXT("hi")' },  E15: { value: null, formula: 'ISTEXT("hi")' },
    D16: { value: "=TYPE(42)" },      E16: { value: null, formula: "TYPE(42)" },
  };
  return s;
}

// ---------------------------------------------------------------------------
// Sheet 5: Date & Time — date functions showcase
// ---------------------------------------------------------------------------

function dateSheet(): SheetData {
  const s = createEmptySheet("dates", "Dates");
  s.cells = {
    A1: { value: "Date & Time Functions", format: { bold: true } },
    A3: { value: "Formula", format: { bold: true } },          B3: { value: "Result", format: { bold: true } },
    A4: { value: "=TODAY()" },          B4: { value: null, formula: "TODAY()", format: { displayFormat: "date" } },
    A5: { value: "=NOW()" },           B5: { value: null, formula: "NOW()", format: { displayFormat: "datetime" } },
    A6: { value: "=DATE(2024,6,15)" }, B6: { value: null, formula: "DATE(2024,6,15)", format: { displayFormat: "date" } },
    A7: { value: "=YEAR(DATE(2024,6,15))" },  B7: { value: null, formula: "YEAR(DATE(2024,6,15))" },
    A8: { value: "=MONTH(DATE(2024,6,15))" }, B8: { value: null, formula: "MONTH(DATE(2024,6,15))" },
    A9: { value: "=DAY(DATE(2024,6,15))" },   B9: { value: null, formula: "DAY(DATE(2024,6,15))" },
    A10: { value: "=WEEKDAY(DATE(2024,6,15))" }, B10: { value: null, formula: "WEEKDAY(DATE(2024,6,15))" },
    A12: { value: "Date Math", format: { bold: true } },
    A13: { value: "Start date" },    B13: { value: null, formula: "DATE(2024,1,1)", format: { displayFormat: "date" } },
    A14: { value: "End date" },      B14: { value: null, formula: "DATE(2024,12,31)", format: { displayFormat: "date" } },
    A15: { value: "Days between" },  B15: { value: null, formula: 'DATEDIF(B13,B14,"D")' },
    A16: { value: "Months between" },B16: { value: null, formula: 'DATEDIF(B13,B14,"M")' },
    A17: { value: "+3 months" },     B17: { value: null, formula: "EDATE(B13,3)", format: { displayFormat: "date" } },
  };
  return s;
}

// ---------------------------------------------------------------------------
// Build the workbook
// ---------------------------------------------------------------------------

function createSampleWorkbook(): WorkbookData {
  return {
    sheets: [
      productsSheet(),
      conditionalsSheet(),
      textSheet(),
      mathSheet(),
      dateSheet(),
    ],
    activeSheetId: "products",
  };
}

// ---------------------------------------------------------------------------
// Demo page
// ---------------------------------------------------------------------------

export function SpreadsheetDemo() {
  const [data, setData] = useState(createSampleWorkbook);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Spreadsheet</h1>

      <DemoSection
        title="Full Spreadsheet"
        description="Multi-sheet workbook with 80+ formula functions. Switch tabs to see: Products (math aggregates), Conditionals (SUMIF/COUNTIF), Text Functions (string manipulation), Math & Logic (advanced formulas), and Dates (date math). Click cells to select, double-click or type to edit, use arrow keys to navigate."
        code={`<Spreadsheet data={workbook} onChange={setWorkbook}>
  <Spreadsheet.Toolbar />
  <Spreadsheet.Grid />
  <Spreadsheet.SheetTabs />
</Spreadsheet>`}
      >
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700" style={{ height: 550 }}>
          <Spreadsheet
            data={data}
            onChange={setData}
            columnCount={10}
            rowCount={25}
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
