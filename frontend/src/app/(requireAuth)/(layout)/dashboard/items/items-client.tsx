"use client"

import {
  BarCode02Icon,
  GridViewIcon,
  PackageIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { AssortmentTable } from "@/components/dashboard/items/assortment-table"
import { ItemsTable } from "@/components/dashboard/items/items-table"
import { PageHeader } from "@/components/dashboard/page-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import useAssortment from "@/hooks/use-assortment"
import useItems from "@/hooks/use-items"

const DEFAULT_ASSORTMENT_PAGE = 0
const DEFAULT_ASSORTMENT_SIZE = 100
export default function ItemsClientPage() {
  const {
    data: assortment,
    isError: isAssortmentError,
    error: assortmentError,
  } = useAssortment({
    page: DEFAULT_ASSORTMENT_PAGE,
    size: DEFAULT_ASSORTMENT_SIZE,
  })

  const { data: items, isError: isItemsError, error: itemsError } = useItems()

  const totalItems = items?.totalElements ?? items?.content.length ?? 0
  const totalStock =
    assortment?.totalElements ?? assortment?.content.length ?? 0

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

      {isAssortmentError && (
        <Alert variant="destructive">
          <AlertTitle>Nie udało się pobrać asortymentu</AlertTitle>
          <AlertDescription>
            {assortmentError instanceof Error
              ? assortmentError.message
              : "Spróbuj ponownie za chwilę."}
          </AlertDescription>
        </Alert>
      )}

      {isItemsError && (
        <Alert variant="destructive">
          <AlertTitle>Nie udało się pobrać katalogu produktów</AlertTitle>
          <AlertDescription>
            {itemsError instanceof Error
              ? itemsError.message
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
                {totalStock}
              </Badge>
            </TabsTrigger>
            <TabsTrigger className="gap-2 px-4" value="definitions">
              <HugeiconsIcon className="size-4" icon={BarCode02Icon} />
              <span>Katalog produktów</span>
              <Badge className="ml-1" variant="secondary">
                {totalItems}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent className="space-y-4" value="assortment">
          <AssortmentTable />
        </TabsContent>
        <TabsContent className="space-y-4" value="definitions">
          <ItemsTable />
        </TabsContent>
      </Tabs>
    </div>
  )
}
