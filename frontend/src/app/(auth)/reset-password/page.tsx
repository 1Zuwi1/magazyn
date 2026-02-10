"use client"

import { LockPasswordIcon } from "@hugeicons/core-free-icons"
import { useForm } from "@tanstack/react-form"
import { redirect, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import z from "zod"
import AuthCard from "@/app/(auth)/components/auth-card"
import { handleApiError } from "@/components/dashboard/utils/helpers"
import { FieldWithState } from "@/components/helpers/field-state"
import Logo from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup } from "@/components/ui/field"
import { createApiSchema } from "@/lib/create-api-schema"
import { apiFetch, FetchError } from "@/lib/fetcher"
import { PasswordSchema } from "@/lib/schemas"
import { getAnimationStyle } from "@/lib/utils"

const ResetPasswordSchema = createApiSchema({
  POST: {
    input: z.object({
      token: z.string(),
      newPassword: PasswordSchema,
    }),
    output: z.null(),
  },
})

export default function ResetPassword() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  if (!token) {
    redirect("/forgot-password")
  }
  const form = useForm({
    defaultValues: {
      token,
      newPassword: "",
    },
    onSubmit: async ({ value }) => {
      try {
        await apiFetch("/api/auth/reset-password", ResetPasswordSchema, {
          body: value,
          method: "POST",
        })

        toast.success(
          "Hasło zostało zresetowane. Możesz teraz zalogować się z nowym hasłem."
        )
        redirect("/login")
      } catch (e) {
        if (FetchError.isError(e)) {
          handleApiError(e)
          return
        }
        toast.error("Wystąpił nieoczekiwany błąd. Spróbuj ponownie.")
      }
    },
    validators: {
      onSubmitAsync: ResetPasswordSchema.shape.POST.shape.input,
    },
  })

  return (
    <AuthCard>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
      >
        <FieldGroup>
          {/* Header */}
          <div
            className="fade-in flex animate-in flex-col items-center gap-3 text-center duration-500"
            style={getAnimationStyle("100ms")}
          >
            <div className="relative">
              <div className="absolute -inset-3 rounded-full bg-primary/10 blur-lg" />
              <Logo className="relative" />
            </div>
            <FieldDescription className="mt-2 max-w-70 text-center text-muted-foreground/80">
              Wprowadź nowe hasło dla swojego konta.
            </FieldDescription>
          </div>
          <div
            className="fade-in animate-in space-y-4 duration-500"
            style={getAnimationStyle("200ms")}
          >
            <form.Field name="newPassword">
              {(field) => {
                return (
                  <FieldWithState
                    field={field}
                    icon={LockPasswordIcon}
                    label="Nowe hasło"
                    placeholder="••••••••"
                    type="password"
                  />
                )
              }}
            </form.Field>

            <Field>
              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
              >
                {([canSubmit, isSubmitting]) => (
                  <Button
                    className="w-full"
                    disabled={!canSubmit}
                    isLoading={isSubmitting}
                    size="lg"
                    type="submit"
                  >
                    Zresetuj hasło
                  </Button>
                )}
              </form.Subscribe>
            </Field>
          </div>
        </FieldGroup>
      </form>
    </AuthCard>
  )
}
