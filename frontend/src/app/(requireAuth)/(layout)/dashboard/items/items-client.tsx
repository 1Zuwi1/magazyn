"use client"

import {
  BarCode02Icon,
  GridViewIcon,
  PackageIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useMemo } from "react"
import { AssortmentTable } from "@/components/dashboard/items/assortment-table"
import { ItemsTable } from "@/components/dashboard/items/items-table"
import type {
  ItemDefinition,
  ItemInstance,
  ItemStats,
} from "@/components/dashboard/items/types"
import { PageHeader } from "@/components/dashboard/page-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import useAssortment, { type AssortmentListItem } from "@/hooks/use-assortment"

const DEFAULT_ASSORTMENT_PAGE = 0
const DEFAULT_ASSORTMENT_SIZE = 100
const DAY_IN_MILLISECONDS = 1000 * 60 * 60 * 24

const parseDate = (value: string): Date => {
  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return new Date(0)
  }
  return parsedDate
}

const calculateDaysUntilDate = (date: Date): number =>
  Math.ceil((date.getTime() - Date.now()) / DAY_IN_MILLISECONDS)

const createDefinition = (
  assortmentItem: AssortmentListItem,
  addedDate: Date
): ItemDefinition => {
  const definitionId = assortmentItem.itemId.toString()
  return {
    id: definitionId,
    name: `Produkt #${definitionId}`,
    category: "Bez kategorii",
    isDangerous: false,
    imageUrl: null,
    createdAt: addedDate,
    updatedAt: addedDate,
  }
}

const mapAssortmentItem = (
  assortmentItem: AssortmentListItem
): ItemInstance => {
  const addedDate = parseDate(assortmentItem.createdAt)
  const expiryDate = parseDate(assortmentItem.expiresAt)
  const rackId = assortmentItem.rackId.toString()

  return {
    id: assortmentItem.id.toString(),
    definitionId: assortmentItem.itemId.toString(),
    definition: createDefinition(assortmentItem, addedDate),
    qrCode: assortmentItem.barcode,
    addedDate,
    expiryDate,
    weight: 0,
    warehouseId: "unknown-warehouse",
    warehouseName: "Nieznany magazyn",
    rackId,
    rackName: `Regał #${rackId}`,
    position: {
      row: assortmentItem.positionY,
      col: assortmentItem.positionX,
    },
  }
}

const buildItemStats = (items: ItemInstance[]): ItemStats[] => {
  const statsByDefinition = new Map<string, ItemStats>()

  for (const item of items) {
    const existingStat = statsByDefinition.get(item.definitionId)

    if (!existingStat) {
      statsByDefinition.set(item.definitionId, {
        definitionId: item.definitionId,
        definition: item.definition,
        totalQuantity: 1,
        warehouseQuantities: {
          [item.warehouseId]: 1,
        },
        nearestExpiryDate: item.expiryDate,
        daysUntilExpiry: calculateDaysUntilDate(item.expiryDate),
        weight: item.weight,
      })
      continue
    }

    existingStat.totalQuantity += 1
    existingStat.warehouseQuantities[item.warehouseId] =
      (existingStat.warehouseQuantities[item.warehouseId] ?? 0) + 1

    if (
      !existingStat.nearestExpiryDate ||
      item.expiryDate < existingStat.nearestExpiryDate
    ) {
      existingStat.nearestExpiryDate = item.expiryDate
    }
  }

  for (const stat of statsByDefinition.values()) {
    if (stat.nearestExpiryDate) {
      stat.daysUntilExpiry = calculateDaysUntilDate(stat.nearestExpiryDate)
    }
  }

  return [...statsByDefinition.values()]
}

export default function ItemsClientPage() {
  const { data, isPending, isError, error } = useAssortment({
    page: DEFAULT_ASSORTMENT_PAGE,
    size: DEFAULT_ASSORTMENT_SIZE,
  })

  const assortmentItems = useMemo(
    () => (data?.content ?? []).map(mapAssortmentItem),
    [data?.content]
  )
  const itemStats = useMemo(
    () => buildItemStats(assortmentItems),
    [assortmentItems]
  )

  const totalItems = itemStats.length
  const totalStock = data?.totalElements ?? assortmentItems.length

  const headerStats = [
    {
      label: "Na stanie",
      value: totalStock.toLocaleString("pl-PL"),
    },
    {
      label: "Produkty",
      value: totalItems,
    },
  ]

  return (
    <div className="space-y-8">
      <PageHeader
        description="Przeglądaj katalog produktów i monitoruj aktualne stany magazynowe w czasie rzeczywistym."
        icon={PackageIcon}
        iconBadge={totalItems}
        stats={headerStats}
        title="Zarządzanie przedmiotami"
      />

      {isError && (
        <Alert variant="destructive">
          <AlertTitle>Nie udało się pobrać asortymentu</AlertTitle>
          <AlertDescription>
            {error instanceof Error
              ? error.message
              : "Spróbuj ponownie za chwilę."}
          </AlertDescription>
        </Alert>
      )}

      <Tabs className="space-y-6" defaultValue="assortment">
        <div className="flex items-center justify-between gap-4">
          <TabsList className="p-1">
            <TabsTrigger className="gap-2 px-4" value="assortment">
              <HugeiconsIcon className="size-4" icon={GridViewIcon} />
              <span>Stan Magazynowy</span>
              <Badge className="ml-1" variant="secondary">
                {itemStats.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger className="gap-2 px-4" value="definitions">
              <HugeiconsIcon className="size-4" icon={BarCode02Icon} />
              <span>Katalog produktów</span>
              <Badge className="ml-1" variant="secondary">
                {assortmentItems.length}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent className="space-y-4" value="assortment">
          <ItemsTable isLoading={isPending} items={itemStats} />
        </TabsContent>
        <TabsContent className="space-y-4" value="definitions">
          <AssortmentTable isLoading={isPending} items={assortmentItems} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
