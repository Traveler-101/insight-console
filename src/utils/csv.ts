/** 极简 CSV 导出：处理逗号、引号、换行与 BOM，保证 Excel 打开中文不乱码 */
export function toCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns: { key: keyof T & string; label: string }[],
): string {
  const escape = (raw: unknown) => {
    const text = raw == null ? '' : String(raw);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const header = columns.map((column) => escape(column.label)).join(',');
  const body = rows.map((row) => columns.map((column) => escape(row[column.key])).join(','));
  return [header, ...body].join('\r\n');
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // 释放 blob，避免长时间占用内存
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
