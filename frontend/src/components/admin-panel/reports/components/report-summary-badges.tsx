import {
  Alert01Icon,
  Calendar03Icon,
  PackageIcon,
  ThermometerIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { pluralize } from "@/components/dashboard/utils/helpers"
import { cn } from "@/lib/utils"

interface ReportSummary {
  totalExpiry: number
  urgentExpiry: number
  soonExpiry: number
  expiredCount: number
  tempAlerts: number
  criticalTempAlerts: number
  inventoryRows: number
  lowStockCount: number
}

interface ReportSummaryBadgesProps {
  summary: ReportSummary
}

interface BadgeItemProps {
  borderColor: string
  bgColor: string
  count: number
  icon: typeof Alert01Icon
  iconColor: string
  label: string
  sublabel?: string
  sublabelColor?: string
  textColor: string
}

function BadgeItem({
  borderColor,
  bgColor,
  count,
  icon,
  iconColor,
  label,
  sublabel,
  sublabelColor,
  textColor,
}: BadgeItemProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-lg border px-3 py-2 backdrop-blur-sm transition-colors",
        borderColor,
        bgColor
      )}
    >
      <div className={cn("rounded-md p-1.5", bgColor)}>
        <HugeiconsIcon className={cn("size-4", iconColor)} icon={icon} />
      </div>
      <div className="flex flex-col">
        <span
          className={cn("font-bold font-mono text-sm leading-tight", textColor)}
        >
          {count}
        </span>
        <span className={cn("text-[11px] leading-tight", `${textColor}/80`)}>
          {label}
          {sublabel && (
            <span className={cn("ml-1 font-semibold", sublabelColor)}>
              {sublabel}
            </span>
          )}
        </span>
      </div>
    </div>
  )
}

export function ReportSummaryBadges({ summary }: ReportSummaryBadgesProps) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      {summary.expiredCount > 0 && (
        <BadgeItem
          bgColor="bg-destructive/5"
          borderColor="border-destructive/30"
          count={summary.expiredCount}
          icon={Alert01Icon}
          iconColor="text-destructive"
          label={pluralize(
            summary.expiredCount,
            "przeterminowana partia",
            "przeterminowane partie",
            "przeterminowanych partii"
          )}
          textColor="text-destructive"
        />
      )}
      <BadgeItem
        bgColor="bg-background/60"
        borderColor="border-border"
        count={summary.soonExpiry}
        icon={Calendar03Icon}
        iconColor="text-primary"
        label={pluralize(
          summary.soonExpiry,
          "partia z krótką datą",
          "partie z krótką datą",
          "partii z krótką datą"
        )}
        textColor="text-primary"
      />
      <BadgeItem
        bgColor="bg-orange-500/10"
        borderColor="border-orange-500/30"
        count={summary.tempAlerts}
        icon={ThermometerIcon}
        iconColor="text-orange-600"
        label={pluralize(
          summary.tempAlerts,
          "odchylenie temperatury",
          "odchylenia temperatury",
          "odchyleń temperatury"
        )}
        sublabel={
          summary.criticalTempAlerts > 0
            ? `(${summary.criticalTempAlerts} kryt.)`
            : undefined
        }
        sublabelColor="text-destructive"
        textColor="text-orange-600"
      />
      <BadgeItem
        bgColor="bg-emerald-500/10"
        borderColor="border-emerald-500/30"
        count={summary.inventoryRows}
        icon={PackageIcon}
        iconColor="text-emerald-600"
        label={pluralize(
          summary.inventoryRows,
          "pozycja stanu",
          "pozycje stanu",
          "pozycji stanu"
        )}
        sublabel={
          summary.lowStockCount > 0
            ? `(${summary.lowStockCount} niski stan)`
            : undefined
        }
        sublabelColor="text-orange-600"
        textColor="text-emerald-600"
      />
    </div>
  )
}
