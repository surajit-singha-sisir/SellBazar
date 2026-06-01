// composables/useExport.ts — Reusable export to Excel / PDF / JSON / CSV
import * as XLSX from 'xlsx'

export function useExport() {
  function exportJSON(data: any[], filename: string) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    triggerDownload(blob, filename + '.json')
  }

  function exportCSV(data: any[], filename: string) {
    if (!data.length) return
    const keys = Object.keys(data[0])
    const rows = [keys.join(','), ...data.map(row =>
      keys.map(k => {
        const v = row[k]
        const s = Array.isArray(v) ? v.join('|') : String(v ?? '')
        return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s
      }).join(',')
    )]
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    triggerDownload(blob, filename + '.csv')
  }

  function exportExcel(data: any[], filename: string, sheetName = 'Sheet1') {
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
    XLSX.writeFile(wb, filename + '.xlsx')
  }

  async function exportPDF(
    columns: string[],
    rows: (string | number)[][],
    filename: string,
    title = ''
  ) {
    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
    if (title) {
      doc.setFontSize(14)
      doc.text(title, 40, 36)
    }
    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: title ? 52 : 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [249, 115, 22] },
    })
    doc.save(filename + '.pdf')
  }

  function triggerDownload(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = name; a.click()
    URL.revokeObjectURL(url)
  }

  return { exportJSON, exportCSV, exportExcel, exportPDF }
}
