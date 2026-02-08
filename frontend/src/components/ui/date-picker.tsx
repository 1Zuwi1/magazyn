"use client"

import { ArrowDown01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function DatePicker({
  date,
  onDateChange,
}: {
  date?: Date
  onDateChange: (date?: Date) => void
}) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            className="w-53 justify-between text-left font-normal data-[empty=true]:text-muted-foreground"
            data-empty={!date}
            variant={"outline"}
          >
            {date ? format(date, "PPP") : <span>Wybierz datę</span>}
            <HugeiconsIcon icon={ArrowDown01Icon} />
          </Button>
        }
      />
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          defaultMonth={date}
          mode="single"
          onSelect={onDateChange}
          selected={date}
        />
      </PopoverContent>
    </Popover>
  )
}
