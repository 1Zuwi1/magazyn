"use client"

import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useForm } from "@tanstack/react-form"
import { REGEXP_ONLY_DIGITS } from "input-otp"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import AuthCard from "@/app/[locale]/(auth)/components/auth-card"
import PasskeyLogin from "@/app/[locale]/(auth)/components/passkey-login"
import { handleApiError } from "@/components/dashboard/utils/helpers"
import { FieldWithState } from "@/components/helpers/field-state"
import Logo from "@/components/logo"
import { Button } from "@/components/ui/button"
import { FieldDescription, FieldGroup } from "@/components/ui/field"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { useAppTranslations } from "@/i18n/use-translations"
import { apiFetch, FetchError } from "@/lib/fetcher"
import {
  Resend2FASchema,
  type ResendType,
  type TwoFactorMethod,
  Verify2FASchema,
} from "@/lib/schemas"
import tryCatch from "@/lib/try-catch"
import { cn, getAnimationStyle } from "@/lib/utils"

interface TwoFactorFormProps {
  linkedMethods: TwoFactorMethod[]
  resendMethods: ResendType[]
  defaultLinkedMethod: TwoFactorMethod
  otpLength: number
}

export default function TwoFactorForm({
  linkedMethods,
  resendMethods,
  defaultLinkedMethod,
  otpLength,
}: TwoFactorFormProps) {
  const t = useAppTranslations()

  if (linkedMethods.length === 0) {
    throw new Error(t("generated.auth.twofactorformRequiresLeastOneLinked"))
  }

  const methodTitles = useMemo(
    () => ({
      AUTHENTICATOR: t("generated.auth.enterCodeAuthenticatorApp"),
      EMAIL: t("generated.auth.enterCodeSentEMail"),
      PASSKEYS: t("generated.auth.authenticateAccessKeys"),
      BACKUP_CODES: t("generated.auth.useRecoveryCode"),
    }),
    [t]
  )

  const methodSwitchLabels = useMemo(
    () => ({
      AUTHENTICATOR: t("generated.auth.useAuthenticatorApp"),
      EMAIL: t("generated.auth.sendCodeEmail"),
      PASSKEYS: t("generated.auth.useAccessKeys"),
      BACKUP_CODES: t("generated.auth.useRecoveryCode"),
    }),
    [t]
  )

  const [defaultMethod] = useState(() => defaultLinkedMethod)
  const [isResending, setIsResending] = useState(false)
  const autoSubmittedRef = useRef(false)
  const router = useRouter()

  const form = useForm({
    defaultValues: { code: "", method: defaultMethod },
    onSubmit: async ({ value }) => {
      try {
        const [err] = await tryCatch(
          apiFetch("/api/2fa/check", Verify2FASchema, {
            method: "POST",
            body: { method: value.method, code: value.code },
          })
        )
        if (err) {
          if (FetchError.isError(err)) {
            handleApiError(err, undefined, t)
          } else {
            toast.error(t("generated.auth.invalidCodeVerificationErrorAgain"))
          }
          return
        }
        toast.success(t("generated.auth.verified"))
        router.push("/dashboard")
      } catch (e) {
        if (FetchError.isError(e)) {
          handleApiError(e, undefined, t)
          return
        }
        toast.error(t("generated.auth.unexpectedErrorOccurredAgain"))
      } finally {
        autoSubmittedRef.current = false
      }
    },
    validators: {
      onSubmitAsync: Verify2FASchema.shape.POST.shape.input,
    },
  })

  const resendCode = useCallback(
    async (m: ResendType, showNotSupportedError = true) => {
      if (!resendMethods.includes(m)) {
        if (showNotSupportedError) {
          toast.error(t("generated.auth.unsupportedMethodResendingCode"))
        }
        return false
      }
      setIsResending(true)
      const [err] = await tryCatch(
        apiFetch("/api/2fa/send", Resend2FASchema, {
          method: "POST",
          body: { method: m },
        })
      )
      setIsResending(false)

      if (err) {
        toast.error(t("generated.auth.codeFailedResendAgainMoment"))
        return false
      }

      toast.success(t("generated.auth.newCodeBeenEmailed"))
      return true
    },
    [resendMethods, t]
  )

  async function handleSwitchMethod(next: TwoFactorMethod) {
    form.setFieldValue("method", next)
    form.resetField("code")

    autoSubmittedRef.current = false

    if (resendMethods.includes(next as ResendType)) {
      await resendCode(next as ResendType)
    }
  }

  useEffect(() => {
    resendCode(defaultMethod as ResendType, false)
  }, [defaultMethod, resendCode])

  return (
    <AuthCard>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
      >
        <FieldGroup>
          <div
            className="fade-in flex animate-in items-center justify-start duration-500"
            style={getAnimationStyle("50ms")}
          >
            <Link
              className="inline-flex items-center gap-1 font-medium text-foreground/80 text-xs uppercase tracking-wide hover:text-primary hover:underline"
              href="/login"
            >
              <HugeiconsIcon className="size-4" icon={ArrowLeft01Icon} />
              {t("generated.auth.backLogin")}
            </Link>
          </div>
          <form.Subscribe
            selector={(state) => ({
              method: state.values.method,
              isSubmitting: state.isSubmitting,
            })}
          >
            {({ method, isSubmitting }) => {
              const alternatives = linkedMethods.filter((m) => m !== method)
              const canResend = resendMethods.includes(method as ResendType)
              const isPasskey = method === "PASSKEYS"
              const slotClassName =
                "gap-2.5 *:data-[slot=input-otp-slot]:h-16 *:data-[slot=input-otp-slot]:w-12 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border *:data-[slot=input-otp-slot]:text-xl"

              return (
                <>
                  <div
                    className="fade-in flex animate-in flex-col items-center gap-3 text-center duration-500"
                    style={getAnimationStyle("100ms")}
                  >
                    <div className="relative">
                      <div className="absolute -inset-3 rounded-full bg-primary/10 blur-lg" />
                      <Logo className="relative" />
                    </div>
                    <FieldDescription className="mt-2 text-muted-foreground/80">
                      {methodTitles[method]}
                    </FieldDescription>
                  </div>
                  <div
                    className="fade-in mt-2 animate-in space-y-4 duration-500"
                    style={getAnimationStyle("200ms")}
                  >
                    {isPasskey ? (
                      <PasskeyLogin
                        disabled={isSubmitting || isResending}
                        label={t("generated.shared.verifySecurityKey")}
                        showSeparator={false}
                      />
                    ) : (
                      <>
                        <form.Field name="code">
                          {(field) => (
                            <FieldWithState
                              field={field}
                              label={t("generated.shared.verificationCode")}
                              labelClassName="sr-only"
                              renderInput={({ id, isInvalid }) => (
                                <InputOTP
                                  aria-invalid={isInvalid}
                                  autoComplete="one-time-code"
                                  autoFocus
                                  containerClassName="items-center justify-center gap-4 flex-col md:flex-row"
                                  disabled={isSubmitting || isResending}
                                  id={id}
                                  inputMode="numeric"
                                  maxLength={otpLength}
                                  onChange={(raw) => {
                                    const code = raw
                                      .replace(/\D/g, "")
                                      .slice(0, otpLength)
                                    field.handleChange(code)

                                    if (code.length < otpLength) {
                                      autoSubmittedRef.current = false
                                      return
                                    }

                                    if (
                                      code.length === otpLength &&
                                      !autoSubmittedRef.current &&
                                      !form.state.isSubmitting
                                    ) {
                                      autoSubmittedRef.current = true
                                      queueMicrotask(() => {
                                        form.handleSubmit()
                                      })
                                    }
                                  }}
                                  pattern={REGEXP_ONLY_DIGITS}
                                  required
                                  spellCheck={false}
                                  value={field.state.value}
                                >
                                  <InputOTPGroup
                                    className={cn(slotClassName, {
                                      "*:data-[slot=input-otp-slot]:border-destructive":
                                        isInvalid,
                                    })}
                                  >
                                    <InputOTPSlot index={0} />
                                    <InputOTPSlot index={1} />
                                    <InputOTPSlot index={2} />
                                  </InputOTPGroup>

                                  <InputOTPSeparator />

                                  <InputOTPGroup
                                    className={cn(slotClassName, {
                                      "*:data-[slot=input-otp-slot]:border-destructive":
                                        isInvalid,
                                    })}
                                  >
                                    <InputOTPSlot index={3} />
                                    <InputOTPSlot index={4} />
                                    <InputOTPSlot index={5} />
                                  </InputOTPGroup>
                                </InputOTP>
                              )}
                            />
                          )}
                        </form.Field>

                        {canResend ? (
                          <FieldDescription className="text-center">
                            {t("generated.auth.didntArrive")}{" "}
                            <Button
                              className="h-auto p-0 align-baseline"
                              isLoading={isResending}
                              onClick={() => resendCode(method as ResendType)}
                              type="button"
                              variant="link"
                            >
                              {t("generated.shared.resend")}
                            </Button>
                          </FieldDescription>
                        ) : null}
                      </>
                    )}

                    {alternatives.length ? (
                      <div className="mt-3">
                        <p className="text-center text-muted-foreground text-sm">
                          {t("generated.auth.useAnotherMethod")}
                        </p>
                        <div className="mt-2 flex flex-col gap-1">
                          {alternatives.map((m) => (
                            <Button
                              className="h-9 justify-start px-2"
                              isLoading={isResending || form.state.isSubmitting}
                              key={m}
                              onClick={() => handleSwitchMethod(m)}
                              showSpinner={false}
                              size="sm"
                              type="button"
                              variant="link"
                            >
                              {methodSwitchLabels[m]}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </>
              )
            }}
          </form.Subscribe>
          <form.Subscribe
            selector={(state) => ({
              isSubmitting: state.isSubmitting,
              method: state.values.method,
            })}
          >
            {({ isSubmitting, method }) =>
              method === "PASSKEYS" ? null : (
                <Button
                  className="w-full"
                  disabled={isSubmitting}
                  isLoading={isSubmitting}
                  type="submit"
                >
                  {t("generated.shared.verifyCode")}
                </Button>
              )
            }
          </form.Subscribe>
        </FieldGroup>
      </form>
    </AuthCard>
  )
}
