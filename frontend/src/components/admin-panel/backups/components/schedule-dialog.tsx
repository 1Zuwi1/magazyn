"use client"

import { useForm } from "@tanstack/react-form"
import { useCallback, useEffect } from "react"
import { toast } from "sonner"
import { FormDialog } from "@/components/admin-panel/components/dialogs"
import { FieldWithState } from "@/components/helpers/field-state"
import { FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAppTranslations } from "@/i18n/use-translations"
import type {
  BackupSchedule,
  ScheduleFrequency,
  ScheduleSubmitPayload,
} from "../types"
import { FREQUENCY_OPTIONS } from "../utils"
import { WarehouseSelector } from "./warehouse-selector"

interface ScheduleDialogProps {
  schedule: BackupSchedule | undefined
  usedWarehouseIds: number[]
  isSubmitting?: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: ScheduleSubmitPayload) => void
}

const getFrequencyLabel = (
  frequency: ScheduleFrequency,
  t: ReturnType<typeof useAppTranslations>
) => {
  if (frequency === "DAILY") {
    return t("generated.admin.backups.frequencyDailySimple")
  }
  if (frequency === "WEEKLY") {
    return t("generated.admin.backups.frequencyWeeklySimple")
  }
  return t("generated.admin.backups.frequencyMonthlySimple")
}

const getWeekdayTranslationKey = (dayOfWeek: number): string => {
  if (dayOfWeek === 1) {
    return "generated.admin.backups.weekdayMonday"
  }
  if (dayOfWeek === 2) {
    return "generated.admin.backups.weekdayTuesday"
  }
  if (dayOfWeek === 3) {
    return "generated.admin.backups.weekdayWednesday"
  }
  if (dayOfWeek === 4) {
    return "generated.admin.backups.weekdayThursday"
  }
  if (dayOfWeek === 5) {
    return "generated.admin.backups.weekdayFriday"
  }
  if (dayOfWeek === 6) {
    return "generated.admin.backups.weekdaySaturday"
  }
  return "generated.admin.backups.weekdaySunday"
}

