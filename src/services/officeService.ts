/* eslint-disable @typescript-eslint/no-explicit-any */

export async function getSelectionText(): Promise<string | null> {
  const host = Office.context.host;
  try {
    if (host === Office.HostType.Excel) {
      return await getExcelSelection();
    } else if (host === Office.HostType.Word) {
      return await getWordSelection();
    } else if (host === Office.HostType.PowerPoint) {
      return await getPPTSelection();
    }
  } catch {
    // no selection or not supported
  }
  return null;
}

async function getExcelSelection(): Promise<string | null> {
  return Excel.run(async (ctx) => {
    const range = ctx.workbook.getSelectedRange();
    range.load("values,address");
    await ctx.sync();
    const flat = (range.values as any[][]).flat().filter(Boolean);
    if (flat.length === 0) return null;
    return `[Excel Range ${range.address}]\n${flat.join(", ")}`;
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
  if (host === Office.HostType.Excel) {
    await applyToExcel(text);
  } else if (host === Office.HostType.Word) {
    await applyToWord(text);
  } else if (host === Office.HostType.PowerPoint) {
    await applyToPPT(text);
  }
}

async function applyToExcel(text: string): Promise<void> {
  await Excel.run(async (ctx) => {
    const range = ctx.workbook.getSelectedRange();
    range.load("rowCount,columnCount");
    await ctx.sync();
    if (range.rowCount === 1 && range.columnCount === 1) {
      range.values = [[text]];
    } else {
      const lines = text.split("\n").filter(Boolean);
      const values = lines.map((line) => [line]);
      const target = range.worksheet.getRangeByIndexes(
        (range as any).rowIndex,
        (range as any).columnIndex,
        lines.length,
        1
      );
      target.values = values;
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
