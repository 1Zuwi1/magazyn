import { Alert01Icon, PackageIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import type { ItemSlot } from "../../types"

interface ElementProps extends React.HTMLAttributes<HTMLDivElement> {
  isEmpty: boolean
  item: ItemSlot
  coordinate: string
}

export default function RackElement({
  isEmpty,
  item,
  coordinate,
  className,
  ...props
}: ElementProps) {
  const isDangerous = item?.isDangerous

  return (
    <div
      className={cn(
        "group relative aspect-square overflow-hidden rounded-lg border transition-all duration-200",
        isEmpty
          ? "border-muted-foreground/20 border-dashed bg-muted/20 hover:border-muted-foreground/40 hover:bg-muted/40"
          : "border-border bg-card shadow-sm hover:shadow-md hover:ring-2 hover:ring-primary/20",
        isDangerous && "ring-2 ring-destructive/50",
        className
      )}
      {...props}
    >
      {isEmpty || !item ? (
        // Empty slot
        <div className="flex h-full flex-col items-center justify-center">
          <div className="flex size-6 items-center justify-center rounded-full bg-muted-foreground/10 transition-colors group-hover:bg-muted-foreground/20 sm:size-8">
            <span className="font-mono font-semibold text-[10px] text-muted-foreground sm:text-xs">
              {coordinate}
            </span>
          </div>
        </div>
      ) : (
        // Occupied slot
        <>
          <div className="relative flex h-full items-center justify-center bg-gradient-to-br from-secondary to-secondary/80">
            {item.imageUrl ? (
              <Image
                alt={item.name}
                className="object-cover transition-transform duration-200 group-hover:scale-105"
                fill
                sizes="(max-width: 768px) 60px, 80px"
                src={item.imageUrl}
              />
            ) : (
              // Fallback icon when no image
              <div className="flex h-full w-full flex-col items-center justify-center gap-1">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 sm:size-10">
                  <HugeiconsIcon
                    className="size-4 text-primary sm:size-5"
                    icon={PackageIcon}
                  />
                </div>
              </div>
            )}

            {/* Hover overlay with item name */}
            <div className="pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
              <span className="mb-1 max-w-full truncate px-1 font-medium text-[9px] text-white sm:mb-2 sm:text-xs">
                {item.name}
              </span>
            </div>
          </div>

          {/* Danger indicator */}
          {isDangerous && (
            <div className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-destructive shadow-sm sm:size-6">
              <HugeiconsIcon
                className="size-3 text-white sm:size-3.5"
                icon={Alert01Icon}
              />
            </div>
          )}

          {/* Slot coordinate badge */}
          <div className="absolute bottom-1 left-1 rounded bg-black/60 px-1 py-0.5 font-mono font-semibold text-[8px] text-white backdrop-blur-sm sm:text-[10px]">
            {coordinate}
          </div>
        </>
      )}
    </div>
  )
}
