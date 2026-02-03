"use client"

import {
  Add01Icon,
  FilterIcon,
  InboxIcon,
  PackageIcon,
  Search01Icon,
  Settings01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type { ComponentProps } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type IconComponent = ComponentProps<typeof HugeiconsIcon>["icon"]

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
            <p className={cn("text-muted-foreground", sizeStyles.description)}>
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
                  <HugeiconsIcon className="mr-1.5 size-4" icon={Add01Icon} />
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
  return (
    <EmptyState
      action={
        onClear
          ? {
              label: "Wyczyść wyszukiwanie",
              onClick: onClear,
              variant: "outline",
            }
          : undefined
      }
      className={className}
      description="Spróbuj zmienić kryteria wyszukiwania lub użyj innych słów kluczowych."
      title="Brak wyników"
      variant="search"
    />
  )
}

export function FilterEmptyState({
  onClear,
  className,
}: {
  onClear?: () => void
  className?: string
}) {
  return (
    <EmptyState
      action={
        onClear
          ? {
              label: "Wyczyść filtry",
              onClick: onClear,
              variant: "outline",
            }
          : undefined
      }
      className={className}
      description="Żadne elementy nie pasują do wybranych filtrów. Spróbuj zmienić ustawienia filtrowania."
      title="Brak pasujących elementów"
      variant="filter"
    />
  )
}

export function NoItemsEmptyState({
  onAdd,
  itemName = "element",
  className,
}: {
  onAdd?: () => void
  itemName?: string
  className?: string
}) {
  return (
    <EmptyState
      action={
        onAdd
          ? {
              label: `Dodaj ${itemName}`,
              onClick: onAdd,
            }
          : undefined
      }
      className={className}
      description={`Nie masz jeszcze żadnych ${itemName}ów. Zacznij od dodania pierwszego.`}
      title={`Brak ${itemName}ów`}
      variant="noItems"
    />
  )
}

export function NoDataEmptyState({ className }: { className?: string }) {
  return (
    <EmptyState
      className={className}
      description="Dane nie zostały jeszcze załadowane. Spróbuj odświeżyć stronę."
      title="Brak danych"
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
  return (
    <EmptyState
      action={
        onRetry
          ? {
              label: "Spróbuj ponownie",
              onClick: onRetry,
              variant: "outline",
            }
          : undefined
      }
      className={className}
      description="Wystąpił problem podczas ładowania danych. Spróbuj ponownie."
      title="Coś poszło nie tak"
      variant="error"
    />
  )
}
