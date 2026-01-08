"use client"

import { useForm } from "@tanstack/react-form"
import { REGEXP_ONLY_DIGITS } from "input-otp"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
import { Spinner } from "@/components/ui/spinner"
import { apiFetch } from "@/lib/fetcher"
import { Resend2FASchema, Verify2FASchema } from "@/lib/schemas"
import tryCatch from "@/lib/try-catch"

export type TwoFactorMethod = "authenticator" | "sms" | "email"
export type ResendType = Exclude<TwoFactorMethod, "authenticator">

interface TwoFactorFormProps {
  linkedMethods: TwoFactorMethod[]
  resendMethods: ResendType[]
  methodTitles: Record<TwoFactorMethod, string>
  methodSwitchLabels: Record<TwoFactorMethod, string>
  otpLength: number
}

export default function TwoFactorForm({
  linkedMethods,
  resendMethods,
  methodTitles,
  methodSwitchLabels,
  otpLength,
}: TwoFactorFormProps) {
  const defaultMethod = linkedMethods[0] ?? "email"
  const [method, setMethod] = useState<TwoFactorMethod>(defaultMethod)
  const [isResending, setIsResending] = useState(false)
  const autoSubmittedRef = useRef(false)
  const router = useRouter()

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
          toast.error(
            "Nieprawidłowy kod lub błąd weryfikacji. Spróbuj ponownie."
          )
          return
        }
        toast.success("Zweryfikowano!")
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
      toast.error("Nieobsługiwana metoda ponownego wysyłania kodu.")
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
      toast.error("Nie udało się wysłać kodu ponownie. Spróbuj za chwilę.")
      return false
    }

    toast.success(
      m === "sms" ? "Wysłano nowy kod SMS." : "Wysłano nowy kod e-mailem."
    )
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
          Cofnij się do strony głównej
        </Link>
        <div className="flex flex-col items-center gap-2 text-center">
          <Logo />
          <FieldDescription>{methodTitles[method]}</FieldDescription>
        </div>

        <form.Field name="code">
          {(field) => (
            <Field disabled={form.state.isSubmitting || isResending}>
              <FieldLabel className="sr-only" htmlFor={field.name}>
                Kod weryfikacyjny
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
                  Nie dotarło?{" "}
                  <Button
                    className="h-auto p-0 align-baseline"
                    disabled={isResending}
                    onClick={() => resendCode(method as ResendType)}
                    type="button"
                    variant="link"
                  >
                    Wyślij ponownie {isResending && <Spinner />}
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
                        disabled={isResending || form.state.isSubmitting}
                        key={m}
                        onClick={() => handleSwitchMethod(m)}
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
            disabled={form.state.isSubmitting}
            type="submit"
          >
            Zweryfikuj {form.state.isSubmitting && <Spinner />}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
