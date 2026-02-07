import { PackageIcon } from "@hugeicons/core-free-icons"
import { useSearchParams } from "next/navigation"
import { AssortmentTable } from "@/components/dashboard/items/assortment-table"
import { PageHeader } from "@/components/dashboard/page-header"
import useItems from "@/hooks/use-items"
import useWarehouses from "@/hooks/use-warehouses"

export default function AssortmentClient() {
  const sp = useSearchParams()
  const wId = Number(sp.get("warehouseId") ?? -1)

  const { data: warehouse } = useWarehouses({
    warehouseId: wId,
  })

  const { data: items } = useItems({
    warehouseId: warehouse?.id ?? -1,
  })

  // const dangerousCount = items?.filter(
  //   (item) => item.definition.isDangerous
  // ).length
  // const expiringCount = items?.filter((item) => {
  //   if (!item.expiryDate) {
  //     return false
  //   }
  //   const daysUntil = Math.ceil(
  //     (item.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  //   )
  //   return daysUntil <= 30 && daysUntil > 0
  // }).length

  const headerStats = [
    {
      label: "Produktów",
      value: items?.totalElements ?? 0,
      icon: PackageIcon,
    },
    // ...(expiringCount > 0
    //   ? [
    //       {
    //         label: "Wygasa <30d",
    //         value: expiringCount,
    //         variant: "warning" as const,
    //       },
    //     ]
    //   : []),
    // ...(dangerousCount > 0
    //   ? [
    //       {
    //         label: "Niebezp.",
    //         value: dangerousCount,
    //         variant: "destructive" as const,
    //       },
    //     ]
    //   : []),
  ]

  return (
    <div className="space-y-8">
      <PageHeader
        backHref={`/dashboard/warehouse/${encodeURIComponent(warehouse?.name ?? "")}`}
        backTitle="Powrót do magazynu"
        description="Przeglądaj wszystkie produkty przechowywane w tym magazynie."
        stats={headerStats}
        title="Asortyment"
        titleBadge={warehouse?.name}
      />

      <AssortmentTable />
    </div>
  )
}
