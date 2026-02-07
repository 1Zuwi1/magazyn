"use client"

import { KeyboardIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs"
import { CancelButton } from "./cancel-button"
import { ScannerBody } from "./scanner-body"

const MODE_OPTIONS = [
  { label: "Przyjmowanie", value: "take" },
  { label: "Zdejmowanie", value: "remove" },
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
  onModeChange?: (mode: ScannerManualMode) => void
}

export function ScannerManualInput({
  onSubmit,
  onCancel,
  isLoading,
  initialCode = "",
  error,
  mode,
  onModeChange,
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

  const handleModeValueChange = useCallback(
    (nextMode: string) => {
      if (
        onModeChange &&
        (nextMode === MODE_OPTIONS[0].value ||
          nextMode === MODE_OPTIONS[1].value)
      ) {
        onModeChange(nextMode)
      }
    },
    [onModeChange]
  )

  return (
    <ScannerBody>
      <div className="relative flex h-full flex-col">
        <CancelButton onClick={onCancel} />

        {mode && onModeChange ? (
          <Tabs
            className={"mx-10"}
            onValueChange={handleModeValueChange}
            value={mode}
          >
            <TabsList className="mb-4 grid w-full grid-cols-2 rounded-xl bg-muted p-1">
              {MODE_OPTIONS.map((option) => (
                <TabsTrigger key={option.value} value={option.value}>
                  {option.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
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
                htmlFor="manual-code"
              >
                Kod produktu
              </label>
              <Input
                autoComplete="off"
                className="h-14 rounded-xl font-mono text-lg tracking-wider"
                id="manual-code"
                onChange={(event) => setCode(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="np. 5901234123457"
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
            Wyszukaj produkt
          </Button>
        </div>
      </div>
    </ScannerBody>
  )
}
