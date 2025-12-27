import { CubeIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import type { Item } from "../types"

interface ElementProps extends React.HTMLAttributes<HTMLDivElement> {
  isEmpty: boolean
  item: Item | null
  coordinate: string
}

export default function RackElement({
  isEmpty,
  item,
  coordinate,
  className,
  ...props
}: ElementProps) {
  return (
    <div
      className={cn(
        "group relative aspect-square overflow-hidden rounded-lg transition-all hover:scale-105 hover:shadow-md",
        {
          "outline-2 outline-red-500": item?.isDangerous,
        },
        className
      )}
      {...props}
    >
      {!item || isEmpty ? (
        // Empty slot
        <div className="flex h-full flex-col items-center justify-center bg-muted/30 text-muted-foreground">
          <span className="font-semibold text-xs sm:text-sm md:text-lg">
            {coordinate}
          </span>
        </div>
      ) : (
        // Occupied slot
        <div className="relative flex h-full items-center justify-center bg-secondary">
          {item.imageUrl ? (
            <Image
              alt={item.name}
              className="object-cover"
              fill
              sizes="(max-width: 768px) 60px, 80px"
              src={item.imageUrl}
            />
          ) : (
            // Fallback icon when no image
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <HugeiconsIcon
                className="size-8 text-muted-foreground"
                icon={CubeIcon}
              />
            </div>
          )}
          {/* Danger indicator */}
          {item.isDangerous && (
            <div className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-destructive">
              <div className="size-2 rounded-full bg-white" />
            </div>
          )}
        </div>
      )}
      {/* Slot coordinate overlay for all slots */}
      <div className="absolute bottom-0.5 left-0.5 flex h-fit w-fit items-center justify-center rounded bg-black/50 p-0.5 font-semibold text-[8px] text-white sm:text-[10px]">
        {coordinate}
      </div>
    </div>
  )
}
