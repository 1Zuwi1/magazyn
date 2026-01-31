import ProtectedPage from "@/app/(requireAuth)/protected-page"
import NotificationsMain from "@/components/admin-panel/notifications-panel/notifications-page"

export default function NotificationsPage() {
  return (
    <ProtectedPage needAdminPrivileges>
      <NotificationsMain />
    </ProtectedPage>
  )
}
