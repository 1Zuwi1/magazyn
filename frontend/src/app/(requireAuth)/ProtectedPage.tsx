import type { ReactNode } from "react"
import { getSession } from "@/lib/session"
import "server-only"
import UnauthorizedComponent from "./components/Unauthorized"

type Children =
  | ReactNode
  | ((session: Awaited<ReturnType<typeof getSession>>) => ReactNode)

interface Props {
  children: Children
  needAdminPrivileges?: boolean
  redirectTo?: string
}

export default async function ProtectedPage({
  children,
  needAdminPrivileges,
  redirectTo = "/login",
}: Props) {
  // Will redirect if the user is not signed in
  const session = await getSession(redirectTo)

  // If the user is not an admin and admin privileges are required, return Unauthorized
  if (!session || (needAdminPrivileges && session.role !== "admin")) {
    return <UnauthorizedComponent />
  }

  // If the child is a function, inject the session so the page can use it
  if (typeof children === "function") {
    return <>{children(session)}</>
  }

  // No need for the session inside the page → just render
  return <>{children}</>
}
