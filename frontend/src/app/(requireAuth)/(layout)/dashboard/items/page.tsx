import {
  BarCode02Icon,
  GridViewIcon,
  PackageIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { AssortmentTable } from "@/components/dashboard/items/assortment-table"
import { ItemsTable } from "@/components/dashboard/items/items-table"
import { MOCK_ITEM_STATS, MOCK_ITEMS } from "@/components/dashboard/mock-data"
import { PageHeader } from "@/components/dashboard/page-header"
import ProtectedPage from "@/components/security/protected-page"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ItemsPage() {
  const totalItems = MOCK_ITEMS.length
  const totalStock = MOCK_ITEM_STATS.reduce(
    (acc, item) => acc + item.totalQuantity,
    0
  )

  const headerStats = [
    {
      label: "Produkty",
      value: totalItems,
    },
    {
      label: "Na stanie",
      value: totalStock.toLocaleString("pl-PL"),
    },
  ]

  return (
    <ProtectedPage>
      {() => (
        <div className="space-y-8">
          <PageHeader
            description="Przeglądaj katalog produktów i monitoruj aktualne stany magazynowe w czasie rzeczywistym."
            icon={PackageIcon}
            iconBadge={totalItems}
            stats={headerStats}
            title="Zarządzanie przedmiotami"
          />

          {/* Tabs Section */}
          <Tabs className="space-y-6" defaultValue="assortment">
            <div className="flex items-center justify-between gap-4">
              <TabsList className="p-1">
                <TabsTrigger className="gap-2 px-4" value="assortment">
                  <HugeiconsIcon className="size-4" icon={GridViewIcon} />
                  <span>Katalog Produktów</span>
                  <Badge className="ml-1" variant="secondary">
                    {MOCK_ITEM_STATS.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger className="gap-2 px-4" value="definitions">
                  <HugeiconsIcon className="size-4" icon={BarCode02Icon} />
                  <span>Stan Magazynowy</span>
                  <Badge className="ml-1" variant="secondary">
                    {MOCK_ITEMS.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent className="space-y-4" value="assortment">
              <ItemsTable items={MOCK_ITEM_STATS} />
            </TabsContent>
            <TabsContent className="space-y-4" value="definitions">
              <AssortmentTable items={MOCK_ITEMS} />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </ProtectedPage>
  )
}
