import {
  Building06Icon,
  Delete02Icon,
  MoreHorizontalCircle01FreeIcons,
  PencilEdit01Icon,
  UserShield01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ErrorEmptyState, FilterEmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { AdminUser } from "@/hooks/use-admin-users"
import { translateMessage } from "@/i18n/translate-message"
import { cn } from "@/lib/utils"
import {
  getStatusLabel,
  getStatusVariant,
  normalizeValue,
} from "../lib/user-utils"

interface UsersTableProps {
  users: AdminUser[]
  isPending: boolean
  isError: boolean
  onEditUser: (userId: number) => void
  onDeleteUser: (userId: number) => void
  onChangeStatus: (userId: number) => void
  onAssignWarehouse: (userId: number) => void
}

const TABLE_COLUMNS_COUNT = 6

const ADMIN_TABLE_LABELS = {
  OPERATIONS: "Operacje magazynowe",
  LOGISTICS: "Logistyka",
  WAREHOUSE: "Magazyn",
  INVENTORY: "Inwentaryzacja",
  QUALITY_CONTROL: translateMessage("generated.m0284"),
  RECEIVING: translateMessage("generated.m0285"),
  SHIPPING: translateMessage("generated.m0286"),
  IT_SUPPORT: "Wsparcie IT",
  MANAGEMENT: translateMessage("generated.m0287"),
}

export function UsersTable({
  users,
  isPending,
  isError,
  onEditUser,
  onDeleteUser,
  onChangeStatus,
  onAssignWarehouse,
}: UsersTableProps) {
  const renderRows = () => {
    if (isPending) {
      return Array.from({ length: 5 }, (_, i) => (
        <TableRow key={`skeleton-${i.toString()}`}>
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-44" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-20 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-16 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-28" />
          </TableCell>
          <TableCell>
            <Skeleton className="size-8 rounded-md" />
          </TableCell>
        </TableRow>
      ))
    }

    if (isError) {
      return (
        <TableRow>
          <TableCell
            className="p-0 text-center text-muted-foreground"
            colSpan={TABLE_COLUMNS_COUNT}
          >
            <ErrorEmptyState />
          </TableCell>
        </TableRow>
      )
    }

    if (users.length === 0) {
      return (
        <TableRow>
          <TableCell
            className="p-0 text-center text-muted-foreground"
            colSpan={TABLE_COLUMNS_COUNT}
          >
            <FilterEmptyState />
          </TableCell>
        </TableRow>
      )
    }

    return users.map((user) => (
      <TableRow
        className="group cursor-default transition-colors"
        key={user.id}
      >
        <TableCell className="font-medium">
          {normalizeValue(user.full_name) || "—"}
        </TableCell>
        <TableCell className="text-muted-foreground">{user.email}</TableCell>
        <TableCell>
          <Badge
            className="capitalize"
            variant={getStatusVariant(user.account_status)}
          >
            {getStatusLabel(user.account_status)}
          </Badge>
        </TableCell>
        <TableCell>
          <Badge
            className="capitalize"
            variant={user.role === "ADMIN" ? "default" : "outline"}
          >
            {user.role}
          </Badge>
        </TableCell>
        <TableCell className="text-muted-foreground">
          {ADMIN_TABLE_LABELS[user.team as keyof typeof ADMIN_TABLE_LABELS] ||
            "—"}
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={translateMessage("generated.m0288")}
              className={cn(
                "flex size-8 items-center justify-center rounded-md opacity-0 transition-all hover:bg-muted group-hover:opacity-100",
                "focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
              )}
            >
              <HugeiconsIcon
                className="size-5"
                icon={MoreHorizontalCircle01FreeIcons}
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={(event) => {
                  event.stopPropagation()
                  onEditUser(user.id)
                }}
              >
                <HugeiconsIcon
                  className="mr-2 size-4"
                  icon={PencilEdit01Icon}
                />
                {translateMessage("generated.m0934")}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={(event) => {
                  event.stopPropagation()
                  onChangeStatus(user.id)
                }}
              >
                <HugeiconsIcon
                  className="mr-2 size-4"
                  icon={UserShield01Icon}
                />
                {translateMessage("generated.m0176")}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={(event) => {
                  event.stopPropagation()
                  onAssignWarehouse(user.id)
                }}
              >
                <HugeiconsIcon className="mr-2 size-4" icon={Building06Icon} />
                {translateMessage("generated.m0289")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={(event) => {
                  event.stopPropagation()
                  onDeleteUser(user.id)
                }}
              >
                <HugeiconsIcon className="mr-2 size-4" icon={Delete02Icon} />
                {translateMessage("generated.m0230")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    ))
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/20 hover:bg-muted/20">
            <TableHead className="font-semibold">
              {translateMessage("generated.m0270")}
            </TableHead>
            <TableHead className="font-semibold">
              {translateMessage("generated.m0874")}
            </TableHead>
            <TableHead className="font-semibold">
              {translateMessage("generated.m0895")}
            </TableHead>
            <TableHead className="font-semibold">
              {translateMessage("generated.m0942")}
            </TableHead>
            <TableHead className="font-semibold">
              {translateMessage("generated.m0272")}
            </TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>{renderRows()}</TableBody>
      </Table>
    </div>
  )
}
