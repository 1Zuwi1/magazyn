import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import TwoFactorForm from "./two-factor-form"

export type TwoFactorMethod = "authenticator" | "sms" | "email"
export type ResendType = Exclude<TwoFactorMethod, "authenticator">

const METHOD_TITLES: Record<TwoFactorMethod, string> = {
  authenticator: "Wpisz kod z aplikacji uwierzytelniającej",
  sms: "Wpisz kod wysłany SMS-em",
  email: "Wpisz kod wysłany na e-mail",
}

const METHOD_SWITCH_LABELS: Record<TwoFactorMethod, string> = {
  authenticator: "Użyj aplikacji uwierzytelniającej",
  sms: "Wyślij kod SMS-em",
  email: "Wyślij kod e-mailem",
}

// TODO: Fetch linked_methods from backend API
const LINKED_METHODS: TwoFactorMethod[] = ["authenticator", "sms", "email"]
const RESEND_METHODS: ResendType[] = ["sms", "email"]

export default async function TwoFactorPage() {
  const session = await getSession()

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <TwoFactorForm
          linkedMethods={LINKED_METHODS}
          methodSwitchLabels={METHOD_SWITCH_LABELS}
          methodTitles={METHOD_TITLES}
          otpLength={6}
          resendMethods={RESEND_METHODS}
        />
      </div>
    </div>
  )
}
