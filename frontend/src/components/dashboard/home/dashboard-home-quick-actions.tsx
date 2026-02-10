import { GroupItemsIcon, Package } from "@hugeicons/core-free-icons"
import Link from "next/link"
import { QuickActionCard } from "@/components/dashboard/stat-card"
import { translateMessage } from "@/i18n/translate-message"

export function DashboardHomeQuickActions() {
  return (
    <section aria-labelledby="dashboard-actions" className="space-y-4">
      <div>
        <h2 className="font-semibold text-xl" id="dashboard-actions">
          {translateMessage("generated.m0431")}
        </h2>
        <p className="text-muted-foreground text-sm">
          {translateMessage("generated.m0432")}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Link href="/dashboard/warehouse">
          <QuickActionCard
            description={translateMessage("generated.m0433")}
            href="/dashboard/warehouse"
            icon={Package}
            title={translateMessage("generated.m0434")}
          />
        </Link>
        <Link href="/dashboard/items">
          <QuickActionCard
            description={translateMessage("generated.m0435")}
            href="/dashboard/items"
            icon={GroupItemsIcon}
            title={translateMessage("generated.m0882")}
          />
        </Link>
      </div>
    </section>
  )
}
