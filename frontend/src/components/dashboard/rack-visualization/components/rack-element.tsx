import { ItemPhoto } from "@/components/ui/item-photo"
import { translateMessage } from "@/i18n/translate-message"
import { cn } from "@/lib/utils"
import type { ItemSlot } from "../../types"
import { getItemStatus, getStatusColors } from "../../utils/item-status"

interface ElementProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isEmpty: boolean
  item: ItemSlot
  coordinate: string
  isSelected?: boolean
}

export default function RackElement({
  isEmpty,
  item,
  coordinate,
  isSelected = false,
  className,
  ...props
}: ElementProps) {
  const status = item ? getItemStatus(item) : null
  const statusColors = status ? getStatusColors(status) : null
  let statusRing: string | null = null
  if (status === "expired") {
    statusRing = "ring-1 ring-amber-400/60"
  } else if (status === "expired-dangerous") {
    statusRing = "ring-2 ring-amber-400/70"
  } else if (status === "dangerous") {
    statusRing = "ring-2 ring-destructive/50"
  }
  const ariaLabel = isEmpty
    ? translateMessage("generated.m0496", { value0: coordinate })
    : translateMessage("generated.m0497", {
        value0: coordinate,
        value1: item?.name ?? translateMessage("generated.m1152"),
      })

  return (
    <button
      aria-label={ariaLabel}
      aria-pressed={isSelected}
      className={cn(
        "group relative aspect-square cursor-pointer overflow-hidden rounded-lg border transition-all duration-200 focus-visible:outline-2 focus-visible:outline-primary/60 focus-visible:outline-offset-2",
        isEmpty
          ? "border-muted-foreground/20 border-dashed bg-muted/20 hover:border-muted-foreground/40 hover:bg-muted/40"
          : "border-border bg-card shadow-sm hover:shadow-md hover:ring-2 hover:ring-primary/20",
        statusRing,
        isSelected && "outline-2 outline-primary/60 outline-offset-2",
        className
      )}
      tabIndex={isEmpty ? -1 : 0}
      type="button"
      {...props}
    >
      {isEmpty || !item ? (
        // Empty slot
        <div className="flex h-full flex-col items-center justify-center">
          <div className="flex size-6 items-center justify-center rounded-full bg-muted-foreground/10 transition-colors group-hover:bg-muted-foreground/20 sm:size-8">
            <span className="text-nowrap font-mono font-semibold text-[10px] text-muted-foreground sm:text-xs">
              {coordinate}
            </span>
          </div>
        </div>
      ) : (
        // Occupied slot
        <>
          <div className="relative flex h-full items-center justify-center bg-linear-to-br from-secondary to-secondary/80">
            <ItemPhoto
              alt={item.name}
              containerClassName="size-14 shrink-0"
              iconClassName="size-6 text-muted-foreground"
              imageClassName="object-cover"
              src={`/api/items/${item.id}/photo`}
            />

            {/* Hover overlay with item name */}
            <div className="pointer-events-none absolute inset-0 flex items-end justify-center bg-linear-to-t from-black/70 via-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
              <span className="mb-1 max-w-full truncate px-1 font-medium text-[9px] text-white sm:mb-2 sm:text-xs">
                {item.name}
              </span>
            </div>
          </div>

          {/* Status indicator */}
          {status && status !== "normal" && statusColors && (
            <div
              className={cn(
                "absolute top-1 right-1 size-2.5 rounded-full",
                statusColors.dot
              )}
            />
          )}

          {/* Slot coordinate badge */}
          <div className="absolute bottom-1 left-1 rounded bg-black/60 px-1 py-0.5 font-mono font-semibold text-[8px] text-white opacity-100 backdrop-blur-sm transition-opacity group-hover:opacity-0 sm:text-[10px]">
            {coordinate}
          </div>
        </>
      )}
    </button>
  )
}
