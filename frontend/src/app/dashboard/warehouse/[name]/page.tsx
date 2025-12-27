import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import WarehouseClient from "./warehouse-client"

// TODO: fetch in prod
const mockRacks = [
  {
    id: "rack-0",
    name: "Regał A",
    rows: 10,
    cols: 12,
    minTemp: 15,
    maxTemp: 25,
    maxWeight: 1000,
    currentWeight: 450,
    occupancy: 70,
    items: [
      {
        id: "item-0",
        name: "Produkt 1",
        expiryDate: new Date("2025-12-31"),
        weight: 25,
        isDangerous: false,
        imageUrl: null,
      },
      {
        id: "item-1",
        name: "Produkt 2",
        expiryDate: new Date("2025-12-31"),
        weight: 15,
        isDangerous: false,
        imageUrl: null,
      },
      {
        id: "item-2",
        name: "Produkt 3",
        expiryDate: new Date("2025-12-31"),
        weight: 30,
        isDangerous: false,
        imageUrl: null,
      },
      null,
      {
        id: "item-4",
        name: "Produkt 5",
        expiryDate: new Date("2025-12-31"),
        weight: 35,
        isDangerous: false,
        imageUrl: null,
      },
      {
        id: "item-5",
        name: "Produkt 6",
        expiryDate: new Date("2025-12-31"),
        weight: 18,
        isDangerous: true,
        imageUrl: null,
      },
      null,
      null,
      null,
      {
        id: "item-9",
        name: "Produkt 10",
        expiryDate: new Date("2025-12-31"),
        weight: 12,
        isDangerous: false,
        imageUrl: null,
      },
      null,
      null,
      {
        id: "item-12",
        name: "Produkt 13",
        expiryDate: new Date("2025-12-31"),
        weight: 27,
        isDangerous: false,
        imageUrl: null,
      },
      {
        id: "item-13",
        name: "Produkt 14",
        expiryDate: new Date("2025-12-31"),
        weight: 45,
        isDangerous: true,
        imageUrl: null,
      },
      null,
      {
        id: "item-15",
        name: "Produkt 16",
        expiryDate: new Date("2025-12-31"),
        weight: 24,
        isDangerous: false,
        imageUrl: null,
      },
    ],
  },
  {
    id: "rack-1",
    name: "Regał B",
    rows: 100,
    cols: 100,
    minTemp: 10,
    maxTemp: 20,
    maxWeight: 1000,
    currentWeight: 620,
    occupancy: 40,
    items: [
      {
        id: "item-b0",
        name: "Produkt B1",
        expiryDate: new Date("2025-12-31"),
        weight: 20,
        isDangerous: false,
        imageUrl: null,
      },
      null,
      null,
      null,
      null,
      null,
      {
        id: "item-b6",
        name: "Produkt B7",
        expiryDate: new Date("2025-12-31"),
        weight: 33,
        isDangerous: false,
        imageUrl: null,
      },
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ],
  },
  {
    id: "rack-2",
    name: "Regał C",
    rows: 4,
    cols: 5,
    minTemp: 5,
    maxTemp: 15,
    maxWeight: 1000,
    currentWeight: 280,
    occupancy: 20,
    items: [
      {
        id: "item-c0",
        name: "Produkt C1",
        expiryDate: new Date("2025-12-31"),
        weight: 40,
        isDangerous: false,
        imageUrl: null,
      },
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      {
        id: "item-c10",
        name: "Produkt C11",
        expiryDate: new Date("2025-12-31"),
        weight: 22,
        isDangerous: true,
        imageUrl: null,
      },
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ],
  },
]

export default async function WarehousePage({
  params,
}: {
  params: Promise<{ name: string }>
}) {
  const cookieStore = await cookies()
  const warehouseId = cookieStore.get("warehouseId")?.value
  if (!warehouseId) {
    redirect("/dashboard/")
  }

  const { name } = await params
  const decodedName = decodeURIComponent(name)

  return (
    <WarehouseClient
      racks={mockRacks}
      warehouseId={warehouseId}
      warehouseName={decodedName}
    />
  )
}
