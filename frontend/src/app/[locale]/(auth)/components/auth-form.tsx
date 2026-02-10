"use client"

import {
  LockPasswordIcon,
  Mail01Icon,
  Shield01Icon,
  TelephoneIcon,
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
import { useAppTranslations } from "@/i18n/use-translations"
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
    phoneNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
  },
}

type ValueTypes = typeof values

export default function AuthForm({ mode }: AuthFormProps) {
  const t = useAppTranslations()

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
          handleApiError(err, t("generated.auth.errorOccurredLoggingAgain"), t)
          return
        }

        toast.success(t("generated.auth.successfullyLogged"))
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
            t("generated.auth.errorOccurredDuringRegistrationAgain"),
            t
          )
          return
        }

        toast.success(t("generated.auth.registeredSuccessfullyLogNow"))
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
            <FieldDescription className="mt-2 max-w-70 text-center text-muted-foreground/80">
              {isLogin
                ? t("generated.auth.enterEmailAddressPasswordAccess")
                : t("generated.auth.createAccountUseApp")}
            </FieldDescription>
          </div>
          <div
            className="fade-in animate-in space-y-4 duration-500"
            style={getAnimationStyle("200ms")}
          >
            <form.Field name="email">
              {(field) => (
                <FieldWithState
                  field={field}
                  icon={Mail01Icon}
                  label={t("generated.shared.eMail")}
                  placeholder={t("generated.auth.janKowalskiPl")}
                  type="email"
                />
              )}
            </form.Field>
            {!isLogin && (
              <>
                <form.Field name="fullName">
                  {(field) => (
                    <FieldWithState
                      field={field}
                      icon={User03Icon}
                      label={t("generated.auth.fullName")}
                      placeholder={t("generated.shared.johnKowalski")}
                      type="text"
                    />
                  )}
                </form.Field>
                <form.Field name="phoneNumber">
                  {(field) => (
                    <FieldWithState
                      field={field}
                      icon={TelephoneIcon}
                      label={t("generated.auth.phoneNumber")}
                      placeholder="+48 123 456 789"
                      type="tel"
                    />
                  )}
                </form.Field>
              </>
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
                          {t("generated.auth.forgotPassword")}
                        </Link>
                      ) : undefined
                    }
                    field={field}
                    icon={LockPasswordIcon}
                    label={t("generated.auth.password")}
                    placeholder="••••••••"
                    type="password"
                  />
                )
              }}
            </form.Field>

            {isLogin ? (
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
                        {t("generated.auth.remember")}
                      </FieldLabel>
                    </FieldContent>
                  </Field>
                )}
              </form.Field>
            ) : (
              <form.Field name="confirmPassword">
                {(field) => (
                  <FieldWithState
                    field={field}
                    icon={Shield01Icon}
                    label={t("generated.shared.confirmPassword")}
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
                    size="lg"
                    type="submit"
                  >
                    {isLogin
                      ? t("generated.shared.log")
                      : t("generated.auth.register")}
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
                  {t("generated.auth.dontAccount")}{" "}
                  <Link className="text-primary underline" href="/register">
                    {t("generated.auth.register")}
                  </Link>
                </>
              ) : (
                <>
                  {t("generated.auth.alreadyAccount")}{" "}
                  <Link className="text-primary underline" href="/login">
                    {t("generated.shared.log")}
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
