import { ArrowLeft02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import type { ComponentProps, ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type IconComponent = ComponentProps<typeof HugeiconsIcon>["icon"]

interface StatItem {
  label: string
  value: string | number
  icon?: IconComponent
  variant?: "default" | "warning" | "destructive"
}

interface PageHeaderProps {
  /** Main title of the page */
  title: string
  /** Description text below the title */
  description?: string
  /** Icon to display in the header */
  icon?: IconComponent
  /** Badge count to display on the icon */
  iconBadge?: number | string
  /** URL to navigate back to (displays back arrow instead of icon) */
  backHref?: string
  /** Title for the back button */
  backTitle?: string
  /** Additional badge to display next to the title */
  titleBadge?: string
  /** Quick stats to display on the right side */
  stats?: StatItem[]
  /** Additional content to render below the title/description */
  children?: ReactNode
  /** Additional content to render in the stats area */
  statsChildren?: ReactNode
}

function StatCard({ label, value, icon, variant = "default" }: StatItem) {
  const valueClassName = cn(
    "font-bold font-mono text-lg",
    variant === "destructive" && "text-destructive",
    variant === "warning" && "text-orange-500",
    variant === "default" && "text-primary"
  )

  const borderClassName = cn(
    "flex flex-col items-center rounded-lg border bg-background/50 px-4 py-2 backdrop-blur-sm",
    variant === "destructive" && "border-destructive/20 bg-destructive/5",
    variant === "warning" && "border-orange-500/20 bg-orange-500/5"
  )

  return (
    <div className={borderClassName}>
      <div className="flex items-center gap-1">
        {icon && (
          <HugeiconsIcon
            className="size-3.5 text-muted-foreground"
            icon={icon}
          />
        )}
        <span className={valueClassName}>
          {typeof value === "number" ? value.toLocaleString("pl-PL") : value}
        </span>
      </div>
      <span className="text-muted-foreground text-xs">{label}</span>
    </div>
  )
}

export function PageHeader({
  title,
  description,
  icon,
  iconBadge,
  backHref,
  backTitle = "Wstecz",
  titleBadge,
  stats,
  children,
  statsChildren,
}: PageHeaderProps) {
  const renderIconOrBackButton = () => {
    if (backHref) {
      return (
        <Link
          className={cn(
            buttonVariants({ variant: "outline", size: "icon" }),
            "relative flex size-14 shrink-0 items-center justify-center rounded-xl transition-all hover:bg-primary/5 hover:ring-primary/30 sm:size-16"
          )}
          href={backHref}
          title={backTitle}
        >
          <HugeiconsIcon className="size-6 sm:size-7" icon={ArrowLeft02Icon} />
        </Link>
      )
    }

    if (icon) {
      return (
        <div className="relative flex size-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20 sm:size-16">
          <HugeiconsIcon
            className="size-7 text-primary sm:size-8"
            icon={icon}
          />
          {iconBadge !== undefined && (
            <div className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full bg-primary font-bold text-[10px] text-primary-foreground">
              {iconBadge}
            </div>
          )}
        </div>
      )
    }

    return null
  }

  return (
    <header className="relative overflow-hidden rounded-2xl border bg-linear-to-br from-card via-card to-primary/2 p-6 sm:p-8">
      {/* Decorative grid pattern */}
      <div className="mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,black_70%,transparent_100%)] pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[4rem_4rem] opacity-30" />

      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          {renderIconOrBackButton()}

          {/* Title and Description */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-semibold text-2xl tracking-tight sm:text-3xl">
                {title}
              </h1>
              {titleBadge && (
                <Badge className="font-mono" variant="outline">
                  {titleBadge}
                </Badge>
              )}
            </div>
            {description && (
              <p className="max-w-md text-muted-foreground text-sm">
                {description}
              </p>
            )}
            {children}
          </div>
        </div>

        {/* Quick Stats */}
        {(stats || statsChildren) && (
          <div className="flex flex-wrap items-center gap-3">
            {stats?.map((stat, index) => (
              <StatCard key={stat.label + index} {...stat} />
            ))}
            {statsChildren}
          </div>
        )}
      </div>
    </header>
  )
}
