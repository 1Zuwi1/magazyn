"use client"

import { useTranslations } from "next-intl"
import { Button } from "../ui/button"
import { CancelButton } from "./cancel-button"
import { LocationCard } from "./location-card"
import { ScannerBody } from "./scanner-body"
import type { Location } from "./scanner-types"

interface ScannerLocationsStepProps {
  locations: Location[]
  isSubmitting: boolean
  onBack: () => void
  onConfirm: () => void
}

export function ScannerLocationsStep({
  locations,
  isSubmitting,
  onBack,
  onConfirm,
}: ScannerLocationsStepProps) {
  const t = useTranslations("scanner")
  return (
    <ScannerBody>
      <div className="relative flex h-full flex-col">
        <CancelButton onClick={onBack} />
        <div className="flex h-full flex-col">
          <div className="mb-6">
            <h2 className="mb-2 font-semibold text-xl">
              {t("locations.title")}
            </h2>
            <p className="text-muted-foreground">{t("locations.subtitle")}</p>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto">
            {locations.map((location, index) => (
              <LocationCard
                index={index}
                key={`${location.rack}-${location.row}-${location.col}`}
                location={location}
              />
            ))}
          </div>
          <Button
            className="w-full"
            isLoading={isSubmitting}
            onClick={onConfirm}
            type="button"
          >
            {t("locations.confirm")}
          </Button>
        </div>
      </div>
    </ScannerBody>
  )
}
