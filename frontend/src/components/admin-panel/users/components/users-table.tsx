import {
  Delete02Icon,
  MoreHorizontalCircle01FreeIcons,
  PencilEdit01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { AdminUser } from "@/hooks/use-admin-users"
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
}

const TABLE_COLUMNS_COUNT = 6

export function UsersTable({
  users,
  isPending,
  isError,
  onEditUser,
  onDeleteUser,
}: UsersTableProps) {
  const renderRows = () => {
    if (isPending) {
      return (
        <TableRow>
          <TableCell
            className="py-12 text-center text-muted-foreground"
            colSpan={TABLE_COLUMNS_COUNT}
          >
            Ładowanie użytkowników...
          </TableCell>
        </TableRow>
      )
    }

    if (isError) {
      return (
        <TableRow>
          <TableCell
            className="py-12 text-center text-muted-foreground"
            colSpan={TABLE_COLUMNS_COUNT}
          >
            Nie udało się pobrać użytkowników.
          </TableCell>
        </TableRow>
      )
    }

    if (users.length === 0) {
      return (
        <TableRow>
          <TableCell
            className="py-12 text-center text-muted-foreground"
            colSpan={TABLE_COLUMNS_COUNT}
          >
            Brak wyników.
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
          {normalizeValue(user.team) || "—"}
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Akcje użytkownika"
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
            <DropdownMenuContent align="end" className="w-40">
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
                Edytuj
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={(event) => {
                  event.stopPropagation()
                  onDeleteUser(user.id)
                }}
              >
                <HugeiconsIcon className="mr-2 size-4" icon={Delete02Icon} />
                Usuń
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
            <TableHead className="font-semibold">Imię i nazwisko</TableHead>
            <TableHead className="font-semibold">Email</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Rola</TableHead>
            <TableHead className="font-semibold">Zespół</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>{renderRows()}</TableBody>
      </Table>
    </div>
  )
}
