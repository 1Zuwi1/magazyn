import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import AuthForm from "../components/auth-form"

export default async function LoginPage() {
  const session = await getSession()
  if (session) {
    redirect("/dashboard")
  }

  return <AuthForm mode="login" />
}
