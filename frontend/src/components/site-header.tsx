"use client"

import { usePathname, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Fragment } from "react/jsx-runtime"
import { removeAppLocalePrefix } from "@/i18n/locale"
import { NotificationInbox } from "./dashboard/notifications/components/notification-icon"
import { LanguageSwitcher } from "./language-switcher"
import { Scanner } from "./scanner/scanner"
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { Separator } from "./ui/separator"
import { SidebarTrigger } from "./ui/sidebar"
import { VoiceAssistant } from "./voice-assistant/voice-assistant"

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
  const t = useTranslations()

  const pathname = usePathname()
  const router = useRouter()
  const splitted = removeAppLocalePrefix(pathname)
    .split("/")
    .filter((part) => part !== "")
  let currPath = "/"
  const paths = useTranslations("breadcrumbs")
  const breadcrumbItems = splitted.map((path) => {
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
    return {
      href: currPath,
      label: displayName,
    }
  })
  const hasOverflow = breadcrumbItems.length > 3
  const middleItems = breadcrumbItems.slice(1, -1)
  const startItem = breadcrumbItems[0]
  const endItem = breadcrumbItems.at(-1)

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
            {startItem && (
              <>
                <BreadcrumbItem>
                  {startItem === endItem ? (
                    <BreadcrumbPage className="capitalize">
                      {startItem.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      className="capitalize"
                      href={startItem.href}
                    >
                      {startItem.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {startItem !== endItem && hasOverflow && (
                  <BreadcrumbSeparator />
                )}
                {startItem !== endItem && !hasOverflow && (
                  <BreadcrumbSeparator />
                )}
              </>
            )}
            {startItem !== endItem && middleItems.length > 0 && (
              <>
                <BreadcrumbItem
                  className={hasOverflow ? undefined : "sm:hidden"}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-1">
                      <BreadcrumbEllipsis className="size-4" />
                      <span className="sr-only">
                        {t("generated.global.header.toggleMenu")}
                      </span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {middleItems.map((item) => (
                        <DropdownMenuItem
                          className="cursor-pointer"
                          key={item.href}
                          onClick={() => router.push(item.href)}
                        >
                          {item.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </BreadcrumbItem>
                <BreadcrumbSeparator
                  className={hasOverflow ? undefined : "sm:hidden"}
                />
              </>
            )}
            {startItem !== endItem &&
              !hasOverflow &&
              middleItems.map((item) => (
                <Fragment key={item.href}>
                  <BreadcrumbItem className="hidden sm:inline">
                    <BreadcrumbLink className="capitalize" href={item.href}>
                      {item.label}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden sm:inline" />
                </Fragment>
              ))}
            {startItem !== endItem && endItem && (
              <BreadcrumbItem>
                <BreadcrumbPage className="capitalize">
                  {endItem.label}
                </BreadcrumbPage>
              </BreadcrumbItem>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex standalone:hidden items-center gap-2 pr-3 sm:gap-3 sm:pr-4">
        <LanguageSwitcher />
        {pathname.includes("/dashboard/warehouse/") && (
          <Scanner
            warehouseName={decodeURIComponent(
              sanitizeVisibleText(safeDecodeURIComponent(splitted[2] ?? ""))
            )}
          />
        )}
        <VoiceAssistant />
        <NotificationInbox />
      </div>
    </header>
  )
}
