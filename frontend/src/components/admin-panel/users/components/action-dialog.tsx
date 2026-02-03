"use client"

import { type AnyFieldApi, useForm } from "@tanstack/react-form"
import { useCallback, useEffect } from "react"
import type { ZodError } from "zod"
import { FormDialog } from "@/components/admin-panel/components/dialogs"
import type { Role, Status, User } from "@/components/dashboard/types"
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
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
  { label: "Użytkownik", value: "user" },
  { label: "Administrator", value: "admin" },
]

const statuses: { label: string; value: Status }[] = [
  { label: "Aktywny", value: "active" },
  { label: "Nieaktywny", value: "inactive" },
]

interface ActionDialogProps {
  currentRow?: User
  open: boolean
  onOpenChange: (open: boolean) => void
  formId?: string
  onSubmit?: (user: User) => void
}

export function ActionDialog({
  currentRow,
  open,
  onOpenChange,
  formId,
  onSubmit,
}: ActionDialogProps) {
  const isEdit = !!currentRow

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

  const renderError = (field: AnyFieldApi) => {
    const error = field.state.meta.errors[0] as ZodError | string | undefined
    const message = typeof error === "string" ? error : error?.message

    if (!message) {
      return null
    }

    return <FieldError className="col-span-4 col-start-3">{message}</FieldError>
  }

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
              <Field className="grid grid-cols-6 items-center gap-x-4 gap-y-1">
                <FieldLabel
                  className="col-span-2 text-end"
                  htmlFor={field.name}
                >
                  Nazwa użytkownika
                </FieldLabel>
                <FieldContent className="col-span-4">
                  <Input
                    autoComplete="off"
                    className={
                      field.state.meta.errors.length ? "border-red-500" : ""
                    }
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="jan_kowalski"
                    value={field.state.value}
                  />
                </FieldContent>
                {renderError(field)}
              </Field>
            )}
          </form.Field>

          <form.Field name="email">
            {(field) => (
              <Field className="grid grid-cols-6 items-center gap-x-4 gap-y-1">
                <FieldLabel
                  className="col-span-2 text-end"
                  htmlFor={field.name}
                >
                  Email
                </FieldLabel>
                <FieldContent className="col-span-4">
                  <Input
                    className={
                      field.state.meta.errors.length ? "border-red-500" : ""
                    }
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="jan.kowalski@example.com"
                    type="email"
                    value={field.state.value}
                  />
                </FieldContent>
                {renderError(field)}
              </Field>
            )}
          </form.Field>

          <form.Field name="role">
            {(field) => (
              <Field className="grid grid-cols-6 items-center gap-x-4 gap-y-1">
                <FieldLabel
                  className="col-span-2 text-end"
                  htmlFor={field.name}
                >
                  Rola
                </FieldLabel>
                <FieldContent className="col-span-4">
                  <Select
                    onValueChange={(value) => {
                      if (value) {
                        field.handleChange(value as Role)
                      }
                    }}
                    value={field.state.value}
                  >
                    <SelectTrigger
                      className={
                        field.state.meta.errors.length ? "border-red-500" : ""
                      }
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
                </FieldContent>
                {renderError(field)}
              </Field>
            )}
          </form.Field>

          <form.Field name="status">
            {(field) => (
              <Field className="grid grid-cols-6 items-center gap-x-4 gap-y-1">
                <FieldLabel
                  className="col-span-2 text-end"
                  htmlFor={field.name}
                >
                  Status
                </FieldLabel>
                <FieldContent className="col-span-4">
                  <Select
                    onValueChange={(value) => {
                      if (value) {
                        field.handleChange(value as Status)
                      }
                    }}
                    value={field.state.value}
                  >
                    <SelectTrigger
                      className={
                        field.state.meta.errors.length ? "border-red-500" : ""
                      }
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
                </FieldContent>
                {renderError(field)}
              </Field>
            )}
          </form.Field>
        </FieldGroup>
      </form>
    </FormDialog>
  )
}
