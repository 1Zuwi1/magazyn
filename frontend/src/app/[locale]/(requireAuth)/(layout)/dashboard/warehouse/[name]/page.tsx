import ProtectedPage from "@/components/security/protected-page"
import WarehouseClient from "./warehouse-client"

export default async function WarehousePage() {
  return (
    <ProtectedPage>
      <WarehouseClient />
    </ProtectedPage>
  )
}
