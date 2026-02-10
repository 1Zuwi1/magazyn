import { translateMessage } from "@/i18n/translate-message"
import { DashboardOperationalAlertsCard } from "./dashboard-operational-alerts-card"
import { DashboardRecentArrivalsCard } from "./dashboard-recent-arrivals-card"
import DashboardTopOccupiedWarehousesCard from "./dashboard-top-occupied-warehouses-card"

export function DashboardHomeInsights() {
  return (
    <section
      aria-labelledby="dashboard-insights"
      className="@container space-y-4"
    >
      <div>
        <h2 className="font-semibold text-xl" id="dashboard-insights">
          {translateMessage("generated.dashboard.home.operationalInsight")}
        </h2>
        <p className="text-muted-foreground text-sm">
          {translateMessage(
            "generated.dashboard.home.mostImportantAlertsLatestReceipts"
          )}
        </p>
      </div>
      <div className="grid @5xl:grid-cols-3 @md:grid-cols-2 gap-6">
        <DashboardOperationalAlertsCard />
        <DashboardRecentArrivalsCard />
        <DashboardTopOccupiedWarehousesCard />
      </div>
    </section>
  )
}
