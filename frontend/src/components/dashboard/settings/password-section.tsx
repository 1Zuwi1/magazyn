"use client"

import { useForm } from "@tanstack/react-form"
import { useTranslations } from "next-intl"
import { useRef } from "react"
import { toast } from "sonner"
import { useTwoFactorVerificationDialog } from "@/components/dashboard/settings/two-factor-verification-dialog-store"
import { handleApiError } from "@/components/dashboard/utils/helpers"
import { FieldWithState } from "@/components/helpers/field-state"
import { Button } from "@/components/ui/button"
import { apiFetch } from "@/lib/fetcher"
import { ChangePasswordFormSchema, ChangePasswordSchema } from "@/lib/schemas"
import tryCatch from "@/lib/try-catch"
export function PasswordSection() {
  const t = useTranslations()

  const { open } = useTwoFactorVerificationDialog()
  const isTwoFactorVerifiedRef = useRef(false)

  const form = useForm({
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    onSubmit: async ({ value }) => {
      if (!isTwoFactorVerifiedRef.current) {
        open({
          onVerified: async () => {
            isTwoFactorVerifiedRef.current = true
            await form.handleSubmit()
          },
        })
        return
      }

      const [error] = await tryCatch(
        apiFetch("/api/users/password", ChangePasswordSchema, {
          method: "PATCH",
          body: {
            oldPassword: value.oldPassword,
            newPassword: value.newPassword,
          },
        })
      )

      isTwoFactorVerifiedRef.current = false

      if (error) {
        handleApiError(
          error,
          t("generated.dashboard.settings.failedChangePasswordAgain"),
          t
        )
        return
      }

      form.reset()
      toast.success(t("generated.dashboard.settings.passwordBeenChanged"))
    },
    validators: {
      onSubmitAsync: ChangePasswordFormSchema,
    },
  })

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        form.handleSubmit()
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <form.Field name="oldPassword">
          {(field) => {
            return (
              <div className="sm:col-span-2">
                <FieldWithState
                  autoComplete="current-password"
                  field={field}
                  id="current-password"
                  label={t("generated.dashboard.settings.currentPassword")}
                  placeholder={t(
                    "generated.dashboard.settings.enterCurrentPassword"
                  )}
                  type="password"
                />
              </div>
            )
          }}
        </form.Field>
        <form.Field name="newPassword">
          {(field) => {
            return (
              <FieldWithState
                autoComplete="new-password"
                field={field}
                id="new-password"
                label={t("generated.shared.newPassword")}
                placeholder={t("generated.dashboard.settings.least8Characters")}
                type="password"
              />
            )
          }}
        </form.Field>
        <form.Field name="confirmPassword">
          {(field) => {
            return (
              <FieldWithState
                autoComplete="new-password"
                field={field}
                id="confirm-password"
                label={t("generated.shared.confirmPassword")}
                placeholder={t(
                  "generated.dashboard.settings.repeatNewPassword"
                )}
                type="password"
              />
            )
          }}
        </form.Field>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-xs">
          {t("generated.dashboard.settings.min8CharactersIncludingNumbers")}
        </p>
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <Button
              disabled={!canSubmit}
              isLoading={isSubmitting}
              type="submit"
            >
              {t("generated.dashboard.settings.changePassword")}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  )
}
