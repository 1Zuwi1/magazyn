import AssortmentMain from "@/components/admin-panel/assortment/assortment-page"
import ProtectedPage from "@/components/security/protected-page"

export default function AdminAssortmentPage() {
  return (
    <ProtectedPage needAdminPrivileges>
      <AssortmentMain />
    </ProtectedPage>
  )
}
