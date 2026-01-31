"use client"

import { MoreHorizontalCircle01FreeIcons } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useMemo, useRef, useState } from "react"
import type { User } from "@/components/dashboard/types"
import { Button } from "@/components/ui/button"
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

interface UsersTableProps {
  data: User[]
  search: string
  onEdit?: (user: User) => void
  onDelete?: (user: User) => void
  pageSize?: number
}

export function UsersTable({
  data,
  search,
  onEdit,
  onDelete,
  pageSize = 12,
}: UsersTableProps) {
  const [page, setPage] = useState(1)
  const prev = useRef(search)

  if (prev.current !== search) {
    prev.current = search
    if (page !== 1) {
      setPage(1)
    }
  }

  const filtered = useMemo(() => {
    if (!search.trim()) {
      return data
    }
    const normalized = search.toLowerCase()

    return data.filter(
      (user) =>
        user.username.toLowerCase().includes(normalized) ||
        user.email.toLowerCase().includes(normalized)
    )
  }, [data, search])

  const { totalPages, currentPage } = useMemo(() => {
    const total = Math.max(1, Math.ceil(filtered.length / pageSize))
    const current = Math.min(page, total)
    return {
      totalPages: total,
      currentPage: current,
    }
  }, [filtered, page, pageSize])

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, currentPage, pageSize])

  const actions = onEdit || onDelete

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Username</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            {actions && <TableHead />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginated.length ? (
            paginated.map((user) => (
              <TableRow className="cursor-default" key={user.id}>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell className="capitalize">{user.status}</TableCell>
                {actions && (
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger aria-label="Akcje użytkownika">
                        <HugeiconsIcon icon={MoreHorizontalCircle01FreeIcons} />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        {onEdit && (
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation()
                              onEdit(user)
                            }}
                          >
                            Edytuj
                          </DropdownMenuItem>
                        )}
                        {onDelete && (
                          <DropdownMenuItem
                            className="cursor-pointer text-destructive focus:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              onDelete(user)
                            }}
                          >
                            Usuń
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                className="py-8 text-center text-muted-foreground"
                colSpan={actions ? 4 : 3}
              >
                Brak użytkowników do wyświetlenia.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          {filtered.length
            ? `Strona ${currentPage} z ${totalPages} ${filtered.length} użytkowników`
            : "Brak wyników"}
        </p>
        <div className="flex items-center gap-2">
          <Button
            disabled={currentPage === 1}
            onClick={() => setPage((p) => p - 1)}
            size="sm"
            variant="outline"
          >
            Poprzednia
          </Button>
          <Button
            disabled={currentPage === totalPages}
            onClick={() => setPage((p) => p + 1)}
            size="sm"
            variant="outline"
          >
            Następna
          </Button>
        </div>
      </div>
    </div>
  )
}
