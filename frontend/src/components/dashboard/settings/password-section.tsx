"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordVerificationSection } from "./password-verification-section"
import type { TwoFactorMethod } from "./types"

interface PasswordSectionProps {
  verificationRequired: boolean
  twoFactorMethod: TwoFactorMethod
}

export function PasswordSection({
  verificationRequired,
  twoFactorMethod,
}: PasswordSectionProps) {
  const [passwordNote, setPasswordNote] = useState<string>("")
  const [verificationComplete, setVerificationComplete] =
    useState<boolean>(false)

  const verificationBlocked = verificationRequired && !verificationComplete

  const handlePasswordSubmit = (
    event: React.FormEvent<HTMLFormElement>
  ): void => {
    event.preventDefault()
    if (verificationBlocked) {
      setPasswordNote("Najpierw potwierdź 2FA, aby zmienić hasło.")
      return
    }
    setPasswordNote("Hasło zaktualizowane lokalnie (mock).")
  }

  useEffect(() => {
    if (!verificationRequired) {
      setVerificationComplete(false)
      setPasswordNote("")
    }
  }, [verificationRequired])

  return (
    <form className="space-y-4" onSubmit={handlePasswordSubmit}>
      {verificationRequired ? (
        <div className="space-y-4">
          <Alert variant="default">
            <AlertTitle>Wymagana weryfikacja 2FA</AlertTitle>
            <AlertDescription>
              Aby zmienić hasło, najpierw potwierdź swoją tożsamość kodem 2FA.
            </AlertDescription>
          </Alert>
          <PasswordVerificationSection
            method={twoFactorMethod}
            onVerificationChange={setVerificationComplete}
          />
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="current-password">Obecne hasło</Label>
          <Input
            autoComplete="current-password"
            disabled={verificationBlocked}
            id="current-password"
            placeholder="Wprowadź obecne hasło"
            type="password"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-password">Nowe hasło</Label>
          <Input
            autoComplete="new-password"
            disabled={verificationBlocked}
            id="new-password"
            placeholder="Co najmniej 8 znaków"
            type="password"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Potwierdź hasło</Label>
          <Input
            autoComplete="new-password"
            disabled={verificationBlocked}
            id="confirm-password"
            placeholder="Powtórz nowe hasło"
            type="password"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-xs">
          Min. 8 znaków, w tym cyfry i znaki specjalne.
        </p>
        <Button disabled={verificationBlocked} type="submit">
          Zmień hasło
        </Button>
      </div>

      {passwordNote ? (
        <Alert>
          <AlertDescription>{passwordNote}</AlertDescription>
        </Alert>
      ) : null}
    </form>
  )
}
