import { useMemo, useState } from "react"
import type { AdminTeamOption, AdminUser } from "@/hooks/use-admin-users"
import { translateMessage } from "@/i18n/translate-message"
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
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [statusDialogUserId, setStatusDialogUserId] = useState<number | null>(
    null
  )
  const [warehouseDialogOpen, setWarehouseDialogOpen] = useState(false)
  const [warehouseDialogUserId, setWarehouseDialogUserId] = useState<
    number | null
  >(null)

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId),
    [users, selectedUserId]
  )
  const userToDelete = useMemo(
    () => users.find((user) => user.id === userIdToDelete),
    [users, userIdToDelete]
  )
  const statusDialogUser = useMemo(
    () => users.find((user) => user.id === statusDialogUserId),
    [users, statusDialogUserId]
  )
  const warehouseDialogUser = useMemo(
    () => users.find((user) => user.id === warehouseDialogUserId),
    [users, warehouseDialogUserId]
  )

  const dialogUser = useMemo(() => {
    if (!selectedUser) {
      return undefined
    }
    return createEditableUser(selectedUser, teams)
  }, [selectedUser, teams])

  const deleteDescription = translateMessage("generated.m0315", {
    value0:
      normalizeValue(userToDelete?.full_name) || userToDelete?.email || "",
  })

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

  const openStatusDialog = (userId: number) => {
    setStatusDialogUserId(userId)
    setStatusDialogOpen(true)
  }

  const handleStatusDialogOpenChange = (open: boolean) => {
    if (!open) {
      setStatusDialogUserId(null)
    }
    setStatusDialogOpen(open)
  }

  const openWarehouseDialog = (userId: number) => {
    setWarehouseDialogUserId(userId)
    setWarehouseDialogOpen(true)
  }

  const handleWarehouseDialogOpenChange = (open: boolean) => {
    if (!open) {
      setWarehouseDialogUserId(null)
    }
    setWarehouseDialogOpen(open)
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
    statusDialogOpen,
    statusDialogUser,
    openStatusDialog,
    handleStatusDialogOpenChange,
    warehouseDialogOpen,
    warehouseDialogUser,
    openWarehouseDialog,
    handleWarehouseDialogOpenChange,
  }
}
