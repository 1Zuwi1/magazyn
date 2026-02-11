import DashboardHomeContent from "@/components/dashboard/dashboard-home-content"
import ProtectedPage from "@/components/security/protected-page"

export default function Page() {
  return (
    <ProtectedPage>
      <DashboardHomeContent />
    </ProtectedPage>
  )
}
