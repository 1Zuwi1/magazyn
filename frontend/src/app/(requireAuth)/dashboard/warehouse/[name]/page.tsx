import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import ProtectedPage from "@/app/(requireAuth)/protected-page"
import { MOCK_RACKS } from "@/components/dashboard/mock-data"
import WarehouseClient from "./warehouse-client"

// TODO: fetch in prod
const MOCK_WAREHOUSES_DATA: Record<string, typeof MOCK_RACKS> = {
  "Magazyn A1": MOCK_RACKS.slice(0, 5),
  "Magazyn A2": MOCK_RACKS.slice(0, 1),
  "Magazyn A3": MOCK_RACKS.slice(0, 8),
}

export default async function WarehousePage({
  params,
}: {
  params: Promise<{ name: string }>
}) {
  return (
    <ProtectedPage>
      {async () => {
        const { name } = await params
        const warehouseId = (await cookies()).get("warehouseId")?.value

        if (!warehouseId) {
          redirect("/dashboard")
        }

        const warehouseRacks =
          MOCK_WAREHOUSES_DATA[name] || MOCK_RACKS.slice(0, 1)
        return (
          <WarehouseClient
            racks={warehouseRacks}
            warehouseId={warehouseId}
            warehouseName={name}
          />
        )
      }}
    </ProtectedPage>
  )
}
