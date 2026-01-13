"use client"

import { useTranslations } from "next-intl"
import type { TranslationValues } from "use-intl/core"
import { Button } from "@/components/ui/button"
import { useWarehouseStore } from "./store"
import type { Item3D, Rack3D, Warehouse3D } from "./types"
import { RACK_ZONE_SIZE } from "./types"

interface DetailsPanelProps {
  warehouse: Warehouse3D
}

type Translator = (key: string, values?: TranslationValues) => string

function getStatusText(t: Translator, status: Item3D["status"]): string {
  if (status === "normal") {
    return t("threeD.status.normal")
  }
  if (status === "expired") {
    return t("threeD.status.expired")
  }
  if (status === "expired-dangerous") {
    return t("threeD.status.expiredDangerous")
  }
  return t("threeD.status.dangerous")
}

function getStatusColor(status: Item3D["status"]): string {
  if (status === "normal") {
    return "bg-green-500"
  }
  if (status === "expired") {
    return "bg-amber-500"
  }
  if (status === "expired-dangerous") {
    return "bg-red-500 ring-2 ring-amber-400"
  }
  return "bg-red-500"
}

function OverviewContent({ warehouse }: { warehouse: Warehouse3D }) {
  const t = useTranslations()
  const totalSlots = warehouse.racks.reduce(
    (sum: number, rack: Rack3D) => sum + rack.grid.rows * rack.grid.cols,
    0
  )
  const totalItems = warehouse.racks.reduce(
    (sum: number, rack: Rack3D) =>
      sum + rack.items.filter((item) => item !== null).length,
    0
  )
  const occupiedSlots = totalItems
  const freeSlots = totalSlots - occupiedSlots

  return (
    <div className="flex h-full flex-col border-l bg-background p-4">
      <h2 className="mb-4 font-bold text-lg">{t("threeD.overview.title")}</h2>

      <div className="space-y-4">
        <div className="rounded-lg border p-4">
          <div className="text-muted-foreground text-sm">
            {t("threeD.overview.racks")}
          </div>
          <div className="font-bold text-2xl">{warehouse.racks.length}</div>
        </div>

        <div className="rounded-lg border p-4">
          <div className="text-muted-foreground text-sm">
            {t("threeD.overview.totalSlots")}
          </div>
          <div className="font-bold text-2xl">{totalSlots}</div>
        </div>

        <div className="rounded-lg border p-4">
          <div className="text-muted-foreground text-sm">
            {t("threeD.overview.occupiedSlots")}
          </div>
          <div className="font-bold text-2xl text-green-600">
            {occupiedSlots}
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <div className="text-muted-foreground text-sm">
            {t("threeD.overview.freeSlots")}
          </div>
          <div className="font-bold text-2xl text-blue-600">{freeSlots}</div>
        </div>

        <div className="rounded-lg border p-4">
          <div className="text-muted-foreground text-sm">
            {t("threeD.overview.occupancy")}
          </div>
          <div className="font-bold text-2xl">
            {totalSlots > 0
              ? Math.round((occupiedSlots / totalSlots) * 100)
              : 0}
            %
          </div>
        </div>
      </div>
    </div>
  )
}

