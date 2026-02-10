import { WarehouseContent } from "@/components/dashboard/warehouse-content"
import ProtectedPage from "@/components/security/protected-page"

export default function WarehousePage() {
  return (
    <ProtectedPage>
      <WarehouseContent />
    </ProtectedPage>
  )
}
