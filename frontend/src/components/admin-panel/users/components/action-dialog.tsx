"use client"

import { useForm, useStore } from "@tanstack/react-form"
import { useCallback, useEffect } from "react"
import z from "zod"
import { FormDialog } from "@/components/admin-panel/components/dialogs"
import { FieldWithState } from "@/components/helpers/field-state"
import { FieldGroup } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { AdminTeamOption } from "@/hooks/use-admin-users"

const profilePhonePattern = /^[+\d\s()-]*$/

const EditUserFormSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "Imię i nazwisko musi mieć co najmniej 3 znaki")
    .max(100, "Imię i nazwisko może mieć maksymalnie 100 znaków"),
  email: z.email("Podaj poprawny adres email"),
  phone: z
    .string()
    .trim()
    .max(20, "Numer telefonu może mieć maksymalnie 20 znaków")
    .regex(
      profilePhonePattern,
      "Numer telefonu może zawierać tylko cyfry, spacje i znaki +()-"
    ),
  location: z
    .string()
    .trim()
    .max(100, "Lokalizacja może mieć maksymalnie 100 znaków"),
  team: z.string(),
})

export type EditUserFormValues = z.infer<typeof EditUserFormSchema>

export interface EditableAdminUser {
  id: number
  fullName: string
  email: string
  phone: string
  location: string
  team: string
}

interface ActionDialogProps {
  currentRow?: EditableAdminUser
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (data: {
    id: number
    values: EditUserFormValues
  }) => Promise<void> | void
  teams: AdminTeamOption[]
}

export function ActionDialog({
  currentRow,
  open,
  onOpenChange,
  onSubmit,
  teams,
}: ActionDialogProps) {
  const formId = "edit-user-form"

  const getFormValues = useCallback(
    () => ({
      fullName: currentRow?.fullName ?? "",
      email: currentRow?.email ?? "",
      phone: currentRow?.phone ?? "",
      location: currentRow?.location ?? "",
      team: currentRow?.team ?? "",
    }),
    [currentRow]
  )

  const form = useForm({
    defaultValues: getFormValues(),
    onSubmit: async ({ value }) => {
      if (!(onSubmit && currentRow)) {
        return
      }
      await onSubmit({
        id: currentRow.id,
        values: value,
      })
      onOpenChange(false)
    },
    validators: {
      onSubmit: EditUserFormSchema,
    },
  })

  useEffect(() => {
    if (open) {
      form.reset(getFormValues())
    }
  }, [open, getFormValues, form])

  const isSubmitting = useStore(form.store, (state) => state.isSubmitting)

  return (
    <FormDialog
      description="Zmień informacje profilowe użytkownika"
      formId={formId}
      isLoading={isSubmitting}
      onFormReset={() => form.reset(getFormValues())}
      onOpenChange={onOpenChange}
      open={open}
      title="Edytuj użytkownika"
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
          <form.Field name="fullName">
            {(field) => (
              <FieldWithState
                autoComplete="off"
                field={field}
                label="Imię i nazwisko"
                layout="grid"
                placeholder="Jan Kowalski"
              />
            )}
          </form.Field>

          <form.Field name="email">
            {(field) => (
              <FieldWithState
                autoComplete="off"
                field={field}
                label="Email"
                layout="grid"
                placeholder="jan.kowalski@example.com"
                type="email"
              />
            )}
          </form.Field>

          <form.Field name="phone">
            {(field) => (
              <FieldWithState
                autoComplete="off"
                field={field}
                label="Telefon"
                layout="grid"
                placeholder="+48 555 019 203"
                type="tel"
              />
            )}
          </form.Field>

          <form.Field name="location">
            {(field) => (
              <FieldWithState
                autoComplete="off"
                field={field}
                label="Lokalizacja"
                layout="grid"
                placeholder="Gdańsk, Polska"
              />
            )}
          </form.Field>

          <form.Field name="team">
            {(field) => (
              <FieldWithState
                field={field}
                label="Zespół"
                layout="grid"
                renderInput={({ id, isInvalid }) => (
                  <Select
                    onValueChange={(value) => field.handleChange(value ?? "")}
                    value={field.state.value || ""}
                  >
                    <SelectTrigger
                      className={isInvalid ? "border-destructive" : ""}
                      id={id}
                    >
                      <SelectValue
                        placeholder="Wybierz zespół"
                        render={
                          <span>
                            {field.state.value
                              ? teams.find((t) => t.value === field.state.value)
                                  ?.label
                              : "Wybierz zespół"}
                          </span>
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((teamOption) => (
                        <SelectItem
                          key={teamOption.value}
                          value={teamOption.value}
                        >
                          {teamOption.label}
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
