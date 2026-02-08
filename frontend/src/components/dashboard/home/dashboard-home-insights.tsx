import { DashboardOperationalAlertsCard } from "./dashboard-operational-alerts-card"
import { DashboardRecentArrivalsCard } from "./dashboard-recent-arrivals-card"
import DashboardTopOccupiedWarehousesCard from "./dashboard-top-occupied-warehouses-card"

export function DashboardHomeInsights() {
  return (
    <section aria-labelledby="dashboard-insights" className="space-y-4">
      <div>
        <h2 className="font-semibold text-xl" id="dashboard-insights">
          Wgląd operacyjny
        </h2>
        <p className="text-muted-foreground text-sm">
          Najważniejsze alerty, ostatnie przyjęcia i obłożenie magazynów.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <DashboardOperationalAlertsCard />
        <DashboardRecentArrivalsCard />
        <DashboardTopOccupiedWarehousesCard />
      </div>
    </section>
  )
}
