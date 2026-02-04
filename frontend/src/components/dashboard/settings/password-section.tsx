"use client"

import { useForm } from "@tanstack/react-form"
import { useState } from "react"
import { toast } from "sonner"
import { FieldWithState } from "@/components/helpers/field-state"
import { Button } from "@/components/ui/button"
import { ChangePasswordFormSchema } from "@/lib/schemas"
import { TwoFactorVerificationDialog } from "./two-factor-verification-dialog"
import { wait } from "./utils"

export function PasswordSection() {
  const [isVerificationDialogOpen, setIsVerificationDialogOpen] =
    useState(false)

  const [isVerified, setIsVerified] = useState(false) // FIXME: Only in dev - remove later

  const form = useForm({
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    onSubmit: async () => {
      if (!isVerified) {
        setIsVerificationDialogOpen(true)
        return
      }

      try {
        await wait(1000)
        form.reset()
        toast.success("Hasło zostało zmienione.")
      } catch {
        toast.error("Nie udało się zmienić hasła. Spróbuj ponownie.")
      }
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
                  label="Obecne hasło"
                  placeholder="Wprowadź obecne hasło"
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
                label="Nowe hasło"
                placeholder="Co najmniej 8 znaków"
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
                label="Potwierdź hasło"
                placeholder="Powtórz nowe hasło"
                type="password"
              />
            )
          }}
        </form.Field>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-xs">
          Min. 8 znaków, w tym cyfry, znaki specjalne, małe i wielkie litery.
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
              Zmień hasło
            </Button>
          )}
        </form.Subscribe>
      </div>
      <TwoFactorVerificationDialog
        onOpenChange={setIsVerificationDialogOpen}
        onVerified={() => {
          setIsVerified(true) // FIXME: Only in dev - remove later
          form.handleSubmit()
        }}
        open={isVerificationDialogOpen}
      />
    </form>
  )
}
