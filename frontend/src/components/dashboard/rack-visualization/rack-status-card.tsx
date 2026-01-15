import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface RackStatusCardProps {
  occupiedSlots: number
  freeSlots: number
  totalCapacity: number
  occupancyPercentage: number
}

export function RackStatusCard({
  occupiedSlots,
  freeSlots,
  totalCapacity,
  occupancyPercentage,
}: RackStatusCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm uppercase tracking-wide">
          Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-secondary-foreground/70 text-sm">
            Zajęte miejsca
          </span>
          <span className="font-semibold">{occupiedSlots}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-secondary-foreground/70 text-sm">
            Wolne miejsca
          </span>
          <span className="font-semibold">{freeSlots}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-secondary-foreground/70 text-sm">
            Całkowita pojemność
          </span>
          <span className="font-semibold">{totalCapacity}</span>
        </div>

        <div className="space-y-2 pt-2">
          <div className="flex justify-between text-xs">
            <span className="text-secondary-foreground/70">Obłożenie</span>
            <span className="font-medium">{occupancyPercentage}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-secondary-foreground/20">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${occupancyPercentage}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
