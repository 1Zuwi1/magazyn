import { redirect } from "next/navigation"
import z from "zod"
import { createApiSchema } from "@/lib/create-api-schema"
import { apiFetch } from "@/lib/fetcher"
import { getSession } from "@/lib/session"
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

// TODO: Fetch linked_methods from backend API
const LINKED_METHODS: TwoFactorMethod[] = ["AUTHENTICATOR", "SMS", "EMAIL"]
const RESEND_METHODS: ResendType[] = ["SMS", "EMAIL"]

const TfaSchema = createApiSchema({
  GET: {
    output: z.string(),
  },
})

export default async function TwoFactorPage() {
  const session = await getSession()

  if (session) {
    redirect("/dashboard")
  }

  const linkedMethods = await apiFetch("/api/2fa", TfaSchema)
  console.log(linkedMethods)

  return (
    <TwoFactorForm
      linkedMethods={LINKED_METHODS}
      methodSwitchLabels={METHOD_SWITCH_LABELS}
      methodTitles={METHOD_TITLES}
      otpLength={6}
      resendMethods={RESEND_METHODS}
    />
  )
}
