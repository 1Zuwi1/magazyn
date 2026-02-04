import { AdminOverview } from "@/components/admin-panel/overview/admin-overview"
import ProtectedPage from "@/components/security/protected-page"

export default function AdminDashboard() {
  return (
    <ProtectedPage needAdminPrivileges>
      <AdminOverview />
    </ProtectedPage>
  )
}
