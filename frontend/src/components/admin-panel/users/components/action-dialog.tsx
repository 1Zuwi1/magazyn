"use client"

import { useForm, useStore } from "@tanstack/react-form"
import { useTranslations } from "next-intl"
import { useCallback, useEffect, useMemo } from "react"
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
import type { AppTranslate } from "@/i18n/use-translations"
import { cn } from "@/lib/utils"

const profilePhonePattern = /^[+\d\s()-]*$/

const createEditUserFormSchema = (t: AppTranslate) =>
  z.object({
    fullName: z
      .string()
      .trim()
      .min(3, t("generated.admin.users.fullNameMustLeast3"))
      .max(100, t("generated.admin.users.fullNameMaximum100Characters")),
    email: z.email("Podaj poprawny adres email"),
    phone: z
      .string()
      .trim()
      .max(20, t("generated.admin.users.phoneNumberMaximum20Characters"))
      .regex(
        profilePhonePattern,
        t("generated.admin.users.phoneNumberOnlyContainNumbers")
      ),
    location: z
      .string()
      .trim()
      .max(100, t("generated.admin.users.locationMaximum100Characters")),
    team: z.string(),
  })

export type EditUserFormValues = z.infer<
  ReturnType<typeof createEditUserFormSchema>
>

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
  const t = useTranslations()
  const editUserFormSchema = useMemo(() => createEditUserFormSchema(t), [t])

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
      onSubmit: editUserFormSchema,
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
        return t("generated.admin.users.chooseTeam")
      }

      return teamTranslations(selectedTeam.value)
    },
    [teamTranslations, teams, t]
  )

  return (
    <FormDialog
      description={t("generated.admin.users.changeUserProfileInformation")}
      formId={formId}
      isLoading={isSubmitting}
      onFormReset={() => form.reset(getFormValues())}
      onOpenChange={onOpenChange}
      open={open}
      title={t("generated.admin.users.editUser")}
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
                label={t("generated.admin.users.fullName")}
                layout="grid"
                placeholder={t("generated.shared.johnKowalski")}
              />
            )}
          </form.Field>

          <form.Field name="email">
            {(field) => (
              <FieldWithState
                autoComplete="off"
                field={field}
                label={t("generated.shared.eMail")}
                layout="grid"
                placeholder={t("generated.admin.users.johnKowalskiExampleCom")}
                type="email"
              />
            )}
          </form.Field>

          <form.Field name="phone">
            {(field) => (
              <FieldWithState
                autoComplete="off"
                field={field}
                label={t("generated.shared.phone")}
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
                label={t("generated.shared.location")}
                layout="grid"
                placeholder={t("generated.admin.users.gdanskPoland")}
              />
            )}
          </form.Field>

          <form.Field name="team">
            {(field) => (
              <FieldWithState
                field={field}
                label={t("generated.shared.team")}
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
                        placeholder={t("generated.admin.users.chooseTeam")}
                        render={
                          <span>
                            {field.state.value
                              ? getTeamLabel(field.state.value)
                              : t("generated.admin.users.chooseTeam")}
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
