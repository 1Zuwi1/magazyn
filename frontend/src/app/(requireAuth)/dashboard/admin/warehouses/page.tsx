import ProtectedPage from "@/app/(requireAuth)/protected-page"
import WarehousesMain from "@/components/admin-panel/warehouses/warehouses-page"

export default function WarehousesPage() {
  return (
    <ProtectedPage needAdminPrivileges>
      <WarehousesMain />
    </ProtectedPage>
  )
}
