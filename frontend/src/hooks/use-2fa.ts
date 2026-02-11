import { formatDate } from "date-fns"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"
import type { AuthenticatorSetupData } from "@/components/dashboard/settings/types"
import { getDateFnsLocale } from "@/i18n/date-fns-locale"
import { apiFetch, FetchError } from "@/lib/fetcher"
import {
  Check2FASchema,
  Resend2FASchema,
  ResendMethods,
  type ResendType,
  TFAAuthenticatorFinishSchema,
  TFAAuthenticatorStartSchema,
  type TwoFactorMethod,
  WebAuthnFinishRegistrationSchema,
  WebAuthnStartRegistrationSchema,
} from "@/lib/schemas"
import tryCatch from "@/lib/try-catch"
import {
  getWebAuthnErrorMessage,
  isPublicKeyCredential,
  serializeCredential,
} from "@/lib/webauthn"
import type { SafeMutationOptions } from "./helper"
import { useApiMutation } from "./use-api-mutation"

export const useAuthenticatorData = (
  options?: SafeMutationOptions<AuthenticatorSetupData, FetchError, string>
) =>
  useApiMutation({
    mutationFn: async (locale: string) => {
      const issuedAt = formatDate(new Date(), "p", {
        locale: getDateFnsLocale(locale),
      })
      const response = await apiFetch(
        "/api/2fa/authenticator/start",
        TFAAuthenticatorStartSchema,
        {
          method: "POST",
          body: null,
        }
      )

      return {
        secret: response.secretKey,
        accountName: response.email,
        issuer: response.issuer,
        issuedAt,
      }
    },
    throwOnError: false,
    ...options,
  })

export const useResendCode = (
  options?: SafeMutationOptions<void, FetchError, ResendType>
) =>
  useApiMutation({
    mutationFn: async (method: ResendType) => {
      await apiFetch("/api/2fa/send", Resend2FASchema, {
        method: "POST",
        body: { method },
      })
    },
    throwOnError: false,
    ...options,
  })

export const useRequestTwoFactorCode = (
  options?: SafeMutationOptions<void, FetchError, TwoFactorMethod>
) =>
  useApiMutation({
    mutationFn: async (method: TwoFactorMethod) => {
      const validatedMethod = ResendMethods.safeParse(method)
      if (validatedMethod.success === false) {
        return
      }

      await apiFetch("/api/2fa/send", Resend2FASchema, {
        method: "POST",
        body: { method: validatedMethod.data },
      })
    },
    throwOnError: false,
    ...options,
  })

export const useCheck2FA = (
  options?: SafeMutationOptions<
    null,
    FetchError,
    {
      value: string
      selectedMethod: TwoFactorMethod
    }
  >
) =>
  useApiMutation({
    mutationFn: ({
      value,
      selectedMethod,
    }: {
      value: string
      selectedMethod: TwoFactorMethod
    }) =>
      apiFetch("/api/2fa/check", Check2FASchema, {
        method: "POST",
        body: { code: value, method: selectedMethod },
      }),
    throwOnError: false,
    ...options,
  })

interface VerifyOneTimeCodeVariables {
  code: string
  method: TwoFactorMethod
}

export const useVerifyOneTimeCode = (
  options?: SafeMutationOptions<boolean, FetchError, VerifyOneTimeCodeVariables>
) =>
  useApiMutation({
    mutationFn: async ({ code, method }: VerifyOneTimeCodeVariables) => {
      try {
        if (method === "AUTHENTICATOR") {
          await apiFetch(
            "/api/2fa/authenticator/finish",
            TFAAuthenticatorFinishSchema,
            {
              method: "POST",
              body: { code },
            }
          )
        } else {
          await apiFetch("/api/2fa/check", Check2FASchema, {
            method: "POST",
            body: { code, method },
          })
        }

        return true
      } catch (error) {
        if (FetchError.isError(error) && error.status === 401) {
          return false
        }

        throw error
      }
    },
    throwOnError: false,
    ...options,
  })

