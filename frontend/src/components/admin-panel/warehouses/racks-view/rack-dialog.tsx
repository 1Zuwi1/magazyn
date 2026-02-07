"use client"

import { useForm, useStore } from "@tanstack/react-form"
import { useEffect, useMemo } from "react"
import z from "zod"
import { FormDialog } from "@/components/admin-panel/components/dialogs"
import { FieldWithState } from "@/components/helpers/field-state"
import { FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { Rack } from "@/lib/schemas"
import { cn } from "@/lib/utils"
import { DEFAULT_RACK } from "../../lib/constants"
import type { RackFormData } from "../csv/utils/types"

const RackDialogFormSchema = z
  .object({
    marker: z
      .string()
      .trim()
      .min(1, "Marker jest wymagany")
      .max(100, "Marker może mieć maksymalnie 100 znaków"),
    rows: z
      .number()
      .int("Liczba wierszy musi być liczbą całkowitą")
      .min(1, "Liczba wierszy musi być większa od 0"),
    cols: z
      .number()
      .int("Liczba kolumn musi być liczbą całkowitą")
      .min(1, "Liczba kolumn musi być większa od 0"),
    minTemp: z.number(),
    maxTemp: z.number(),
    maxWeight: z.number().nonnegative("Maksymalna waga nie może być ujemna"),
    maxItemWidth: z
      .number()
      .positive("Maksymalna szerokość asortymentu musi być większa od 0"),
    maxItemHeight: z
      .number()
      .positive("Maksymalna wysokość asortymentu musi być większa od 0"),
    maxItemDepth: z
      .number()
      .positive("Maksymalna głębokość asortymentu musi być większa od 0"),
    comment: z
      .string()
      .trim()
      .max(1000, "Komentarz może mieć maksymalnie 1000 znaków"),
  })
  .refine((value) => value.maxTemp >= value.minTemp, {
    message: "Maksymalna temperatura nie może być mniejsza od minimalnej",
    path: ["maxTemp"],
  })

const getNumericInputValue = (value: string): number => {
  const parsedValue = Number(value)
  return Number.isNaN(parsedValue) ? 0 : parsedValue
}

interface RackDialogProps {
  currentRow?: Rack
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: RackFormData) => Promise<void>
}

