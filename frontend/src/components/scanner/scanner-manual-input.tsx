"use client"

import { KeyboardIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useCallback, useEffect, useRef, useState } from "react"
import { translateMessage } from "@/i18n/translate-message"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { CancelButton } from "./cancel-button"
import { ScannerBody } from "./scanner-body"

const MODE_OPTIONS = [
  { label: translateMessage("generated.scanner.receiving"), value: "take" },
  { label: translateMessage("generated.scanner.removing"), value: "remove" },
] as const

type ScannerManualMode = (typeof MODE_OPTIONS)[number]["value"]

interface ScannerManualInputProps {
  onSubmit: (code: string) => void
  onCancel: () => void
  isLoading: boolean
  /** Pre-filled code value (e.g. from a previous failed attempt) */
  initialCode?: string
  /** Error message to display inline (e.g. product not found) */
  error?: string | null
  mode?: ScannerManualMode
}

export function ScannerManualInput({
  onSubmit,
  onCancel,
  isLoading,
  initialCode = "",
  error,
  mode,
}: ScannerManualInputProps) {
  const [code, setCode] = useState<string>(initialCode)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setCode(initialCode)
  }, [initialCode])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const trimmedCode = code.trim()
  const isSubmitDisabled = trimmedCode.length === 0

  const handleSubmit = useCallback(() => {
    if (isSubmitDisabled || isLoading) {
      return
    }
    onSubmit(trimmedCode)
  }, [isSubmitDisabled, isLoading, onSubmit, trimmedCode])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit]
  )

  const modeLabel = MODE_OPTIONS.find((option) => option.value === mode)?.label

  return (
    <ScannerBody>
      <div className="relative flex h-full flex-col">
        <CancelButton onClick={onCancel} />

        {modeLabel ? (
          <p className="mx-10 mb-4 rounded-xl border border-border/70 bg-muted/30 px-4 py-2 text-center text-muted-foreground text-sm">
            {translateMessage("generated.scanner.mode")}{" "}
            <span className="font-medium text-foreground">{modeLabel}</span>.
          </p>
        ) : null}

        <div className="mb-6 flex items-start gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
            <HugeiconsIcon
              className="size-6 text-primary"
              icon={KeyboardIcon}
            />
          </div>
          <div>
            <h2 className="font-semibold text-xl tracking-tight">
              {translateMessage("generated.scanner.enterCodeManually")}
            </h2>
            <p className="mt-1 text-muted-foreground text-sm">
              {translateMessage("generated.scanner.enterBarcodeQrCodeScanner")}
            </p>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label
                className="block font-medium text-sm"
                htmlFor="manual-code"
              >
                {translateMessage("generated.scanner.productCode")}
              </Label>
              <Input
                autoComplete="off"
                className="h-14 rounded-xl font-mono text-lg tracking-wider"
                id="manual-code"
                onChange={(event) => setCode(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={translateMessage(
                  "generated.scanner.eG5901234123457"
                )}
                ref={inputRef}
                type="text"
                value={code}
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
            {translateMessage("generated.shared.searchProduct")}
          </Button>
        </div>
      </div>
    </ScannerBody>
  )
}
