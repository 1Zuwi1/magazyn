import ItemsMain from "@/components/admin-panel/items/items-page"
import ProtectedPage from "@/components/security/protected-page"

export default function AdminItemsPage() {
  return (
    <ProtectedPage needAdminPrivileges>
      <ItemsMain />
    </ProtectedPage>
  )
}
