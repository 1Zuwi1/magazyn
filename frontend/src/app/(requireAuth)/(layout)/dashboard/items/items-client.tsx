"use client"

import {
  BarCode02Icon,
  GridViewIcon,
  PackageIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { AssortmentTable } from "@/components/dashboard/items/assortment-table"
import { ItemsTable } from "@/components/dashboard/items/items-table"
import { PageHeader } from "@/components/dashboard/page-header"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import useAssortment from "@/hooks/use-assortment"
import useItems from "@/hooks/use-items"

type ItemsTab = "assortment" | "definitions"

const isItemsTab = (value: string | null): value is ItemsTab =>
  value === "assortment" || value === "definitions"

export default function ItemsClientPage() {
  const searchParams = useSearchParams()
  const requestedTabFromUrl = useMemo<ItemsTab>(() => {
    const tabParam = searchParams.get("tab")
    return isItemsTab(tabParam) ? tabParam : "assortment"
  }, [searchParams])
  const requestedSearchFromUrl = useMemo(() => {
    const searchParam = searchParams.get("search")
    return searchParam?.trim() ?? ""
  }, [searchParams])
  const [activeTab, setActiveTab] = useState<ItemsTab>(requestedTabFromUrl)

  useEffect(() => {
    if (requestedSearchFromUrl) {
      setActiveTab(requestedTabFromUrl)
    }
  }, [requestedTabFromUrl, requestedSearchFromUrl])

  const {
    data: assortment,
    isPending: isAssortmentPending,
    isError: isAssortmentError,
  } = useAssortment({
    page: 0,
    size: 1,
  })

  const {
    data: items,
    isPending: isItemsPending,
    isError: isItemsError,
  } = useItems({
    search: requestedSearchFromUrl,
    page: 0,
    size: 1,
  })

  const isPending = isAssortmentPending || isItemsPending
  const totalItems = items?.totalElements ?? 0
  const totalStock = assortment?.totalElements ?? 0

  const headerStats = [
    {
      label: "Na stanie",
      value:
        isPending || isAssortmentError
          ? "..."
          : totalStock.toLocaleString("pl-PL"),
    },
    {
      label: "Produkty",
      value: isPending || isItemsError ? "..." : totalItems,
    },
  ]

  return (
    <div className="space-y-8">
      <PageHeader
        description="Przeglądaj katalog produktów i monitoruj aktualne stany magazynowe w czasie rzeczywistym."
        icon={PackageIcon}
        iconBadge={isPending ? undefined : totalItems}
        stats={headerStats}
        title="Zarządzanie przedmiotami"
      />

      <Tabs
        className="space-y-0"
        onValueChange={(value) => {
          if (isItemsTab(value)) {
            setActiveTab(value)
          }
        }}
        value={activeTab}
      >
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="border-b px-4">
            <TabsList className="h-auto" variant="line">
              <TabsTrigger className="gap-2 py-2.5" value="assortment">
                <HugeiconsIcon className="size-3.5" icon={GridViewIcon} />
                <span>Stan Magazynowy</span>
                <Badge className="ml-1" variant="secondary">
                  {isAssortmentPending ? "..." : totalStock}
                </Badge>
              </TabsTrigger>
              <TabsTrigger className="gap-2 py-2.5" value="definitions">
                <HugeiconsIcon className="size-3.5" icon={BarCode02Icon} />
                <span>Katalog produktów</span>
                <Badge className="ml-1" variant="secondary">
                  {totalItems}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent className="p-4" value="assortment">
            <AssortmentTable />
          </TabsContent>
          <TabsContent className="p-4" value="definitions">
            <ItemsTable initialSearch={requestedSearchFromUrl} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
