"use client"

import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { Fragment } from "react/jsx-runtime"
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
  const pathname = usePathname()
  const splitted = pathname.split("/")
  let currPath = "/"
  const paths = useTranslations("breadcrumbs")
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
            {splitted.map((path, index) => {
              if (path === "") {
                return null
              }
              currPath += `${path}/`
              const splittedPath = path.split("-")
              const isDynamic = splittedPath.length > 1
              let displayName: string
              const key = path as Parameters<typeof paths>[0]
              if (paths.has(key)) {
                displayName = paths(key)
              } else {
                displayName = isDynamic ? splittedPath[0] : decodeURI(path)
              }
              return (
                <Fragment key={path + index}>
                  <BreadcrumbItem>
                    <BreadcrumbLink className="capitalize" href={currPath}>
                      {displayName}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {splitted.length - 1 !== index && <BreadcrumbSeparator />}
                </Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  )
}
