import RackReportsMain from "@/components/admin-panel/rack-reports-panel/rack-reports-page"
import ProtectedPage from "@/components/security/protected-page"

export default function RackReportsPage() {
  return (
    <ProtectedPage needAdminPrivileges>
      <RackReportsMain />
    </ProtectedPage>
  )
}
