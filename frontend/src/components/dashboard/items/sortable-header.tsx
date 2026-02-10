"use client"

import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  SortingIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type { Column, SortDirection } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { translateMessage } from "@/i18n/translate-message"
import { cn } from "@/lib/utils"

function SortIcon({ isSorted }: { isSorted: false | SortDirection }) {
  const baseClass = cn(
    "flex size-4 items-center justify-center rounded transition-all",
    isSorted
      ? "text-primary"
      : "text-muted-foreground/50 group-hover:text-muted-foreground"
  )

  let icon = SortingIcon
  if (isSorted === "asc") {
    icon = ArrowUp01Icon
  } else if (isSorted === "desc") {
    icon = ArrowDown01Icon
  }

  const iconClass = cn(
    "size-3.5",
    isSorted ? "fade-in animate-in" : "opacity-0 group-hover:opacity-100"
  )

  return (
    <span className={baseClass}>
      <HugeiconsIcon
        className={iconClass}
        icon={icon}
        key={isSorted || "none"}
      />
    </span>
  )
}

interface SortableHeaderProps<TData, TValue> {
  column: Column<TData, TValue>
  children: React.ReactNode
  className?: string
}

export function SortableHeader<TData, TValue>({
  column,
  children,
  className,
}: SortableHeaderProps<TData, TValue>) {
  const isSorted = column.getIsSorted()
  const canSort = column.getCanSort()
  const nextSortingOrder = column.getNextSortingOrder()

  if (!canSort) {
    return <span className={className}>{children}</span>
  }

  let sortingTitle = translateMessage("generated.dashboard.items.clearSorting")
  if (nextSortingOrder === "asc") {
    sortingTitle = translateMessage("generated.dashboard.items.sortAscending")
  } else if (nextSortingOrder === "desc") {
    sortingTitle = translateMessage("generated.dashboard.items.sortDescending")
  }

  return (
    <Button
      className={cn(
        "group -ml-3 h-8 gap-1.5 px-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider hover:text-foreground",
        isSorted && "text-foreground",
        className
      )}
      onClick={column.getToggleSortingHandler()}
      size="sm"
      title={sortingTitle}
      type="button"
      variant="ghost"
    >
      <span>{children}</span>
      <SortIcon isSorted={isSorted} />
    </Button>
  )
}

interface StaticHeaderProps {
  children: React.ReactNode
  className?: string
}

export function StaticHeader({ children, className }: StaticHeaderProps) {
  return (
    <span
      className={cn(
        "font-semibold text-muted-foreground text-xs uppercase tracking-wider",
        className
      )}
    >
      {children}
    </span>
  )
}
