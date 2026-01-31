import { redirect } from "next/navigation"
import type { ReactNode } from "react"
import { getSession } from "@/lib/session"
import LayoutQueryClientWrapper from "./layout-query-client-wrapper"

export default async function Layout({ children }: { children: ReactNode }) {
  const session = await getSession()

  if (!session) {
    return redirect("/login")
  }

  if (session.status === "UNVERIFIED") {
    return redirect("/pending-verification")
  }

  return <LayoutQueryClientWrapper>{children}</LayoutQueryClientWrapper>
}
