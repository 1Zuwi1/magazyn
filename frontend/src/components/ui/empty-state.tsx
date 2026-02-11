"use client"

import {
  Add01Icon,
  Delete02Icon,
  FilterIcon,
  InboxIcon,
  PackageIcon,
  ReloadIcon,
  Search01Icon,
  Settings01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Button } from "@/components/ui/button"
import { useAppTranslations } from "@/i18n/use-translations"
import { cn } from "@/lib/utils"
import type { IconComponent } from "../dashboard/types"

type EmptyStateVariant =
  | "default"
  | "search"
  | "filter"
  | "noData"
  | "noItems"
  | "error"

interface EmptyStateProps {
  variant?: EmptyStateVariant
  icon?: IconComponent
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: "default" | "outline" | "ghost"
    icon?: IconComponent
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
  size?: "sm" | "md" | "lg"
}

function getVariantIcon(variant: EmptyStateVariant): IconComponent {
  switch (variant) {
    case "search":
      return Search01Icon
    case "filter":
      return FilterIcon
    case "noItems":
      return PackageIcon
    case "error":
      return Settings01Icon
    case "noData":
      return InboxIcon
    default:
      return InboxIcon
  }
}

function getVariantStyles(variant: EmptyStateVariant) {
  switch (variant) {
    case "search":
      return {
        iconBg: "bg-blue-500/10",
        iconColor: "text-blue-500",
        decorativeBg: "from-blue-500/5",
      }
    case "filter":
      return {
        iconBg: "bg-orange-500/10",
        iconColor: "text-orange-500",
        decorativeBg: "from-orange-500/5",
      }
    case "noItems":
      return {
        iconBg: "bg-primary/10",
        iconColor: "text-primary",
        decorativeBg: "from-primary/5",
      }
    case "error":
      return {
        iconBg: "bg-destructive/10",
        iconColor: "text-destructive",
        decorativeBg: "from-destructive/5",
      }
    default:
      return {
        iconBg: "bg-muted",
        iconColor: "text-muted-foreground",
        decorativeBg: "from-muted/30",
      }
  }
}

function getBlurSize(size: EmptyStateProps["size"]) {
  if (size === "lg") {
    return "size-40"
  }
  if (size === "sm") {
    return "size-20"
  }
  return "size-32"
}

function getSizeStyles(size: EmptyStateProps["size"]) {
  switch (size) {
    case "sm":
      return {
        container: "py-8",
        icon: "size-10",
        iconWrapper: "size-14",
        title: "text-sm",
        description: "text-xs",
      }
    case "lg":
      return {
        container: "py-16",
        icon: "size-10",
        iconWrapper: "size-20",
        title: "text-xl",
        description: "text-base",
      }
    default:
      return {
        container: "py-12",
        icon: "size-8",
        iconWrapper: "size-16",
        title: "text-base",
        description: "text-sm",
      }
  }
}

export function EmptyState({
  variant = "default",
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  size = "md",
}: EmptyStateProps) {
  const styles = getVariantStyles(variant)
  const sizeStyles = getSizeStyles(size)
  const IconToUse = icon ?? getVariantIcon(variant)

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center text-center",
        sizeStyles.container,
        className
      )}
    >
      {/* Decorative background */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-linear-to-b via-transparent to-transparent opacity-50",
          styles.decorativeBg
        )}
      />

      {/* Decorative circles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-3xl",
            styles.iconBg,
            getBlurSize(size)
          )}
        />
      </div>

      <div className="relative flex flex-col items-center gap-4">
        {/* Icon */}
        <div
          className={cn(
            "flex items-center justify-center rounded-2xl ring-1 ring-border/50",
            styles.iconBg,
            sizeStyles.iconWrapper
          )}
        >
          <HugeiconsIcon
            className={cn(sizeStyles.icon, styles.iconColor)}
            icon={IconToUse}
          />
        </div>

        {/* Text */}
        <div className="max-w-sm space-y-2">
          <h3 className={cn("font-semibold text-foreground", sizeStyles.title)}>
            {title}
          </h3>
          {description && (
            <p
              className={cn(
                "text-wrap text-muted-foreground",
                sizeStyles.description
              )}
            >
              {description}
            </p>
          )}
        </div>

        {/* Actions */}
        {(action || secondaryAction) && (
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {action && (
              <Button
                onClick={action.onClick}
                size="sm"
                variant={action.variant ?? "default"}
              >
                {action.variant !== "ghost" && (
                  <HugeiconsIcon
                    className="mr-1.5 size-4"
                    icon={action.icon ?? Add01Icon}
                  />
                )}
                {action.label}
              </Button>
            )}
            {secondaryAction && (
              <Button
                onClick={secondaryAction.onClick}
                size="sm"
                variant="ghost"
              >
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Preset variants for common use cases
export function SearchEmptyState({
  onClear,
  className,
}: {
  onClear?: () => void
  className?: string
}) {
  const t = useAppTranslations()

  return (
    <EmptyState
      action={
        onClear
          ? {
              label: t("generated.ui.clearSearch"),
              onClick: onClear,
              variant: "outline",
            }
          : undefined
      }
      className={className}
      description={t("generated.ui.changingSearchCriteriaUsingDifferent")}
      title={t("generated.shared.results")}
      variant="search"
    />
  )
}

export function FilterEmptyState({
  onClear,
  className,
  description,
}: {
  onClear?: () => void
  className?: string
  description?: string
}) {
  const t = useAppTranslations()
  const resolvedDescription =
    description ?? t("generated.ui.itemsMatchSelectedFiltersChanging")

  return (
    <EmptyState
      action={
        onClear
          ? {
              label: t("generated.shared.clearFilters"),
              onClick: onClear,
              variant: "outline",
              icon: Delete02Icon,
            }
          : undefined
      }
      className={className}
      description={resolvedDescription}
      title={t("generated.ui.matchingItems")}
      variant="filter"
    />
  )
}

export function NoItemsEmptyState({
  onAdd,
  itemName = "element",
  title,
  description,
  className,
  icon,
}: {
  onAdd?: () => void
  itemName?: string
  title?: string
  description?: string
  className?: string
  icon?: IconComponent
}) {
  const t = useAppTranslations()
  const resolvedTitle = title ?? t("generated.ui.s", { value0: itemName })
  const resolvedDescription =
    description ??
    t("generated.ui.dontAnySYetStart", {
      value0: itemName,
    })

  return (
    <EmptyState
      action={
        onAdd
          ? {
              label: t("generated.ui.add", { value0: itemName }),
              onClick: onAdd,
            }
          : undefined
      }
      className={className}
      description={resolvedDescription}
      icon={icon}
      title={resolvedTitle}
      variant="noItems"
    />
  )
}

export function NoDataEmptyState({ className }: { className?: string }) {
  const t = useAppTranslations()

  return (
    <EmptyState
      className={className}
      description={t("generated.ui.dataBeenLoadedYetRefreshing")}
      title={t("generated.shared.dataAvailable")}
      variant="noData"
    />
  )
}

export function ErrorEmptyState({
  onRetry,
  className,
}: {
  onRetry?: () => void
  className?: string
}) {
  const t = useAppTranslations()

  return (
    <EmptyState
      action={
        onRetry
          ? {
              label: t("generated.shared.again"),
              onClick: onRetry,
              variant: "outline",
              icon: ReloadIcon,
            }
          : undefined
      }
      className={className}
      description={t("generated.ui.problemLoadingDataAgain")}
      title={t("generated.ui.somethingWentWrong")}
      variant="error"
    />
  )
}
