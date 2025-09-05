// utils/csv.ts
export function toCSV<T extends Record<string, any>>(rows: T[], headers?: (keyof T)[]) {
  if (!rows.length) return '';
  const cols = headers ?? (Object.keys(rows[0]) as (keyof T)[]);
  const esc = (v: any) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = cols.map((c) => esc(String(c))).join(',');
  const body = rows.map((r) => cols.map((c) => esc(r[c])).join(',')).join('\n');
  return head + '\n' + body;
}
