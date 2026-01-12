"use client"

import {
  ArrowRight01Icon,
  LaptopIcon,
  Moon02Icon,
  Sun03Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useTheme } from "next-themes"
import * as React from "react"

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

export interface NavData {
  title: string
  items: NavItem[]
}

interface CommandMenuProps {
  navDane?: NavData[]
  subDane?: NavItem[]
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CommandMenu({
  open,
  onOpenChange,
  navDane,
  subDane,
  ...props
}: CommandMenuProps) {
  const { setTheme } = useTheme()

  const runCommand = React.useCallback(
    (command: () => unknown) => {
      onOpenChange?.(false)
      command()
    },
    [onOpenChange]
  )

  return (
    <CommandDialog modal onOpenChange={onOpenChange} open={open} {...props}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <ScrollArea className="h-72 pe-1">
          <CommandEmpty>No results found.</CommandEmpty>
          {navDane?.map((group) => (
            <CommandGroup heading={group.title} key={group.title}>
              {group.items.map((navItem, i) => {
                if (navItem.url) {
                  return (
                    <CommandItem
                      key={`${navItem.url}-${i}`}
                      onSelect={() => {
                        runCommand(() => {
                          return 0
                        })
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

                return navItem.items?.map((subItem, j) => (
                  <CommandItem
                    key={`${navItem.title}-${subItem.url}-${j}`}
                    onSelect={() => {
                      runCommand(() => {
                        return 0
                      })
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

          {subDane && subDane.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Other">
                {subDane.map((item, i) => (
                  <CommandItem
                    key={`${item.url}-${i}`}
                    onSelect={() => {
                      runCommand(() => {
                        return 0
                      })
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
          <CommandGroup heading="Theme">
            <CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
              <HugeiconsIcon icon={Sun03Icon} /> <span>Light</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
              <HugeiconsIcon className="scale-90" icon={Moon02Icon} />
              <span>Dark</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme("system"))}>
              <HugeiconsIcon icon={LaptopIcon} />
              <span>System</span>
            </CommandItem>
          </CommandGroup>
        </ScrollArea>
      </CommandList>
    </CommandDialog>
  )
}
