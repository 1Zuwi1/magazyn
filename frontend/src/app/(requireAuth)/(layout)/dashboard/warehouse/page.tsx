import { WarehouseContent } from "@/components/dashboard/warehouse-content"
import ProtectedPage from "@/components/security/protected-page"

export default function WarehousePage() {
  return (
    <ProtectedPage>
      <div className="space-y-6">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Magazyny</h1>
          <p className="text-muted-foreground">
            Wyszukuj lokalizacje, sprawdzaj obłożenie i przechodź do regałów.
          </p>
        </div>
        <WarehouseContent />
      </div>
    </ProtectedPage>
  )
}
