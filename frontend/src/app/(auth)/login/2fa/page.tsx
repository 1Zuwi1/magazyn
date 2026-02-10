import { redirect } from "next/navigation"
import { translateMessage } from "@/i18n/translate-message"
import { apiFetch } from "@/lib/fetcher"
import { type ResendType, TFASchema, type TwoFactorMethod } from "@/lib/schemas"
import { getSession } from "@/lib/session"
import tryCatch from "@/lib/try-catch"
import TwoFactorForm from "./two-factor-form"

const METHOD_TITLES: Record<TwoFactorMethod, string> = {
  AUTHENTICATOR: translateMessage("generated.auth.enterCodeAuthenticatorApp"),
  EMAIL: translateMessage("generated.auth.enterCodeSentEMail"),
  PASSKEYS: translateMessage("generated.auth.authenticateAccessKeys"),
  BACKUP_CODES: translateMessage("generated.auth.useRecoveryCode"),
}

const METHOD_SWITCH_LABELS: Record<TwoFactorMethod, string> = {
  AUTHENTICATOR: translateMessage("generated.auth.useAuthenticatorApp"),
  EMAIL: translateMessage("generated.auth.sendCodeEmail"),
  PASSKEYS: translateMessage("generated.auth.useAccessKeys"),
  BACKUP_CODES: translateMessage("generated.auth.useRecoveryCode"),
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
