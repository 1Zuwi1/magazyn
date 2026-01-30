"use client"

import { InformationCircleIcon, Key02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { handleApiError } from "@/components/dashboard/utils/helpers"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { apiFetch } from "@/lib/fetcher"
import {
  WebAuthnFinishAssertionSchema,
  WebAuthnStartAssertionSchema,
} from "@/lib/schemas"
import tryCatch from "@/lib/try-catch"
import {
  getWebAuthnErrorMessage,
  getWebAuthnSupport,
  isPublicKeyCredential,
  parseAuthenticationOptions,
  serializeCredential,
} from "@/lib/webauthn"

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

interface PasskeyLoginProps {
  disabled?: boolean
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

const getRequiresTwoFactor = (value: unknown): boolean => {
  if (!isRecord(value)) {
    return false
  }

  return typeof value.requiresTwoFactor === "boolean"
    ? value.requiresTwoFactor
    : false
}

export default function PasskeyLogin({ disabled }: PasskeyLoginProps) {
  const router = useRouter()
  const [supportState, setSupportState] = useState<SupportState>("checking")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setSupportState(getWebAuthnSupport())
  }, [])

  const handlePasskeyLogin = async () => {
    if (supportState !== "supported") {
      toast.error("Twoje urządzenie nie obsługuje passkeys.")
      return
    }

    if (!navigator.credentials) {
      toast.error("Twoja przeglądarka nie obsługuje WebAuthn.")
      return
    }

    setIsLoading(true)

    try {
      const [startError, startResponse] = await tryCatch(
        apiFetch(
          "/api/webauthn/assertion/start",
          WebAuthnStartAssertionSchema,
          {
            method: "POST",
            body: {},
          }
        )
      )

      if (startError) {
        handleApiError(startError, "Nie udało się rozpocząć logowania passkey.")
        return
      }

      const publicKeyOptions = parseAuthenticationOptions(startResponse)

      if (!publicKeyOptions) {
        toast.error("Nie udało się przygotować opcji logowania passkey.")
        return
      }

      const [credentialError, credential] = await tryCatch(
        navigator.credentials.get({
          publicKey: publicKeyOptions,
        })
      )

      if (credentialError) {
        toast.error(
          getWebAuthnErrorMessage(
            credentialError,
            "Nie udało się zweryfikować passkey."
          )
        )
        return
      }

      const publicKeyCredential = credential ?? null

      if (!isPublicKeyCredential(publicKeyCredential)) {
        toast.error("Nie udało się odczytać danych passkey.")
        return
      }

      const credentialJson = serializeCredential(publicKeyCredential)

      const [finishError, finishResponse] = await tryCatch(
        apiFetch(
          "/api/webauthn/assertion/finish",
          WebAuthnFinishAssertionSchema,
          {
            method: "POST",
            body: { credentialJson },
          }
        )
      )

      if (finishError) {
        handleApiError(
          finishError,
          "Nie udało się zakończyć logowania passkey."
        )
        return
      }

      toast.success("Zalogowano passkey.")
      router.push(
        getRequiresTwoFactor(finishResponse) ? "/login/2fa" : "/dashboard"
      )
    } finally {
      setIsLoading(false)
    }
  }

  const isDisabled = disabled || isLoading || supportState !== "supported"

  return (
    <div className="space-y-3">
      <div className="relative">
        <Separator className="bg-border/60" />
        <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-card px-2 text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
          lub
        </span>
      </div>

      <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
              <HugeiconsIcon icon={Key02Icon} size={16} />
            </div>
            <div className="space-y-0.5">
              <p className="font-medium text-sm">Passkey</p>
              <p className="text-muted-foreground text-xs">
                Logowanie bez hasła przy użyciu biometrii lub PIN-u.
              </p>
            </div>
          </div>
          <Badge variant={SUPPORT_VARIANTS[supportState]}>
            {SUPPORT_LABELS[supportState]}
          </Badge>
        </div>

        <Button
          className="w-full"
          disabled={isDisabled}
          isLoading={isLoading}
          onClick={handlePasskeyLogin}
          type="button"
          variant="outline"
        >
          Zaloguj passkey
        </Button>

        <Alert className="border-border/60 bg-background/80">
          <HugeiconsIcon icon={InformationCircleIcon} />
          <AlertTitle>Dodane w ustawieniach</AlertTitle>
          <AlertDescription>
            Passkey musi być wcześniej dodany w ustawieniach konta po
            zalogowaniu.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
