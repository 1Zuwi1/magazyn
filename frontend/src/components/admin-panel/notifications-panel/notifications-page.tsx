"use client"
import { MOCK_NOTIFICATIONS } from "@/components/dashboard/mock-data"
import { Separator } from "@/components/ui/separator"
import { useIsMobile } from "@/hooks/use-mobile"
import { NOTIFICATIONS_NAV_LINKS } from "../lib/constants"
import { NotificationNav } from "./components/nav"
import { NotificationList } from "./components/notification-list"

export default function NotificationsMain() {
  const isMobile = useIsMobile()

  return (
    <div className="flex h-full">
      <NotificationNav isCollapsed={isMobile} links={NOTIFICATIONS_NAV_LINKS} />
      <Separator className="m-2" orientation="vertical" />
      <div className="flex-1">
        <NotificationList items={MOCK_NOTIFICATIONS} />
      </div>
    </div>
  )
}
