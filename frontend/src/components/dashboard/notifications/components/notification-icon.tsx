"use client"

import { InboxIcon } from "@hugeicons/core-free-icons"
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
import { mockNotifications } from "../../mock-data"

interface NotificationInboxProps {
  count?: number
}

export function NotificationInbox({ count: _count }: NotificationInboxProps) {
  const [notifications, setNotifications] = useState(mockNotifications)
  const [isOpen, setIsOpen] = useState(false)
  const unreadCount = notifications.filter((n) => !n.read).length

  const handleMarkAllRead = (checked: boolean) => {
    if (checked === true) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    }
  }

  return (
    <Popover onOpenChange={setIsOpen} open={isOpen}>
      <PopoverTrigger>
        <div className="relative mr-3 flex size-11 cursor-pointer items-center justify-center rounded-xl bg-background transition-colors hover:bg-accent">
          <HugeiconsIcon className="size-1/2" icon={InboxIcon} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 font-bold text-[10px] text-destructive-foreground ring-2 ring-background sm:size-6 sm:text-xs md:-top-2 md:-right-2">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 sm:w-96">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="font-semibold text-sm">Powiadomienia</span>
          <div className="flex items-center space-x-2">
            <Button
              className="cursor-pointer text-xs"
              onClick={() => handleMarkAllRead(true)}
              size="sm"
              variant="ghost"
            >
              Oznacz wszystkie jako przeczytane
            </Button>
          </div>
        </div>
        <Separator />
        <ScrollArea className="h-[300px]">
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
                    </span>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {notification.date}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-muted-foreground text-xs">
                    {notification.description}
                  </p>
                  {!notification.read && (
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        <Separator />
        <div className="p-2">
          <Button className="w-full justify-center text-xs" variant="ghost">
            <Link
              href="/dashboard/notifications"
              onClick={() => setIsOpen(false)}
            >
              Zobacz wszystkie powiadomienia
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
