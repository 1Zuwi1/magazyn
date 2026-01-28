"use client"

import { useForm } from "@tanstack/react-form"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { handleApiError } from "@/components/dashboard/utils/helpers"
import { FieldWithState } from "@/components/helpers/field-state"
import Logo from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup } from "@/components/ui/field"
import { apiFetch } from "@/lib/fetcher"
import { FormRegisterSchema, LoginSchema, RegisterSchema } from "@/lib/schemas"
import tryCatch from "@/lib/try-catch"

type AuthMode = "login" | "register"

interface AuthFormProps {
  mode: AuthMode
}

const values = {
  login: {
    email: "",
    password: "",
  },
  register: {
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  },
}

type ValueTypes = typeof values

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const isLogin = mode === "login"

  const form = useForm({
    defaultValues: values[mode],
    onSubmit: async ({ value }) => {
      if (isLogin) {
        const loginValue = value as ValueTypes["login"]
        const [err, res] = await tryCatch(
          apiFetch("/api/auth/login", LoginSchema, {
            method: "POST",
            body: loginValue,
          })
        )

        if (err) {
          handleApiError(
            err,
            "Wystąpił błąd podczas logowania. Spróbuj ponownie."
          )
          return
        }

        toast.success("Zalogowano pomyślnie!")
        router.push(res.requiresTwoFactor ? "/login/2fa" : "/dashboard")
      } else {
        const { confirmPassword, ...registerValue } =
          value as ValueTypes["register"]
        const [err] = await tryCatch(
          apiFetch("/api/auth/register", RegisterSchema, {
            method: "POST",
            body: registerValue,
          })
        )

        if (err) {
          handleApiError(
            err,
            "Wystąpił błąd podczas rejestracji. Spróbuj ponownie."
          )
          return
        }

        toast.success("Zarejestrowano pomyślnie! Możesz się teraz zalogować.")
        router.push("/login")
      }
    },
    validators: {
      onSubmitAsync: isLogin
        ? LoginSchema.shape.POST.shape.input
        : FormRegisterSchema,
    },
  })

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
      >
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <Logo />
            <FieldDescription>
              {isLogin
                ? "Wprowadź swój adres email i hasło, aby uzyskać dostęp do konta."
                : "Utwórz konto, aby korzystać z aplikacji."}
            </FieldDescription>
          </div>
          <form.Field name="email">
            {(field) => (
              <FieldWithState
                field={field}
                label="Email"
                placeholder="jan@kowalski.pl"
                type="email"
              />
            )}
          </form.Field>
          {!isLogin && (
            <form.Field name="fullName">
              {(field) => (
                <FieldWithState
                  field={field}
                  label="Pełne imię i nazwisko"
                  placeholder="Jan Kowalski"
                  type="text"
                />
              )}
            </form.Field>
          )}

          <form.Field name="password">
            {(field) => {
              return (
                <FieldWithState
                  field={field}
                  label="Hasło"
                  placeholder="••••••••"
                  type="password"
                />
              )
            }}
          </form.Field>

          {!isLogin && (
            <form.Field name="confirmPassword">
              {(field) => (
                <FieldWithState
                  field={field}
                  label="Potwierdź hasło"
                  placeholder="••••••••"
                  type="password"
                />
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
                  disabled={!canSubmit}
                  isLoading={isSubmitting}
                  type="submit"
                >
                  {isLogin ? "Zaloguj się" : "Zarejestruj się"}
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
