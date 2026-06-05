export interface SummaryRow {
  label: string;
  value: string;
}

export function generateAndDownloadReport(
  title: string,
  filename: string,
  tableHeaders: string[],
  tableRows: string[][],
  summaryRows?: SummaryRow[],
): void {
  const now = new Date();
  const generatedAt = now.toLocaleString("en-IN", {
    dateStyle: "full",
    timeStyle: "medium",
  });

  const summaryHtml = summaryRows?.length
    ? `<div class="summary">${summaryRows.map((r) => `<div class="summary-row"><span class="summary-label">${r.label}:</span><span class="summary-value">${r.value}</span></div>`).join("")}</div>`
    : "";

  const tableHtml = `<table><thead><tr>${tableHeaders.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${tableRows.map((row, i) => `<tr class="${i % 2 === 0 ? "even" : "odd"}">${row.map((cell) => `<td>${cell ?? ""}</td>`).join("")}</tr>`).join("")}</tbody></table>`;

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${title} — AssignServiceHub</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#1e293b;background:#fff;padding:32px}.header{border-bottom:2px solid #1d4ed8;padding-bottom:16px;margin-bottom:20px}.brand{font-size:22px;font-weight:700;color:#1d4ed8;letter-spacing:-.5px}.brand span{color:#64748b;font-weight:400;font-size:14px;margin-left:8px}.report-title{font-size:18px;font-weight:600;color:#0f172a;margin:6px 0 4px}.generated{font-size:11px;color:#64748b}.summary{background:#f0f7ff;border:1px solid #bfdbfe;border-radius:6px;padding:12px 16px;margin-bottom:20px;display:flex;flex-wrap:wrap;gap:16px}.summary-row{display:flex;flex-direction:column;gap:2px}.summary-label{font-size:11px;color:#64748b;font-weight:500;text-transform:uppercase;letter-spacing:.4px}.summary-value{font-size:15px;font-weight:700;color:#1d4ed8}table{width:100%;border-collapse:collapse;margin-bottom:24px}th{background:#1d4ed8;color:#fff;font-weight:600;font-size:12px;padding:10px 12px;text-align:left}td{padding:8px 12px;border:1px solid #e2e8f0;font-size:12px;vertical-align:top}tr.even td{background:#fff}tr.odd td{background:#f0f7ff}.footer{border-top:1px solid #e2e8f0;padding-top:12px;margin-top:8px;display:flex;justify-content:space-between;font-size:11px;color:#94a3b8}@media print{body{padding:16px}.header{page-break-after:avoid}table{page-break-inside:auto}tr{page-break-inside:avoid}}</style></head><body><div class="header"><div class="brand">AssignServiceHub <span>Assignment Management Platform</span></div><div class="report-title">${title}</div><div class="generated">Generated on: ${generatedAt}</div></div>${summaryHtml}${tableHtml}<div class="footer"><span>AssignServiceHub &mdash; Confidential</span><span>Generated: ${generatedAt}</span></div></body></html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}_${now.toISOString().slice(0, 10)}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
