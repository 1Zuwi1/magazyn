"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { handleApiError } from "@/components/dashboard/utils/helpers"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { translateMessage } from "@/i18n/translate-message"
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

type SupportState = "checking" | "supported" | "unsupported"

interface PasskeyLoginProps {
  disabled?: boolean
  label?: string
  showSeparator?: boolean
  onSuccess?: () => void
  redirectTo?: string | null
  successMessage?: string
  showSuccessToast?: boolean
}

export default function PasskeyLogin({
  disabled,
  label = translateMessage("generated.auth.logSecurityKey"),
  showSeparator = true,
  onSuccess,
  redirectTo = "/dashboard",
  successMessage = translateMessage("generated.auth.loggedSecurityKey"),
  showSuccessToast = true,
}: PasskeyLoginProps) {
  const router = useRouter()
  const [supportState, setSupportState] = useState<SupportState>("checking")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setSupportState(getWebAuthnSupport())
  }, [])

  const handlePasskeyLogin = async () => {
    if (supportState !== "supported") {
      toast.error(
        translateMessage("generated.shared.deviceSupportSecurityKeys")
      )
      return
    }

    if (!navigator.credentials) {
      toast.error(translateMessage("generated.shared.browserSupportWebauthn"))
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
          translateMessage("generated.auth.failedStartLoginSecurityKey")
        )
        return
      }

      const publicKeyOptions = parseAuthenticationOptions(startResponse)

      if (!publicKeyOptions) {
        toast.error(
          translateMessage("generated.auth.failedPrepareSecurityKeyLogin")
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
            translateMessage("generated.auth.securityKeyVerified")
          )
        )
        return
      }

      if (!isPublicKeyCredential(credential)) {
        toast.error(translateMessage("generated.shared.securityKeyDataRead"))
        return
      }

      const credentialJson = serializeCredential(credential)

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
          translateMessage("generated.auth.failedCompleteLoginSecurityKey")
        )
        return
      }

      if (showSuccessToast) {
        toast.success(successMessage)
      }
      onSuccess?.()
      if (redirectTo) {
        router.push(redirectTo)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const isDisabled = disabled || isLoading || supportState !== "supported"

  return (
    <div className="space-y-3">
      {showSeparator ? (
        <div className="relative">
          <Separator className="bg-border/60" />
          <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-card px-2 text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
            {translateMessage("generated.auth.label")}
          </span>
        </div>
      ) : null}

      <Button
        className="w-full"
        disabled={isDisabled}
        isLoading={isLoading}
        onClick={handlePasskeyLogin}
        size={"lg"}
        type="button"
        variant="outline"
      >
        {label}
      </Button>
    </div>
  )
}
