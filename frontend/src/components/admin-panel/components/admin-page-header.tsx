"use client"

import { ArrowLeft02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import type { ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { removeAppLocalePrefix } from "@/i18n/locale"
import { cn } from "@/lib/utils"
import { getAdminNavLinks } from "../lib/constants"

interface AdminPageHeaderProps {
  /** Main title of the page */
  title: string
  /** Description text below the title */
  description?: string
  /** Icon to display in the header */
  icon?: IconSvgElement
  /** Badge count to display on the icon */
  iconBadge?: number | string
  /** URL to navigate back to (displays back arrow instead of icon) */
  backHref?: string
  /** Title for the back button */
  backTitle?: string
  /** Optional click handler for the back button */
  onBack?: () => void
  /** Navigation links */
  /** Additional badge to display next to the title */
  titleBadge?: string
  /** Additional content to render in the header actions area */
  actions?: ReactNode
  /** Children rendered below the header content */
  children?: ReactNode
}

export function AdminPageHeader({
  title,
  description,
  icon,
  iconBadge,
  backHref,
  backTitle,
  onBack,
  titleBadge,
  actions,
  children,
}: AdminPageHeaderProps) {
  const pathname = usePathname()
  const t = useTranslations()
  const backTitleT = backTitle ?? t("generated.admin.reports.shared.back")
  const renderIconOrBackButton = () => {
    if (onBack) {
      return (
        <Button
          aria-label={backTitleT}
          className={cn(
            "relative flex size-14 shrink-0 items-center justify-center rounded-xl transition-all hover:bg-primary/5 hover:ring-primary/30 sm:size-16"
          )}
          onClick={onBack}
          size="icon"
          title={backTitleT}
          type="button"
          variant="outline"
        >
          <HugeiconsIcon className="size-6 sm:size-7" icon={ArrowLeft02Icon} />
        </Button>
      )
    }

    if (backHref) {
      return (
        <Link
          aria-label={backTitle}
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

  const navLinks = getAdminNavLinks(t).map((link) => ({
    title: link.title,
    url: link.url,
  }))

  return (
    <header className="relative overflow-hidden rounded-2xl border bg-linear-to-br from-card via-card to-primary/2">
      {/* Decorative grid pattern */}
      <div className="mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,black_70%,transparent_100%)] pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[4rem_4rem] opacity-30" />

      {/* Decorative corner accent */}
      <div className="pointer-events-none absolute -top-24 -right-24 size-48 rounded-full bg-linear-to-br from-primary/10 to-transparent blur-3xl" />

      <div className="relative p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
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

          {/* Actions */}
          {actions && (
            <div className="flex flex-wrap items-center gap-3">{actions}</div>
          )}
        </div>

        {/* Navigation Links */}
        {navLinks && navLinks.length > 0 && (
          <nav className="mt-6 flex flex-wrap items-center gap-2 border-border/50 border-t pt-4">
            {navLinks.map((link) => {
              const url = removeAppLocalePrefix(link.url)
              const pathnameWithoutLocale = removeAppLocalePrefix(pathname)
              const isActive =
                pathnameWithoutLocale === url ||
                (url === "/admin" && pathnameWithoutLocale === "/admin/")

              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative flex items-center gap-2 rounded-lg px-3 py-2 font-medium text-sm transition-all",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  href={link.url}
                  key={link.url}
                >
                  {link.title}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-primary" />
                  )}
                </Link>
              )
            })}
          </nav>
        )}
      </div>
    </header>
  )
}
