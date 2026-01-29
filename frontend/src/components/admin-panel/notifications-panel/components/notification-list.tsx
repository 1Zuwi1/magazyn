import { formatDistanceToNow } from "date-fns"
import type { Notification } from "@/components/dashboard/types"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useNotification } from "../../hooks/use-notification"

interface NotificationListProps {
  items: Notification[]
}
export function NotificationList({ items }: NotificationListProps) {
  const [notification, setNotification] = useNotification(items)
  return (
    <ScrollArea>
      <div>
        {items.map((item) => (
          <button
            className={cn(
              "flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent"
            )}
            key={item.id}
            onClick={() => setNotification(item)}
            type="button"
          >
            <div className="flex w-full flex-col gap-1">
              <span className="font-semibold">{item.title}</span>
              {!item.read && (
                <span className="flex h-2 w-2 rounded-full bg-blue-500" />
              )}
            </div>
            <div
              className={cn(
                "ml-auto text-xs",
                notification?.id === item.id
                  ? "text-white"
                  : "text-muted-foreground"
              )}
            >
              {formatDistanceToNow(new Date(item.createdAt), {
                addSuffix: true,
              })}
            </div>
            <div className="line-clamp-2 text-muted-foreground text-xs">
              {item.description.substring(0, 200)}
            </div>
          </button>
        ))}
      </div>
    </ScrollArea>
  )
}
