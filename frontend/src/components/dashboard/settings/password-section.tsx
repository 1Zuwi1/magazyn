"use client"

import { useForm } from "@tanstack/react-form"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { FieldWithState } from "@/components/helpers/field-state"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ChangePasswordFormSchema } from "@/lib/schemas"
import { PasswordVerificationSection } from "./password-verification-section"
import type { TwoFactorMethod } from "./types"
import { wait } from "./utils"

interface PasswordSectionProps {
  verificationRequired: boolean
  twoFactorMethod: TwoFactorMethod
}

export function PasswordSection({
  verificationRequired,
  twoFactorMethod,
}: PasswordSectionProps) {
  const [verificationComplete, setVerificationComplete] = useState(
    !verificationRequired
  )
  const verificationCompleteRef = useRef(verificationComplete)
  const [isVerificationDialogOpen, setIsVerificationDialogOpen] =
    useState(false)

  useEffect(() => {
    setVerificationComplete(!verificationRequired)
  }, [verificationRequired])

  useEffect(() => {
    verificationCompleteRef.current = verificationComplete
  }, [verificationComplete])

  const isVerificationBlocked = (): boolean =>
    verificationRequired && !verificationCompleteRef.current

  const form = useForm({
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
      twoFactorCode: "",
    },
    onSubmit: async () => {
      if (isVerificationBlocked()) {
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
      {verificationRequired ? (
        <Dialog
          onOpenChange={setIsVerificationDialogOpen}
          open={isVerificationDialogOpen}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Potwierdź 2FA przed zmianą</DialogTitle>
            </DialogHeader>
            <form.Field name="twoFactorCode">
              {(field) => (
                <PasswordVerificationSection
                  code={field.state.value}
                  method={twoFactorMethod}
                  onInputChange={(code) => field.handleChange(code)}
                  onVerificationChange={(complete) => {
                    setVerificationComplete(complete)
                    if (complete) {
                      verificationCompleteRef.current = true
                      setIsVerificationDialogOpen(false)
                      form.handleSubmit()
                    }
                  }}
                />
              )}
            </form.Field>
          </DialogContent>
        </Dialog>
      ) : null}
    </form>
  )
}
