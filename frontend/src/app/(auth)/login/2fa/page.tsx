"use client"

import { useForm } from "@tanstack/react-form"
import { REGEXP_ONLY_DIGITS } from "input-otp"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { z } from "zod"
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
import { createApiSchema } from "@/lib/create-api-schema"
import { apiFetch } from "@/lib/fetcher"
import tryCatch from "@/lib/try-catch"

type TwoFactorMethod = "authenticator" | "sms" | "email"

// Zakładam endpointy jak wcześniej.
// Jeśli masz inne, podmień tu, a reszta zostaje.
const Verify2FASchema = createApiSchema({
  POST: {
    input: z.object({
      method: z.enum(["authenticator", "sms", "email"]),
      code: z.string().length(6, "Kod musi mieć dokładnie 6 cyfr"),
    }),
    output: z.null(),
  },
})

const Resend2FASchema = createApiSchema({
  POST: {
    input: z.object({
      method: z.enum(["sms", "email"]),
    }),
    output: z.null(),
  },
})

function methodTitle(method: TwoFactorMethod) {
  switch (method) {
    case "authenticator":
      return "Wpisz kod z aplikacji uwierzytelniającej"
    case "sms":
      return "Wpisz kod wysłany SMS-em"
    case "email":
      return "Wpisz kod wysłany na e-mail"
    default:
      return "Nieznana metoda"
  }
}

function methodSwitchLabel(method: TwoFactorMethod) {
  switch (method) {
    case "authenticator":
      return "Użyj aplikacji uwierzytelniającej"
    case "sms":
      return "Wyślij kod SMS-em"
    case "email":
      return "Wyślij kod e-mailem"
    default:
      return "Nieznana metoda"
  }
}

const linkedMethods: TwoFactorMethod[] = ["authenticator", "sms", "email"]
export default function TwoFactorPage() {
  const defaultMethod = useMemo<TwoFactorMethod>(
    () => linkedMethods[0] ?? "email",
    []
  )

  const [method, setMethod] = useState<TwoFactorMethod>(defaultMethod)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)

  const alternatives = linkedMethods.filter((m) => m !== method)
  const canResend = method === "sms" || method === "email"

  const form = useForm({
    defaultValues: { code: "" },
    onSubmit: async ({ value }) => {
      if (value.code.length !== 6) {
        toast.error("Wpisz 6-cyfrowy kod.")
        return
      }

      setIsSubmitting(true)
      const [err] = await tryCatch(
        apiFetch("/api/auth/login/2fa", Verify2FASchema, {
          method: "POST",
          body: { method, code: value.code },
        })
      )
      setIsSubmitting(false)

      if (err) {
        toast.error("Nieprawidłowy kod lub błąd weryfikacji. Spróbuj ponownie.")
        return
      }

      toast.success("Zweryfikowano!")
    },
  })

  async function resendCode(m: "sms" | "email") {
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

  async function switchMethod(next: TwoFactorMethod) {
    setMethod(next)
    form.resetField("code")

    if (next === "sms" || next === "email") {
      await resendCode(next)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit(e)
        }}
      >
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="font-bold text-xl">Wpisz kod weryfikacyjny</h1>
            <FieldDescription>{methodTitle(method)}</FieldDescription>
          </div>

          <form.Field name="code">
            {(field) => (
              <Field>
                <FieldLabel className="sr-only" htmlFor={field.name}>
                  Kod weryfikacyjny
                </FieldLabel>

                <InputOTP
                  containerClassName="gap-4 items-center justify-center"
                  id={field.name}
                  maxLength={6}
                  onChange={(code) => field.handleChange(code)}
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
                      onClick={() => resendCode(method)}
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
                          disabled={isResending || isSubmitting}
                          key={m}
                          onClick={() => switchMethod(m)}
                          size="sm"
                          type="button"
                          variant="link"
                        >
                          {methodSwitchLabel(m)}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </Field>
            )}
          </form.Field>
          <Field>
            <Button className="w-full" disabled={isSubmitting} type="submit">
              Zweryfikuj {isSubmitting && <Spinner />}
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  )
}
