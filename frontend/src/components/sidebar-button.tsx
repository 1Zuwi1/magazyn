import { ChevronRight } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import type { NavigationItem } from "@/config/navigation"
import { useSession } from "@/hooks/use-session"
import { cn } from "@/lib/utils"
import { Button } from "./ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible"
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "./ui/sidebar"

export default function SidebarButton({ item }: { item: NavigationItem }) {
  const pathname = usePathname()
  const isActive = pathname.startsWith(item.href)
  const [isOpen, setIsOpen] = useState(isActive)
  const hasItems = item.items && item.items.length > 0
  const { data: session, isPending: isSessionPending } = useSession()

  if (isSessionPending) {
    return null
  }

  if (item.adminOnly && session?.role !== "ADMIN") {
    return null
  }

  return (
    <Collapsible
      onOpenChange={(o, e) => {
        if ((e.event.target as HTMLElement).id.startsWith("link-") && !o) {
          return
        }
        setIsOpen(o)
      }}
      open={hasItems && isOpen}
    >
      <SidebarMenuItem>
        <CollapsibleTrigger
          render={({ className, ...props }) => (
            <SidebarMenuButton
              {...props}
              className={cn(
                "group/collapsible relative w-full p-0",
                {
                  "aria-expanded:bg-transparent": !isActive,
                },
                className
              )}
              isActive={isActive}
              render={
                <Button
                  aria-label={`Wybierz kategorię ${item.title}`}
                  id={`button-${item.href}`}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      (event.target as HTMLElement).id === `button-${item.href}`
                    ) {
                      document.getElementById(`link-${item.href}`)?.click()
                    }
                  }}
                  tabIndex={0}
                  variant="ghost"
                >
                  <Link
                    className="mr-8 flex h-full w-full p-2"
                    href={item.href}
                    id={`link-${item.href}`}
                    tabIndex={-1}
                  >
                    <HugeiconsIcon
                      className="mr-2 size-5"
                      icon={item.icon}
                      tabIndex={-1}
                    />
                    {item.title}
                  </Link>
                  {hasItems && (
                    <HugeiconsIcon
                      className="absolute right-2 transition-transform duration-200 group-data-panel-open/collapsible:rotate-90"
                      icon={ChevronRight}
                      tabIndex={0}
                    />
                  )}
                </Button>
              }
            />
          )}
        />
        <CollapsibleContent>
          <SidebarMenuSub className="pt-2">
            {hasItems &&
              item.items?.map((subItem) => (
                <SidebarMenuSubItem key={subItem.title}>
                  <SidebarMenuSubButton
                    className={cn("w-full", {
                      "font-semibold": pathname === subItem.href, // overwrite active styles
                    })}
                    isActive={pathname === subItem.href}
                    render={
                      <Link href={subItem.href}>
                        {subItem.icon && (
                          <HugeiconsIcon
                            className="size-4"
                            icon={subItem.icon}
                          />
                        )}
                        {subItem.title}
                      </Link>
                    }
                  />
                </SidebarMenuSubItem>
              ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}
