import { PackageIcon } from "@hugeicons/core-free-icons"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { AssortmentTable } from "@/components/dashboard/items/assortment-table"
import { MOCK_ITEMS, MOCK_WAREHOUSES } from "@/components/dashboard/mock-data"
import { PageHeader } from "@/components/dashboard/page-header"
import ProtectedPage from "@/components/security/protected-page"

export default async function AssortmentPage() {
  return (
    <ProtectedPage>
      {async () => {
        const warehouseId = (await cookies()).get("warehouseId")?.value
        const warehouse = MOCK_WAREHOUSES.find((w) => w.id === warehouseId)

        if (!warehouse) {
          notFound()
        }

        const items = MOCK_ITEMS.filter(
          (item) => item.warehouseId === warehouseId
        )

        const dangerousCount = items.filter(
          (item) => item.definition.isDangerous
        ).length
        const expiringCount = items.filter((item) => {
          if (!item.expiryDate) {
            return false
          }
          const daysUntil = Math.ceil(
            (item.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          )
          return daysUntil <= 30 && daysUntil > 0
        }).length

        const headerStats = [
          {
            label: "Produktów",
            value: items.length,
            icon: PackageIcon,
          },
          ...(expiringCount > 0
            ? [
                {
                  label: "Wygasa <30d",
                  value: expiringCount,
                  variant: "warning" as const,
                },
              ]
            : []),
          ...(dangerousCount > 0
            ? [
                {
                  label: "Niebezp.",
                  value: dangerousCount,
                  variant: "destructive" as const,
                },
              ]
            : []),
        ]

        return (
          <div className="space-y-8">
            <PageHeader
              backHref={`/dashboard/warehouse/${encodeURIComponent(warehouse.name)}`}
              backTitle="Powrót do magazynu"
              description="Przeglądaj wszystkie produkty przechowywane w tym magazynie."
              stats={headerStats}
              title="Asortyment"
              titleBadge={warehouse.name}
            />

            <AssortmentTable items={items} />
          </div>
        )
      }}
    </ProtectedPage>
  )
}
