"use client"

import {
  ArrowRight01Icon,
  LaptopIcon,
  Moon02Icon,
  Sun03Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useTheme } from "next-themes"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { ScrollArea } from "@/components/ui/scroll-area"

export interface NavItem {
  title: string
  url?: string
  items?: NavItem[]
}

export interface NavGroup {
  title: string
  items: NavItem[]
}

interface CommandMenuProps {
  navData?: NavGroup[]
  subData?: NavItem[]
  open: boolean
  setOpen: (open: boolean) => void
}

export function CommandMenu({
  navData,
  subData,
  open,
  setOpen,
}: CommandMenuProps) {
  const { setTheme } = useTheme()

  return (
    <CommandDialog onOpenChange={setOpen} open={open}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <ScrollArea className="h-72 pe-1">
          <CommandEmpty>No results found.</CommandEmpty>
          {navData?.map((group) => (
            <CommandGroup heading={group.title} key={group.title}>
              {group.items.map((navItem, i) => {
                if (navItem.url) {
                  return (
                    <CommandItem
                      key={`${navItem.url}-${i}`}
                      onSelect={() => {
                        console.log(`Wybrano: ${navItem.title}`)
                        setOpen(false)
                      }}
                      value={navItem.title}
                    >
                      <div className="flex size-4 items-center justify-center">
                        <HugeiconsIcon
                          className="size-2 text-muted-foreground/80"
                          icon={ArrowRight01Icon}
                        />
                      </div>
                      {navItem.title}
                    </CommandItem>
                  )
                }

                return navItem.items?.map((subItem) => (
                  <CommandItem
                    key={subItem.title}
                    onSelect={() => {
                      console.log(
                        `Wybrano: ${navItem.title} -> ${subItem.title}`
                      )
                      setOpen(false)
                    }}
                    value={`${navItem.title} ${subItem.title}`}
                  >
                    <div className="flex size-4 items-center justify-center">
                      <HugeiconsIcon
                        className="size-2 text-muted-foreground/80"
                        icon={ArrowRight01Icon}
                      />
                    </div>
                    {navItem.title}
                    <HugeiconsIcon
                      className="mx-1 size-2 text-muted-foreground/80"
                      icon={ArrowRight01Icon}
                    />
                    {subItem.title}
                  </CommandItem>
                ))
              })}
            </CommandGroup>
          ))}

          {subData && subData.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Inne">
                {subData.map((item) => (
                  <CommandItem
                    key={item.title}
                    onSelect={() => {
                      console.log(`Wybrano: ${item.title}`)
                      setOpen(false)
                    }}
                    value={item.title}
                  >
                    <div className="flex size-4 items-center justify-center">
                      <HugeiconsIcon
                        className="size-2 text-muted-foreground/80"
                        icon={ArrowRight01Icon}
                      />
                    </div>
                    {item.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          <CommandSeparator />
          <CommandGroup heading="Motyw">
            <CommandItem
              onSelect={() => {
                setTheme("light")
                setOpen(false)
              }}
            >
              <HugeiconsIcon icon={Sun03Icon} /> <span>Jasny</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setTheme("dark")
                setOpen(false)
              }}
            >
              <HugeiconsIcon className="scale-90" icon={Moon02Icon} />
              <span>Ciemny</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setTheme("system")
                setOpen(false)
              }}
            >
              <HugeiconsIcon icon={LaptopIcon} />
              <span>System</span>
            </CommandItem>
          </CommandGroup>
        </ScrollArea>
      </CommandList>
    </CommandDialog>
  )
}
