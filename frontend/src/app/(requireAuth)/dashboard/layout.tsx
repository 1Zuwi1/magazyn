import type React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { Dock } from "@/components/dock"
import SiteHeader from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar className="standalone:hidden" variant="inset" />
      <SidebarInset className="standalone:m-0! standalone:rounded-none! standalone:shadow-none!">
        <SiteHeader />
        <div className="p-8 pt-6 standalone:pb-24">{children}</div>
        <Dock />
      </SidebarInset>
    </SidebarProvider>
  )
}
