import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { AssortmentTable } from "@/components/dashboard/items/assortment-table"
import { MOCK_ITEMS, MOCK_WAREHOUSES } from "@/components/dashboard/mock-data"

export default async function AssortmentPage() {
  const warehouseId = (await cookies()).get("warehouseId")?.value
  const warehouse = MOCK_WAREHOUSES.find((w) => w.id === warehouseId)

  if (!warehouse) {
    notFound()
  }

  const items = MOCK_ITEMS.filter((item) => item.warehouseId === warehouseId)

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="font-bold text-3xl">
          Asortyment magazynu {warehouse.id}
        </h1>
        <p className="text-muted-foreground">
          Przeglądaj wszystkie produkty w magazynie
        </p>
      </div>
      <AssortmentTable items={items} />
    </div>
  )
}
