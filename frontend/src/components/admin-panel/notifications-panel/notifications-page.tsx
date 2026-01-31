"use client"
import { MOCK_NOTIFICATIONS } from "@/components/dashboard/mock-data"
import { Separator } from "@/components/ui/separator"
import { useIsMobile } from "@/hooks/use-mobile"
import { useNotification } from "../hooks/use-notification"
import { NOTIFICATIONS_NAV_LINKS } from "../lib/constants"
import { NotificationNav } from "./components/nav"
import { NotificationDetail } from "./components/notification-detail"
import { NotificationList } from "./components/notification-list"

export default function NotificationsMain() {
  const isMobile = useIsMobile()
  const {
    notifications,
    selectedNotification,
    setSelectedNotification,
    markAllAsRead,
    dismiss,
  } = useNotification(MOCK_NOTIFICATIONS)

  return (
    <div className="flex h-full">
      <NotificationNav isCollapsed={isMobile} links={NOTIFICATIONS_NAV_LINKS} />
      <Separator className="m-2" orientation="vertical" />
      <div className="flex-1">
        <NotificationList
          items={notifications}
          onMarkAllAsRead={markAllAsRead}
          onSelectNotification={setSelectedNotification}
          selectedNotification={selectedNotification}
        />
      </div>
      <Separator className="m-2" orientation="vertical" />
      <div className="w-100">
        <NotificationDetail
          notification={selectedNotification}
          onDismiss={dismiss}
        />
      </div>
    </div>
  )
}
