"use client"

import { useMemo, useState } from "react"
import { ActionDialog } from "@/components/admin-panel/users/components/action-dialog"
import UsersTable from "@/components/admin-panel/users/components/users-table"
import { MOCK_USERS } from "@/components/dashboard/mock-data"
import type { User } from "@/components/dashboard/types"
import { Button } from "@/components/ui/button"

export default function UsersMain() {
  const [users, setUsers] = useState<User[]>(MOCK_USERS)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined)

  const stats = useMemo(() => {
    const activeCount = users.filter((user) => user.status === "active").length
    return {
      total: users.length,
      active: activeCount,
      inactive: users.length - activeCount,
    }
  }, [users])

  const handleAddUser = () => {
    setSelectedUser(undefined)
    setDialogOpen(true)
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setDialogOpen(true)
  }

  const handleDeleteUser = (user: User) => {
    setUsers((prev) => prev.filter((item) => item.id !== user.id))
  }

  const handleSubmit = (user: User) => {
    if (selectedUser) {
      setUsers((prev) =>
        prev.map((item) => (item.id === user.id ? { ...item, ...user } : item))
      )
    } else {
      const newUser: User = {
        ...user,
        id: user.id || `user-${Date.now()}`,
      }
      setUsers((prev) => [...prev, newUser])
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-semibold text-lg">Użytkownicy</h1>
          <p className="text-muted-foreground text-sm">
            {stats.total} · {stats.active} aktywnych · {stats.inactive}{" "}
            nieaktywnych
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button onClick={handleAddUser}>Dodaj użytkownika</Button>
        </div>
      </header>

      <UsersTable
        data={users}
        onDelete={handleDeleteUser}
        onEdit={handleEditUser}
        search=""
      />

      <ActionDialog
        currentRow={selectedUser}
        formId="user-form"
        onOpenChange={(open) => {
          if (!open) {
            setSelectedUser(undefined)
          }
          setDialogOpen(open)
        }}
        onSubmit={handleSubmit}
        open={dialogOpen}
      />
    </section>
  )
}
