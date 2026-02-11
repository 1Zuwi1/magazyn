"use client"

import {
  Calendar03Icon,
  Clock01Icon,
  WarehouseIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useForm } from "@tanstack/react-form"
import { useTranslations } from "next-intl"
import { useCallback, useEffect } from "react"
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
import type { AppTranslate } from "@/i18n/use-translations"
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
  hasGlobalSchedule: boolean
}

const getFrequencyLabel = (frequency: ScheduleFrequency, t: AppTranslate) => {
  if (frequency === "DAILY") {
    return t("generated.admin.backups.frequencyDailySimple")
  }
  if (frequency === "WEEKLY") {
    return t("generated.admin.backups.frequencyWeeklySimple")
  }
  return t("generated.admin.backups.frequencyMonthlySimple")
}

const getWeekdayTranslationKey = (dayOfWeek: number) => {
  if (dayOfWeek === 1) {
    return "generated.admin.backups.weekdayMonday" as const
  }
  if (dayOfWeek === 2) {
    return "generated.admin.backups.weekdayTuesday" as const
  }
  if (dayOfWeek === 3) {
    return "generated.admin.backups.weekdayWednesday" as const
  }
  if (dayOfWeek === 4) {
    return "generated.admin.backups.weekdayThursday" as const
  }
  if (dayOfWeek === 5) {
    return "generated.admin.backups.weekdayFriday" as const
  }
  if (dayOfWeek === 6) {
    return "generated.admin.backups.weekdaySaturday" as const
  }
  return "generated.admin.backups.weekdaySunday" as const
}

function SectionHeader({
  icon,
  label,
}: {
  icon: typeof Calendar03Icon
  label: string
}) {
  return (
    <div className="flex items-center gap-2 pb-1">
      <div className="flex size-6 items-center justify-center rounded-md bg-primary/10">
        <HugeiconsIcon className="size-3.5 text-primary" icon={icon} />
      </div>
      <span className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
        {label}
      </span>
      <div className="ml-1 h-px flex-1 bg-border" />
    </div>
  )
}

export function ScheduleDialog({
  schedule,
  usedWarehouseIds,
  isSubmitting = false,
  open,
  onOpenChange,
  onSubmit,
  hasGlobalSchedule,
}: ScheduleDialogProps) {
  const t = useTranslations()
  const isEdit = !!schedule

  const getFormValues = useCallback(
    () => ({
      warehouseId: schedule?.warehouseId ?? null,
      warehouseName:
        schedule?.warehouseName ?? t("generated.admin.backups.allWarehouses"),
      frequency: schedule?.frequency ?? ("DAILY" as ScheduleFrequency),
      backupHour: schedule?.backupHour ?? 2,
      dayOfWeek: schedule?.dayOfWeek ?? 1,
      dayOfMonth: schedule?.dayOfMonth ?? 1,
    }),
    [schedule, t]
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
              value0:
                schedule?.warehouseName === "GLOBAL"
                  ? t("generated.admin.backups.allWarehouses")
                  : (schedule?.warehouseName ?? ""),
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
        className="space-y-5 px-0.5"
        id="schedule-form"
        onSubmit={(event) => {
          event.preventDefault()
          if (isSubmitting) {
            return
          }
          form.handleSubmit()
        }}
      >
        {!isEdit && (
          <div className="space-y-3">
            <SectionHeader
              icon={WarehouseIcon}
              label={t("generated.shared.warehouse")}
            />
            <form.Subscribe
              selector={(state) => ({
                warehouseId: state.values.warehouseId,
              })}
            >
              {(warehouseState) => (
                <div className="rounded-lg border border-dashed bg-muted/20 p-3">
                  <WarehouseSelector
                    excludedWarehouseIds={usedWarehouseIds}
                    includeAllOption={!hasGlobalSchedule}
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
          </div>
        )}

        <div className="space-y-3">
          <SectionHeader
            icon={Calendar03Icon}
            label={t("generated.admin.backups.frequencyLabel")}
          />

          <div className="rounded-lg border border-dashed bg-muted/20 p-4">
            <FieldGroup className="gap-4">
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
                      <div className="space-y-1.5">
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
                        <div className="flex items-center gap-1 text-muted-foreground/70 text-xs">
                          <HugeiconsIcon
                            className="size-3"
                            icon={Clock01Icon}
                          />
                          <span>0–23 (UTC)</span>
                        </div>
                      </div>
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
                                className={
                                  isInvalid ? "border-destructive" : ""
                                }
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
                                  {t(
                                    "generated.admin.backups.weekdayWednesday"
                                  )}
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
          </div>
        </div>
      </form>
    </FormDialog>
  )
}
