"use client"

import { ArrowDown01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { format, formatISO } from "date-fns"
import { useLocale } from "next-intl"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { getDateFnsLocale } from "@/i18n/date-fns-locale"
import { translateMessage } from "@/i18n/translate-message"

export function DatePicker({
  date,
  onDateChange,
  setTimeToEndOfDay = false,
}: {
  date?: Date
  onDateChange: (date: string) => void
  setTimeToEndOfDay?: boolean
}) {
  const locale = useLocale()
  const dateFnsLocale = getDateFnsLocale(locale)

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            className="w-53 justify-between text-left font-normal data-[empty=true]:text-muted-foreground"
            data-empty={!date}
            variant={"outline"}
          >
            {date ? (
              format(date, "PPP", {
                locale: dateFnsLocale,
              })
            ) : (
              <span>{translateMessage("generated.ui.selectDate")}</span>
            )}
            <HugeiconsIcon icon={ArrowDown01Icon} />
          </Button>
        }
      />
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          defaultMonth={date}
          locale={dateFnsLocale}
          mode="single"
          onSelect={(date) => {
            if (date) {
              if (setTimeToEndOfDay) {
                date.setHours(23, 59, 59, 999)
              }
              onDateChange(formatISO(date))
            } else {
              onDateChange("")
            }
          }}
          selected={date}
        />
      </PopoverContent>
    </Popover>
  )
}
