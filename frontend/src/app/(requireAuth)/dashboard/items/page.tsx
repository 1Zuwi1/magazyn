import { AssortmentTable } from "@/components/dashboard/items/assortment-table"
import { ItemsTable } from "@/components/dashboard/items/items-table"
import { MOCK_ITEM_STATS, MOCK_ITEMS } from "@/components/dashboard/mock-data"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ProtectedPage from "../../protected-page"

export default function ItemsPage() {
  return (
    <ProtectedPage>
      {() => (
        <div className="space-y-6">
          <div>
            <h1 className="font-bold text-3xl tracking-tight">
              Zarządzanie przedmiotami
            </h1>
            <p className="text-muted-foreground">
              Przeglądaj katalog produktów i aktualne stany magazynowe
            </p>
          </div>

          <Tabs className="space-y-4" defaultValue="assortment">
            <TabsList>
              <TabsTrigger value="assortment">Stan Magazynowy</TabsTrigger>
              <TabsTrigger value="definitions">Katalog Produktów</TabsTrigger>
            </TabsList>
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
