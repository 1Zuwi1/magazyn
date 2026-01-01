import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import AuthForm from "../components/form"

export default async function RegisterPage() {
  const session = await getSession()
  if (session) {
    redirect("/dashboard")
  }

  return <AuthForm mode="register" />
}
