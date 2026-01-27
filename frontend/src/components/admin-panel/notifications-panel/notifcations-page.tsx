"use client"
import { Separator } from "@/components/ui/separator"
import { useIsMobile } from "@/hooks/use-mobile"
import { NOTIFICATIONS_NAV_LINKS } from "../lib/constants"
import AdminNotificationsNav from "./components/nav"

export default function NotificationsMain() {
  const isMobile = useIsMobile()

  return (
    <div className="flex h-full">
      <AdminNotificationsNav
        isCollapsed={isMobile}
        links={NOTIFICATIONS_NAV_LINKS}
      />
      <Separator className="m-2" orientation="vertical" />
      <div className="flex-1">{/* Główny ekran mailboxa */}</div>
    </div>
  )
}
