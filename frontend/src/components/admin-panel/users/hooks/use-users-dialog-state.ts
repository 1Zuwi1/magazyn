import { useMemo, useState } from "react"
import type { AdminTeamOption, AdminUser } from "@/hooks/use-admin-users"
import { createEditableUser, normalizeValue } from "../lib/user-utils"

interface UseUsersDialogStateParams {
  users: AdminUser[]
  teams: AdminTeamOption[]
}

export function useUsersDialogState({
  users,
  teams,
}: UseUsersDialogStateParams) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userIdToDelete, setUserIdToDelete] = useState<number | null>(null)

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

  const deleteDescription = `Czy na pewno chcesz usunąć użytkownika "${normalizeValue(userToDelete?.full_name) || userToDelete?.email || ""}"? Ta operacja jest nieodwracalna.`

  const openEditDialog = (userId: number) => {
    setSelectedUserId(userId)
    setDialogOpen(true)
  }

  const handleEditDialogOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedUserId(null)
    }
    setDialogOpen(open)
  }

  const openDeleteDialog = (userId: number) => {
    setUserIdToDelete(userId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteDialogOpenChange = (open: boolean) => {
    if (!open) {
      setUserIdToDelete(null)
    }
    setDeleteDialogOpen(open)
  }

  return {
    dialogOpen,
    dialogUser,
    openEditDialog,
    handleEditDialogOpenChange,
    deleteDialogOpen,
    openDeleteDialog,
    handleDeleteDialogOpenChange,
    userIdToDelete,
    setUserIdToDelete,
    deleteDescription,
  }
}
