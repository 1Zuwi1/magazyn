"use client"

import {
  Cancel01Icon,
  FilterIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type { ComponentProps, ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface FilterBarProps {
  children?: ReactNode
  className?: string
}

export function FilterBar({ children, className }: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between",
        className
      )}
    >
      {children}
    </div>
  )
}

interface FilterGroupProps {
  children: ReactNode
  className?: string
}

export function FilterGroup({ children, className }: FilterGroupProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center",
        className
      )}
    >
      {children}
    </div>
  )
}

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  "aria-label"?: string
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Szukaj...",
  className,
  "aria-label": ariaLabel = "Szukaj",
}: SearchInputProps) {
  const isFiltered = value.length > 0

  return (
    <div className={cn("relative flex-1 sm:min-w-70 sm:max-w-sm", className)}>
      <HugeiconsIcon
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        icon={Search01Icon}
      />
      <Input
        aria-label={ariaLabel}
        className="h-10 pr-9 pl-9"
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        value={value}
      />
      {isFiltered && (
        <button
          aria-label="Wyczyść wyszukiwanie"
          className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={() => onChange("")}
          type="button"
        >
          <HugeiconsIcon className="size-3.5" icon={Cancel01Icon} />
        </button>
      )}
    </div>
  )
}

interface FilterResultsProps {
  filteredCount: number
  totalCount: number
  isFiltered: boolean
  itemLabel: {
    singular: string
    plural: string
    genitive: string
  }
  className?: string
}

export function FilterResults({
  filteredCount,
  totalCount,
  isFiltered,
  itemLabel,
  className,
}: FilterResultsProps) {
  const pluralize = (count: number) => {
    if (count === 1) {
      return itemLabel.singular
    }
    if (count >= 2 && count <= 4) {
      return itemLabel.plural
    }
    return itemLabel.genitive
  }

  return (
    <div className={cn("flex items-center gap-2 text-sm", className)}>
      {isFiltered ? (
        <span className="rounded-md bg-primary/10 px-2.5 py-1 font-medium text-primary">
          {filteredCount} z {totalCount} {pluralize(totalCount)}
        </span>
      ) : (
        <span className="text-muted-foreground">
          {totalCount} {pluralize(totalCount)}
        </span>
      )}
    </div>
  )
}

interface ClearFiltersButtonProps {
  onClick: () => void
  className?: string
}

export function ClearFiltersButton({
  onClick,
  className,
}: ClearFiltersButtonProps) {
  return (
    <Button
      className={cn("gap-1.5 text-muted-foreground", className)}
      onClick={onClick}
      size="sm"
      variant="ghost"
    >
      <HugeiconsIcon className="size-3.5" icon={FilterIcon} />
      <span>Wyczyść</span>
    </Button>
  )
}

interface ActiveFiltersBadgeProps {
  count: number
  className?: string
}

export function ActiveFiltersBadge({
  count,
  className,
}: ActiveFiltersBadgeProps) {
  if (count === 0) {
    return null
  }

  return (
    <Badge className={cn("font-normal", className)} variant="secondary">
      {count} {count === 1 ? "filtr" : "filtry"} aktywne
    </Badge>
  )
}

interface FilterSelectProps {
  icon?: ComponentProps<typeof HugeiconsIcon>["icon"]
  isActive?: boolean
  className?: string
  children: ReactNode
}

export function FilterSelectWrapper({
  icon,
  isActive,
  className,
  children,
}: FilterSelectProps) {
  return (
    <div
      className={cn(
        "relative flex items-center gap-2",
        isActive &&
          "**:data-[slot=select-trigger]:border-primary/50 **:data-[slot=select-trigger]:bg-primary/5 **:data-[slot=select-trigger]:text-primary",
        className
      )}
    >
      {icon && (
        <HugeiconsIcon
          className={cn(
            "pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2",
            isActive ? "text-primary" : "text-muted-foreground"
          )}
          icon={icon}
        />
      )}
      <div className={cn(icon && "**:data-[slot=select-trigger]:pl-9")}>
        {children}
      </div>
    </div>
  )
}
