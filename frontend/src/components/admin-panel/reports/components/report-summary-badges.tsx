import { PackageIcon, ThermometerIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { pluralize } from "@/components/dashboard/utils/helpers"

interface ReportSummary {
  totalExpiry: number
  urgentExpiry: number
  tempAlerts: number
  inventoryRows: number
}

interface ReportSummaryBadgesProps {
  summary: ReportSummary
}

export function ReportSummaryBadges({ summary }: ReportSummaryBadgesProps) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 rounded-lg border bg-background/60 px-3 py-1.5 backdrop-blur-sm">
        <HugeiconsIcon className="size-3.5 text-primary" icon={PackageIcon} />
        <span className="font-mono font-semibold text-primary">
          {summary.totalExpiry}
        </span>
        <span className="text-muted-foreground text-xs">
          {pluralize(
            summary.totalExpiry,
            "partia z krótką datą",
            "partie z krótką datą",
            "partii z krótką datą"
          )}
        </span>
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-1.5 backdrop-blur-sm">
        <span className="font-mono font-semibold text-destructive">
          {summary.urgentExpiry}
        </span>
        <span className="text-destructive/80 text-xs">
          {pluralize(
            summary.urgentExpiry,
            "pilny alert",
            "pilne alerty",
            "pilnych alertów"
          )}
        </span>
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 backdrop-blur-sm">
        <HugeiconsIcon
          className="size-3.5 text-orange-600"
          icon={ThermometerIcon}
        />
        <span className="font-mono font-semibold text-orange-600">
          {summary.tempAlerts}
        </span>
        <span className="text-orange-600/80 text-xs">
          {pluralize(
            summary.tempAlerts,
            "odchylenie temperatury",
            "odchylenia temperatury",
            "odchyleń temperatury"
          )}
        </span>
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 backdrop-blur-sm">
        <span className="font-mono font-semibold text-emerald-600">
          {summary.inventoryRows}
        </span>
        <span className="text-emerald-600/80 text-xs">
          {pluralize(
            summary.inventoryRows,
            "pozycja stanu",
            "pozycji stanu",
            "pozycji stanu"
          )}
        </span>
      </div>
    </div>
  )
}
