"use client"
import { MOCK_NOTIFICATIONS } from "@/components/dashboard/mock-data"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent } from "@/components/ui/sheet"
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
    filterType,
    setFilterType,
    selectedNotification,
    setSelectedNotification,
    markAllAsRead,
    dismiss,
  } = useNotification(MOCK_NOTIFICATIONS)

  return (
    <div className="flex h-full">
      <NotificationNav
        activeFilter={filterType}
        isCollapsed={isMobile}
        links={NOTIFICATIONS_NAV_LINKS}
        onFilterChange={setFilterType}
      />
      <Separator className="m-2" orientation="vertical" />
      <div className="flex-1">
        <NotificationList
          items={notifications}
          onMarkAllAsRead={markAllAsRead}
          onSelectNotification={setSelectedNotification}
          selectedNotification={selectedNotification}
        />
      </div>

      {isMobile ? (
        <Sheet
          onOpenChange={(open) => !open && setSelectedNotification(null)}
          open={!!selectedNotification}
        >
          <SheetContent side="bottom">
            <NotificationDetail
              notification={selectedNotification}
              onDismiss={dismiss}
            />
          </SheetContent>
        </Sheet>
      ) : (
        <>
          <Separator className="m-2" orientation="vertical" />
          <div className="w-full">
            <NotificationDetail
              notification={selectedNotification}
              onDismiss={dismiss}
            />
          </div>
        </>
      )}
    </div>
  )
}
