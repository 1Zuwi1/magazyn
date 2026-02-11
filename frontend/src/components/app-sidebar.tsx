"use client"

import { useTranslations } from "next-intl"
import type * as React from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  sidebarMenuButtonVariants,
} from "@/components/ui/sidebar"
import { getNavigationItems } from "@/config/navigation"
import Logo from "./logo"
import SidebarButton from "./sidebar-button"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offExamples" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <Logo
              className={sidebarMenuButtonVariants({
                className: "data-[slot=sidebar-menu-button]:p-2.5!",
              })}
              href="/dashboard"
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
      </SidebarContent>
    </Sidebar>
  )
}

function NavMain() {
  const t = useTranslations()
  const navigationItems = getNavigationItems(t)

  return (
    <SidebarMenu className="px-2">
      {navigationItems.map((item) => (
        <SidebarButton item={item} key={item.href} />
      ))}
    </SidebarMenu>
  )
}
