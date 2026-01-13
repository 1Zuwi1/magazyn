import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import ProtectedPage from "@/app/(requireAuth)/protected-page"
import { AssortmentTable } from "@/components/dashboard/items/assortment-table"
import { MOCK_ITEMS, MOCK_WAREHOUSES } from "@/components/dashboard/mock-data"

export default async function AssortmentPage() {
  const t = await getTranslations("assortmentPage")
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
        return (
          <div className="container mx-auto">
            <div className="mb-6">
              <h1 className="font-bold text-3xl">
                {t("title", { id: warehouse.id })}
              </h1>
              <p className="text-muted-foreground">{t("subtitle")}</p>
            </div>
            <AssortmentTable items={items} />
          </div>
        )
      }}
    </ProtectedPage>
  )
}
