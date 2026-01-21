"use client"

import { ViewIcon, ViewOffIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { type AnyFieldApi, useForm } from "@tanstack/react-form"
import { useEffect, useState } from "react"
import { FormDialog } from "@/components/admin-panel/components/form-dialog"
import type { Role, Status, User } from "@/components/dashboard/types"
import { buttonVariants } from "@/components/ui/button"
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

const roles: { label: string; value: Role }[] = [
  { label: "user", value: "user" },
  { label: "admin", value: "admin" },
]

const statuses: { label: string; value: Status }[] = [
  { label: "active", value: "active" },
  { label: "inactive", value: "inactive" },
]

const getDefaultValues = (currentRow?: User): User => ({
  id: currentRow?.id ?? "",
  username: currentRow?.username ?? "",
  email: currentRow?.email ?? "",
  password: "",
  role: currentRow?.role ?? "user",
  status: currentRow?.status ?? "active",
})

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
}: ActionDialogProps) {
  const isEdit = !!currentRow
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm({
    defaultValues: getDefaultValues(currentRow),
    onSubmit: ({ value }) => {
      form.reset()
      console.log(JSON.stringify(value))
      onOpenChange(false)
    },
  })

  useEffect(() => {
    form.reset(getDefaultValues(currentRow))
  }, [currentRow, form])

  const handleFormReset = () => {
    form.reset()
    setShowPassword(false)
  }

  const renderError = (field: AnyFieldApi) => {
    const error = field.state.meta.errors[0] as { message?: string } | undefined
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
      onFormReset={handleFormReset}
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
                  Username
                </FieldLabel>
                <FieldContent className="col-span-4">
                  <Input
                    autoComplete="off"
                    className="w-full"
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="john_doe"
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
                    className="w-full"
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="john.doe@gmail.com"
                    type="email"
                    value={field.state.value}
                  />
                </FieldContent>
                {renderError(field)}
              </Field>
            )}
          </form.Field>

          <form.Field name="password">
            {(field) => (
              <Field className="grid grid-cols-6 items-center gap-x-4 gap-y-1">
                <FieldLabel
                  className="col-span-2 text-end"
                  htmlFor={field.name}
                >
                  Password
                </FieldLabel>
                <FieldContent className="col-span-4">
                  <InputGroup>
                    <InputGroupInput
                      className="text-sm"
                      id={field.name}
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="********"
                      type={showPassword ? "text" : "password"}
                      value={field.state.value}
                    />
                    <InputGroupButton
                      aria-label={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
                      onClick={(e) => {
                        e.preventDefault()
                        setShowPassword(!showPassword)
                      }}
                      type="button"
                    >
                      <HugeiconsIcon
                        className={cn(
                          buttonVariants({
                            variant: "ghost",
                            size: "icon-xs",
                          }),
                          {
                            hidden: !field.state.value,
                            visible: field.state.value,
                          }
                        )}
                        icon={showPassword ? ViewOffIcon : ViewIcon}
                      />
                    </InputGroupButton>
                  </InputGroup>
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
                  Role
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
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {field.state.value || "Select a role"}
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
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {field.state.value || "Select a status"}
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
