"use client"

import { ArrowRight02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface AdminStatCardProps {
  title: string
  value: number | string
  description?: string
  icon: IconSvgElement
  href: string
  variant?: "default" | "primary" | "success" | "warning" | "danger"
  trend?: {
    value: number
    label: string
    isPositive?: boolean
  }
}

function getVariantStyles(variant: AdminStatCardProps["variant"] = "default") {
  switch (variant) {
    case "primary":
      return {
        iconBg: "bg-primary/10",
        iconColor: "text-primary",
        decorativeBg: "from-primary/5 via-transparent to-transparent",
        accentColor: "bg-primary",
        valueColor: "text-primary",
      }
    case "success":
      return {
        iconBg: "bg-emerald-500/10",
        iconColor: "text-emerald-500",
        decorativeBg: "from-emerald-500/5 via-transparent to-transparent",
        accentColor: "bg-emerald-500",
        valueColor: "text-emerald-600 dark:text-emerald-400",
      }
    case "warning":
      return {
        iconBg: "bg-orange-500/10",
        iconColor: "text-orange-500",
        decorativeBg: "from-orange-500/5 via-transparent to-transparent",
        accentColor: "bg-orange-500",
        valueColor: "text-orange-600 dark:text-orange-400",
      }
    case "danger":
      return {
        iconBg: "bg-destructive/10",
        iconColor: "text-destructive",
        decorativeBg: "from-destructive/5 via-transparent to-transparent",
        accentColor: "bg-destructive",
        valueColor: "text-destructive",
      }
    default:
      return {
        iconBg: "bg-muted",
        iconColor: "text-muted-foreground",
        decorativeBg: "from-muted/30 via-transparent to-transparent",
        accentColor: "bg-muted-foreground",
        valueColor: "",
      }
  }
}

export function AdminStatCard({
  title,
  value,
  description,
  icon,
  href,
  variant = "default",
  trend,
}: AdminStatCardProps) {
  const styles = getVariantStyles(variant)

  return (
    <Link className="group block" href={href}>
      <div className="relative overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:shadow-md">
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
              <p className="text-muted-foreground text-sm">{title}</p>
              <p
                className={cn(
                  "font-bold font-mono text-3xl tracking-tight",
                  styles.valueColor
                )}
              >
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

          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {description && (
                <p className="text-muted-foreground text-sm">{description}</p>
              )}
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
            <div className="flex size-6 items-center justify-center rounded-full bg-muted/50 opacity-0 transition-all group-hover:opacity-100">
              <HugeiconsIcon
                className="size-3.5 text-muted-foreground"
                icon={ArrowRight02Icon}
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
