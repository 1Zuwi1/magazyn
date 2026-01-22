import type React from "react"
import ProtectedPage from "../../protected-page"

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <ProtectedPage needAdminPrivileges={false}>
      <main className="flex flex-col gap-4">{children}</main>
    </ProtectedPage>
  )
}
