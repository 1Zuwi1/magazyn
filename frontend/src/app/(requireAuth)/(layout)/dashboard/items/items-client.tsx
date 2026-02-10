"use client"

import {
  BarCode02Icon,
  GridViewIcon,
  PackageIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useSearchParams } from "next/navigation"
import { useLocale } from "next-intl"
import { useEffect, useMemo, useState } from "react"
import { AssortmentTable } from "@/components/dashboard/items/assortment-table"
import { ItemsTable } from "@/components/dashboard/items/items-table"
import { PageHeader } from "@/components/dashboard/page-header"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import useAssortment from "@/hooks/use-assortment"
import useItems from "@/hooks/use-items"
import { translateMessage } from "@/i18n/translate-message"

type ItemsTab = "assortment" | "definitions"

const isItemsTab = (value: string | null): value is ItemsTab =>
  value === "assortment" || value === "definitions"

export default function ItemsClientPage() {
  const locale = useLocale()
  const searchParams = useSearchParams()
  const requestedTabFromUrl = useMemo<ItemsTab>(() => {
    const tabParam = searchParams.get("tab")
    return isItemsTab(tabParam) ? tabParam : "assortment"
  }, [searchParams])
  const requestedSearchFromUrl = useMemo(() => {
    const searchParam = searchParams.get("search")
    return searchParam?.trim() ?? ""
  }, [searchParams])
  const initialAssortmentSearch =
    requestedTabFromUrl === "assortment" ? requestedSearchFromUrl : ""
  const initialDefinitionsSearch =
    requestedTabFromUrl === "definitions" ? requestedSearchFromUrl : ""
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
      label: translateMessage("generated.m0068"),
      value:
        isPending || isAssortmentError
          ? "..."
          : totalStock.toLocaleString(locale),
    },
    {
      label: translateMessage("generated.m0878"),
      value: isPending || isItemsError ? "..." : totalItems,
    },
  ]

  return (
    <div className="space-y-8">
      <PageHeader
        description={translateMessage("generated.m0069")}
        icon={PackageIcon}
        iconBadge={isPending ? undefined : totalItems}
        stats={headerStats}
        title={translateMessage("generated.m0070")}
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
                <span>{translateMessage("generated.m0071")}</span>
                <Badge className="ml-1" variant="secondary">
                  {isAssortmentPending ? "..." : totalStock}
                </Badge>
              </TabsTrigger>
              <TabsTrigger className="gap-2 py-2.5" value="definitions">
                <HugeiconsIcon className="size-3.5" icon={BarCode02Icon} />
                <span>{translateMessage("generated.m0072")}</span>
                <Badge className="ml-1" variant="secondary">
                  {totalItems}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent className="p-4" value="assortment">
            <AssortmentTable initialSearch={initialAssortmentSearch} />
          </TabsContent>
          <TabsContent className="p-4" value="definitions">
            <ItemsTable initialSearch={initialDefinitionsSearch} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
