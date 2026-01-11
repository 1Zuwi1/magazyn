"use client"

import {
  Cancel01Icon,
  QrCodeIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "../ui/button"
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog"
import { Input } from "../ui/input"
import { ScannerCamera } from "./scanner-camera"

interface ScannerProps {
  /** Prevents spamming the same result continuously */
  scanDelayMs?: number
  /** Stop camera as soon as a QR is read */
  stopOnScan?: boolean
  /** Override camera constraints if you want */
  constraints?: MediaStreamConstraints
  warehouseName?: string
  className?: string
  /** Children to show instead of camera (e.g. scan results) */
  children?: React.ReactNode
}

const TAB_TRIGGERS = [
  {
    text: "Przyjmowanie",
    action: "take",
  },
  {
    text: "Zdejmowanie",
    action: "remove",
  },
] as const

interface Location {
  rack: number
  row: number
  col: number
}

type Step = "camera" | "quantity" | "locations" | "success"

type ScanItem = {
  id?: string
  name?: string
  qrCode?: string
  expiresIn?: number
  weight?: number
  imageUrl?: string | null
} | null

export function Scanner({
  scanDelayMs = 1200,
  stopOnScan = false,
  constraints,
  warehouseName,
  className,
  children,
}: ScannerProps) {
  const isMobile = useIsMobile()
  const [mode, setMode] = useState<number>(0)
  const [open, setOpen] = useState<boolean>(false)
  const modeRef = useRef<number>(mode)
  modeRef.current = mode
  const armedRef = useRef<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [step, setStep] = useState<Step>("camera")
  const [quantity, setQuantity] = useState<number>(1)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [locations, setLocations] = useState<Location[]>([])
  const [scannedItem, setScannedItem] = useState<ScanItem>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    if (!armedRef.current) {
      window.history.pushState({ __overlay: true }, "", window.location.href)
      armedRef.current = true
    }

    const onPopState = () => {
      if (open) {
        setOpen(false)
        armedRef.current = false
      }
    }

    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [open])

  const closeDialog = useCallback(() => {
    if (!open) {
      return
    }

    if (armedRef.current) {
      window.history.back()
    } else {
      setOpen(false)
    }
  }, [open])

  const onScan = useCallback(async (text: string) => {
    setIsLoading(true)
    console.log("Scanned code:", text, "mode:", modeRef.current)

    await new Promise((resolve) => setTimeout(resolve, 500))

    setScannedItem({
      expiresIn: 180,
      id: "item-123",
      name: "Przykładowy przedmiot",
      qrCode: text,
      weight: 2.5,
      imageUrl: "https://placehold.co/600x400",
    })
    setStep("quantity")
    setIsLoading(false)
  }, [])

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true)

    await new Promise((resolve) => setTimeout(resolve, 500))
    const isError = Math.random() < 1
    if (isError) {
      setError("W tym magazynie brakuje miejsca na te przedmioty.")
      setIsSubmitting(false)
      return
    }

    const mockLocations: Location[] = Array.from(
      { length: quantity },
      (_, i) => ({
        rack: Math.floor(Math.random() * 10) + 1,
        row: Math.floor(Math.random() * 5) + 1,
        col: (i % 3) + 1,
      })
    )

    setLocations(mockLocations)
    setStep("locations")
    setIsSubmitting(false)
  }, [quantity])

  const handleConfirmPlacement = useCallback(async () => {
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    setStep("success")
    setIsSubmitting(false)
  }, [])

  const handleReset = useCallback(() => {
    setStep("camera")
    setQuantity(1)
    setLocations([])
  }, [])

  const renderContent = useCallback(() => {
    const defaultClassName = "flex h-full flex-col p-6"
    if (children) {
      return <div className={defaultClassName}>{children}</div>
    }

    if (error) {
      return (
        <div className="flex h-full flex-col items-center justify-center p-6 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400">
            <HugeiconsIcon className="size-8" icon={Cancel01Icon} />
          </div>
          <h2 className="mb-2 font-semibold text-xl">Wystąpił błąd</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button className="mt-6" onClick={() => setError(null)} type="button">
            Spróbuj ponownie
          </Button>
        </div>
      )
    }

    if (step === "quantity") {
      return (
        <div className={defaultClassName}>
          <div className="relative flex h-full flex-col">
            <CancelButton onClick={() => setStep("camera")} />
            <div className="mb-6 flex-1">
              <h2 className="mb-2 font-semibold text-xl">
                Podaj ilość przedmiotów
              </h2>
              <p className="text-muted-foreground">
                Ile sztuk chcesz dodać do magazynu?
              </p>
            </div>
            <div className="h-full">
              {scannedItem?.imageUrl && (
                <Image
                  alt={scannedItem.name || "Skanowany przedmiot"}
                  className="mb-4 max-h-40 w-auto rounded-md object-cover"
                  height={0}
                  src={scannedItem.imageUrl}
                  width={0}
                />
              )}
              <div className="mb-4">
                <h3 className="font-medium text-lg">
                  {scannedItem?.name || "Nieznany przedmiot"}
                </h3>
                {scannedItem?.expiresIn !== undefined && (
                  <p className="text-muted-foreground text-sm">
                    Data przeterminowania za około {scannedItem.expiresIn} dni
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label
                  className="mb-2 block font-medium text-sm"
                  htmlFor="quantity"
                >
                  Ilość przedmiotów
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    disabled={quantity <= 1}
                    onClick={() => setQuantity((q) => q - 1)}
                    size={"icon-lg"}
                    type="button"
                    variant={"outline"}
                  >
                    −
                  </Button>
                  <Input
                    className="h-10 w-20 text-center text-lg"
                    id="quantity"
                    min="1"
                    onChange={(e) => {
                      const value = Number.parseInt(e.target.value, 10)
                      if (!Number.isNaN(value) && value > 0) {
                        setQuantity(value)
                      }
                    }}
                    value={quantity}
                  />
                  <Button
                    onClick={() => setQuantity((q) => q + 1)}
                    size={"icon-lg"}
                    type="button"
                    variant={"outline"}
                  >
                    +
                  </Button>
                </div>
              </div>
              <Button
                className="w-full"
                disabled={isSubmitting}
                onClick={handleSubmit}
                type="button"
              >
                {isSubmitting ? "Przetwarzanie..." : "Potwierdź"}
              </Button>
            </div>
          </div>
        </div>
      )
    }

    if (step === "locations") {
      return (
        <div className={defaultClassName}>
          <div className="relative flex h-full flex-col">
            <CancelButton onClick={() => setStep("quantity")} />
            <div className="flex h-full flex-col">
              <div className="mb-6">
                <h2 className="mb-2 font-semibold text-xl">
                  Lokalizacje do umieszczenia
                </h2>
                <p className="text-muted-foreground">
                  Umieść przedmioty w następujących miejscach:
                </p>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto">
                {locations.map((loc, i) => (
                  <div
                    className="flex items-center justify-between rounded-lg border p-4"
                    key={i}
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-primary">
                        {i + 1}
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <div className="font-bold text-lg">{loc.rack}</div>
                          <div className="text-muted-foreground text-xs">
                            Regał
                          </div>
                        </div>
                        <div className="h-6 w-px bg-border" />
                        <div className="text-center">
                          <div className="font-bold text-lg">{loc.row}</div>
                          <div className="text-muted-foreground text-xs">
                            Rząd
                          </div>
                        </div>
                        <div className="h-6 w-px bg-border" />
                        <div className="text-center">
                          <div className="font-bold text-lg">{loc.col}</div>
                          <div className="text-muted-foreground text-xs">
                            Kol.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                className="w-full"
                disabled={isSubmitting}
                onClick={handleConfirmPlacement}
                type="button"
              >
                {isSubmitting ? "Przetwarzanie..." : "Przedmioty umieszczone"}
              </Button>
            </div>
          </div>
        </div>
      )
    }

    if (step === "success") {
      return (
        <div className="flex h-full flex-col items-center justify-center p-6 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400">
            <HugeiconsIcon className="size-8" icon={Tick02Icon} />
          </div>
          <h2 className="mb-2 font-semibold text-xl">Dodano pomyślnie</h2>
          <p className="text-muted-foreground">
            Przedmioty zostały dodane do magazynu
          </p>
          <Button className="mt-6" onClick={handleReset} type="button">
            Zeskanuj kolejny
          </Button>
        </div>
      )
    }

    return (
      <ScannerCamera
        constraints={constraints}
        isLoading={isLoading}
        isMobile={isMobile}
        isOpen={open}
        mode={mode}
        onModeChange={setMode}
        onRequestClose={closeDialog}
        onScan={onScan}
        scanDelayMs={scanDelayMs}
        stopOnScan={stopOnScan}
        tabTriggers={TAB_TRIGGERS}
        warehouseName={warehouseName}
      />
    )
  }, [
    children,
    closeDialog,
    constraints,
    handleConfirmPlacement,
    handleReset,
    handleSubmit,
    isSubmitting,
    isLoading,
    isMobile,
    locations,
    mode,
    onScan,
    open,
    quantity,
    scanDelayMs,
    step,
    stopOnScan,
    warehouseName,
    scannedItem,
    error,
  ])

  return (
    <Dialog
      onOpenChange={(o) => {
        if (o) {
          setOpen(true)
        } else {
          closeDialog()
        }
      }}
      open={open}
    >
      <DialogTrigger
        className={buttonVariants({
          variant: "ghost",
          size: "icon",
          className: "mr-1 ml-auto size-8 rounded-xl sm:size-10",
        })}
        title="Skaner kodów"
      >
        <HugeiconsIcon icon={QrCodeIcon} />
      </DialogTrigger>
      <DialogContent
        className={cn(
          "p-0",
          isMobile ? "h-screen w-screen max-w-none rounded-none" : ""
        )}
        showCloseButton={false}
      >
        <div
          className={cn(
            "relative overflow-hidden py-12",
            isMobile ? "h-full w-full" : "aspect-3/4 w-full rounded-lg border",
            className
          )}
        >
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function CancelButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      className={"absolute top-0 right-0"}
      onClick={onClick}
      size={"icon"}
      type="button"
      variant={"outline"}
    >
      <HugeiconsIcon className="size-4" icon={Cancel01Icon} />
    </Button>
  )
}
