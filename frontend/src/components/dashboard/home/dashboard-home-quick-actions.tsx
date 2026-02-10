import { GroupItemsIcon, Package } from "@hugeicons/core-free-icons"
import Link from "next/link"
import { QuickActionCard } from "@/components/dashboard/stat-card"
import { translateMessage } from "@/i18n/translate-message"

export function DashboardHomeQuickActions() {
  return (
    <section aria-labelledby="dashboard-actions" className="space-y-4">
      <div>
        <h2 className="font-semibold text-xl" id="dashboard-actions">
          {translateMessage("generated.dashboard.home.quickActions")}
        </h2>
        <p className="text-muted-foreground text-sm">
          {translateMessage("generated.dashboard.home.mostCommonTasksOnePlace")}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Link href="/dashboard/warehouse">
          <QuickActionCard
            description={translateMessage(
              "generated.dashboard.home.manageLocationsRacks"
            )}
            href="/dashboard/warehouse"
            icon={Package}
            title={translateMessage("generated.dashboard.home.warehouseReview")}
          />
        </Link>
        <Link href="/dashboard/items">
          <QuickActionCard
            description={translateMessage(
              "generated.dashboard.home.productCatalogStockLevels"
            )}
            href="/dashboard/items"
            icon={GroupItemsIcon}
            title={translateMessage("generated.shared.assortment")}
          />
        </Link>
      </div>
    </section>
  )
}
