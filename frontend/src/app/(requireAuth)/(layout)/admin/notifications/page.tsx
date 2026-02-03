import NotificationsMain from "@/components/admin-panel/notifications-panel/notifications-page"
import ProtectedPage from "@/components/security/protected-page"

export default function NotificationsPage() {
  return (
    <ProtectedPage needAdminPrivileges>
      <NotificationsMain />
    </ProtectedPage>
  )
}
