import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import Papa from "papaparse"
import * as XLSX from "xlsx"

export type ExportFormat = "xlsx" | "csv" | "pdf"

interface ExportColumn<T> {
  header: string
  key: keyof T | ((row: T) => string | number | null | undefined)
}

interface ExportConfig<T> {
  filename: string
  columns: ExportColumn<T>[]
  data: T[]
  format: ExportFormat
}

export async function exportReport<T>({
  filename,
  columns,
  data,
  format,
}: ExportConfig<T>) {
  const exportData = data.map((row) => {
    const mappedRow: Record<string, string | number | null | undefined> = {}
    for (const col of columns) {
      if (typeof col.key === "function") {
        mappedRow[col.header] = col.key(row)
      } else {
        mappedRow[col.header] = row[col.key] as
          | string
          | number
          | null
          | undefined
      }
    }
    return mappedRow
  })

  await Promise.resolve()

  switch (format) {
    case "csv":
      exportToCsv(exportData, filename)
      break
    case "xlsx":
      exportToExcel(exportData, filename)
      break
    case "pdf":
      exportToPdf(exportData, filename)
      break
    default:
      break
  }
}

function exportToCsv(
  data: Record<string, string | number | null | undefined>[],
  filename: string
) {
  const csv = Papa.unparse(data, {
    quotes: true,
    delimiter: ";",
  })

  const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}.csv`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function exportToExcel(
  data: Record<string, string | number | null | undefined>[],
  filename: string
) {
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Raport")

  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

function exportToPdf(
  data: Record<string, string | number | null | undefined>[],
  filename: string
) {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  })

  doc.setFontSize(16)
  const title = filename.replace(/_/g, " ").toUpperCase()
  doc.text(title, 14, 15)

  doc.setFontSize(10)
  doc.text(`Data wygenerowania: ${new Date().toLocaleString("pl-PL")}`, 14, 22)

  if (data.length > 0) {
    const headers = [Object.keys(data[0])]
    const rows = data.map((obj) => Object.values(obj).map((v) => v ?? ""))

    autoTable(doc, {
      head: headers,
      body: rows,
      startY: 30,
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: 255,
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
    })
  } else {
    doc.text("Brak danych do wyświetlenia", 14, 35)
  }

  doc.save(`${filename}.pdf`)
}
