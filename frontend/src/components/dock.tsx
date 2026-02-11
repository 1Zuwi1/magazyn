"use client"

import {
  GroupItemsIcon,
  Home01Icon,
  Mic01Icon,
  Package,
  QrCodeIcon,
  Settings01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { Scanner } from "./scanner/scanner"
import { DialogTrigger } from "./ui/dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"
import { VoiceAssistant } from "./voice-assistant/voice-assistant"

const getDockNavItems = (t: ReturnType<typeof useTranslations>) =>
  [
    {
      title: t("generated.ui.dock.dashboard"),
      href: "/dashboard",
      icon: Home01Icon,
    },
    {
      title: t("generated.shared.warehouses"),
      href: "/dashboard/warehouse",
      icon: Package,
    },
    {
      title: t("generated.shared.assortment"),
      href: "/dashboard/items",
      icon: GroupItemsIcon,
    },
    {
      title: t("generated.shared.settings"),
      href: "/settings",
      icon: Settings01Icon,
    },
  ] as const

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

export function Dock() {
  const t = useTranslations()
  const dockNavItems = useMemo(() => getDockNavItems(t), [t])

  const pathname = usePathname()
  const splitted = pathname.split("/").filter((part) => part !== "")

  const isInWarehouse = pathname.includes("/dashboard/warehouse/")
  const warehouseName = useMemo(() => {
    if (!isInWarehouse) {
      return ""
    }
    return decodeURIComponent(
      sanitizeVisibleText(safeDecodeURIComponent(splitted[2] ?? ""))
    )
  }, [isInWarehouse, splitted])

  return (
    <div className="pointer-events-none fixed bottom-0 left-0 z-50 standalone:flex hidden max-h-96 w-full justify-center px-4 pb-6">
      {/* Ambient glow effect */}
      <div
        aria-hidden="true"
        className="absolute bottom-3 h-16 w-64 rounded-full bg-primary/20 blur-2xl"
      />

      <nav className="pointer-events-auto relative flex items-center gap-1 rounded-2xl border border-white/10 bg-card/90 p-1.5 shadow-2xl shadow-black/20 ring-1 ring-white/5 ring-inset backdrop-blur-xl dark:border-white/5 dark:bg-card/80">
        {/* Gradient border overlay */}
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/10 to-transparent opacity-50 dark:from-white/5"
        />

        {dockNavItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Tooltip key={item.href}>
              <TooltipTrigger
                render={
                  <Link
                    className={cn(
                      "group relative flex size-12 flex-col items-center justify-center rounded-xl transition-all duration-200",
                      "hover:bg-muted/80 active:scale-95",
                      isActive && "bg-primary/10 text-primary"
                    )}
                    href={item.href}
                  />
                }
              >
                {/* Active indicator dot */}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_8px_2px] shadow-primary/50"
                  />
                )}

                <HugeiconsIcon
                  className={cn(
                    "size-5 transition-transform duration-200 group-hover:scale-110",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                  icon={item.icon}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={12}>
                {item.title}
              </TooltipContent>
            </Tooltip>
          )
        })}

        {/* Divider */}
        <div
          aria-hidden="true"
          className="mx-1 h-8 w-px bg-gradient-to-b from-transparent via-border to-transparent"
        />

        <VoiceAssistant
          dialogTrigger={
            <Tooltip>
              <TooltipTrigger
                render={
                  <DialogTrigger
                    aria-label={t("generated.shared.voiceAssistant")}
                    className={cn(
                      "group relative flex size-12 flex-col items-center justify-center rounded-xl transition-all duration-200",
                      "hover:bg-muted/80 active:scale-95"
                    )}
                  />
                }
              >
                <HugeiconsIcon
                  className="size-5 text-muted-foreground transition-transform duration-200 group-hover:scale-110 group-hover:text-foreground"
                  icon={Mic01Icon}
                  strokeWidth={2}
                />
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={12}>
                {t("generated.shared.voiceAssistant")}
              </TooltipContent>
            </Tooltip>
          }
        />

        {/* Scanner button */}
        <Scanner
          dialogTrigger={
            <Tooltip>
              <TooltipTrigger
                render={
                  <DialogTrigger
                    aria-disabled={!isInWarehouse}
                    aria-label={t("generated.shared.barcodeScanner")}
                    className={cn(
                      "group relative flex size-12 flex-col items-center justify-center rounded-xl transition-all duration-200",
                      isInWarehouse
                        ? "bg-gradient-to-b from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:brightness-110 active:scale-95"
                        : "cursor-not-allowed bg-muted/50 text-muted-foreground opacity-50"
                    )}
                    disabled={!isInWarehouse}
                  />
                }
              >
                {isInWarehouse && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 overflow-hidden rounded-xl"
                  >
                    <span className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  </span>
                )}

                <HugeiconsIcon
                  className={cn(
                    "size-5 transition-transform duration-200",
                    isInWarehouse && "group-hover:scale-110"
                  )}
                  icon={QrCodeIcon}
                  strokeWidth={2}
                />
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={12}>
                {isInWarehouse
                  ? t("generated.shared.barcodeScanner")
                  : t("generated.ui.dock.selectWarehouseUseScanner")}
              </TooltipContent>
            </Tooltip>
          }
          warehouseName={warehouseName}
        />
      </nav>
    </div>
  )
}
