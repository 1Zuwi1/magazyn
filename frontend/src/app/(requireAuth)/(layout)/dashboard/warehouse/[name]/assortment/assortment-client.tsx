import { PackageIcon } from "@hugeicons/core-free-icons"
import { useSearchParams } from "next/navigation"
import { AssortmentTableWithData } from "@/components/dashboard/items/assortment-table"
import { PageHeader } from "@/components/dashboard/page-header"
import useWarehouses from "@/hooks/use-warehouses"
import { ErrorEmptyState } from "@/components/ui/empty-state"
import useAssortments from "@/hooks/use-assortment"

export default function AssortmentClient() {
  const sp = useSearchParams()
  const wId = Number(sp.get("warehouseId") ?? -1)

  const {
    data: warehouse,
    isPending: isWarehousePending,
    isError: isWarehouseError,
    refetch: refetchWarehouse,
  } = useWarehouses({
    warehouseId: wId,
  })

  const {
    data: items,
    isPending: isItemsPending,
    isError: isItemsError,
    refetch: refetchItems,
  } = useAssortments({
    warehouseId: warehouse?.id ?? -1,
  })

  const isError = isWarehouseError || isItemsError

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

  if (isError) {
    return (
      <div className="space-y-8">
        <PageHeader
          backHref="/dashboard/warehouse"
          backTitle="Powrót do magazynu"
          description="Przeglądaj wszystkie produkty przechowywane w tym magazynie."
          title="Asortyment"
        />
        <ErrorEmptyState
          onRetry={() => {
            refetchWarehouse()
            refetchItems()
          }}
        />
      </div>
    )
  }

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

      <AssortmentTableWithData
        assortmentData={items}
        
        isLoading={isWarehousePending || isItemsPending}
      />
    </div>
  )
}
