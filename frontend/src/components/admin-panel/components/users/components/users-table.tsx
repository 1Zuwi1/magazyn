"use client"

import { MoreHorizontalCircle01FreeIcons } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useState } from "react"
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
  navigate: (path: string) => void
  onEdit?: (user: User) => void
  onDelete?: (user: User) => void
  pageSize?: number
}

export default function UsersTable({
  data,
  search,
  onEdit,
  onDelete,
  pageSize = 12,
}: UsersTableProps) {
  const [page, setPage] = useState(1)
  const filtered = search
    ? data.filter(
        (u) =>
          u.username.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase())
      )
    : data

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * pageSize
  const pageData = filtered.slice(startIndex, startIndex + pageSize)

  const actions = onEdit || onDelete

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Username</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>{}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageData.length ? (
            pageData.map((user) => (
              <TableRow
                className="cursor-default"
                key={user.id}
                onClick={() => console.log(`${user.id} clicked`)}
              >
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell className="capitalize">{user.status}</TableCell>
                {actions && (
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger>
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
                colSpan={actions ? 5 : 4}
              >
                Brak użytkowników do wyświetlenia.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">{}</p>
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
