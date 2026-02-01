"use client"

import type * as React from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { navigationItems } from "@/config/navigation"
import Logo from "./logo"
import SidebarButton from "./sidebar-button"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offExamples" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="data-[slot=sidebar-menu-button]:p-2.5!">
              <Logo href="/" />
            </SidebarMenuButton>
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
  return (
    <SidebarMenu className="gap-2 px-2">
      {navigationItems.map((item) => (
        <SidebarButton item={item} key={item.href} />
      ))}
    </SidebarMenu>
  )
}
