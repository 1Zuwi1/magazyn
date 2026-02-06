"use client"

import { KeyboardIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { CancelButton } from "./cancel-button"
import { ScannerBody } from "./scanner-body"

interface ScannerManualInputProps {
  onSubmit: (barcode: string) => void
  onCancel: () => void
  isLoading: boolean
  /** Pre-filled barcode value (e.g. from a previous failed attempt) */
  initialBarcode?: string
  /** Error message to display inline (e.g. product not found) */
  error?: string | null
}

export function ScannerManualInput({
  onSubmit,
  onCancel,
  isLoading,
  initialBarcode = "",
  error,
}: ScannerManualInputProps) {
  const [barcode, setBarcode] = useState<string>(initialBarcode)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const trimmedBarcode = barcode.trim()
  const isSubmitDisabled = trimmedBarcode.length === 0

  const handleSubmit = useCallback(() => {
    if (isSubmitDisabled || isLoading) {
      return
    }
    onSubmit(trimmedBarcode)
  }, [isSubmitDisabled, isLoading, onSubmit, trimmedBarcode])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit]
  )

  return (
    <ScannerBody>
      <div className="relative flex h-full flex-col">
        <CancelButton onClick={onCancel} />

        <div className="mb-6 flex items-start gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
            <HugeiconsIcon
              className="size-6 text-primary"
              icon={KeyboardIcon}
            />
          </div>
          <div>
            <h2 className="font-semibold text-xl tracking-tight">
              Wprowadź kod ręcznie
            </h2>
            <p className="mt-1 text-muted-foreground text-sm">
              Wpisz kod kreskowy lub QR, jeśli skaner nie może go odczytać.
            </p>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center">
          <div className="space-y-4">
            <div className="space-y-2">
              <label
                className="block font-medium text-sm"
                htmlFor="manual-barcode"
              >
                Kod produktu
              </label>
              <Input
                autoComplete="off"
                className="h-14 rounded-xl font-mono text-lg tracking-wider"
                id="manual-barcode"
                onChange={(event) => setBarcode(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="np. 5901234123457"
                ref={inputRef}
                type="text"
                value={barcode}
              />
              {error ? (
                <p className="text-destructive text-sm" role="alert">
                  {error}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="pt-4">
          <Button
            className="h-12 w-full rounded-xl"
            disabled={isSubmitDisabled}
            isLoading={isLoading}
            onClick={handleSubmit}
            type="button"
          >
            Wyszukaj produkt
          </Button>
        </div>
      </div>
    </ScannerBody>
  )
}
