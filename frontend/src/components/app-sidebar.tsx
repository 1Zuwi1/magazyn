"use client"

import { Analytics01Icon, GroupItemsIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import { useTranslations } from "next-intl"
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
  const t = useTranslations("sidebar")
  const items = [
    {
      title: t("items.dashboard"),
      href: "/dashboard",
      icon: Analytics01Icon,
    },
    {
      title: t("items.assortment"),
      href: "/dashboard/items",
      icon: GroupItemsIcon,
    },
  ]

  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            render={
              <Link href={item.href}>
                <HugeiconsIcon className="mr-2 size-5" icon={item.icon} />
                {item.title}
              </Link>
            }
          />
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}
