"use client"

import { MoreHorizontalCircle01FreeIcons } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useMemo, useState } from "react"
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
  const normalizedSearch = search.trim().toLowerCase()

  const filteredData = useMemo(() => {
    if (!normalizedSearch) {
      return data
    }

    return data.filter((user) => {
      const haystack = [user.username, user.email, user.role, user.status]
        .join(" ")
        .toLowerCase()

      return haystack.includes(normalizedSearch)
    })
  }, [data, normalizedSearch])

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * pageSize
  const pageData = filteredData.slice(startIndex, startIndex + pageSize)

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Username</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
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
                <TableCell className="capitalize">{user.role}</TableCell>
                <TableCell className="capitalize">{user.status}</TableCell>
                {(onEdit || onDelete) && (
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <HugeiconsIcon icon={MoreHorizontalCircle01FreeIcons} />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        {onEdit && (
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={(event) => {
                              event.stopPropagation()
                              onEdit(user)
                            }}
                          >
                            Edytuj
                          </DropdownMenuItem>
                        )}
                        {onDelete && (
                          <DropdownMenuItem
                            className="cursor-pointer text-destructive focus:text-destructive"
                            onClick={(event) => {
                              event.stopPropagation()
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
                colSpan={onEdit || onDelete ? 5 : 4}
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
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            size="sm"
            variant="outline"
          >
            Poprzednia
          </Button>
          <Button
            disabled={currentPage === totalPages}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
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
