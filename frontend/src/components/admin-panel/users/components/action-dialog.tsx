"use client"

import { useForm } from "@tanstack/react-form"
import { useCallback, useEffect } from "react"
import { FormDialog } from "@/components/admin-panel/components/dialogs"
import type { Role, Status, User } from "@/components/dashboard/types"
import { FieldWithState } from "@/components/helpers/field-state"
import { FieldGroup } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { UserFormSchema } from "@/lib/schemas/csv-schemas"
import { DEFAULT_USER } from "../../lib/constants"

const roles: { label: string; value: Role }[] = [
  { label: "Użytkownik", value: "USER" },
  { label: "Administrator", value: "ADMIN" },
]

const statuses: { label: string; value: Status }[] = [
  { label: "Aktywny", value: "ACTIVE" },
  { label: "Nieaktywny", value: "INACTIVE" },
]

interface ActionDialogProps {
  currentRow?: User
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (user: User) => void
}

export function ActionDialog({
  currentRow,
  open,
  onOpenChange,
  onSubmit,
}: ActionDialogProps) {
  const isEdit = !!currentRow

  const formId = isEdit ? "edit-form" : "add-form"

  const getFormValues = useCallback(
    () => ({
      username: currentRow?.username ?? DEFAULT_USER.username,
      email: currentRow?.email ?? DEFAULT_USER.email,
      role: currentRow?.role ?? DEFAULT_USER.role,
      status: currentRow?.status ?? DEFAULT_USER.status,
      team: currentRow?.team ?? DEFAULT_USER.team,
    }),
    [currentRow]
  )

  const form = useForm({
    defaultValues: getFormValues(),
    onSubmit: ({ value }) => {
      if (onSubmit) {
        const user: User = {
          id: currentRow?.id ?? crypto.randomUUID(),
          ...value,
        }
        onSubmit(user)
      }
      onOpenChange(false)
    },
    validators: {
      onSubmit: UserFormSchema,
    },
  })

  useEffect(() => {
    if (open) {
      form.reset(getFormValues())
    }
  }, [open, getFormValues, form])

  return (
    <FormDialog
      description={
        isEdit
          ? "Zmień informacje o użytkowniku"
          : "Wprowadź informacje o nowym użytkowniku."
      }
      formId={formId}
      onFormReset={() => form.reset(getFormValues())}
      onOpenChange={onOpenChange}
      open={open}
      title={isEdit ? "Edytuj użytkownika" : "Dodaj użytkownika"}
    >
      <form
        className="space-y-4 px-0.5"
        id={formId}
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
      >
        <FieldGroup className="gap-4">
          <form.Field name="username">
            {(field) => (
              <FieldWithState
                autoComplete="off"
                field={field}
                label="Nazwa użytkownika"
                layout="grid"
                placeholder="jan_kowalski"
              />
            )}
          </form.Field>

          <form.Field name="email">
            {(field) => (
              <FieldWithState
                field={field}
                label="Email"
                layout="grid"
                placeholder="jan.kowalski@example.com"
                type="email"
              />
            )}
          </form.Field>

          <form.Field name="role">
            {(field) => (
              <FieldWithState
                field={field}
                label="Rola"
                layout="grid"
                renderInput={({ id, isInvalid }) => (
                  <Select
                    onValueChange={(value) => {
                      if (value) {
                        field.handleChange(value as Role)
                      }
                    }}
                    value={field.state.value}
                  >
                    <SelectTrigger
                      className={isInvalid ? "border-destructive" : ""}
                      id={id}
                    >
                      <SelectValue>
                        {roles.find((r) => r.value === field.state.value)
                          ?.label ?? "Wybierz rolę"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            )}
          </form.Field>

          <form.Field name="status">
            {(field) => (
              <FieldWithState
                field={field}
                label="Status"
                layout="grid"
                renderInput={({ id, isInvalid }) => (
                  <Select
                    onValueChange={(value) => {
                      if (value) {
                        field.handleChange(value as Status)
                      }
                    }}
                    value={field.state.value}
                  >
                    <SelectTrigger
                      className={isInvalid ? "border-destructive" : ""}
                      id={id}
                    >
                      <SelectValue>
                        {statuses.find((s) => s.value === field.state.value)
                          ?.label ?? "Wybierz status"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            )}
          </form.Field>
        </FieldGroup>
      </form>
    </FormDialog>
  )
}
