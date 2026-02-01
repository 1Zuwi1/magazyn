"use client"

import { Key02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { handleApiError } from "@/components/dashboard/utils/helpers"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiFetch } from "@/lib/fetcher"
import {
  WebAuthnFinishRegistrationSchema,
  WebAuthnStartRegistrationSchema,
} from "@/lib/schemas"
import tryCatch from "@/lib/try-catch"
import {
  getWebAuthnErrorMessage,
  getWebAuthnSupport,
  isPublicKeyCredential,
  serializeCredential,
} from "@/lib/webauthn"
import { TwoFactorVerificationDialog } from "./two-factor-verification-dialog"

const SUPPORT_LABELS = {
  checking: "Sprawdzanie",
  supported: "Obsługiwane",
  unsupported: "Brak wsparcia",
} as const

const SUPPORT_VARIANTS = {
  checking: "secondary",
  supported: "success",
  unsupported: "warning",
} as const

type SupportState = keyof typeof SUPPORT_LABELS

type PasskeyStatus = "idle" | "success"

export function PasskeysSection() {
  const [supportState, setSupportState] = useState<SupportState>("checking")
  const [status, setStatus] = useState<PasskeyStatus>("idle")
  const [isLoading, setIsLoading] = useState(false)
  const [showSudoDialog, setShowSudoDialog] = useState(false)

  useEffect(() => {
    setSupportState(getWebAuthnSupport())
  }, [])

  const handleAddPasskey = async () => {
    if (supportState !== "supported") {
      toast.error("Twoje urządzenie nie obsługuje kluczy bezpieczeństwa.")
      return
    }

    if (!navigator.credentials) {
      toast.error("Twoja przeglądarka nie obsługuje WebAuthn.")
      return
    }

    setIsLoading(true)
    setStatus("idle")

    try {
      const [startError, startResponse] = await tryCatch(
        apiFetch(
          "/api/webauthn/register/start",
          WebAuthnStartRegistrationSchema,
          {
            method: "POST",
            body: null,
          }
        )
      )

      if (startError) {
        if (startError.message === "INVALID_PASSKEY_REGISTRATION") {
          setShowSudoDialog(true)
          return
        }
        handleApiError(
          startError,
          "Nie udało się rozpocząć dodawania klucza bezpieczeństwa."
        )
        return
      }

      const [credentialError, credential] = await tryCatch(
        navigator.credentials.create({
          publicKey:
            PublicKeyCredential.parseCreationOptionsFromJSON(startResponse),
        })
      )
      if (credentialError) {
        toast.error(
          getWebAuthnErrorMessage(
            credentialError,
            "Nie udało się utworzyć klucza bezpieczeństwa."
          )
        )
        return
      }

      if (!isPublicKeyCredential(credential)) {
        toast.error("Nie udało się odczytać danych klucza bezpieczeństwa.")
        return
      }

      const credentialJson = serializeCredential(credential)

      const [finishError] = await tryCatch(
        apiFetch(
          "/api/webauthn/register/finish",
          WebAuthnFinishRegistrationSchema,
          {
            method: "POST",
            body: { credentialJson },
          }
        )
      )

      if (finishError) {
        handleApiError(
          finishError,
          "Nie udało się zakończyć dodawania klucza bezpieczeństwa."
        )
        return
      }

      setStatus("success")
      toast.success("Klucz bezpieczeństwa został dodany.")
    } finally {
      setIsLoading(false)
    }
  }

  const isDisabled = supportState !== "supported" || isLoading

  return (
    <>
      <TwoFactorVerificationDialog
        onOpenChange={setShowSudoDialog}
        open={showSudoDialog}
      />
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                  <HugeiconsIcon
                    className="text-primary"
                    icon={Key02Icon}
                    size={16}
                  />
                </div>
                Klucze bezpieczeństwa
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                Dodaj klucz dostępu, aby logować się bez hasła.
              </p>
            </div>
            <Badge variant={SUPPORT_VARIANTS[supportState]}>
              {SUPPORT_LABELS[supportState]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="font-medium text-sm">
                  Dodaj nowy klucz bezpieczeństwa
                </p>
                <p className="text-muted-foreground text-xs">
                  Potwierdź biometrią, kluczem sprzętowym lub PIN-em.
                </p>
              </div>
              <Button
                disabled={isDisabled}
                isLoading={isLoading}
                onClick={handleAddPasskey}
                type="button"
              >
                Dodaj klucz bezpieczeństwa
              </Button>
            </div>
            {status === "success" ? (
              <p className="mt-3 text-muted-foreground text-xs">
                Klucz bezpieczeństwa został dodany. Możesz teraz logować się bez
                hasła.
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </>
  )
}
