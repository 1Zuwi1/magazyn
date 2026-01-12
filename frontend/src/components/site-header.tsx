"use client"

import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { Fragment } from "react/jsx-runtime"
import { cn } from "@/lib/utils"
import { Scanner } from "./scanner/scanner"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "./ui/breadcrumb"
import { Separator } from "./ui/separator"
import { SidebarTrigger } from "./ui/sidebar"

// biome-ignore lint/suspicious/noControlCharactersInRegex: This is needed to strip control characters from decoded text
const CONTROL_CHAR_REGEX = /[\u0000-\u001f\u007f]/g
const SCRIPT_TAG_BLOCK_REGEX = /<script[\s\S]*?>[\s\S]*?<\/script>/gi
const STYLE_TAG_BLOCK_REGEX = /<style[\s\S]*?>[\s\S]*?<\/style>/gi
const HTML_TAG_REGEX = /<\/?[^>]+>/g

const safeDecodeURIComponent = (value: string | undefined): string => {
  if (!value) {
    return ""
  }

  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

const sanitizeVisibleText = (value: string): string => {
  return value
    .replace(SCRIPT_TAG_BLOCK_REGEX, "")
    .replace(STYLE_TAG_BLOCK_REGEX, "")
    .replace(HTML_TAG_REGEX, "")
    .replace(CONTROL_CHAR_REGEX, "")
}

export default function SiteHeader() {
  const pathname = usePathname()
  const splitted = pathname.split("/").filter((part) => part !== "")
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
                  <BreadcrumbItem
                    className={cn({
                      "hidden sm:inline": index !== 0,
                    })}
                  >
                    <BreadcrumbLink
                      className={cn("capitalize")}
                      href={currPath}
                    >
                      {displayName}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {splitted.length - 1 !== index && (
                    <BreadcrumbSeparator className="hidden sm:inline" />
                  )}
                </Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      {pathname.includes("/dashboard/warehouse/") && (
        <Scanner
          warehouseName={decodeURIComponent(
            sanitizeVisibleText(safeDecodeURIComponent(splitted[2] ?? ""))
          )}
        />
      )}
    </header>
  )
}
