import ReportsMain from "@/components/admin-panel/reports/reports-page"
import ProtectedPage from "@/components/security/protected-page"

export default function ReportsPage() {
  return (
    <ProtectedPage needAdminPrivileges>
      <ReportsMain />
    </ProtectedPage>
  )
}
