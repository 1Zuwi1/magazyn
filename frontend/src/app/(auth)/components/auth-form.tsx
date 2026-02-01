"use client"

import {
  LockPasswordIcon,
  Mail01Icon,
  Shield01Icon,
  User03Icon,
} from "@hugeicons/core-free-icons"
import { useForm } from "@tanstack/react-form"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { handleApiError } from "@/components/dashboard/utils/helpers"
import { FieldWithState } from "@/components/helpers/field-state"
import Logo from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { apiFetch } from "@/lib/fetcher"
import { FormRegisterSchema, LoginSchema, RegisterSchema } from "@/lib/schemas"
import tryCatch from "@/lib/try-catch"
import { getAnimationStyle } from "@/lib/utils"
import AuthCard from "./auth-card"
import PasskeyLogin from "./passkey-login"

type AuthMode = "login" | "register"

interface AuthFormProps {
  mode: AuthMode
}

const values = {
  login: {
    email: "",
    password: "",
    rememberMe: false,
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
        const [err] = await tryCatch(
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
        router.push("/login/2fa")
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
            <FieldDescription className="mt-2 max-w-70 text-muted-foreground/80">
              {isLogin
                ? "Wprowadź swój adres email i hasło, aby uzyskać dostęp do konta."
                : "Utwórz konto, aby korzystać z aplikacji."}
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
                    icon={User03Icon}
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
                    additionalNode={
                      isLogin ? (
                        <Link
                          className="font-medium text-foreground/80 text-xs uppercase tracking-wide hover:text-primary hover:underline"
                          href="/forgot-password"
                        >
                          Zapomniałeś hasła?
                        </Link>
                      ) : undefined
                    }
                    field={field}
                    icon={LockPasswordIcon}
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
                    icon={Shield01Icon}
                    label="Potwierdź hasło"
                    placeholder="••••••••"
                    type="password"
                  />
                )}
              </form.Field>
            )}

            <form.Field name="rememberMe">
              {(field) => (
                <Field orientation="horizontal">
                  <Checkbox
                    checked={field.state.value}
                    id={field.name}
                    onCheckedChange={field.handleChange}
                  />
                  <FieldContent>
                    <FieldLabel htmlFor={field.name}>
                      Zapamiętaj mnie
                    </FieldLabel>
                  </FieldContent>
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
                    disabled={!canSubmit}
                    isLoading={isSubmitting}
                    size="lg"
                    type="submit"
                  >
                    {isLogin ? "Zaloguj się" : "Zarejestruj się"}
                  </Button>
                )}
              </form.Subscribe>
            </Field>

            {isLogin ? (
              <PasskeyLogin disabled={form.state.isSubmitting} />
            ) : null}

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
          </div>
        </FieldGroup>
      </form>
    </AuthCard>
  )
}
