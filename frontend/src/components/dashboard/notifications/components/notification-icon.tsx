"use client"

import {
  Delete02Icon,
  InboxIcon,
  TickDouble02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { MOCK_NOTIFICATIONS } from "../../mock-data"

export function NotificationInbox() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)
  const [open, setOpen] = useState(false)
  const unreadCount = notifications.filter((n) => !n.read).length

  const handleMarkAllRead = (checked: boolean) => {
    if (checked === true) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    }
  }

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger>
        <div className="relative mr-3 flex size-11 cursor-pointer items-center justify-center rounded-xl bg-background transition-colors hover:bg-accent">
          <HugeiconsIcon className="size-1/2" icon={InboxIcon} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 font-bold text-[10px] text-primary-foreground ring-2 ring-background sm:size-6 sm:text-xs md:-top-2 md:-right-2">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-90 p-0 sm:w-90">
        <div className="m-1 flex items-center justify-between px-3 py-3">
          <span className="font-semibold text-sm">Powiadomienia</span>
        </div>

        <ScrollArea className="h-70">
          <div className="flex flex-col">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                Brak powiadomień
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  className={cn(
                    "flex flex-col gap-1 border-b p-4 transition-colors last:border-0 hover:bg-muted/50",
                    !notification.read && "bg-muted/30"
                  )}
                  key={notification.id}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={cn(
                        "font-medium text-sm",
                        !notification.read && "font-semibold"
                      )}
                    >
                      {notification.title}
                      {!notification.read && (
                        <span className="ml-2 inline-block h-2 w-2 rounded-full bg-primary" />
                      )}
                    </span>

                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {notification.date}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-muted-foreground text-xs">
                    {notification.description}
                  </p>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        <div className="flex flex-row items-center justify-between gap-2 border-t p-1">
          <Button
            className="h-8 flex-1 justify-start text-muted-foreground text-xs hover:text-foreground"
            disabled={unreadCount === 0}
            onClick={() => handleMarkAllRead(true)}
            size="sm"
            variant="ghost"
          >
            <HugeiconsIcon className="mr-2 size-3.5" icon={TickDouble02Icon} />
            <span>Oznacz wszystkie jako przeczytane</span>
          </Button>
          <Button
            className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            disabled={notifications.length === 0}
            onClick={() => setNotifications([])}
            size="icon"
            title="Wyczyść wszystkie powiadomienia"
            variant="ghost"
          >
            <HugeiconsIcon className="size-3.5" icon={Delete02Icon} />
          </Button>
        </div>
        <Separator />
        <div className="p-2">
          <Button className="w-full justify-center text-xs" variant="ghost">
            <Link
              href="/dashboard/notifications"
              onClick={() => setOpen(false)}
            >
              Zobacz wszystkie powiadomienia
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
