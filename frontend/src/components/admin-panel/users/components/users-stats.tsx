import { Cancel01Icon, CheckmarkBadge01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { useTranslations } from "next-intl"

interface UsersStatsProps {
  total: number
  active: number
  inactive: number
}

export function UsersStats({ total, active, inactive }: UsersStatsProps) {
  const t = useTranslations()

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 rounded-lg border bg-background/50 px-3 py-1.5 backdrop-blur-sm">
        <span className="font-mono font-semibold text-primary">{total}</span>
        <span className="text-muted-foreground text-xs">
          {t("generated.shared.together")}
        </span>
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5">
        <HugeiconsIcon
          className="size-3.5 text-emerald-500"
          icon={CheckmarkBadge01Icon}
        />
        <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
          {active}
        </span>
        <span className="text-muted-foreground text-xs">
          {t("generated.admin.users.active")}
        </span>
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-orange-500/20 bg-orange-500/5 px-3 py-1.5">
        <HugeiconsIcon
          className="size-3.5 text-orange-500"
          icon={Cancel01Icon}
        />
        <span className="font-mono font-semibold text-orange-600 dark:text-orange-400">
          {inactive}
        </span>
        <span className="text-muted-foreground text-xs">
          {t("generated.admin.users.others")}
        </span>
      </div>
    </div>
  )
}
