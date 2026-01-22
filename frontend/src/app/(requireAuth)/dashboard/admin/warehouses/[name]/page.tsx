import { notFound } from "next/navigation"
import WarehouseRacksPage from "@/components/admin-panel/warehouses/racks/warehouse-racks-page"
import { MOCK_WAREHOUSES } from "@/components/dashboard/mock-data"

interface WarehouseDetailPageProps {
  params: Promise<{ name: string }>
}

export default async function WarehouseDetailPage({
  params,
}: WarehouseDetailPageProps) {
  const { name } = await params
  const decodedName = decodeURIComponent(name)
  const warehouse = MOCK_WAREHOUSES.find((w) => w.name === decodedName)

  if (!warehouse) {
    notFound()
  }

  return <WarehouseRacksPage warehouse={warehouse} />
}
