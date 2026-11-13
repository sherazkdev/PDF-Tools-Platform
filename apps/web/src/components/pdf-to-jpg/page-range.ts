const TOKEN = /^\s*(\d+)(?:\s*-\s*(\d+))?\s*$/;

export function estimateSelectedPageCount(
  expression: string,
  pageCount: number,
): { ok: true; count: number } | { ok: false; message: string } {
  if (!expression.trim()) {
    return { ok: false, message: "Enter a page range, e.g. 1-3, 5, 8." };
  }
  const indexes: number[] = [];
  const parts = expression.split(",").map((p) => p.trim()).filter(Boolean);
  for (const part of parts) {
    const match = TOKEN.exec(part);
    if (!match) {
      return { ok: false, message: `Invalid page syntax: "${part}".` };
    }
    const start = Number(match[1]);
    const end = Number(match[2] ?? match[1]);
    if (start < 1 || end < 1) {
      return { ok: false, message: "Page numbers must be 1 or greater." };
    }
    if (start > end) {
      return { ok: false, message: `Reversed range "${part}" is not allowed.` };
    }
    if (end > pageCount) {
      return { ok: false, message: `Page ${end} is outside the document (${pageCount} pages).` };
    }
    for (let human = start; human <= end; human++) {
      const idx = human - 1;
      if (!indexes.includes(idx)) indexes.push(idx);
    }
  }
  if (!indexes.length) {
    return { ok: false, message: "No pages selected." };
  }
  return { ok: true, count: indexes.length };
}
