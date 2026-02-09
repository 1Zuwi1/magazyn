"use client"

import { FilterIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { AdminUser } from "@/hooks/use-admin-users"
import { getStatusLabel } from "../lib/user-utils"

type AccountStatus = AdminUser["account_status"]

const STATUS_OPTIONS: AccountStatus[] = [
  "ACTIVE",
  "PENDING_VERIFICATION",
  "LOCKED",
  "DISABLED",
]

const ALL_STATUSES_VALUE = "__all__"

interface UsersFilterBarProps {
  search: string
  onSearchChange: (value: string) => void
  statusFilter: AccountStatus | undefined
  onStatusFilterChange: (status: AccountStatus | undefined) => void
}

export function UsersFilterBar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: UsersFilterBarProps) {
  return (
    <div className="flex flex-col gap-3 border-b bg-muted/30 p-4 sm:flex-row sm:items-center">
      <Input
        className="max-w-sm"
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Szukaj użytkowników..."
        type="search"
        value={search}
      />
      <div className="relative flex items-center gap-2">
        <HugeiconsIcon
          className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground"
          icon={FilterIcon}
        />
        <Select
          onValueChange={(value) => {
            onStatusFilterChange(
              value === ALL_STATUSES_VALUE
                ? undefined
                : (value as AccountStatus)
            )
          }}
          value={statusFilter ?? ALL_STATUSES_VALUE}
        >
          <SelectTrigger className="w-fit pl-9" size="sm">
            <SelectValue
              placeholder="Status"
              render={
                <span>
                  {statusFilter
                    ? getStatusLabel(statusFilter)
                    : "Wszystkie statusy"}
                </span>
              }
            />
          </SelectTrigger>
          <SelectContent className="w-fit">
            <SelectItem value={ALL_STATUSES_VALUE}>
              Wszystkie statusy
            </SelectItem>
            {STATUS_OPTIONS.map((status) => (
              <SelectItem key={status} value={status}>
                {getStatusLabel(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
