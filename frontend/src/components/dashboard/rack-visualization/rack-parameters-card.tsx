import { SquareIcon, ThermometerIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface RackParametersCardProps {
  maxElementSize: { width: number; height: number; depth: number }
  tempRange: { min: number; max: number }
  gridDimensions: { rows: number; cols: number }
}

export function RackParametersCard({
  maxElementSize,
  tempRange,
  gridDimensions,
}: RackParametersCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm uppercase tracking-wide">
          Parametry
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <HugeiconsIcon
            className="size-5 self-center text-muted-foreground"
            icon={SquareIcon}
          />
          <div className="flex-1">
            <p className="text-muted-foreground text-xs">
              Max rozmiar elementu
            </p>
            <p className="font-medium text-sm">
              {maxElementSize.width} × {maxElementSize.height} ×{" "}
              {maxElementSize.depth} mm
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <HugeiconsIcon
            className="size-5 self-center text-muted-foreground"
            icon={ThermometerIcon}
          />
          <div className="flex-1">
            <p className="text-muted-foreground text-xs">Zakres temperatur</p>
            <p className="font-medium text-sm">
              {tempRange.min}°C - {tempRange.max}°C
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <HugeiconsIcon
            className="size-5 self-center text-muted-foreground"
            icon={SquareIcon}
          />
          <div className="flex-1">
            <p className="text-muted-foreground text-xs">Wymiary siatki</p>
            <p className="font-medium text-sm">
              {gridDimensions.rows} rzędów × {gridDimensions.cols} kolumn
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
