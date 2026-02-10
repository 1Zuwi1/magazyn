import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  MoreHorizontalCircle01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type * as React from "react"
import { Button } from "@/components/ui/button"
import { translateMessage } from "@/i18n/translate-message"
import { cn } from "@/lib/utils"

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      aria-label={translateMessage("generated.m1044")}
      className={cn("mx-auto flex w-full justify-center", className)}
      data-slot="pagination"
      {...props}
    />
  )
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      className={cn("flex items-center gap-1", className)}
      data-slot="pagination-content"
      {...props}
    />
  )
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />
}

type PaginationLinkProps = {
  isActive?: boolean
} & React.ComponentProps<typeof Button>

function PaginationLink({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) {
  return (
    <Button
      className={cn(className)}
      size={size}
      variant={isActive ? "outline" : "ghost"}
      {...props}
    />
  )
}

function PaginationPrevious({
  className,
  text = "Poprzednia",
  showIcon = true,
  ...props
}: React.ComponentProps<typeof PaginationLink> & {
  text?: string
  showIcon?: boolean
}) {
  return (
    <PaginationLink
      aria-label={translateMessage("generated.m0802")}
      className={cn("pl-2!", className)}
      size="default"
      {...props}
    >
      {showIcon && (
        <HugeiconsIcon
          data-icon="inline-start"
          icon={ArrowLeft01Icon}
          strokeWidth={2}
        />
      )}
      <span className="hidden sm:block">{text}</span>
    </PaginationLink>
  )
}

function PaginationNext({
  className,
  text = translateMessage("generated.m0803"),
  showIcon = true,
  ...props
}: React.ComponentProps<typeof PaginationLink> & {
  text?: string
  showIcon?: boolean
}) {
  return (
    <PaginationLink
      aria-label={translateMessage("generated.m0804")}
      className={cn("pr-2!", className)}
      size="default"
      {...props}
    >
      <span className="hidden sm:block">{text}</span>
      {showIcon && (
        <HugeiconsIcon
          data-icon="inline-end"
          icon={ArrowRight01Icon}
          strokeWidth={2}
        />
      )}
    </PaginationLink>
  )
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-9 items-center justify-center [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      data-slot="pagination-ellipsis"
      {...props}
    >
      <HugeiconsIcon icon={MoreHorizontalCircle01Icon} strokeWidth={2} />
      <span className="sr-only">{translateMessage("generated.m0805")}</span>
    </span>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}
