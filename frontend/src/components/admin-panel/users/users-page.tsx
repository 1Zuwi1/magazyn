"use client"

import {
  Add01Icon,
  Cancel01Icon,
  CheckmarkBadge01Icon,
  Delete02Icon,
  MoreHorizontalCircle01FreeIcons,
  PencilEdit01Icon,
  UserMultiple02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useEffect, useMemo, useRef, useState } from "react"
import { ConfirmDialog } from "@/components/admin-panel/components/dialogs"
import { ActionDialog } from "@/components/admin-panel/users/components/action-dialog"
import { MOCK_USERS } from "@/components/dashboard/mock-data"
import type { User } from "@/components/dashboard/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { AdminPageHeader } from "../components/admin-page-header"
import { ADMIN_NAV_LINKS } from "../lib/constants"

export default function UsersMain() {
  const [users, setUsers] = useState<User[]>(MOCK_USERS)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | undefined>(undefined)
  const [page, setPage] = useState(1)
  const pageSize = 10
  const prev = useRef(search)

  useEffect(() => {
    if (prev.current !== search) {
      prev.current = search
      setPage(1)
    }
  }, [search])

  const stats = useMemo(() => {
    const activeCount = users.filter((user) => user.status === "ACTIVE").length
    return {
      total: users.length,
      active: activeCount,
      inactive: users.length - activeCount,
    }
  }, [users])

  const filtered = useMemo(() => {
    if (!search.trim()) {
      return users
    }
    const normalized = search.toLowerCase()
    return users.filter(
      (user) =>
        user.username.toLowerCase().includes(normalized) ||
        user.email.toLowerCase().includes(normalized)
    )
  }, [users, search])

  const { totalPages, currentPage } = useMemo(() => {
    const total = Math.max(1, Math.ceil(filtered.length / pageSize))
    const current = Math.min(page, total)
    return { totalPages: total, currentPage: current }
  }, [filtered, page])

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, currentPage])

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setDialogOpen(true)
  }

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteUser = () => {
    if (userToDelete) {
      setUsers((prev) => prev.filter((item) => item.id !== userToDelete.id))
      setUserToDelete(undefined)
    }
  }

  const handleSubmitUser = (user: User) => {
    setUsers((prev) => {
      const exists = prev.find((item) => item.id === user.id)
      if (exists) {
        return prev.map((item) => (item.id === user.id ? user : item))
      }
      return [user, ...prev]
    })
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <AdminPageHeader
        actions={
          <Button
            onClick={() => {
              setSelectedUser(undefined)
              setDialogOpen(true)
            }}
          >
            <HugeiconsIcon className="mr-2 size-4" icon={Add01Icon} />
            Dodaj użytkownika
          </Button>
        }
        description="Zarządzaj kontami użytkowników i ich uprawnieniami"
        icon={UserMultiple02Icon}
        navLinks={ADMIN_NAV_LINKS.map((link) => ({
          title: link.title,
          url: link.url,
        }))}
        title="Użytkownicy"
      >
        {/* Quick Stats */}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border bg-background/50 px-3 py-1.5 backdrop-blur-sm">
            <span className="font-mono font-semibold text-primary">
              {stats.total}
            </span>
            <span className="text-muted-foreground text-xs">łącznie</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5">
            <HugeiconsIcon
              className="size-3.5 text-emerald-500"
              icon={CheckmarkBadge01Icon}
            />
            <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
              {stats.active}
            </span>
            <span className="text-muted-foreground text-xs">aktywnych</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-orange-500/20 bg-orange-500/5 px-3 py-1.5">
            <HugeiconsIcon
              className="size-3.5 text-orange-500"
              icon={Cancel01Icon}
            />
            <span className="font-mono font-semibold text-orange-600 dark:text-orange-400">
              {stats.inactive}
            </span>
            <span className="text-muted-foreground text-xs">nieaktywnych</span>
          </div>
        </div>
      </AdminPageHeader>

      {/* Table Section */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        {/* Search Bar */}
        <div className="border-b bg-muted/30 p-4">
          <Input
            className="max-w-sm"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Szukaj użytkowników..."
            type="search"
            value={search}
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20">
                <TableHead className="font-semibold">
                  Nazwa użytkownika
                </TableHead>
                <TableHead className="font-semibold">Email</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Rola</TableHead>
                <TableHead className="font-semibold">Zespół</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length > 0 ? (
                paginated.map((user) => (
                  <TableRow
                    className="group cursor-default transition-colors"
                    key={user.id}
                  >
                    <TableCell className="font-medium">
                      {user.username}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className="capitalize"
                        variant={
                          user.status === "ACTIVE" ? "success" : "secondary"
                        }
                      >
                        {user.status === "ACTIVE" ? "Aktywny" : "Nieaktywny"}
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
                      {user.team || "—"}
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
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditUser(user)
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
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteUser(user)
                            }}
                          >
                            <HugeiconsIcon
                              className="mr-2 size-4"
                              icon={Delete02Icon}
                            />
                            Usuń
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    className="py-12 text-center text-muted-foreground"
                    colSpan={6}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                        <HugeiconsIcon
                          className="size-6 text-muted-foreground"
                          icon={UserMultiple02Icon}
                        />
                      </div>
                      <p className="font-medium">Brak użytkowników</p>
                      <p className="text-sm">
                        {search
                          ? "Nie znaleziono użytkowników pasujących do wyszukiwania"
                          : "Dodaj pierwszego użytkownika, aby rozpocząć"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/20 px-4 py-3">
          <p className="text-muted-foreground text-sm">
            {filtered.length > 0 ? (
              <>
                Wyświetlanie{" "}
                <span className="font-medium text-foreground">
                  {(currentPage - 1) * pageSize + 1}
                </span>
                –
                <span className="font-medium text-foreground">
                  {Math.min(currentPage * pageSize, filtered.length)}
                </span>{" "}
                z{" "}
                <span className="font-medium text-foreground">
                  {filtered.length}
                </span>{" "}
                użytkowników
              </>
            ) : (
              "Brak wyników"
            )}
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
            <div className="flex items-center gap-1 px-2">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                return (
                  <button
                    className={cn(
                      "flex size-8 items-center justify-center rounded-md text-sm transition-colors",
                      pageNum === currentPage
                        ? "bg-primary font-medium text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    type="button"
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>
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

      {/* Dialogs */}
      <ActionDialog
        currentRow={selectedUser}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedUser(undefined)
          }
          setDialogOpen(open)
        }}
        onSubmit={handleSubmitUser}
        open={dialogOpen}
      />

      <ConfirmDialog
        description={`Czy na pewno chcesz usunąć użytkownika "${userToDelete?.username}"? Ta operacja jest nieodwracalna.`}
        onConfirm={confirmDeleteUser}
        onOpenChange={setDeleteDialogOpen}
        open={deleteDialogOpen}
        title="Usuń użytkownika"
      />
    </div>
  )
}
