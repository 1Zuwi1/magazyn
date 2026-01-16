import { ViewIcon, ViewOffIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { type AnyFieldApi, useForm } from "@tanstack/react-form"
import { useState } from "react"
import z from "zod"
import type { User } from "@/components/dashboard/types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const formSchema = z.object({
  username: z.string().min(1, "Username is required"),
  email: z.email({
    error: "Invalid email address",
  }),
  role: z.enum(["user", "admin"]),
  status: z.enum(["active", "inactive"]),
})

type UserForm = z.infer<typeof formSchema>

interface ActionDialogProps {
  currentRow?: User
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ActionDialog({
  currentRow,
  open,
  onOpenChange,
}: ActionDialogProps) {
  const isEdit = !!currentRow
  const [showPassword, setShowPassword] = useState(false)
  const form = useForm({
    defaultValues: isEdit
      ? {
          username: currentRow.username,
          email: currentRow.email,
          password: currentRow.password ?? "",
          role: currentRow.role,
          status: currentRow.status,
        }
      : {
          username: "",
          email: "",
          password: "",
          role: "user",
          status: "active",
        },
    onSubmit: ({ value }) => {
      form.reset()
      JSON.stringify(value, null, 2)
      onOpenChange(false)
    },
  })

  const renderError = (field: AnyFieldApi) => {
    const error = field.state.meta.errors[0] as
      | { message?: string }
      | string
      | undefined

    const message = typeof error === "string" ? error : error?.message

    if (!message) {
      return null
    }

    return <FieldError className="col-span-4 col-start-3">{message}</FieldError>
  }

  return (
    <Dialog
      onOpenChange={(state) => {
        form.reset()
        onOpenChange(state)
      }}
      open={open}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edytuj użytkownika" : "Dodaj użytkownika"}
          </DialogTitle>
          <DialogDescription className="mt-2">
            {isEdit
              ? "Zmień informacje o użytkowniku"
              : "Wprowadź informacje o nowym użytkowniku."}
          </DialogDescription>
          <DialogDescription className="mt-1">
            Kliknij przycisk "Zapisz", aby zatwierdzić.
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <div className="h-105 overflow-y-auto py-1 pe-3">
          <form
            className="space-y-4 px-0.5"
            id="user-form"
            onSubmit={(event) => {
              event.preventDefault()
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
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
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
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
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
                          onChange={(event) =>
                            field.handleChange(event.target.value)
                          }
                          placeholder="********"
                          type={showPassword ? "text" : "password"}
                          value={field.state.value}
                        />
                        <InputGroupAddon>
                          <HugeiconsIcon
                            className={cn("cursor-pointer hover:text-primary", {
                              hidden: field.state.value,
                              visible: !field.state.value,
                            })}
                            icon={showPassword ? ViewOffIcon : ViewIcon}
                            onClick={(e) => {
                              e.preventDefault()
                              setShowPassword(!showPassword)
                            }}
                            type="button"
                          />
                        </InputGroupAddon>
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
                        onValueChange={(value) =>
                          field.handleChange(value as UserForm["role"])
                        }
                        value={field.state.value}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                          {!field.state.value && (
                            <span className="text-muted-foreground">
                              Select a role
                            </span>
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            { label: "user", value: "user" },
                            { label: "admin", value: "admin" },
                          ].map((role) => (
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
                        onValueChange={(value) =>
                          field.handleChange(value as UserForm["status"])
                        }
                        value={field.state.value}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                          {!field.state.value && (
                            <span className="text-muted-foreground">
                              Select a status
                            </span>
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            { label: "active", value: "active" },
                            { label: "inactive", value: "inactive" },
                          ].map((status) => (
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
        </div>
        <DialogFooter>
          <Button form="user-form" type="submit">
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
