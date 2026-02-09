"use client"

import { useForm } from "@tanstack/react-form"
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
import type {
  AvailableWarehouse,
  BackupSchedule,
  ScheduleFrequency,
} from "../types"
import { FREQUENCY_CONFIG } from "../utils"

const ALL_WAREHOUSES_ID = "__all__"

const frequencyOptions = (
  Object.keys(FREQUENCY_CONFIG) as ScheduleFrequency[]
).map((value) => ({ label: FREQUENCY_CONFIG[value].label, value }))

interface ScheduleDialogProps {
  schedule: BackupSchedule | undefined
  availableWarehouses: AvailableWarehouse[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: {
    id?: string
    warehouseId: string | null
    warehouseName: string
    frequency: ScheduleFrequency
    customDays: number | null
    enabled: boolean
  }) => void
}

interface ScheduleSubmitPayload {
  id?: string
  warehouseId: string | null
  warehouseName: string
  frequency: ScheduleFrequency
  customDays: number | null
  enabled: boolean
}

const buildEditPayload = (
  schedule: BackupSchedule,
  frequency: ScheduleFrequency,
  customDays: number | null
): ScheduleSubmitPayload => ({
  id: schedule.id,
  warehouseId: schedule.warehouseId,
  warehouseName: schedule.warehouseName,
  frequency,
  customDays,
  enabled: schedule.enabled,
})

const resolveNewWarehouse = (
  warehouseId: string,
  availableWarehouses: AvailableWarehouse[]
): { id: string | null; name: string } | null => {
  const isAll = warehouseId === ALL_WAREHOUSES_ID
  if (isAll) {
    return { id: null, name: "Wszystkie magazyny" }
  }

  const warehouse = availableWarehouses.find((item) => item.id === warehouseId)
  if (!warehouse) {
    return null
  }

  return { id: warehouse.id, name: warehouse.name }
}

export function ScheduleDialog({
  schedule,
  availableWarehouses,
  open,
  onOpenChange,
  onSubmit,
}: ScheduleDialogProps) {
  const isEdit = !!schedule

  const getFormValues = useCallback(
    () => ({
      warehouseId: schedule?.warehouseId ?? ALL_WAREHOUSES_ID,
      frequency: schedule?.frequency ?? ("DAILY" as ScheduleFrequency),
      customDays: schedule?.customDays ?? 14,
    }),
    [schedule]
  )

  const form = useForm({
    defaultValues: getFormValues(),
    onSubmit: ({ value }) => {
      const customDays = value.frequency === "CUSTOM" ? value.customDays : null

      if (isEdit && schedule) {
        onSubmit(buildEditPayload(schedule, value.frequency, customDays))
        onOpenChange(false)
        return
      }

      const warehouse = resolveNewWarehouse(
        value.warehouseId,
        availableWarehouses
      )
      if (!warehouse) {
        return
      }

      onSubmit({
        warehouseId: warehouse.id,
        warehouseName: warehouse.name,
        frequency: value.frequency,
        customDays,
        enabled: true,
      })
      onOpenChange(false)
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
          ? `Zmień harmonogram kopii zapasowych dla magazynu "${schedule?.warehouseName}"`
          : "Skonfiguruj harmonogram automatycznych kopii zapasowych"
      }
      formId="schedule-form"
      onFormReset={() => form.reset(getFormValues())}
      onOpenChange={onOpenChange}
      open={open}
      title={isEdit ? "Edytuj harmonogram" : "Dodaj harmonogram"}
    >
      <form
        className="space-y-4 px-0.5"
        id="schedule-form"
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
      >
        <FieldGroup className="gap-4">
          {!isEdit && (
            <form.Field name="warehouseId">
              {(field) => (
                <FieldWithState
                  field={field}
                  label="Magazyn"
                  layout="grid"
                  renderInput={({ id, isInvalid }) => (
                    <Select
                      onValueChange={(value) => {
                        if (value) {
                          field.handleChange(value)
                        }
                      }}
                      value={String(field.state.value)}
                    >
                      <SelectTrigger
                        className={isInvalid ? "border-destructive" : ""}
                        id={id}
                      >
                        <SelectValue>
                          {field.state.value === ALL_WAREHOUSES_ID
                            ? "Wszystkie"
                            : (availableWarehouses.find(
                                (w) => w.id === field.state.value
                              )?.name ?? "Wybierz magazyn")}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={String(ALL_WAREHOUSES_ID)}>
                          Wszystkie
                        </SelectItem>
                        {availableWarehouses.map((warehouse) => (
                          <SelectItem
                            key={warehouse.id}
                            value={String(warehouse.id)}
                          >
                            {warehouse.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
            </form.Field>
          )}

          <form.Field name="frequency">
            {(field) => (
              <FieldWithState
                field={field}
                label="Częstotliwość"
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
                        {frequencyOptions.find(
                          (f) => f.value === field.state.value
                        )?.label ?? "Wybierz częstotliwość"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {frequencyOptions.map((freq) => (
                        <SelectItem key={freq.value} value={freq.value}>
                          {freq.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            )}
          </form.Field>

          <form.Subscribe selector={(state) => state.values.frequency}>
            {(frequency) =>
              frequency === "CUSTOM" ? (
                <form.Field name="customDays">
                  {(field) => (
                    <FieldWithState
                      field={field}
                      label="Interwał"
                      layout="grid"
                      renderInput={({ id, isInvalid }) => (
                        <div className="flex items-center gap-2">
                          <Input
                            className={isInvalid ? "border-destructive" : ""}
                            id={id}
                            min={1}
                            onChange={(e) =>
                              field.handleChange(Number(e.target.value))
                            }
                            type="number"
                            value={field.state.value}
                          />
                          <span className="shrink-0 text-muted-foreground text-sm">
                            (dni)
                          </span>
                        </div>
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
