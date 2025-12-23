"use client"

import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "./ui/breadcrumb"
import { Separator } from "./ui/separator"
import { SidebarTrigger } from "./ui/sidebar"

export default function SiteHeader() {
  const path = usePathname()
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          className="mx-2 data-[orientation=vertical]:h-8"
          orientation="vertical"
        />
        <Breadcrumb>
          <BreadcrumbList>
            {path
              .split("/")
              .filter((segment) => segment)
              .map((segment, index, array) => {
                const isLast = index === array.length - 1
                const href = `/${array.slice(0, index + 1).join("/")}`
                const title = segment
                  .replace(/-/g, " ")
                  .replace(/\b\w/g, (char) => char.toUpperCase())
                return (
                  <BreadcrumbItem key={href}>
                    {isLast ? (
                      <BreadcrumbLink aria-current="page">
                        {title}
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbLink href={href}>{title}</BreadcrumbLink>
                    )}
                    {!isLast && <BreadcrumbSeparator />}
                  </BreadcrumbItem>
                )
              })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  )
}
