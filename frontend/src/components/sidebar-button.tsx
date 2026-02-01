import { ChevronRight } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import type { navigationItems } from "@/config/navigation"
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

export default function SidebarButton({
  item,
}: {
  item: (typeof navigationItems)[number]
}) {
  const pathname = usePathname()
  const defaultActive = pathname.startsWith(item.href)
  const [isOpen, setIsOpen] = useState(defaultActive)
  const hasItems = item.items && item.items.length > 0
  return (
    <Collapsible
      onOpenChange={(o, e) => {
        if ((e.event.target as HTMLElement).id.startsWith("link-")) {
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
              className={cn("group/collapsible relative w-full p-0", className)}
              isActive={defaultActive}
              render={
                <Button variant="ghost">
                  <Link
                    className="mr-8 flex h-full w-full p-2"
                    href={item.href}
                    id={`link-${item.href}`}
                  >
                    <HugeiconsIcon className="mr-2 size-5" icon={item.icon} />
                    {item.title}
                  </Link>
                  {hasItems && (
                    <HugeiconsIcon
                      className="absolute right-2 transition-transform duration-200 group-data-panel-open/collapsible:rotate-90"
                      icon={ChevronRight}
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
