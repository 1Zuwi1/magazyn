import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default async function RackPage({
  params,
}: {
  params: Promise<{ name: string }>
}) {
  const cookieStore = await cookies()
  const rackId = cookieStore.get("rackId")?.value
  if (!rackId) {
    redirect("/dashboard/")
  }

  const { name } = await params
  const decodedName = decodeURIComponent(name)

  // TODO: in prod fetch
  const mockRack = {
    id: rackId,
    name: decodedName,
    rows: 4,
    cols: 6,
    minTemp: 10,
    maxTemp: 25,
    maxWeight: 1000,
    currentWeight: 450,
    occupancy: 45,
    items: [
      {
        id: "item-0",
        name: "Produkt 1",
        expiryDate: "2025-12-31",
        weight: 25,
        isDangerous: false,
      },
      {
        id: "item-1",
        name: "Produkt 2",
        expiryDate: "2025-12-31",
        weight: 15,
        isDangerous: false,
      },
      {
        id: "item-2",
        name: "Produkt 3",
        expiryDate: "2025-12-31",
        weight: 30,
        isDangerous: false,
      },
      {
        id: "item-3",
        name: "Produkt 4",
        expiryDate: "2025-12-31",
        weight: 20,
        isDangerous: false,
      },
      {
        id: "item-4",
        name: "Produkt 5",
        expiryDate: "2025-12-31",
        weight: 35,
        isDangerous: false,
      },
      {
        id: "item-5",
        name: "Produkt 6",
        expiryDate: "2025-12-31",
        weight: 18,
        isDangerous: true,
      },
      {
        id: "item-6",
        name: "Produkt 7",
        expiryDate: "2025-12-31",
        weight: 22,
        isDangerous: false,
      },
      {
        id: "item-7",
        name: "Produkt 8",
        expiryDate: "2025-12-31",
        weight: 28,
        isDangerous: false,
      },
      {
        id: "item-8",
        name: "Produkt 9",
        expiryDate: "2025-12-31",
        weight: 40,
        isDangerous: false,
      },
      {
        id: "item-9",
        name: "Produkt 10",
        expiryDate: "2025-12-31",
        weight: 12,
        isDangerous: false,
      },
      {
        id: "item-10",
        name: "Produkt 11",
        expiryDate: "2025-12-31",
        weight: 33,
        isDangerous: false,
      },
      {
        id: "item-11",
        name: "Produkt 12",
        expiryDate: "2025-12-31",
        weight: 19,
        isDangerous: false,
      },
      {
        id: "item-12",
        name: "Produkt 13",
        expiryDate: "2025-12-31",
        weight: 27,
        isDangerous: false,
      },
      {
        id: "item-13",
        name: "Produkt 14",
        expiryDate: "2025-12-31",
        weight: 45,
        isDangerous: true,
      },
      {
        id: "item-14",
        name: "Produkt 15",
        expiryDate: "2025-12-31",
        weight: 16,
        isDangerous: false,
      },
      {
        id: "item-15",
        name: "Produkt 16",
        expiryDate: "2025-12-31",
        weight: 24,
        isDangerous: false,
      },
      {
        id: "item-16",
        name: "Produkt 17",
        expiryDate: "2025-12-31",
        weight: 31,
        isDangerous: false,
      },
      {
        id: "item-17",
        name: "Produkt 18",
        expiryDate: "2025-12-31",
        weight: 21,
        isDangerous: false,
      },
      {
        id: "item-18",
        name: "Produkt 19",
        expiryDate: "2025-12-31",
        weight: 38,
        isDangerous: false,
      },
      {
        id: "item-19",
        name: "Produkt 20",
        expiryDate: "2025-12-31",
        weight: 14,
        isDangerous: false,
      },
      {
        id: "item-20",
        name: "Produkt 21",
        expiryDate: "2025-12-31",
        weight: 29,
        isDangerous: false,
      },
      {
        id: "item-21",
        name: "Produkt 22",
        expiryDate: "2025-12-31",
        weight: 36,
        isDangerous: false,
      },
      {
        id: "item-22",
        name: "Produkt 23",
        expiryDate: "2025-12-31",
        weight: 17,
        isDangerous: false,
      },
      {
        id: "item-23",
        name: "Produkt 24",
        expiryDate: "2025-12-31",
        weight: 23,
        isDangerous: false,
      },
    ],
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-3xl tracking-tight">{decodedName}</h2>
          <p className="text-muted-foreground">
            ID: {rackId} • {mockRack.rows}x{mockRack.cols} pozycji
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Obłożenie</CardDescription>
            <CardTitle className="text-2xl">{mockRack.occupancy}%</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Waga</CardDescription>
            <CardTitle className="text-2xl">
              {mockRack.currentWeight}kg / {mockRack.maxWeight}kg
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Temperatura</CardDescription>
            <CardTitle className="text-2xl">
              {mockRack.minTemp}°C - {mockRack.maxTemp}°C
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pozycje</CardDescription>
            <CardTitle className="text-2xl">{mockRack.items.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Siatka Regału</CardTitle>
          <CardDescription>
            Wizualizacja pozycji w regale {decodedName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: `repeat(${mockRack.cols}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: mockRack.rows * mockRack.cols }).map(
              (_, index) => {
                const item = mockRack.items[index]
                const isEmpty = !item

                let cellClassName: string
                if (isEmpty) {
                  cellClassName =
                    "border-muted-foreground/25 border-dashed bg-muted/10"
                } else if (item.isDangerous) {
                  cellClassName = "border-destructive bg-destructive/10"
                } else {
                  cellClassName = "border-primary bg-primary/10"
                }

                return (
                  <div
                    className={`aspect-square rounded-md border-2 p-2 text-xs ${cellClassName}`}
                    key={index}
                  >
                    {isEmpty ? (
                      <span className="flex h-full items-center justify-center text-muted-foreground">
                        Pusty
                      </span>
                    ) : (
                      <div className="flex h-full flex-col justify-between">
                        <span className="truncate font-medium">
                          {item.name}
                        </span>
                        <div className="space-y-0.5">
                          <span className="block truncate text-muted-foreground">
                            {item.weight}kg
                          </span>
                          {item.isDangerous && (
                            <Badge
                              className="text-[10px]"
                              variant="destructive"
                            >
                              Niebezpieczny
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              }
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
