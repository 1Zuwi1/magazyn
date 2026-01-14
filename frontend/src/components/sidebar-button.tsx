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
  return (
    <Collapsible onOpenChange={setIsOpen} open={isOpen}>
      <SidebarMenuItem>
        <CollapsibleTrigger
          render={({ className, ...props }) => (
            <SidebarMenuButton
              {...props}
              className={cn("group/collapsible w-full", className)}
              isActive={defaultActive}
              render={
                <Button className="flex w-full" variant="ghost">
                  <Link className="flex" href={item.href}>
                    <HugeiconsIcon className="mr-2 size-5" icon={item.icon} />
                    {item.title}
                  </Link>
                  <HugeiconsIcon
                    className="ml-auto transition-transform duration-200 group-data-panel-open/collapsible:rotate-90"
                    icon={ChevronRight}
                  />
                </Button>
              }
            />
          )}
        />
        <CollapsibleContent>
          <SidebarMenuSub className="pt-2">
            {item.items?.map((subItem) => (
              <SidebarMenuSubItem key={subItem.title}>
                <SidebarMenuSubButton
                  className={cn("w-full", {
                    "bg-transparent! font-semibold": pathname === subItem.href, // overwrite active styles
                  })}
                  isActive={pathname === subItem.href}
                  render={<Link href={subItem.href}>{subItem.title}</Link>}
                />
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}
