"use client"

import {
  Cancel01Icon,
  CheckmarkBadge01Icon,
  Delete02Icon,
  MoreHorizontalCircle01FreeIcons,
  PencilEdit01Icon,
  UserMultiple02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/admin-panel/components/dialogs"
import {
  ActionDialog,
  type EditableAdminUser,
  type EditUserFormValues,
} from "@/components/admin-panel/users/components/action-dialog"
import { Badge } from "@/components/ui/badge"
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
import useAdminUsers, {
  useAdminUserTeams,
  useChangeAdminUserEmail,
  useDeleteAdminUser,
  useUpdateAdminUserProfile,
} from "@/hooks/use-admin-users"
import { cn } from "@/lib/utils"
import { AdminPageHeader } from "../components/admin-page-header"
import { ADMIN_NAV_LINKS } from "../lib/constants"

const USERS_FETCH_SIZE = 1000
const TABLE_PAGE_SIZE = 10

const getStatusLabel = (status: string): string => {
  if (status === "ACTIVE") {
    return "Aktywne"
  }
  if (status === "PENDING_VERIFICATION") {
    return "Oczekuje"
  }
  if (status === "LOCKED") {
    return "Zablokowane"
  }
  if (status === "DISABLED") {
    return "Wyłączone"
  }
  return status
}

const getStatusVariant = (
  status: string
): "default" | "destructive" | "success" | "secondary" | "outline" => {
  if (status === "ACTIVE") {
    return "success"
  }
  if (status === "LOCKED") {
    return "destructive"
  }
  return "secondary"
}

const normalizeValue = (value: string | null | undefined): string =>
  value?.trim() ?? ""

const resolveTeamValue = (
  currentTeam: string | null | undefined,
  teams: { value: string; label: string }[]
): string => {
  const normalizedTeam = normalizeValue(currentTeam)

  if (!normalizedTeam) {
    return ""
  }

  const exactValueMatch = teams.find((team) => team.value === normalizedTeam)
  if (exactValueMatch) {
    return exactValueMatch.value
  }

  const labelMatch = teams.find((team) => team.label === normalizedTeam)
  if (labelMatch) {
    return labelMatch.value
  }

  return ""
}

const createEditableUser = (
  user: {
    id: number
    full_name?: string | null
    email: string
    phone?: string | null
    location?: string | null
    team?: string | null
  },
  teams: { value: string; label: string }[]
): EditableAdminUser => ({
  id: user.id,
  fullName: normalizeValue(user.full_name),
  email: normalizeValue(user.email),
  phone: normalizeValue(user.phone),
  location: normalizeValue(user.location),
  team: resolveTeamValue(user.team, teams),
})

export default function UsersMain() {
  const {
    data: usersData,
    isPending: isUsersPending,
    isError: isUsersError,
  } = useAdminUsers({
    page: 0,
    size: USERS_FETCH_SIZE,
    sortBy: "id",
    sortDir: "asc",
  })
  const {
    data: teamsData,
    isPending: isTeamsPending,
    isError: isTeamsError,
  } = useAdminUserTeams()
  const updateProfileMutation = useUpdateAdminUserProfile()
  const changeEmailMutation = useChangeAdminUserEmail()
  const deleteUserMutation = useDeleteAdminUser()

  const users = usersData?.content ?? []
  const teams = useMemo(() => {
    return isTeamsPending ? [] : (teamsData ?? [])
  }, [teamsData, isTeamsPending])

  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userIdToDelete, setUserIdToDelete] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const prevSearch = useRef(search)

  useEffect(() => {
    if (prevSearch.current !== search) {
      prevSearch.current = search
      setPage(1)
    }
  }, [search])

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId),
    [users, selectedUserId]
  )
  const userToDelete = useMemo(
    () => users.find((user) => user.id === userIdToDelete),
    [users, userIdToDelete]
  )

  const dialogUser = useMemo(() => {
    if (!selectedUser) {
      return undefined
    }
    return createEditableUser(selectedUser, teams)
  }, [selectedUser, teams])

  const stats = useMemo(() => {
    const activeCount = users.filter(
      (user) => user.account_status === "ACTIVE"
    ).length
    const total = usersData?.totalElements ?? users.length
    return {
      total,
      active: activeCount,
      inactive: Math.max(0, total - activeCount),
    }
  }, [users, usersData?.totalElements])

  const filtered = useMemo(() => {
    if (!search.trim()) {
      return users
    }

    const normalizedSearch = search.toLowerCase()
    return users.filter((user) => {
      const fullName = normalizeValue(user.full_name).toLowerCase()
      const email = normalizeValue(user.email).toLowerCase()
      const team = normalizeValue(user.team).toLowerCase()
      return (
        fullName.includes(normalizedSearch) ||
        email.includes(normalizedSearch) ||
        team.includes(normalizedSearch)
      )
    })
  }, [users, search])

  const { totalPages, currentPage } = useMemo(() => {
    const total = Math.max(1, Math.ceil(filtered.length / TABLE_PAGE_SIZE))
    const current = Math.min(page, total)
    return { totalPages: total, currentPage: current }
  }, [filtered.length, page])

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * TABLE_PAGE_SIZE
    return filtered.slice(start, start + TABLE_PAGE_SIZE)
  }, [filtered, currentPage])

  const handleEditUser = (userId: number) => {
    if (isTeamsError) {
      toast.warning(
        "Nie udało się załadować listy zespołów. Pole zespołu może być niedostępne."
      )
    }
    setSelectedUserId(userId)
    setDialogOpen(true)
  }

  const handleDeleteUser = (userId: number) => {
    setUserIdToDelete(userId)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteUser = () => {
    if (userIdToDelete === null) {
      return
    }

    deleteUserMutation.mutate(userIdToDelete, {
      onSuccess: () => {
        setUserIdToDelete(null)
        toast.success("Użytkownik został usunięty")
      },
      onError: () => {
        toast.error("Nie udało się usunąć użytkownika")
      },
    })
  }

  const handleSubmitUser = async ({
    id,
    values,
  }: {
    id: number
    values: EditUserFormValues
  }) => {
    const currentUser = users.find((user) => user.id === id)
    if (!currentUser) {
      return
    }

    const nextEmail = values.email.trim()
    const nextFullName = values.fullName.trim()
    const nextPhone = values.phone.trim()
    const nextLocation = values.location.trim()
    const nextTeam = values.team.trim()

    const currentEmail = normalizeValue(currentUser.email)
    const currentFullName = normalizeValue(currentUser.full_name)
    const currentPhone = normalizeValue(currentUser.phone)
    const currentLocation = normalizeValue(currentUser.location)
    const currentTeam = resolveTeamValue(currentUser.team, teams)
    const selectedTeamOption = teams.find((team) => team.value === nextTeam)

    const didEmailChange = nextEmail !== currentEmail
    const didProfileChange =
      nextFullName !== currentFullName ||
      nextPhone !== currentPhone ||
      nextLocation !== currentLocation ||
      nextTeam !== currentTeam

    if (!(didEmailChange || didProfileChange)) {
      return
    }

    if (didEmailChange) {
      await changeEmailMutation.mutateAsync(
        {
          userId: id,
          body: { newEmail: nextEmail },
        },
        {
          onSuccess: () => {
            toast.success("Email użytkownika został zaktualizowany")
          },
          onError: () => {
            toast.error("Nie udało się zaktualizować emaila użytkownika")
          },
        }
      )
    }

    if (didProfileChange) {
      await updateProfileMutation.mutateAsync(
        {
          userId: id,
          body: {
            fullName: nextFullName || undefined,
            phone: nextPhone || undefined,
            location: nextLocation || undefined,
            team: selectedTeamOption?.value,
          },
        },
        {
          onSuccess: () => {
            toast.success("Profil użytkownika został zaktualizowany")
          },
          onError: () => {
            toast.error("Nie udało się zaktualizować profilu użytkownika")
          },
        }
      )
    }
  }

  const renderTableRows = () => {
    if (isUsersPending) {
      return (
        <TableRow>
          <TableCell
            className="py-12 text-center text-muted-foreground"
            colSpan={6}
          >
            Ładowanie użytkowników...
          </TableCell>
        </TableRow>
      )
    }

    if (isUsersError) {
      return (
        <TableRow>
          <TableCell
            className="py-12 text-center text-muted-foreground"
            colSpan={6}
          >
            Nie udało się pobrać użytkowników.
          </TableCell>
        </TableRow>
      )
    }

    if (paginated.length === 0) {
      return (
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
                  : "Brak danych użytkowników do wyświetlenia"}
              </p>
            </div>
          </TableCell>
        </TableRow>
      )
    }

    return paginated.map((user) => (
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
                onClick={(e) => {
                  e.stopPropagation()
                  handleEditUser(user.id)
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
                  handleDeleteUser(user.id)
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
    <div className="space-y-6">
      <AdminPageHeader
        description="Zarządzaj kontami użytkowników i ich danymi profilowymi"
        icon={UserMultiple02Icon}
        navLinks={ADMIN_NAV_LINKS.map((link) => ({
          title: link.title,
          url: link.url,
        }))}
        title="Użytkownicy"
      >
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
            <span className="text-muted-foreground text-xs">pozostałych</span>
          </div>
        </div>
      </AdminPageHeader>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="border-b bg-muted/30 p-4">
          <Input
            className="max-w-sm"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Szukaj użytkowników..."
            type="search"
            value={search}
          />
        </div>

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
            <TableBody>{renderTableRows()}</TableBody>
          </Table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/20 px-4 py-3">
          <p className="text-muted-foreground text-sm">
            {filtered.length > 0 ? (
              <>
                Wyświetlanie{" "}
                <span className="font-medium text-foreground">
                  {(currentPage - 1) * TABLE_PAGE_SIZE + 1}
                </span>
                –
                <span className="font-medium text-foreground">
                  {Math.min(currentPage * TABLE_PAGE_SIZE, filtered.length)}
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
            <button
              className={cn(
                "inline-flex items-center justify-center rounded-md border px-3 py-1.5 font-medium text-sm transition-colors",
                currentPage === 1
                  ? "cursor-not-allowed opacity-50"
                  : "hover:bg-muted"
              )}
              disabled={currentPage === 1}
              onClick={() => setPage((p) => p - 1)}
              type="button"
            >
              Poprzednia
            </button>
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
            <button
              className={cn(
                "inline-flex items-center justify-center rounded-md border px-3 py-1.5 font-medium text-sm transition-colors",
                currentPage === totalPages
                  ? "cursor-not-allowed opacity-50"
                  : "hover:bg-muted"
              )}
              disabled={currentPage === totalPages}
              onClick={() => setPage((p) => p + 1)}
              type="button"
            >
              Następna
            </button>
          </div>
        </div>
      </div>

      <ActionDialog
        currentRow={dialogUser}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedUserId(null)
          }
          setDialogOpen(open)
        }}
        onSubmit={handleSubmitUser}
        open={dialogOpen}
        teams={teams}
      />

      <ConfirmDialog
        description={`Czy na pewno chcesz usunąć użytkownika "${normalizeValue(userToDelete?.full_name) || userToDelete?.email || ""}"? Ta operacja jest nieodwracalna.`}
        onConfirm={confirmDeleteUser}
        onOpenChange={(open) => {
          if (!open) {
            setUserIdToDelete(null)
          }
          setDeleteDialogOpen(open)
        }}
        open={deleteDialogOpen}
        title="Usuń użytkownika"
      />
    </div>
  )
}
