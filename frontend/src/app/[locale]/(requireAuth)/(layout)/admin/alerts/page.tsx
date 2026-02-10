import AlertsMain from "@/components/admin-panel/alerts-panel/alerts-page"
import ProtectedPage from "@/components/security/protected-page"

export default function AlertsPage() {
  return (
    <ProtectedPage needAdminPrivileges>
      <AlertsMain />
    </ProtectedPage>
  )
}
