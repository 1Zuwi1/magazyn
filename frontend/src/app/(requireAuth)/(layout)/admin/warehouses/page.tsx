import WarehousesMain from "@/components/admin-panel/warehouses/warehouses-page"
import ProtectedPage from "@/components/security/protected-page"

export default function WarehousesPage() {
  return (
    <ProtectedPage needAdminPrivileges>
      <WarehousesMain />
    </ProtectedPage>
  )
}
