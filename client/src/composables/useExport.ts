// composables/useExport.ts — Reusable export to Excel / PDF / JSON / CSV / Image
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

  /**
   * Capture a DOM element as a PNG image and trigger download.
   * Falls back to a styled canvas table if html2canvas is unavailable.
   */
  async function exportImage(
    el: HTMLElement | null,
    filename: string,
    title = ''
  ) {
    if (!el) return

    try {
      const { default: html2canvas } = await import('html2canvas')

      // Temporarily force light background so the screenshot is clean
      const prevBg = el.style.background
      el.style.background = getComputedStyle(document.documentElement)
        .getPropertyValue('--page-bg') || '#ffffff'

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
      })

      el.style.background = prevBg

      // Stamp a title bar on top
      if (title) {
        const out = document.createElement('canvas')
        const headerH = 48
        out.width  = canvas.width
        out.height = canvas.height + headerH * 2
        const ctx = out.getContext('2d')!
        ctx.fillStyle = '#f97316'
        ctx.fillRect(0, 0, out.width, headerH * 2)
        ctx.fillStyle = '#ffffff'
        ctx.font = `bold ${headerH * 0.65}px sans-serif`
        ctx.textBaseline = 'middle'
        ctx.fillText(title, 24 * 2, headerH)
        ctx.font = `${headerH * 0.35}px sans-serif`
        ctx.fillStyle = 'rgba(255,255,255,0.75)'
        ctx.fillText(`Exported ${new Date().toLocaleString()}`, 24 * 2, headerH * 1.6)
        ctx.drawImage(canvas, 0, headerH * 2)
        triggerDownload(await canvasToBlob(out), filename + '.png')
      } else {
        triggerDownload(await canvasToBlob(canvas), filename + '.png')
      }
    } catch (err) {
      console.error('html2canvas failed:', err)
      alert('Image export failed. Make sure html2canvas is installed:\nnpm install html2canvas')
    }
  }

  function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/png')
    })
  }

  function triggerDownload(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = name; a.click()
    URL.revokeObjectURL(url)
  }

  return { exportJSON, exportCSV, exportExcel, exportPDF, exportImage }
}