interface FinishPasskeyRegistrationVariables {
  credentialJson: string
  keyName: string
}

const useStartPasskeyRegistration = (
  options?: SafeMutationOptions<
    PublicKeyCredentialCreationOptions,
    FetchError,
    void
  >
) =>
  useApiMutation({
    mutationFn: async () =>
      apiFetch(
        "/api/webauthn/register/start",
        WebAuthnStartRegistrationSchema,
        {
          method: "POST",
          body: null,
        }
      ),
    throwOnError: false,
    ...options,
  })

const useFinishPasskeyRegistration = (
  options?: SafeMutationOptions<
    null,
    FetchError,
    FinishPasskeyRegistrationVariables
  >
) =>
  useApiMutation({
    mutationFn: ({
      credentialJson,
      keyName,
    }: FinishPasskeyRegistrationVariables) =>
      apiFetch(
        "/api/webauthn/register/finish",
        WebAuthnFinishRegistrationSchema,
        {
          method: "POST",
          body: { credentialJson, keyName },
        }
      ),
    throwOnError: false,
    ...options,
  })

interface UsePasskeyRegistrationOptions {
  isSupported: boolean
  pendingCredentialJson: string | null
  newKeyName: string
  setIsNamingDialogOpen: (open: boolean) => void
  setNewKeyName: (name: string) => void
  setPendingCredentialJson: (credentialJson: string | null) => void
  onSaveSuccess?: () => void
}

export const usePasskeyRegistration = ({
  isSupported,
  pendingCredentialJson,
  newKeyName,
  setIsNamingDialogOpen,
  setNewKeyName,
  setPendingCredentialJson,
  onSaveSuccess,
}: UsePasskeyRegistrationOptions) => {
  const t = useTranslations()
  const [isRegistering, setIsRegistering] = useState(false)
  const [isSavingName, setIsSavingName] = useState(false)

  const startPasskeyRegistration = useStartPasskeyRegistration()
  const finishPasskeyRegistration = useFinishPasskeyRegistration()

  const handleAddPasskey = async (): Promise<void> => {
    if (!isSupported) {
      toast.error(t("generated.shared.deviceSupportSecurityKeys"))
      return
    }

    if (!navigator.credentials) {
      toast.error(t("generated.shared.browserSupportWebauthn"))
      return
    }

    setIsRegistering(true)

    try {
      const [startError, startResponse] = await tryCatch(
        startPasskeyRegistration.mutateAsync()
      )

      if (startError || !startResponse) {
        return
      }

      const [credentialError, credential] = await tryCatch(
        navigator.credentials.create({
          publicKey: startResponse,
        })
      )
      if (credentialError) {
        toast.error(
          getWebAuthnErrorMessage(
            credentialError,
            t("generated.dashboard.settings.failedCreateSecurityKey"),
            t
          )
        )
        return
      }

      if (!isPublicKeyCredential(credential)) {
        toast.error(t("generated.shared.securityKeyDataRead"))
        return
      }

      const credentialJson = serializeCredential(credential)

      setPendingCredentialJson(credentialJson)
      setNewKeyName("")
      setIsNamingDialogOpen(true)
    } finally {
      setIsRegistering(false)
    }
  }

  const handleSaveNewPasskey = async (): Promise<void> => {
    const trimmedName = newKeyName.trim()
    if (!(pendingCredentialJson && trimmedName)) {
      return
    }

    setIsSavingName(true)

    const [finishError] = await tryCatch(
      finishPasskeyRegistration.mutateAsync({
        credentialJson: pendingCredentialJson,
        keyName: trimmedName,
      })
    )

    setIsSavingName(false)

    if (finishError) {
      return
    }

    setIsNamingDialogOpen(false)
    setPendingCredentialJson(null)
    setNewKeyName("")
    toast.success(t("generated.dashboard.settings.securityKeyBeenAdded"))
    onSaveSuccess?.()
  }

  return {
    handleAddPasskey,
    handleSaveNewPasskey,
    isRegistering,
    isSavingName,
  }
}
