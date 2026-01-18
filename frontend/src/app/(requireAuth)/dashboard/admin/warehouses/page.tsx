"use client"

import type z from "zod"
import { CsvImporter } from "@/components/admin-panel/warehouses/csv/csv-importer"
import { Separator } from "@/components/ui/separator"
import type {
  CsvItemRowSchema,
  CsvRackRowSchema,
} from "@/lib/schemas/admin-schemas"

// biome-ignore lint:unused
type CsvRackRow = z.infer<typeof CsvRackRowSchema>
// biome-ignore lint:unused
type CsvItemRow = z.infer<typeof CsvItemRowSchema>

export default function WarehousesPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-2xl">Zarządzaj magazynami</h1>
        </div>

        <CsvImporter onImport={() => console.log("asd")} type="rack" />
      </div>

      <Separator />
    </div>
  )
}
