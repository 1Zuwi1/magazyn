import { GroupItemsIcon, Package } from "@hugeicons/core-free-icons"
import Link from "next/link"
import { QuickActionCard } from "@/components/dashboard/stat-card"

export function DashboardHomeQuickActions() {
  return (
    <section aria-labelledby="dashboard-actions" className="space-y-4">
      <div>
        <h2 className="font-semibold text-xl" id="dashboard-actions">
          Szybkie akcje
        </h2>
        <p className="text-muted-foreground text-sm">
          Najczęstsze zadania w jednym miejscu.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Link href="/dashboard/warehouse">
          <QuickActionCard
            description="Zarządzaj lokalizacjami i regałami"
            href="/dashboard/warehouse"
            icon={Package}
            title="Przegląd magazynów"
          />
        </Link>
        <Link href="/dashboard/items">
          <QuickActionCard
            description="Katalog produktów i stany magazynowe"
            href="/dashboard/items"
            icon={GroupItemsIcon}
            title="Asortyment"
          />
        </Link>
      </div>
    </section>
  )
}
