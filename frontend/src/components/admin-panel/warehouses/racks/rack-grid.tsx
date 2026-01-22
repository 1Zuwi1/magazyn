"use client"

import {
  Delete02Icon,
  MoreHorizontalCircle01FreeIcons,
  PencilEdit01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type { Rack } from "@/components/dashboard/types"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const HIGH_OCCUPANCY_THRESHOLD = 80

interface RackGridProps {
  racks: Rack[]
  onEdit?: (rack: Rack) => void
  onDelete?: (rack: Rack) => void
}

export function RackGrid({ racks, onEdit, onDelete }: RackGridProps) {
  const hasActions = onEdit || onDelete

  if (racks.length === 0) {
    return (
      <p className="text-center text-muted-foreground">
        Brak regałów do wyświetlenia.
      </p>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {racks.map((rack) => (
        <Card className="transition-shadow hover:shadow-lg" key={rack.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">
                  {rack.name}
                  {rack.symbol && (
                    <span className="ml-2 font-normal text-muted-foreground text-sm">
                      ({rack.symbol})
                    </span>
                  )}
                </CardTitle>
                <CardDescription className="mt-1">
                  ID: {rack.id}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    rack.occupancy > HIGH_OCCUPANCY_THRESHOLD
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {rack.occupancy}%
                </Badge>
                {hasActions && (
                  <DropdownMenu>
                    <DropdownMenuTrigger aria-label="Akcje regału">
                      <HugeiconsIcon icon={MoreHorizontalCircle01FreeIcons} />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      {onEdit && (
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => onEdit(rack)}
                        >
                          <HugeiconsIcon
                            className="mr-2 h-4 w-4"
                            icon={PencilEdit01Icon}
                          />
                          Edytuj
                        </DropdownMenuItem>
                      )}
                      {onDelete && (
                        <DropdownMenuItem
                          className="cursor-pointer text-destructive focus:text-destructive"
                          onClick={() => onDelete(rack)}
                        >
                          <HugeiconsIcon
                            className="mr-2 h-4 w-4"
                            icon={Delete02Icon}
                          />
                          Usuń
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Wymiary</span>
                <span className="font-medium">
                  {rack.rows} × {rack.cols}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Temperatura</span>
                <span className="font-medium">
                  {rack.minTemp}°C – {rack.maxTemp}°C
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Max waga</span>
                <span className="font-medium">{rack.maxWeight} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Aktualna waga</span>
                <span className="font-medium">{rack.currentWeight} kg</span>
              </div>
              {rack.comment && (
                <div className="border-t pt-2">
                  <span className="text-muted-foreground text-xs">
                    {rack.comment}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
