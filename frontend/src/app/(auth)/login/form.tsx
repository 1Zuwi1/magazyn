"use client"

import { type AnyFieldApi, useForm } from "@tanstack/react-form"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { ZodError } from "zod"
import Logo from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { apiFetch } from "@/lib/fetcher"
import { LoginSchema } from "@/lib/schemas"
import tryCatch from "@/lib/try-catch"

function FieldState({ field }: { field: AnyFieldApi }) {
  const error = field.state.meta.errors[0] as ZodError

  return error ? (
    <p className="mt-1 text-wrap text-red-600 text-xs">{error.message}</p>
  ) : null
}

export default function LoginForm() {
  const router = useRouter()
  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
    onSubmit: async ({ value }) => {
      const [err, _] = await tryCatch(
        apiFetch("/api/auth/login", LoginSchema, {
          method: "POST",
          body: { ...value },
        })
      )

      if (err) {
        toast.error("Wystąpił błąd podczas logowania. Spróbuj ponownie.")
        return
      }

      toast.success("Zalogowano pomyślnie!")
      router.push("/dashboard")
    },
    validators: {
      onSubmitAsync: LoginSchema.shape.POST.shape.input,
    },
  })

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
      >
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <Logo />
            <FieldDescription>
              Wprowadź swój email i hasło, aby uzyskać dostęp do konta.
            </FieldDescription>
          </div>
          <form.Field name="email">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                <Input
                  className={
                    field.state.meta.errors.length ? "border-red-500" : ""
                  }
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="jan@kowalski.pl"
                  type="email"
                  value={field.state.value}
                />
                <FieldState field={field} />
              </Field>
            )}
          </form.Field>

          <form.Field name="password">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Hasło</FieldLabel>
                <Input
                  className={
                    field.state.meta.errors.length ? "border-red-500" : ""
                  }
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="••••••••"
                  type="password"
                  value={field.state.value}
                />
                <FieldState field={field} />
              </Field>
            )}
          </form.Field>

          <form.Field name="rememberMe">
            {(field) => (
              <Field>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={field.state.value}
                    id={field.name}
                    onCheckedChange={(checked) => field.handleChange(!!checked)}
                  />
                  <FieldLabel
                    className="font-medium text-sm leading-none"
                    htmlFor={field.name}
                  >
                    Zapamiętaj mnie
                  </FieldLabel>
                </div>
                <FieldState field={field} />
              </Field>
            )}
          </form.Field>

          <Field>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <Button
                  className="w-full"
                  disabled={!canSubmit || isSubmitting}
                  type="submit"
                >
                  Zaloguj się {isSubmitting && <Spinner />}
                </Button>
              )}
            </form.Subscribe>
          </Field>
        </FieldGroup>
      </form>
    </div>
  )
}
