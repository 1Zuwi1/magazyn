"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type * as React from "react"
// import { NavDocuments } from "@/components/nav-documents"
// import { NavMain } from "@/components/nav-main"
// import { NavSecondary } from "@/components/nav-secondary"
// import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { navigationItems } from "@/config/navigation"
import Logo from "./logo"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offExamples" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="data-[slot=sidebar-menu-button]:p-1.5!">
              <Logo />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
      </SidebarContent>
      <SidebarFooter>{/* <NavUser user={data.user} /> */}</SidebarFooter>
    </Sidebar>
  )
}

function NavMain() {
  const pathname = usePathname()
  return (
    <SidebarMenu className="gap-2 px-2">
      {navigationItems.map((item, index) => {
        const isActive = pathname === item.href
        return (
          <SidebarMenuItem key={index}>
            <SidebarMenuButton
              isActive={isActive}
              render={
                <Link href={item.href}>
                  <HugeiconsIcon className="mr-2 size-5" icon={item.icon} />
                  {item.title}
                </Link>
              }
              size={"lg"}
            />
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )
}
