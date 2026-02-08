import { redirect } from "next/navigation"
import { apiFetch } from "@/lib/fetcher"
import { type ResendType, TFASchema, type TwoFactorMethod } from "@/lib/schemas"
import { getSession } from "@/lib/session"
import tryCatch from "@/lib/try-catch"
import TwoFactorForm from "./two-factor-form"

const METHOD_TITLES: Record<TwoFactorMethod, string> = {
  AUTHENTICATOR: "Wpisz kod z aplikacji uwierzytelniającej",
  EMAIL: "Wpisz kod wysłany na e-mail",
  PASSKEYS: "Uwierzytelnij się za pomocą kluczy dostępu",
  BACKUP_CODES: "Wpisz kod odzyskiwania",
}

const METHOD_SWITCH_LABELS: Record<TwoFactorMethod, string> = {
  AUTHENTICATOR: "Użyj aplikacji uwierzytelniającej",
  EMAIL: "Wyślij kod e-mailem",
  PASSKEYS: "Użyj kluczy dostępu",
  BACKUP_CODES: "Użyj kodu odzyskiwania",
}

const RESEND_METHODS: ResendType[] = ["EMAIL"]

export default async function TwoFactorPage() {
  const session = await getSession()

  if (session) {
    redirect("/dashboard")
  }

  const [err, linkedMethods] = await tryCatch(apiFetch("/api/2fa", TFASchema))

  if (err) {
    redirect("/login")
  }

  return (
    <TwoFactorForm
      defaultLinkedMethod={linkedMethods.defaultMethod}
      linkedMethods={linkedMethods.methods}
      methodSwitchLabels={METHOD_SWITCH_LABELS}
      methodTitles={METHOD_TITLES}
      otpLength={6}
      resendMethods={RESEND_METHODS}
    />
  )
}
