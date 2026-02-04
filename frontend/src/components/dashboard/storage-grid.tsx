import {
  ArrowRight01Icon,
  CubeIcon,
  Layers01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { Warehouse } from "./types"
import { getOccupancyPercentage, pluralize } from "./utils/helpers"

const OCCUPANCY_WARNING_THRESHOLD = 75
const OCCUPANCY_CRITICAL_THRESHOLD = 90

interface WarehouseGridProps {
  warehouses: Warehouse[]
}

const getOccupancyColor = (percentage: number): string => {
  if (percentage >= OCCUPANCY_CRITICAL_THRESHOLD) {
    return "bg-destructive"
  }
  if (percentage >= OCCUPANCY_WARNING_THRESHOLD) {
    return "bg-orange-500"
  }
  return "bg-primary"
}

const getOccupancyBadgeVariant = (
  percentage: number
): "destructive" | "warning" | "secondary" => {
  if (percentage >= OCCUPANCY_CRITICAL_THRESHOLD) {
    return "destructive"
  }
  if (percentage >= OCCUPANCY_WARNING_THRESHOLD) {
    return "warning"
  }
  return "secondary"
}
export function WarehouseGrid({ warehouses }: WarehouseGridProps) {
  if (warehouses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/30 py-16 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <HugeiconsIcon
            className="size-8 text-muted-foreground"
            icon={Layers01Icon}
          />
        </div>
        <p className="mt-4 font-medium text-muted-foreground">
          Brak magazynów do wyświetlenia
        </p>
        <p className="mt-1 text-muted-foreground text-sm">
          Zmień filtry lub dodaj nowy magazyn
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
      {warehouses.map((warehouse) => {
        const occupancyPercentage = getOccupancyPercentage(
          warehouse.used,
          warehouse.capacity
        )
        const roundedOccupancy = Math.round(occupancyPercentage)

        return (
          <Card
            className="group relative overflow-hidden transition-all duration-200 hover:ring-2 hover:ring-primary/20"
            key={warehouse.id}
          >
            {/* Decorative corner accent */}
            <div
              className={cn(
                "absolute top-0 right-0 size-24 translate-x-12 -translate-y-12 rounded-full opacity-10 blur-2xl transition-opacity group-hover:opacity-20",
                getOccupancyColor(occupancyPercentage)
              )}
            />

            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-primary/15 to-primary/5 ring-1 ring-primary/10">
                    <span className="font-bold font-mono text-primary text-sm">
                      {warehouse.id}
                    </span>
                  </div>
                  <div>
                    <CardTitle className="text-lg">{warehouse.name}</CardTitle>
                    <p className="mt-0.5 flex items-center gap-1 text-muted-foreground text-xs">
                      <HugeiconsIcon className="size-3" icon={Layers01Icon} />
                      {warehouse.racks.length}{" "}
                      {pluralize(
                        warehouse.racks.length,
                        "regał",
                        "regały",
                        "regałów"
                      )}
                    </p>
                  </div>
                </div>
                <Badge variant={getOccupancyBadgeVariant(occupancyPercentage)}>
                  {roundedOccupancy}%
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pb-4">
              {/* Occupancy Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Zapełnienie</span>
                  <span className="font-medium font-mono">
                    {warehouse.used.toLocaleString("pl-PL")} /{" "}
                    {warehouse.capacity.toLocaleString("pl-PL")}
                  </span>
                </div>
                <div className="relative h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      getOccupancyColor(occupancyPercentage)
                    )}
                    style={{ width: `${occupancyPercentage}%` }}
                  />
                </div>
              </div>

              {/* Quick Stats Row */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-md bg-muted/50 px-2 py-1.5">
                  <span className="block font-mono font-semibold text-sm">
                    {warehouse.used.toLocaleString("pl-PL")}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Zajęte
                  </span>
                </div>
                <div className="rounded-md bg-muted/50 px-2 py-1.5">
                  <span className="block font-mono font-semibold text-sm">
                    {(warehouse.capacity - warehouse.used).toLocaleString(
                      "pl-PL"
                    )}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Wolne
                  </span>
                </div>
                <div className="rounded-md bg-muted/50 px-2 py-1.5">
                  <span className="block font-mono font-semibold text-sm">
                    {warehouse.racks.length}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Regałów
                  </span>
                </div>
              </div>
            </CardContent>

            <CardFooter className="gap-2 border-t pt-4">
              <Link
                className={buttonVariants({
                  variant: "default",
                  size: "sm",
                  className: "flex-1 gap-1.5",
                })}
                href={`/dashboard/warehouse/id/${warehouse.id}/${encodeURIComponent(warehouse.name)}`}
              >
                <span>Regały</span>
                <HugeiconsIcon className="size-3.5" icon={ArrowRight01Icon} />
              </Link>
              <Link
                className={buttonVariants({
                  variant: "outline",
                  size: "sm",
                  className: "flex-1 gap-1.5",
                })}
                href={`/dashboard/warehouse/id/${warehouse.id}/${encodeURIComponent(warehouse.name)}/3d-visualization`}
              >
                <HugeiconsIcon className="size-3.5" icon={CubeIcon} />
                <span>3D</span>
              </Link>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
