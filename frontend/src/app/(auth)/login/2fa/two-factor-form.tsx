"use client"

import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useForm } from "@tanstack/react-form"
import { REGEXP_ONLY_DIGITS } from "input-otp"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import AuthCard from "@/app/(auth)/components/auth-card"
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
import { apiFetch } from "@/lib/fetcher"
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
  methodTitles: Record<TwoFactorMethod, string>
  methodSwitchLabels: Record<TwoFactorMethod, string>
  defaultLinkedMethod: TwoFactorMethod
  otpLength: number
}

export default function TwoFactorForm({
  linkedMethods,
  resendMethods,
  methodTitles,
  methodSwitchLabels,
  defaultLinkedMethod,
  otpLength,
}: TwoFactorFormProps) {
  if (linkedMethods.length === 0) {
    throw new Error("TwoFactorForm requires at least one linked 2FA method.")
  }
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
          console.error(err)
          toast.error(
            "Nieprawidłowy kod lub błąd weryfikacji. Spróbuj ponownie."
          )
          return
        }
        toast.success("Zweryfikowano!")
        router.push("/dashboard")
      } catch (e) {
        console.error(e)
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
          toast.error("Nieobsługiwana metoda ponownego wysyłania kodu.")
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
        toast.error("Nie udało się wysłać kodu ponownie. Spróbuj za chwilę.")
        return false
      }

      toast.success(
        m === "SMS" ? "Wysłano nowy kod SMS." : "Wysłano nowy kod e-mailem."
      )
      return true
    },
    [resendMethods]
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
              Cofnij do logowania
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
                    <form.Field name="code">
                      {(field) => (
                        <FieldWithState
                          field={field}
                          label="Kod weryfikacyjny"
                          labelClassName="sr-only"
                          renderInput={({ id, isInvalid }) => (
                            <InputOTP
                              aria-invalid={isInvalid}
                              autoComplete="one-time-code"
                              containerClassName="items-center justify-center gap-4"
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
                        Nie dotarło?{" "}
                        <Button
                          className="h-auto p-0 align-baseline"
                          isLoading={isResending}
                          onClick={() => resendCode(method as ResendType)}
                          type="button"
                          variant="link"
                        >
                          Wyślij ponownie
                        </Button>
                      </FieldDescription>
                    ) : null}

                    {alternatives.length ? (
                      <div className="mt-3">
                        <p className="text-center text-muted-foreground text-sm">
                          Użyj innej metody
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
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button
                className="w-full"
                disabled={isSubmitting}
                isLoading={isSubmitting}
                type="submit"
              >
                Zweryfikuj kod
              </Button>
            )}
          </form.Subscribe>
        </FieldGroup>
      </form>
    </AuthCard>
  )
}
