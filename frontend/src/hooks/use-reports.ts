import {
  apiFetch,
  type InferApiInput,
  type InferApiOutput,
} from "@/lib/fetcher"
import {
  ExpiryReportSchema,
  InventoryStockReportSchema,
  type ReportFileFormat,
  TemperatureAlertReportSchema,
} from "@/lib/schemas"
import { useApiMutation } from "./use-api-mutation"

export type ReportFormat = "csv" | "pdf" | "xlsx"

const REPORT_FORMAT_TO_API_FORMAT: Record<ReportFormat, ReportFileFormat> = {
  csv: "CSV",
  pdf: "PDF",
  xlsx: "EXCEL",
}

const mapToApiReportFormat = (format: ReportFormat): ReportFileFormat =>
  REPORT_FORMAT_TO_API_FORMAT[format]

export const downloadReportBlob = (blob: Blob, filename: string): void => {
  const blobUrl = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = blobUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(blobUrl)
}

export type TemperatureAlertReportInput = InferApiInput<
  typeof TemperatureAlertReportSchema,
  "POST"
>
export type InventoryStockReportInput = InferApiInput<
  typeof InventoryStockReportSchema,
  "POST"
>
export type ExpiryReportInput = InferApiInput<typeof ExpiryReportSchema, "POST">

export type TemperatureAlertReportFile = InferApiOutput<
  typeof TemperatureAlertReportSchema,
  "POST"
>
export type InventoryStockReportFile = InferApiOutput<
  typeof InventoryStockReportSchema,
  "POST"
>
export type ExpiryReportFile = InferApiOutput<typeof ExpiryReportSchema, "POST">

export function useGenerateTemperatureAlertReport() {
  return useApiMutation({
    mutationFn: (payload: TemperatureAlertReportInput) =>
      apiFetch(
        "/api/reports/temperature-alerts",
        TemperatureAlertReportSchema,
        {
          method: "POST",
          body: payload,
          responseType: payload.sendEmail ? "json" : "blob",
        }
      ),
  })
}

export function useGenerateInventoryStockReport() {
  return useApiMutation({
    mutationFn: (payload: InventoryStockReportInput) =>
      apiFetch("/api/reports/inventory-stock", InventoryStockReportSchema, {
        method: "POST",
        body: payload,
        responseType: payload.sendEmail ? "json" : "blob",
      }),
  })
}

export function useGenerateExpiryReport() {
  return useApiMutation({
    mutationFn: (payload: ExpiryReportInput) =>
      apiFetch("/api/reports/expiry", ExpiryReportSchema, {
        method: "POST",
        body: payload,
        responseType: payload.sendEmail ? "json" : "blob",
      }),
  })
}

export { mapToApiReportFormat }
