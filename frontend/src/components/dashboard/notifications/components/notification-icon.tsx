"use client"

import { InboxIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

interface NotificationInboxProps {
  count?: number
}

export function NotificationInbox({ count = 5 }: NotificationInboxProps) {
  return (
    <div className="relative mr-3 flex size-11 cursor-pointer items-center justify-center rounded-xl bg-background transition-colors hover:bg-accent">
      <HugeiconsIcon className="size-1/2" icon={InboxIcon} />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 flex h-3 min-w-5 items-center justify-center rounded-full bg-primary px-1 font-bold text-[10px] text-primary-foreground ring-2 ring-background sm:size-6 sm:text-xs md:-top-2 md:-right-2">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </div>
  )
}
