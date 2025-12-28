import { notFound } from "next/navigation"
import { AssortmentTable } from "@/components/dashboard/items/assortment-table"
import { MOCK_ITEMS, MOCK_WAREHOUSES } from "@/components/dashboard/mock_data"

interface AssortmentPageProps {
  params: {
    id: string
  }
}

export default async function AssortmentPage({ params }: AssortmentPageProps) {
  const { id } = await params
  const warehouse = MOCK_WAREHOUSES.find((w) => w.id === id)

  if (!warehouse) {
    notFound()
  }

  const items = MOCK_ITEMS.filter((item) => item.warehouseId === id)

  return (
    <div className="container mx-auto py-6">
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
