import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  SortingIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type { ReactNode } from "react"
import { TableHead } from "@/components/ui/table"
import { cn } from "@/lib/utils"

type SortDirection = "asc" | "desc"

interface SortableTableHeadProps {
  active: boolean
  children: ReactNode
  className?: string
  direction?: SortDirection
  onSort: () => void
}

function getSortIcon(active: boolean, direction: SortDirection) {
  if (!active) {
    return SortingIcon
  }
  return direction === "asc" ? ArrowUp01Icon : ArrowDown01Icon
}

export function SortableTableHead({
  active,
  children,
  className,
  direction = "asc",
  onSort,
}: SortableTableHeadProps) {
  const icon = getSortIcon(active, direction)

  return (
    <TableHead className={className}>
      <button
        className={cn(
          "flex items-center gap-1.5 transition-colors hover:text-foreground",
          active && "text-foreground"
        )}
        onClick={onSort}
        type="button"
      >
        {children}
        <HugeiconsIcon
          className={cn(
            "size-3 transition-opacity",
            active ? "text-primary opacity-100" : "opacity-30"
          )}
          icon={icon}
        />
      </button>
    </TableHead>
  )
}
