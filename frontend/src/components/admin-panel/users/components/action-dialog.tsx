"use client"

import { useForm, useStore } from "@tanstack/react-form"
import { useTranslations } from "next-intl"
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
import { translateMessage } from "@/i18n/translate-message"
import { cn } from "@/lib/utils"

const profilePhonePattern = /^[+\d\s()-]*$/

const EditUserFormSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, translateMessage("generated.admin.users.fullNameMustLeast3"))
    .max(
      100,
      translateMessage("generated.admin.users.fullNameMaximum100Characters")
    ),
  email: z.email("Podaj poprawny adres email"),
  phone: z
    .string()
    .trim()
    .max(
      20,
      translateMessage("generated.admin.users.phoneNumberMaximum20Characters")
    )
    .regex(
      profilePhonePattern,
      translateMessage("generated.admin.users.phoneNumberOnlyContainNumbers")
    ),
  location: z
    .string()
    .trim()
    .max(
      100,
      translateMessage("generated.admin.users.locationMaximum100Characters")
    ),
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
  const teamTranslations = useTranslations("adminUsers.teams")

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
  const getTeamLabel = useCallback(
    (teamValue: string): string => {
      const selectedTeam = teams.find(
        (teamOption) => teamOption.value === teamValue
      )
      if (!selectedTeam) {
        return translateMessage("generated.admin.users.chooseTeam")
      }

      return teamTranslations(selectedTeam.value)
    },
    [teamTranslations, teams]
  )

  return (
    <FormDialog
      description={translateMessage(
        "generated.admin.users.changeUserProfileInformation"
      )}
      formId={formId}
      isLoading={isSubmitting}
      onFormReset={() => form.reset(getFormValues())}
      onOpenChange={onOpenChange}
      open={open}
      title={translateMessage("generated.admin.users.editUser")}
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
                label={translateMessage("generated.admin.users.fullName")}
                layout="grid"
                placeholder={translateMessage("generated.shared.johnKowalski")}
              />
            )}
          </form.Field>

          <form.Field name="email">
            {(field) => (
              <FieldWithState
                autoComplete="off"
                field={field}
                label={translateMessage("generated.shared.eMail")}
                layout="grid"
                placeholder={translateMessage(
                  "generated.admin.users.johnKowalskiExampleCom"
                )}
                type="email"
              />
            )}
          </form.Field>

          <form.Field name="phone">
            {(field) => (
              <FieldWithState
                autoComplete="off"
                field={field}
                label={translateMessage("generated.shared.phone")}
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
                label={translateMessage("generated.shared.location")}
                layout="grid"
                placeholder={translateMessage(
                  "generated.admin.users.gdanskPoland"
                )}
              />
            )}
          </form.Field>

          <form.Field name="team">
            {(field) => (
              <FieldWithState
                field={field}
                label={translateMessage("generated.shared.team")}
                layout="grid"
                renderInput={({ id, isInvalid }) => (
                  <Select
                    onValueChange={(value) => field.handleChange(value ?? "")}
                    value={field.state.value || ""}
                  >
                    <SelectTrigger
                      className={cn("w-fit", {
                        "border-destructive": isInvalid,
                      })}
                      id={id}
                    >
                      <SelectValue
                        placeholder={translateMessage(
                          "generated.admin.users.chooseTeam"
                        )}
                        render={
                          <span>
                            {field.state.value
                              ? getTeamLabel(field.state.value)
                              : translateMessage(
                                  "generated.admin.users.chooseTeam"
                                )}
                          </span>
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="w-fit">
                      {teams.map((teamOption) => (
                        <SelectItem
                          key={teamOption.value}
                          value={teamOption.value}
                        >
                          {teamTranslations(teamOption.value)}
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
