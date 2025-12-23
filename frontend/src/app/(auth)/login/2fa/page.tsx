"use client"

import { useForm } from "@tanstack/react-form"
import { motion, useReducedMotion } from "framer-motion"
import z from "zod"
import { Button } from "@/components/ui/button"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { createApiSchema } from "@/lib/create-api-schema"
import { apiFetch } from "@/lib/fetcher"

const LoginSchema = createApiSchema({
  POST: {
    input: z.object({
      email: z.email("Nieprawidłowy adres email"),
      password: z.string().min(6, "Hasło musi mieć co najmniej 6 znaków"),
      rememberMe: z.boolean("Pole zapamiętaj mnie musi być wartością logiczną"),
    }),
    output: z.null(),
  },
})

// function FieldState({ field }: { field: AnyFieldApi }) {
//   const error = field.getMeta().errors[0] as ZodError | null
//   return error ? (
//     <p className="mt-1 text-wrap text-red-600 text-xs">{error.message}</p>
//   ) : null
// }

export default function LoginPage() {
  const shouldReduceMotion = useReducedMotion()

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
    onSubmit: async (values) => {
      console.log(values)
      await apiFetch("/api/auth/login", LoginSchema, {
        method: "POST",
        body: { ...values.value },
      })
    },
    validators: {
      onSubmitAsync: LoginSchema.shape.POST.shape.input,
    },
  })

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      aria-labelledby="glass-sign-in-title"
      className="group relative w-full max-w-lg overflow-hidden rounded-3xl border border-border/60 bg-card/85 p-8 backdrop-blur-xl sm:p-10"
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
      role="form"
      transition={{
        duration: 0.45,
        ease: shouldReduceMotion ? "linear" : [0.16, 1, 0.3, 1],
      }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-br from-foreground/[0.04] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
      <div className="mb-8 space-y-2 text-center">
        <h1
          className="mt-3 font-semibold text-2xl text-foreground sm:text-3xl"
          id="glass-verification-title"
        >
          Wpisz kod weryfikacyjny
        </h1>
        <p className="mt-2 text-muted-foreground text-sm">
          Wysłaliśmy 6-cyfrowy kod na twój adres email. Wpisz go poniżej, aby
          kontynuować.
        </p>
      </div>

      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit(e)
        }}
      >
        <div className="flex w-full items-center justify-center">
          <form.Field name="email">
            {(field) => (
              <InputOTP
                className="**:data-[slot='input-otp-slot']:size-16!"
                id={field.name}
                maxLength={6}
                onChange={(value) => field.handleChange(value)}
              >
                <InputOTPGroup className="**:data-[slot='input-otp-slot']:size-16!">
                  <InputOTPSlot className="text-xl" index={0} />
                  <InputOTPSlot className="text-xl" index={1} />
                  <InputOTPSlot className="text-xl" index={2} />
                </InputOTPGroup>
                <InputOTPSeparator className="[&_svg:not([class*='size-'])]:size-8" />
                <InputOTPGroup className="**:data-[slot='input-otp-slot']:size-16!">
                  <InputOTPSlot className="text-xl" index={3} />
                  <InputOTPSlot className="text-xl" index={4} />
                  <InputOTPSlot className="text-xl" index={5} />
                </InputOTPGroup>
              </InputOTP>
            )}
          </form.Field>
        </div>

        <Button
          className="w-full bg-primary text-primary-foreground shadow-[0_20px_60px_-30px_rgba(79,70,229,0.75)] transition-transform duration-300"
          size={"lg"}
          type="submit"
        >
          Zweryfikuj i zaloguj się
        </Button>
      </form>
    </motion.div>
  )
}
