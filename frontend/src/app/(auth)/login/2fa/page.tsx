import { redirect } from "next/navigation"
import { apiFetch } from "@/lib/fetcher"
import { TFASchema } from "@/lib/schemas"
import { getSession } from "@/lib/session"
import tryCatch from "@/lib/try-catch"
import TwoFactorForm, {
  type ResendType,
  type TwoFactorMethod,
} from "./two-factor-form"

const METHOD_TITLES: Record<TwoFactorMethod, string> = {
  AUTHENTICATOR: "Wpisz kod z aplikacji uwierzytelniającej",
  SMS: "Wpisz kod wysłany SMS-em",
  EMAIL: "Wpisz kod wysłany na e-mail",
}

const METHOD_SWITCH_LABELS: Record<TwoFactorMethod, string> = {
  AUTHENTICATOR: "Użyj aplikacji uwierzytelniającej",
  SMS: "Wyślij kod SMS-em",
  EMAIL: "Wyślij kod e-mailem",
}

const RESEND_METHODS: ResendType[] = ["SMS", "EMAIL"]

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
      linkedMethods={linkedMethods}
      methodSwitchLabels={METHOD_SWITCH_LABELS}
      methodTitles={METHOD_TITLES}
      otpLength={6}
      resendMethods={RESEND_METHODS}
    />
  )
}
