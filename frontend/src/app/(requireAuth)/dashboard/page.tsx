import { DashboardContent } from "@/components/dashboard/dashboard-content"
import ProtectedPage from "../protected-page"

export default function Page() {
  return (
    <ProtectedPage>
      <DashboardContent />
    </ProtectedPage>
  )
}
