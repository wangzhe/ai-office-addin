/* eslint-disable @typescript-eslint/no-explicit-any */

export function getHostType(): string {
  const host = Office.context.host;
  if (host === Office.HostType.Excel) return "Excel";
  if (host === Office.HostType.Word) return "Word";
  if (host === Office.HostType.PowerPoint) return "PowerPoint";
  return "Office";
}

export async function getSelectionText(): Promise<string | null> {
  const host = Office.context.host;
  try {
    if (host === Office.HostType.Excel) return await getExcelContext();
    if (host === Office.HostType.Word) return await getWordSelection();
    if (host === Office.HostType.PowerPoint) return await getPPTSelection();
  } catch {
    // no selection or not supported
  }
  return null;
}

async function getExcelContext(): Promise<string | null> {
  return Excel.run(async (ctx) => {
    const sheet = ctx.workbook.worksheets.getActiveWorksheet();
    sheet.load("name");

    const selection = ctx.workbook.getSelectedRange();
    selection.load("values,formulas,address,rowCount,columnCount,rowIndex,columnIndex");

    let usedRange: Excel.Range | null = null;
    try {
      usedRange = sheet.getUsedRange();
      usedRange.load("values,rowCount,columnCount");
    } catch {
      // empty sheet
    }

    await ctx.sync();

    const lines: string[] = [];
    lines.push(`[工作表: ${sheet.name}]`);

    if (usedRange) {
      lines.push(`[数据范围: ${usedRange.rowCount} 行 × ${usedRange.columnCount} 列]`);
      const headers = (usedRange.values as any[][])[0]?.filter(Boolean) ?? [];
      if (headers.length > 0) {
        lines.push(`[列标题: ${headers.join(" | ")}]`);
      }
    }

    const selValues = selection.values as any[][];
    const hasData = selValues.flat().some((v) => v !== "" && v !== null && v !== undefined);

    if (hasData) {
      lines.push(`[已选中: ${selection.address}, ${selection.rowCount}行 × ${selection.columnCount}列]`);
      // Include up to 50 rows to avoid huge context
      const preview = selValues.slice(0, 50);
      lines.push(preview.map((row) => row.join("\t")).join("\n"));
    } else {
      lines.push(`[当前选中: ${selection.address}（空）]`);
    }

    return lines.join("\n");
  });
}

async function getWordSelection(): Promise<string | null> {
  return Word.run(async (ctx) => {
    const sel = ctx.document.getSelection();
    sel.load("text");
    await ctx.sync();
    return sel.text?.trim() || null;
  });
}

async function getPPTSelection(): Promise<string | null> {
  return new Promise((resolve) => {
    Office.context.document.getSelectedDataAsync(
      Office.CoercionType.Text,
      (result) => {
        if (result.status === Office.AsyncResultStatus.Succeeded) {
          resolve((result.value as string)?.trim() || null);
        } else {
          resolve(null);
        }
      }
    );
  });
}

export async function applyToDocument(text: string): Promise<void> {
  const host = Office.context.host;
  if (host === Office.HostType.Excel) await applyToExcel(text);
  else if (host === Office.HostType.Word) await applyToWord(text);
  else if (host === Office.HostType.PowerPoint) await applyToPPT(text);
}

async function applyToExcel(text: string): Promise<void> {
  await Excel.run(async (ctx) => {
    const range = ctx.workbook.getSelectedRange();
    range.load("rowCount,columnCount,rowIndex,columnIndex");
    await ctx.sync();

    const trimmed = text.trim();

    // Single formula → write to active cell as formula
    if (trimmed.startsWith("=")) {
      range.formulas = [[trimmed]];
      await ctx.sync();
      return;
    }

    // Parse tabular data: lines with tabs or commas → multi-cell grid
    const rows = trimmed
      .split("\n")
      .map((line) => line.split(/\t|,(?=(?:[^"]*"[^"]*")*[^"]*$)/))
      .filter((r) => r.some((c) => c.trim() !== ""));

    if (rows.length > 1 || (rows.length === 1 && rows[0].length > 1)) {
      const maxCols = Math.max(...rows.map((r) => r.length));
      const normalized = rows.map((r) => {
        const padded = [...r];
        while (padded.length < maxCols) padded.push("");
        return padded.map((c) => c.replace(/^"|"$/g, "").trim());
      });
      const target = range.worksheet.getRangeByIndexes(
        range.rowIndex,
        range.columnIndex,
        normalized.length,
        maxCols
      );
      target.values = normalized;
    } else {
      // Single value or multi-line single column
      const lines = trimmed.split("\n").filter((l) => l.trim() !== "");
      if (lines.length > 1) {
        const target = range.worksheet.getRangeByIndexes(
          range.rowIndex,
          range.columnIndex,
          lines.length,
          1
        );
        target.values = lines.map((l) => [l.trim()]);
      } else {
        range.values = [[trimmed]];
      }
    }

    await ctx.sync();
  });
}

async function applyToWord(text: string): Promise<void> {
  await Word.run(async (ctx) => {
    const sel = ctx.document.getSelection();
    sel.insertText(text, Word.InsertLocation.replace);
    await ctx.sync();
  });
}

async function applyToPPT(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    Office.context.document.setSelectedDataAsync(
      text,
      { coercionType: Office.CoercionType.Text },
      (result) => {
        if (result.status === Office.AsyncResultStatus.Failed) {
          reject(new Error(result.error.message));
        } else {
          resolve();
        }
      }
    );
  });
}
