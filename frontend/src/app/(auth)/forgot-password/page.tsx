"use client"

import { ArrowLeft01Icon, Mail01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useForm, useStore } from "@tanstack/react-form"
import Link from "next/link"
import { toast } from "sonner"
import z from "zod"
import AuthCard from "@/app/(auth)/components/auth-card"
import { handleApiError } from "@/components/dashboard/utils/helpers"
import { FieldWithState } from "@/components/helpers/field-state"
import Logo from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup } from "@/components/ui/field"
import { translateMessage } from "@/i18n/translate-message"
import { createApiSchema } from "@/lib/create-api-schema"
import { apiFetch, FetchError } from "@/lib/fetcher"
import { getAnimationStyle } from "@/lib/utils"

const ForgotPasswordSchema = createApiSchema({
  POST: {
    input: z.object({
      email: z.email(translateMessage("generated.m0028")),
    }),
    output: z.null(),
  },
})

export default function ForgotPassword() {
  const form = useForm({
    defaultValues: {
      email: "",
    },
    onSubmit: async ({ value }) => {
      try {
        await apiFetch("/api/auth/forgot-password", ForgotPasswordSchema, {
          body: value,
          method: "POST",
        })

        toast.success(translateMessage("generated.m0029"))
      } catch (e) {
        if (FetchError.isError(e)) {
          handleApiError(e)
          return
        }
        toast.error(translateMessage("generated.m0030"))
      }
    },
    validators: {
      onSubmitAsync: ForgotPasswordSchema.shape.POST.shape.input,
    },
  })

  const isSubmitting = useStore(form.store, (state) => state.isSubmitting)
  return (
    <AuthCard>
      <form
        className="space-y-0"
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
              {translateMessage("generated.m0031")}
            </Link>
          </div>
          <div
            className="fade-in flex animate-in flex-col items-center gap-3 text-center duration-500"
            style={getAnimationStyle("100ms")}
          >
            <div className="relative">
              <div className="absolute -inset-3 rounded-full bg-primary/10 blur-lg" />
              <Logo className="relative" />
            </div>
            <FieldDescription className="mt-2 max-w-70 text-center text-muted-foreground/80">
              {translateMessage("generated.m0032")}
            </FieldDescription>
          </div>
          <div
            className="fade-in mt-2 animate-in space-y-4 duration-500"
            style={getAnimationStyle("200ms")}
          >
            <form.Field name="email">
              {(field) => (
                <FieldWithState
                  field={field}
                  icon={Mail01Icon}
                  label={translateMessage("generated.m0874")}
                  placeholder={translateMessage("generated.m0875")}
                  type="email"
                />
              )}
            </form.Field>
            <Field className="pt-1">
              <Button
                className="w-full"
                isLoading={isSubmitting}
                size="lg"
                type="submit"
              >
                {translateMessage("generated.m0033")}
              </Button>
            </Field>
          </div>
        </FieldGroup>
      </form>
    </AuthCard>
  )
}
