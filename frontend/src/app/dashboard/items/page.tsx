import { ItemsTable } from "@/components/dashboard/items/items-table"
import { MOCK_ITEM_STATS } from "@/components/dashboard/mock_data"

export default function ItemsPage() {
  const items = MOCK_ITEM_STATS
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Asortyment</h1>
        <p className="text-muted-foreground">
          Zarządzaj wszystkimi przedmiotami w systemie
        </p>
      </div>

      <ItemsTable items={items} />
    </div>
  )
}
