"use client"
import {
  ArrowLeft01Icon,
  CheckUnread01Icon,
  IcoIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { type HTMLAttributes, useId, useMemo, useState } from "react"
import { buttonVariants } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { TableHead } from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface PreviewTableProps extends HTMLAttributes<HTMLTableCellElement> {
  field: { label: string; value: string; required?: boolean }
  onFieldChange: (props: { value: string; required?: boolean }) => void
  onFieldToggle: (props: { value: string; checked?: boolean }) => void
  currentField: string | undefined
  originalField: Record<string, string | undefined>
}

export function PreviewTable({
  field,
  onFieldChange,
  onFieldToggle,
  currentField,
  originalField,
  className,
  ...props
}: PreviewTableProps) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [checked, setChecked] = useState(false)

  const availableFields = useMemo(() => {
    return [...new Set(Object.values(originalField))].filter(Boolean)
  }, [originalField])

  return (
    <TableHead className={cn("whitespace-nowrap py-2", className)} {...props}>
      <div className="flex items-center gap-4 pr-1.5">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={field.required ? true : checked}
            disabled={field.required}
            id={id}
            onCheckedChange={(checked) => {
              onFieldToggle({ value: field.value, checked: !!checked })
              setChecked(!!checked)
            }}
          />

          <Label className="truncate text-muted-foreground" htmlFor={id}>
            {field.label}
          </Label>
        </div>
        <HugeiconsIcon className="size-4" icon={ArrowLeft01Icon} />
        <Popover onOpenChange={setOpen} open={open}>
          <PopoverTrigger>
            <span className="max-w-24 truncate">
              {currentField || "Wybierz pole"}
            </span>
            <HugeiconsIcon
              className={cn(
                "ml-2 size-4",
                buttonVariants({
                  variant: "outline",
                  size: "icon-xs",
                })
              )}
              icon={IcoIcon}
            />
          </PopoverTrigger>
          <PopoverContent>
            <Command>
              <CommandInput placeholder="Wyszukaj pole">
                <CommandList>
                  <CommandEmpty>Nie znaleziono żadnych pól</CommandEmpty>
                  <CommandGroup>
                    {availableFields.map((field) => (
                      <CommandItem
                        key={field}
                        onSelect={() => {
                          onFieldChange({ value: field as string })
                          setOpen(false)
                        }}
                        value={field}
                      >
                        <HugeiconsIcon
                          className={cn(
                            "mr-2 size-4",
                            currentField === field
                              ? "opacity-100"
                              : "opacity-50"
                          )}
                          icon={CheckUnread01Icon}
                        />
                        <span className="truncate">{field}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </CommandInput>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </TableHead>
  )
}
