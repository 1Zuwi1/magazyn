"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { handleApiError } from "@/components/dashboard/utils/helpers"
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

type SupportState = keyof typeof SUPPORT_LABELS

interface PasskeyLoginProps {
  disabled?: boolean
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
      toast.error("Twoje urządzenie nie obsługuje kluczy bezpieczeństwa.")
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
        handleApiError(
          startError,
          "Nie udało się rozpocząć logowania kluczem bezpieczeństwa."
        )
        return
      }

      const publicKeyOptions = parseAuthenticationOptions(startResponse)

      if (!publicKeyOptions) {
        toast.error(
          "Nie udało się przygotować opcji logowania kluczem bezpieczeństwa."
        )
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
            "Nie udało się zweryfikować klucza bezpieczeństwa."
          )
        )
        return
      }

      const publicKeyCredential = credential ?? null

      if (!isPublicKeyCredential(publicKeyCredential)) {
        toast.error("Nie udało się odczytać danych klucza bezpieczeństwa.")
        return
      }

      const credentialJson = serializeCredential(publicKeyCredential)

      const [finishError] = await tryCatch(
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
          "Nie udało się zakończyć logowania kluczem bezpieczeństwa."
        )
        return
      }

      toast.success("Zalogowano kluczem bezpieczeństwa.")
      router.push("/dashboard")
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

      <Button
        className="w-full"
        disabled={isDisabled}
        isLoading={isLoading}
        onClick={handlePasskeyLogin}
        size={"lg"}
        type="button"
        variant="outline"
      >
        Zaloguj kluczem bezpieczeństwa
      </Button>
    </div>
  )
}
