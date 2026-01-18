"use client"

import { FileUploadIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type z from "zod"
import { CsvImporter } from "@/components/admin-panel/warehouses/csv/csv-importer"
import { Button } from "@/components/ui/button"
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
          <h1 className="font-semibold text-2xl">
            Zarządzaj regałami magazynu
          </h1>
        </div>

        <CsvImporter onImport={() => console.log("asd")} type="rack">
          <Button>
            <HugeiconsIcon className="mr-2 size-4" icon={FileUploadIcon} />
            Importuj CSV (dialog)
          </Button>
        </CsvImporter>
      </div>

      <Separator />
    </div>
  )
}
