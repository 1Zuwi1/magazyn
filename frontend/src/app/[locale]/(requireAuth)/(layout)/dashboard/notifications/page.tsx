import NotificationsMain from "@/components/dashboard/notifications/notifications-page"
import ProtectedPage from "@/components/security/protected-page"

export default function NotificationsPage() {
  return (
    <ProtectedPage>
      <NotificationsMain />
    </ProtectedPage>
  )
}