export function ScheduleDialog({
  schedule,
  usedWarehouseIds,
  isSubmitting = false,
  open,
  onOpenChange,
  onSubmit,
}: ScheduleDialogProps) {
  const t = useAppTranslations()
  const isEdit = !!schedule

  const getFormValues = useCallback(
    () => ({
      warehouseId: schedule?.warehouseId ?? null,
      warehouseName: schedule?.warehouseName ?? "",
      frequency: schedule?.frequency ?? ("DAILY" as ScheduleFrequency),
      backupHour: schedule?.backupHour ?? 2,
      dayOfWeek: schedule?.dayOfWeek ?? 1,
      dayOfMonth: schedule?.dayOfMonth ?? 1,
    }),
    [schedule]
  )

  const form = useForm({
    defaultValues: getFormValues(),
    onSubmit: ({ value }) => {
      const selectedWarehouseId = isEdit
        ? (schedule?.warehouseId ?? null)
        : value.warehouseId
      const selectedWarehouseName = isEdit
        ? (schedule?.warehouseName ?? "")
        : value.warehouseName.trim()

      if (selectedWarehouseId == null || selectedWarehouseName.length === 0) {
        toast.error(t("generated.admin.backups.selectedWarehouseNotFound"))
        return
      }

      onSubmit({
        warehouseId: selectedWarehouseId,
        warehouseName: selectedWarehouseName,
        frequency: value.frequency,
        backupHour: value.backupHour,
        dayOfWeek: value.frequency === "WEEKLY" ? value.dayOfWeek : null,
        dayOfMonth: value.frequency === "MONTHLY" ? value.dayOfMonth : null,
        enabled: schedule?.enabled ?? true,
      })
      onOpenChange(false)
    },
  })

  useEffect(() => {
    if (open) {
      form.reset(getFormValues())
    }
  }, [form, getFormValues, open])

  return (
    <FormDialog
      description={
        isEdit
          ? t("generated.admin.backups.editScheduleDescription", {
              value0: schedule?.warehouseName,
            })
          : t("generated.admin.backups.addScheduleDescription")
      }
      formId="schedule-form"
      onFormReset={() => form.reset(getFormValues())}
      onOpenChange={onOpenChange}
      open={open}
      title={
        isEdit
          ? t("generated.admin.backups.editScheduleTitle")
          : t("generated.admin.backups.addScheduleTitle")
      }
    >
      <form
        className="space-y-4 px-0.5"
        id="schedule-form"
        onSubmit={(event) => {
          event.preventDefault()
          if (isSubmitting) {
            return
          }
          form.handleSubmit()
        }}
      >
        <FieldGroup className="gap-4">
          {!isEdit && (
            <form.Subscribe
              selector={(state) => ({
                warehouseId: state.values.warehouseId,
              })}
            >
              {(warehouseState) => (
                <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[140px_1fr]">
                  <span className="font-medium text-sm">
                    {t("generated.shared.warehouse")}
                  </span>
                  <WarehouseSelector
                    excludedWarehouseIds={usedWarehouseIds}
                    onValueChange={(warehouseId, warehouseName) => {
                      form.setFieldValue("warehouseId", warehouseId)
                      form.setFieldValue("warehouseName", warehouseName ?? "")
                    }}
                    placeholder={t("generated.shared.searchWarehouse")}
                    value={warehouseState.warehouseId}
                  />
                </div>
              )}
            </form.Subscribe>
          )}

          <form.Field name="frequency">
            {(field) => (
              <FieldWithState
                field={field}
                label={t("generated.admin.backups.frequencyLabel")}
                layout="grid"
                renderInput={({ id, isInvalid }) => (
                  <Select
                    onValueChange={(value) => {
                      if (value) {
                        field.handleChange(value as ScheduleFrequency)
                      }
                    }}
                    value={field.state.value}
                  >
                    <SelectTrigger
                      className={isInvalid ? "border-destructive" : ""}
                      id={id}
                    >
                      <SelectValue>
                        {getFrequencyLabel(field.state.value, t)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCY_OPTIONS.map((frequency) => (
                        <SelectItem key={frequency} value={frequency}>
                          {getFrequencyLabel(frequency, t)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            )}
          </form.Field>

          <form.Field
            name="backupHour"
            validators={{
              onChange: ({ value }) => {
                if (!Number.isInteger(value)) {
                  return t("generated.admin.backups.hourMustBeInteger")
                }
                if (value < 0 || value > 23) {
                  return t("generated.admin.backups.hourRangeError")
                }
                return undefined
              },
            }}
          >
            {(field) => (
              <FieldWithState
                field={field}
                label={t("generated.admin.backups.hourLabel")}
                layout="grid"
                renderInput={({ id, isInvalid }) => (
                  <Input
                    className={isInvalid ? "border-destructive" : ""}
                    id={id}
                    max={23}
                    min={0}
                    onChange={(event) =>
                      field.handleChange(Number(event.target.value))
                    }
                    type="number"
                    value={field.state.value}
                  />
                )}
              />
            )}
          </form.Field>

          <form.Subscribe selector={(state) => state.values.frequency}>
            {(frequency) =>
              frequency === "WEEKLY" ? (
                <form.Field name="dayOfWeek">
                  {(field) => (
                    <FieldWithState
                      field={field}
                      label={t("generated.admin.backups.dayOfWeekLabel")}
                      layout="grid"
                      renderInput={({ id, isInvalid }) => (
                        <Select
                          onValueChange={(value) => {
                            if (value) {
                              field.handleChange(Number(value))
                            }
                          }}
                          value={String(field.state.value)}
                        >
                          <SelectTrigger
                            className={isInvalid ? "border-destructive" : ""}
                            id={id}
                          >
                            <SelectValue>
                              {t(
                                getWeekdayTranslationKey(
                                  Number(field.state.value)
                                )
                              )}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">
                              {t("generated.admin.backups.weekdayMonday")}
                            </SelectItem>
                            <SelectItem value="2">
                              {t("generated.admin.backups.weekdayTuesday")}
                            </SelectItem>
                            <SelectItem value="3">
                              {t("generated.admin.backups.weekdayWednesday")}
                            </SelectItem>
                            <SelectItem value="4">
                              {t("generated.admin.backups.weekdayThursday")}
                            </SelectItem>
                            <SelectItem value="5">
                              {t("generated.admin.backups.weekdayFriday")}
                            </SelectItem>
                            <SelectItem value="6">
                              {t("generated.admin.backups.weekdaySaturday")}
                            </SelectItem>
                            <SelectItem value="7">
                              {t("generated.admin.backups.weekdaySunday")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  )}
                </form.Field>
              ) : null
            }
          </form.Subscribe>

          <form.Subscribe selector={(state) => state.values.frequency}>
            {(frequency) =>
              frequency === "MONTHLY" ? (
                <form.Field
                  name="dayOfMonth"
                  validators={{
                    onChange: ({ value }) => {
                      if (!Number.isInteger(value)) {
                        return t("generated.admin.backups.dayMustBeInteger")
                      }
                      if (value < 1 || value > 31) {
                        return t("generated.admin.backups.dayRangeError")
                      }
                      return undefined
                    },
                  }}
                >
                  {(field) => (
                    <FieldWithState
                      field={field}
                      label={t("generated.admin.backups.dayOfMonthLabel")}
                      layout="grid"
                      renderInput={({ id, isInvalid }) => (
                        <Input
                          className={isInvalid ? "border-destructive" : ""}
                          id={id}
                          max={31}
                          min={1}
                          onChange={(event) =>
                            field.handleChange(Number(event.target.value))
                          }
                          type="number"
                          value={field.state.value}
                        />
                      )}
                    />
                  )}
                </form.Field>
              ) : null
            }
          </form.Subscribe>
        </FieldGroup>
      </form>
    </FormDialog>
  )
}