export function DetailsPanel({ warehouse }: DetailsPanelProps) {
  const t = useTranslations()
  const translate = (key: string, values?: TranslationValues) =>
    t(key as never, values as never)
  const {
    mode,
    selectedRackId,
    selectedShelf,
    clearSelection,
    focusWindow,
    setFocusWindow,
  } = useWarehouseStore()

  const selectedRack = warehouse.racks.find(
    (rack: Rack3D) => rack.id === selectedRackId
  )

  const selectedItem =
    selectedShelf && selectedRack
      ? (selectedRack.items[selectedShelf.index] ?? null)
      : null
  const isLargeGrid = selectedRack
    ? selectedRack.grid.rows > RACK_ZONE_SIZE ||
      selectedRack.grid.cols > RACK_ZONE_SIZE
    : false
  const showBlockHint = isLargeGrid && !focusWindow

  if (mode === "overview") {
    return <OverviewContent warehouse={warehouse} />
  }

  return (
    <div className="flex h-full flex-col border-l bg-background p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-bold text-lg">{t("threeD.details.title")}</h2>
        <div className="flex w-full flex-col gap-2 *:w-full">
          {focusWindow && (
            <Button
              onClick={() => {
                setFocusWindow(null)
              }}
              variant="outline"
            >
              {t("threeD.details.backToBlocks")}
            </Button>
          )}
        </div>
      </div>

      {selectedRack && (
        <div className="mb-6 rounded-lg border p-4">
          <h3 className="mb-2 font-bold text-xl">{selectedRack.name}</h3>
          <div className="space-y-1 text-muted-foreground text-sm">
            <div>{t("threeD.details.code", { code: selectedRack.code })}</div>
            <div>
              {t("threeD.details.grid", {
                rows: String(selectedRack.grid.rows),
                cols: String(selectedRack.grid.cols),
              })}
            </div>
            <div>
              {t("threeD.details.totalSlots", {
                count: String(selectedRack.grid.rows * selectedRack.grid.cols),
              })}
            </div>
            <div>
              {t("threeD.details.occupiedSlots", {
                count: String(
                  selectedRack.items.filter((item) => item !== null).length
                ),
              })}
            </div>
            <div>
              {t("threeD.details.maxSize", {
                width: String(selectedRack.maxElementSize.width),
                height: String(selectedRack.maxElementSize.height),
                depth: String(selectedRack.maxElementSize.depth),
              })}
            </div>
          </div>
        </div>
      )}

      {selectedShelf && (
        <div className="flex-1">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-lg">
              {t("threeD.details.shelfTitle", {
                row: String(selectedShelf.row + 1),
                col: String(selectedShelf.col + 1),
              })}
            </h3>
            <Button onClick={clearSelection} size="sm" variant="ghost">
              {t("common.actions.clear")}
            </Button>
          </div>

          {selectedItem ? (
            <div className="rounded-lg border p-4">
              <div className="mb-4 flex items-center gap-2">
                <div
                  className={`h-3 w-3 rounded ${getStatusColor(selectedItem.status)}`}
                />
                <span className="font-semibold">
                  {getStatusText(translate, selectedItem.status)}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">
                    {t("threeD.details.item.id")}
                  </span>{" "}
                  <span className="font-mono">{selectedItem.id}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    {t("threeD.details.item.label")}
                  </span>{" "}
                  <span>{selectedItem.label}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    {t("threeD.details.item.type")}
                  </span>{" "}
                  <span>{selectedItem.type}</span>
                </div>

                {selectedItem.meta && (
                  <div className="space-y-1">
                    <div className="text-muted-foreground">
                      {t("threeD.details.item.meta")}
                    </div>
                    {Object.entries(selectedItem.meta).map(([key, value]) => (
                      <div className="ml-2 font-mono text-xs" key={key}>
                        {key}: {String(value)}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-2">
                <Button className="w-full" size="sm" variant="outline">
                  {t("threeD.details.item.editLabel")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border p-4 text-center text-muted-foreground">
              <div className="mb-2 font-bold">
                {t("threeD.details.emptyShelf.title")}
              </div>
              <div className="text-sm">
                {t("threeD.details.emptyShelf.description", {
                  row: String(selectedShelf.row + 1),
                  col: String(selectedShelf.col + 1),
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {!selectedShelf && (
        <div className="flex-1 text-center text-muted-foreground">
          {showBlockHint
            ? t("threeD.details.blockHint", {
                size: String(RACK_ZONE_SIZE),
              })
            : t("threeD.details.shelfHint")}
        </div>
      )}
    </div>
  )
}
