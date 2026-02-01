"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"

type IconComponent = ComponentProps<typeof HugeiconsIcon>["icon"]

interface StatCardProps {
  label: string
  value: string | number
  hint: string
  icon: IconComponent
  variant?: "default" | "primary" | "success" | "warning" | "danger"
  trend?: {
    value: number
    label: string
    isPositive?: boolean
  }
}

function getVariantStyles(variant: StatCardProps["variant"] = "default") {
  switch (variant) {
    case "primary":
      return {
        iconBg: "bg-primary/10",
        iconColor: "text-primary",
        decorativeBg: "from-primary/5 via-transparent to-transparent",
        accentColor: "bg-primary",
      }
    case "success":
      return {
        iconBg: "bg-emerald-500/10",
        iconColor: "text-emerald-500",
        decorativeBg: "from-emerald-500/5 via-transparent to-transparent",
        accentColor: "bg-emerald-500",
      }
    case "warning":
      return {
        iconBg: "bg-orange-500/10",
        iconColor: "text-orange-500",
        decorativeBg: "from-orange-500/5 via-transparent to-transparent",
        accentColor: "bg-orange-500",
      }
    case "danger":
      return {
        iconBg: "bg-destructive/10",
        iconColor: "text-destructive",
        decorativeBg: "from-destructive/5 via-transparent to-transparent",
        accentColor: "bg-destructive",
      }
    default:
      return {
        iconBg: "bg-muted",
        iconColor: "text-muted-foreground",
        decorativeBg: "from-muted/30 via-transparent to-transparent",
        accentColor: "bg-muted-foreground",
      }
  }
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  variant = "default",
  trend,
}: StatCardProps) {
  const styles = getVariantStyles(variant)

  return (
    <div className="group relative overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:shadow-md">
      {/* Decorative gradient background */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-linear-to-br opacity-50",
          styles.decorativeBg
        )}
      />

      {/* Decorative grid pattern */}
      <div className="mask-[radial-gradient(ellipse_80%_80%_at_100%_0%,black_30%,transparent_70%)] pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[3rem_3rem] opacity-20" />

      {/* Accent line */}
      <div
        className={cn(
          "absolute top-0 left-0 h-1 w-full",
          styles.accentColor,
          "opacity-0 transition-opacity group-hover:opacity-100"
        )}
      />

      <div className="relative p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-muted-foreground text-sm">{label}</p>
            <p className="font-bold font-mono text-3xl tracking-tight">
              {value}
            </p>
          </div>
          <div
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105",
              styles.iconBg
            )}
          >
            <HugeiconsIcon
              className={cn("size-6", styles.iconColor)}
              icon={icon}
            />
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <p className="text-muted-foreground text-sm">{hint}</p>
          {trend && (
            <span
              className={cn(
                "flex items-center gap-0.5 rounded-full px-2 py-0.5 font-medium text-xs",
                trend.isPositive
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-red-500/10 text-red-600 dark:text-red-400"
              )}
            >
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
              <span className="ml-0.5 text-muted-foreground">
                {trend.label}
              </span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

interface QuickActionCardProps {
  title: string
  description: string
  icon: IconComponent
  href: string
}

export function QuickActionCard({
  title,
  description,
  icon,
}: QuickActionCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl border bg-card p-4 transition-all hover:border-primary/30 hover:bg-primary/2 hover:shadow-sm">
      {/* Decorative corner gradient */}
      <div className="pointer-events-none absolute -top-12 -right-12 size-24 rounded-full bg-linear-to-br from-primary/10 to-transparent opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />

      <div className="relative flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary/10 to-muted transition-all group-hover:from-primary/20 group-hover:to-primary/5">
          <HugeiconsIcon
            className="size-6 text-primary transition-transform group-hover:scale-110"
            icon={icon}
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-sm group-hover:text-primary">
            {title}
          </h3>
          <p className="mt-0.5 text-muted-foreground text-xs">{description}</p>
        </div>
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted/50 opacity-0 transition-all group-hover:opacity-100">
          <span className="text-muted-foreground text-sm">→</span>
        </div>
      </div>
    </div>
  )
}

interface InsightCardProps {
  title: string
  description: string
  children: React.ReactNode
  icon?: IconComponent
}

export function InsightCard({
  title,
  description,
  children,
  icon,
}: InsightCardProps) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      {/* Header with decorative pattern */}
      <div className="relative overflow-hidden border-b bg-linear-to-br from-muted/50 via-transparent to-transparent px-5 py-4">
        <div className="mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,black_70%,transparent_100%)] pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[2rem_2rem] opacity-20" />

        <div className="relative flex items-center gap-3">
          {icon && (
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <HugeiconsIcon className="size-4.5 text-primary" icon={icon} />
            </div>
          )}
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-muted-foreground text-xs">{description}</p>
          </div>
        </div>
      </div>

      <div className="p-5">{children}</div>
    </div>
  )
}
