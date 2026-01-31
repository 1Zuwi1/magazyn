import { formatDistanceToNow } from "date-fns"
import type { Notification } from "@/components/dashboard/types"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface NotificationListProps {
  items: Notification[]
  selectedNotification: Notification | null
  onSelectNotification: (notification: Notification) => void
  onMarkAllAsRead: () => void
}

export function NotificationList({
  items,
  selectedNotification,
  onSelectNotification,
  onMarkAllAsRead,
}: NotificationListProps) {
  const hasUnread = items.some((n) => !n.read)

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-2">
        <span className="font-medium text-sm">Powiadomienia</span>
        <Button
          className="cursor-pointer"
          disabled={!hasUnread}
          onClick={onMarkAllAsRead}
          size="sm"
          variant="outline"
        >
          Oznacz wszystkie jako przeczytane
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div>
          {items.map((item) => (
            <button
              className={cn(
                "flex w-full flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent"
              )}
              key={item.id}
              onClick={() => onSelectNotification(item)}
              type="button"
            >
              <div className="flex w-full flex-col gap-1">
                <div className="flex items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{item.title}</span>
                    {!item.read && (
                      <span className="flex h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                </div>
                <div
                  className={cn(
                    "ml-auto text-xs",
                    selectedNotification?.id === item.id
                      ? "text-white"
                      : "text-muted-foreground"
                  )}
                >
                  {formatDistanceToNow(new Date(item.createdAt), {
                    addSuffix: true,
                  })}
                </div>
              </div>
              <div className="line-clamp-2 text-muted-foreground text-xs">
                {item.description.substring(0, 200)}
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
