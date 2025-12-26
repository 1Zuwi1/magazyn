import { Package } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Warehouse } from "./types"

interface WarehouseGridProps {
  warehouses: Warehouse[]
  onSelect: (warehouse: Warehouse) => void
}

export function WarehouseGrid({ warehouses, onSelect }: WarehouseGridProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {warehouses.map((storage) => (
        <Card
          className="cursor-pointer transition-shadow hover:shadow-lg"
          key={storage.id}
          onClick={() => onSelect(storage)}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">{storage.name}</CardTitle>
                <CardDescription className="mt-1 flex items-center" />
              </div>
              <Badge
                variant={
                  storage.used / storage.capacity > 0.9
                    ? "destructive"
                    : "secondary"
                }
              >
                {Math.round((storage.used / storage.capacity) * 100)}% Pełny
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Zapełnienie</span>
                  <span className="font-medium">
                    {storage.used} / {storage.capacity} miejsc
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`h-full rounded-full ${storage.used / storage.capacity > 0.9 ? "bg-destructive" : "bg-primary"}`}
                    style={{
                      width: `${(storage.used / storage.capacity) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center text-muted-foreground">
                  <Package className="mr-2 h-4 w-4" />
                  {storage.racks.length} Regałów
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="outline">
              Zobacz Regały
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
