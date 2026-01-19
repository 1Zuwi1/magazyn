"use client"

import { useForm } from "@tanstack/react-form"
import { REGEXP_ONLY_DIGITS } from "input-otp"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import Logo from "@/components/logo"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { useHandleApiError } from "@/hooks/use-handle-api-error"
import { apiFetch } from "@/lib/fetcher"
import { createAuthSchemas } from "@/lib/schemas"
import tryCatch from "@/lib/try-catch"

export type TwoFactorMethod = "authenticator" | "sms" | "email"
export type ResendType = Exclude<TwoFactorMethod, "authenticator">

interface TwoFactorFormProps {
  linkedMethods: TwoFactorMethod[]
  resendMethods: ResendType[]
  otpLength: number
}

export default function TwoFactorForm({
  linkedMethods,
  resendMethods,
  otpLength,
}: TwoFactorFormProps) {
  const translate = useTranslations("twoFactor")
  const authTranslations = useTranslations("auth")
  const apiErrors = useTranslations("common.apiErrors")

  const handleApiError = useHandleApiError()
  const defaultMethod = linkedMethods[0] ?? "email"
  const [method, setMethod] = useState<TwoFactorMethod>(defaultMethod)
  const [isResending, setIsResending] = useState(false)
  const autoSubmittedRef = useRef(false)
  const router = useRouter()
  const { Resend2FASchema, Verify2FASchema } = useMemo(
    () => createAuthSchemas(authTranslations),
    [authTranslations]
  )

  const methodTitles: Record<TwoFactorMethod, string> = {
    authenticator: translate("methodTitles.authenticator"),
    sms: translate("methodTitles.sms"),
    email: translate("methodTitles.email"),
  }
  const methodSwitchLabels: Record<TwoFactorMethod, string> = {
    authenticator: translate("methodSwitch.authenticator"),
    sms: translate("methodSwitch.sms"),
    email: translate("methodSwitch.email"),
  }

  const form = useForm({
    defaultValues: { code: "" },
    onSubmit: async ({ value }) => {
      try {
        const [err] = await tryCatch(
          apiFetch("/api/auth/login/2fa/check", Verify2FASchema, {
            method: "POST",
            body: { method, code: value.code },
          })
        )
        if (err) {
          handleApiError(err, apiErrors("invalidCode"))
          return
        }
        toast.success(translate("success.verified"))
        router.push("/dashboard")
      } finally {
        autoSubmittedRef.current = false
      }
    },
    validators: {
      onSubmitAsync: Verify2FASchema.shape.POST.shape.input,
    },
  })

  const alternatives = useMemo(
    () => linkedMethods.filter((m) => m !== method),
    [method, linkedMethods]
  )

  const canResend = resendMethods.includes(method as ResendType)

  async function resendCode(m: ResendType) {
    if (!resendMethods.includes(m)) {
      toast.error(apiErrors("unsupportedResend"))
      return false
    }
    setIsResending(true)
    const [err] = await tryCatch(
      apiFetch("/api/auth/login/2fa/resend", Resend2FASchema, {
        method: "POST",
        body: { method: m },
      })
    )
    setIsResending(false)

    if (err) {
      handleApiError(err, apiErrors("resendFailed"))
      return false
    }

    toast.success(translate(`success.resend.${m}`))
    return true
  }

  async function handleSwitchMethod(next: TwoFactorMethod) {
    setMethod(next)
    form.resetField("code")

    autoSubmittedRef.current = false

    if (resendMethods.includes(next as ResendType)) {
      await resendCode(next as ResendType)
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
    >
      <FieldGroup>
        <Link className="underline" href="/">
          {translate("actions.backToHome")}
        </Link>
        <div className="flex flex-col items-center gap-2 text-center">
          <Logo />
          <FieldDescription>{methodTitles[method]}</FieldDescription>
        </div>

        <form.Field name="code">
          {(field) => (
            <Field disabled={form.state.isSubmitting || isResending}>
              <FieldLabel className="sr-only" htmlFor={field.name}>
                {translate("fields.code")}
              </FieldLabel>

              <InputOTP
                containerClassName="gap-4 items-center justify-center"
                id={field.name}
                maxLength={otpLength}
                onChange={(raw) => {
                  const code = raw.replace(/\D/g, "").slice(0, otpLength)
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
                value={field.state.value}
              >
                <InputOTPGroup className="gap-2.5 *:data-[slot=input-otp-slot]:h-16 *:data-[slot=input-otp-slot]:w-12 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border *:data-[slot=input-otp-slot]:text-xl">
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                </InputOTPGroup>

                <InputOTPSeparator />

                <InputOTPGroup className="gap-2.5 *:data-[slot=input-otp-slot]:h-16 *:data-[slot=input-otp-slot]:w-12 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border *:data-[slot=input-otp-slot]:text-xl">
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>

              {canResend ? (
                <FieldDescription className="text-center">
                  {translate("resend.prompt")}{" "}
                  <Button
                    className="h-auto p-0 align-baseline"
                    isLoading={isResending}
                    onClick={() => resendCode(method as ResendType)}
                    type="button"
                    variant="link"
                  >
                    {translate("resend.action")}
                  </Button>
                </FieldDescription>
              ) : null}

              {alternatives.length ? (
                <div className="mt-3">
                  <p className="text-center text-muted-foreground text-sm">
                    {translate("switch.prompt")}
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
            </Field>
          )}
        </form.Field>
        <Field>
          <Button
            className="w-full"
            isLoading={form.state.isSubmitting}
            type="submit"
          >
            {translate("actions.verify")}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
