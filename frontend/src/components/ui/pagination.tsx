import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  MoreHorizontalCircle01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useTranslations } from "next-intl"
import type * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  const t = useTranslations()

  return (
    <nav
      aria-label={t("generated.ui.pagination")}
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
  const t = useTranslations()

  return (
    <PaginationLink
      aria-label={t("generated.ui.goPreviousPage")}
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
  text,
  showIcon = true,
  ...props
}: React.ComponentProps<typeof PaginationLink> & {
  text?: string
  showIcon?: boolean
}) {
  const t = useTranslations()
  const resolvedText = text ?? t("generated.ui.next")

  return (
    <PaginationLink
      aria-label={t("generated.ui.goNextPage")}
      className={cn("pr-2!", className)}
      size="default"
      {...props}
    >
      <span className="hidden sm:block">{resolvedText}</span>
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
  const t = useTranslations()

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
      <span className="sr-only">{t("generated.ui.morePages")}</span>
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
