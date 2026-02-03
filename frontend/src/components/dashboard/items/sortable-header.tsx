"use client"

import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  SortingIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type { Column, SortDirection } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function SortIcon({ isSorted }: { isSorted: false | SortDirection }) {
  const baseClass = cn(
    "flex size-4 items-center justify-center rounded transition-all",
    isSorted
      ? "text-primary"
      : "text-muted-foreground/50 group-hover:text-muted-foreground"
  )

  if (isSorted === "asc") {
    return (
      <span className={baseClass}>
        <HugeiconsIcon
          className="fade-in size-3.5 animate-in"
          icon={ArrowUp01Icon}
        />
      </span>
    )
  }

  if (isSorted === "desc") {
    return (
      <span className={baseClass}>
        <HugeiconsIcon
          className="fade-in size-3.5 animate-in"
          icon={ArrowDown01Icon}
        />
      </span>
    )
  }

  return (
    <span className={baseClass}>
      <HugeiconsIcon
        className="size-3.5 opacity-0 group-hover:opacity-100"
        icon={SortingIcon}
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

  if (!canSort) {
    return <span className={className}>{children}</span>
  }

  return (
    <Button
      className={cn(
        "group -ml-3 h-8 gap-1.5 px-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider hover:text-foreground",
        isSorted && "text-foreground",
        className
      )}
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      size="sm"
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
