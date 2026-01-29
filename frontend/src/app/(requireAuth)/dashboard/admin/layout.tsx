import type React from "react"

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return <main className="flex flex-col gap-4">{children}</main>
}
