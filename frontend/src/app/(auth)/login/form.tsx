"use client"

import { type AnyFieldApi, useForm } from "@tanstack/react-form"
import Link from "next/link"
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
import { LoginSchema, RegisterSchema } from "@/lib/schemas"
import tryCatch from "@/lib/try-catch"

type AuthMode = "login" | "register"

interface AuthFormProps {
  mode: AuthMode
}

function FieldState({ field }: { field: AnyFieldApi }) {
  const error = field.state.meta.errors[0] as ZodError

  return error ? (
    <p className="mt-1 text-wrap text-red-600 text-xs">{error.message}</p>
  ) : null
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const isLogin = mode === "login"

  const form = useForm({
    defaultValues: isLogin
      ? {
          email: "",
          password: "",
          rememberMe: false,
        }
      : {
          email: "",
          password: "",
          confirmPassword: "",
        },
    onSubmit: async ({ value }) => {
      if (isLogin) {
        const loginValue = value as {
          email: string
          password: string
          rememberMe: boolean
        }
        const [err, res] = await tryCatch(
          apiFetch("/api/auth/login", LoginSchema, {
            method: "POST",
            body: loginValue,
          })
        )

        if (err) {
          toast.error("Wystąpił błąd podczas logowania. Spróbuj ponownie.")
          return
        }

        toast.success("Zalogowano pomyślnie!")
        router.push(res.requiresTwoFactor ? "/login/2fa" : "/dashboard")
      } else {
        const registerValue = value as {
          email: string
          password: string
          confirmPassword: string
        }
        const [err] = await tryCatch(
          apiFetch("/api/auth/register", RegisterSchema, {
            method: "POST",
            body: registerValue,
          })
        )

        if (err) {
          toast.error("Wystąpił błąd podczas rejestracji. Spróbuj ponownie.")
          return
        }

        toast.success("Zarejestrowano pomyślnie! Możesz się teraz zalogować.")
        router.push("/login")
      }
    },
    validators: {
      onSubmitAsync: isLogin
        ? LoginSchema.shape.POST.shape.input
        : RegisterSchema.shape.POST.shape.input,
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
              {isLogin
                ? "Wprowadź swój email i hasło, aby uzyskać dostęp do konta."
                : "Utwórz konto, aby korzystać z aplikacji."}
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

          {!isLogin && (
            <form.Field name="confirmPassword">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Potwierdź hasło</FieldLabel>
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
          )}

          {isLogin && (
            <form.Field name="rememberMe">
              {(field) => (
                <Field>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={field.state.value}
                      id={field.name}
                      onCheckedChange={(checked) =>
                        field.handleChange(!!checked)
                      }
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
          )}

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
                  {isLogin ? "Zaloguj się" : "Zarejestruj się"}{" "}
                  {isSubmitting && <Spinner />}
                </Button>
              )}
            </form.Subscribe>
          </Field>

          <div className="text-center text-sm">
            {isLogin ? (
              <>
                Nie masz konta?{" "}
                <Link className="text-primary underline" href="/register">
                  Zarejestruj się
                </Link>
              </>
            ) : (
              <>
                Masz już konto?{" "}
                <Link className="text-primary underline" href="/login">
                  Zaloguj się
                </Link>
              </>
            )}
          </div>
        </FieldGroup>
      </form>
    </div>
  )
}