export function RackDialog({
  currentRow,
  open,
  onOpenChange,
  onSubmit,
}: RackDialogProps) {
  const isEdit = !!currentRow
  const formValues = useMemo(
    () => ({
      marker: currentRow?.marker ?? DEFAULT_RACK.marker,
      rows: currentRow?.sizeX ?? DEFAULT_RACK.rows,
      cols: currentRow?.sizeY ?? DEFAULT_RACK.cols,
      minTemp: currentRow?.minTemp ?? DEFAULT_RACK.minTemp,
      maxTemp: currentRow?.maxTemp ?? DEFAULT_RACK.maxTemp,
      maxWeight: currentRow?.maxWeight ?? DEFAULT_RACK.maxWeight,
      maxItemWidth: currentRow?.maxSizeX ?? DEFAULT_RACK.maxItemWidth,
      maxItemHeight: currentRow?.maxSizeY ?? DEFAULT_RACK.maxItemHeight,
      maxItemDepth: currentRow?.maxSizeZ ?? DEFAULT_RACK.maxItemDepth,
      comment: currentRow?.comment ?? DEFAULT_RACK.comment,
    }),
    [currentRow]
  )

  const form = useForm({
    defaultValues: formValues,
    onSubmit: async ({ value }) => {
      await onSubmit({
        marker: value.marker,
        rows: value.rows,
        cols: value.cols,
        minTemp: value.minTemp,
        maxTemp: value.maxTemp,
        maxWeight: value.maxWeight,
        maxItemWidth: value.maxItemWidth,
        maxItemHeight: value.maxItemHeight,
        maxItemDepth: value.maxItemDepth,
        comment: value.comment.length > 0 ? value.comment : undefined,
      })
      form.reset(formValues)
      onOpenChange(false)
    },
    validators: {
      onSubmit: RackDialogFormSchema,
    },
  })

  useEffect(() => {
    if (open) {
      form.reset(formValues)
    }
  }, [open, form, formValues])

  const isSubmitting = useStore(form.store, (state) => state.isSubmitting)

  return (
    <FormDialog
      description={
        isEdit ? "Zmień parametry regału" : "Wprowadź parametry nowego regału."
      }
      formId="rack-form"
      isLoading={isSubmitting}
      onFormReset={() => form.reset(formValues)}
      onOpenChange={onOpenChange}
      open={open}
      title={isEdit ? "Edytuj regał" : "Dodaj regał"}
    >
      <form
        className="space-y-4 px-0.5 py-4"
        id="rack-form"
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
      >
        <FieldGroup className="gap-4">
          <form.Field name="marker">
            {(field) => (
              <FieldWithState
                autoComplete="off"
                field={field}
                label="Marker"
                layout="grid"
                placeholder="A1-01"
              />
            )}
          </form.Field>

          <div className="grid grid-cols-6 items-center gap-x-4 gap-y-1">
            <span className="col-span-2 text-left font-medium text-sm">
              Wymiary (wiersze × kolumny)
            </span>
            <div className="col-span-4 flex gap-2">
              <form.Field name="rows">
                {(field) => (
                  <FieldWithState
                    field={field}
                    fieldClassName="w-full"
                    label="Wiersze"
                    labelClassName="sr-only"
                    renderInput={({ id, isInvalid }) => (
                      <Input
                        className={cn("w-full", {
                          "border-destructive": isInvalid,
                        })}
                        id={id}
                        min={1}
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) =>
                          field.handleChange(
                            getNumericInputValue(e.target.value)
                          )
                        }
                        placeholder="Wiersze"
                        type="number"
                        value={field.state.value}
                      />
                    )}
                  />
                )}
              </form.Field>
              <span className="flex items-center text-muted-foreground">×</span>
              <form.Field name="cols">
                {(field) => (
                  <FieldWithState
                    field={field}
                    fieldClassName="w-full"
                    label="Kolumny"
                    labelClassName="sr-only"
                    renderInput={({ id, isInvalid }) => (
                      <Input
                        className={cn("w-full", {
                          "border-destructive": isInvalid,
                        })}
                        id={id}
                        min={1}
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) =>
                          field.handleChange(
                            getNumericInputValue(e.target.value)
                          )
                        }
                        placeholder="Kolumny"
                        type="number"
                        value={field.state.value}
                      />
                    )}
                  />
                )}
              </form.Field>
            </div>
          </div>

          <div className="grid grid-cols-6 items-center gap-x-4 gap-y-1">
            <span className="col-span-2 text-left font-medium text-sm">
              Temperatura
            </span>
            <div className="col-span-4 flex gap-2">
              <form.Field name="minTemp">
                {(field) => (
                  <FieldWithState
                    field={field}
                    fieldClassName="w-full"
                    label="Minimalna temperatura"
                    labelClassName="sr-only"
                    renderInput={({ id, isInvalid }) => (
                      <Input
                        className={cn("w-full", {
                          "border-destructive": isInvalid,
                        })}
                        id={id}
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) =>
                          field.handleChange(
                            getNumericInputValue(e.target.value)
                          )
                        }
                        placeholder="Min °C"
                        type="number"
                        value={field.state.value}
                      />
                    )}
                  />
                )}
              </form.Field>
              <span className="flex items-center text-muted-foreground">–</span>
              <form.Field name="maxTemp">
                {(field) => (
                  <FieldWithState
                    field={field}
                    fieldClassName="w-full"
                    label="Maksymalna temperatura"
                    labelClassName="sr-only"
                    renderInput={({ id, isInvalid }) => (
                      <Input
                        className={cn("w-full", {
                          "border-destructive": isInvalid,
                        })}
                        id={id}
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) =>
                          field.handleChange(
                            getNumericInputValue(e.target.value)
                          )
                        }
                        placeholder="Max °C"
                        type="number"
                        value={field.state.value}
                      />
                    )}
                  />
                )}
              </form.Field>
            </div>
          </div>

          <form.Field name="maxWeight">
            {(field) => (
              <FieldWithState
                field={field}
                label="Max waga (kg)"
                layout="grid"
                renderInput={({ id, isInvalid }) => (
                  <Input
                    className={cn({
                      "border-destructive": isInvalid,
                    })}
                    id={id}
                    min={1}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) =>
                      field.handleChange(getNumericInputValue(e.target.value))
                    }
                    placeholder="1000"
                    type="number"
                    value={field.state.value}
                  />
                )}
              />
            )}
          </form.Field>

          <div className="grid grid-cols-6 items-center gap-x-4 gap-y-1">
            <span className="col-span-2 text-left font-medium text-sm">
              Wymiary asortymentu (mm)
            </span>
            <div className="col-span-4 flex gap-2">
              <form.Field name="maxItemWidth">
                {(field) => (
                  <FieldWithState
                    field={field}
                    fieldClassName="w-full"
                    label="Maksymalna szerokość"
                    labelClassName="sr-only"
                    renderInput={({ id, isInvalid }) => (
                      <Input
                        className={cn("w-full", {
                          "border-destructive": isInvalid,
                        })}
                        id={id}
                        min={1}
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) =>
                          field.handleChange(
                            getNumericInputValue(e.target.value)
                          )
                        }
                        placeholder="Szer."
                        type="number"
                        value={field.state.value}
                      />
                    )}
                  />
                )}
              </form.Field>
              <span className="flex items-center text-muted-foreground">×</span>
              <form.Field name="maxItemHeight">
                {(field) => (
                  <FieldWithState
                    field={field}
                    fieldClassName="w-full"
                    label="Maksymalna wysokość"
                    labelClassName="sr-only"
                    renderInput={({ id, isInvalid }) => (
                      <Input
                        className={cn("w-full", {
                          "border-destructive": isInvalid,
                        })}
                        id={id}
                        min={1}
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) =>
                          field.handleChange(
                            getNumericInputValue(e.target.value)
                          )
                        }
                        placeholder="Wys."
                        type="number"
                        value={field.state.value}
                      />
                    )}
                  />
                )}
              </form.Field>
              <span className="flex items-center text-muted-foreground">×</span>
              <form.Field name="maxItemDepth">
                {(field) => (
                  <FieldWithState
                    field={field}
                    fieldClassName="w-full"
                    label="Maksymalna głębokość"
                    labelClassName="sr-only"
                    renderInput={({ id, isInvalid }) => (
                      <Input
                        className={cn("w-full", {
                          "border-destructive": isInvalid,
                        })}
                        id={id}
                        min={1}
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) =>
                          field.handleChange(
                            getNumericInputValue(e.target.value)
                          )
                        }
                        placeholder="Gł."
                        type="number"
                        value={field.state.value}
                      />
                    )}
                  />
                )}
              </form.Field>
            </div>
          </div>

          <form.Field name="comment">
            {(field) => (
              <FieldWithState
                field={field}
                fieldClassName="items-start"
                label="Komentarz"
                labelClassName="pt-2 text-left"
                layout="grid"
                renderInput={({ id, isInvalid }) => (
                  <Textarea
                    className={cn("w-full resize-none", {
                      "border-destructive": isInvalid,
                    })}
                    id={id}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Opcjonalny komentarz..."
                    rows={3}
                    value={field.state.value ?? ""}
                  />
                )}
              />
            )}
          </form.Field>
        </FieldGroup>
      </form>
    </FormDialog>
  )
}
