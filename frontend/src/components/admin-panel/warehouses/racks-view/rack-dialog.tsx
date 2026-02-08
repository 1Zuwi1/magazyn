"use client"

import {
  RulerIcon,
  Tag01Icon,
  ThermometerIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useForm, useStore } from "@tanstack/react-form"
import { useEffect, useMemo } from "react"
import { toast } from "sonner"
import z from "zod"
import { FormDialog } from "@/components/admin-panel/components/dialogs"
import { FieldWithState } from "@/components/helpers/field-state"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldContent, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
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
    acceptsDangerous: z.boolean(),
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

function SectionHeader({
  icon,
  title,
}: {
  icon: typeof Tag01Icon
  title: string
}) {
  return (
    <div className="flex items-center gap-2 pt-1 pb-1">
      <HugeiconsIcon className="size-3.5 text-muted-foreground" icon={icon} />
      <span className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
        {title}
      </span>
    </div>
  )
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
      acceptsDangerous:
        currentRow?.acceptsDangerous ?? DEFAULT_RACK.acceptsDangerous,
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
        acceptsDangerous: value.acceptsDangerous,
        comment: value.comment.length > 0 ? value.comment : undefined,
      })
      toast.success(isEdit ? "Regał zaktualizowany" : "Regał dodany")
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
        className="space-y-5 px-0.5 py-4"
        id="rack-form"
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
      >
        <section className="space-y-3">
          <SectionHeader icon={Tag01Icon} title="Identyfikacja" />
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
          </FieldGroup>
        </section>

        <Separator />

        <section className="space-y-3">
          <SectionHeader icon={ThermometerIcon} title="Przechowywanie" />
          <FieldGroup className="gap-4">
            <div className="grid grid-cols-6 items-center gap-x-4 gap-y-1">
              <span className="col-span-2 text-start font-medium text-sm">
                Temperatura
              </span>
              <div className="col-span-4 flex items-center gap-2">
                <form.Field name="minTemp">
                  {(field) => (
                    <Input
                      className="w-full"
                      id={field.name}
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) =>
                        field.handleChange(getNumericInputValue(e.target.value))
                      }
                      placeholder="Min °C"
                      type="number"
                      value={field.state.value}
                    />
                  )}
                </form.Field>
                <span className="shrink-0 text-muted-foreground">–</span>
                <form.Field name="maxTemp">
                  {(field) => (
                    <Input
                      className="w-full"
                      id={field.name}
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) =>
                        field.handleChange(getNumericInputValue(e.target.value))
                      }
                      placeholder="Max °C"
                      type="number"
                      value={field.state.value}
                    />
                  )}
                </form.Field>
              </div>
            </div>

            <form.Field name="acceptsDangerous">
              {(field) => (
                <Field className="grid grid-cols-6 items-center gap-x-4 gap-y-1">
                  <Label
                    className="col-span-2 cursor-pointer text-nowrap text-end"
                    htmlFor={field.name}
                  >
                    Akceptuje niebezpieczne
                  </Label>
                  <FieldContent className="col-span-4 flex items-center">
                    <Checkbox
                      checked={field.state.value}
                      id={field.name}
                      onCheckedChange={(checked) =>
                        field.handleChange(checked === true)
                      }
                    />
                  </FieldContent>
                </Field>
              )}
            </form.Field>
          </FieldGroup>
        </section>

        <Separator />

        <section className="space-y-3">
          <SectionHeader icon={RulerIcon} title="Wymiary fizyczne" />
          <FieldGroup className="gap-4">
            <div className="grid grid-cols-6 items-center gap-x-4 gap-y-1">
              <span className="col-span-2 font-medium text-sm">
                Wymiary (wiersze × kolumny)
              </span>
              <div className="col-span-4 flex items-center gap-2">
                <form.Field name="rows">
                  {(field) => (
                    <Input
                      className="w-full"
                      id={field.name}
                      min={1}
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) =>
                        field.handleChange(getNumericInputValue(e.target.value))
                      }
                      placeholder="Wiersze"
                      type="number"
                      value={field.state.value}
                    />
                  )}
                </form.Field>
                <span className="shrink-0 text-muted-foreground">×</span>
                <form.Field name="cols">
                  {(field) => (
                    <Input
                      className="w-full"
                      id={field.name}
                      min={1}
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) =>
                        field.handleChange(getNumericInputValue(e.target.value))
                      }
                      placeholder="Kolumny"
                      type="number"
                      value={field.state.value}
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
              <span className="col-span-2 font-medium text-sm">
                Wymiary asortymentu (mm)
              </span>
              <div className="col-span-4 flex items-center gap-2">
                <form.Field name="maxItemWidth">
                  {(field) => (
                    <Input
                      className="w-full"
                      id={field.name}
                      min={1}
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) =>
                        field.handleChange(getNumericInputValue(e.target.value))
                      }
                      placeholder="Szer."
                      type="number"
                      value={field.state.value}
                    />
                  )}
                </form.Field>
                <span className="shrink-0 text-muted-foreground">×</span>
                <form.Field name="maxItemHeight">
                  {(field) => (
                    <Input
                      className="w-full"
                      id={field.name}
                      min={1}
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) =>
                        field.handleChange(getNumericInputValue(e.target.value))
                      }
                      placeholder="Wys."
                      type="number"
                      value={field.state.value}
                    />
                  )}
                </form.Field>
                <span className="shrink-0 text-muted-foreground">×</span>
                <form.Field name="maxItemDepth">
                  {(field) => (
                    <Input
                      className="w-full"
                      id={field.name}
                      min={1}
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) =>
                        field.handleChange(getNumericInputValue(e.target.value))
                      }
                      placeholder="Gł."
                      type="number"
                      value={field.state.value}
                    />
                  )}
                </form.Field>
              </div>
            </div>
          </FieldGroup>
        </section>

        <Separator />

        <section className="space-y-3">
          <SectionHeader icon={Tag01Icon} title="Dodatkowe" />
          <FieldGroup className="gap-4">
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
        </section>
      </form>
    </FormDialog>
  )
}
