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
import type { IconComponent } from "@/components/dashboard/types"
import { FieldWithState } from "@/components/helpers/field-state"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldContent, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { translateMessage } from "@/i18n/translate-message"
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
      .max(100, translateMessage("generated.m0355")),
    rows: z
      .number()
      .int(translateMessage("generated.m0356"))
      .min(1, translateMessage("generated.m0357")),
    cols: z
      .number()
      .int(translateMessage("generated.m0358"))
      .min(1, translateMessage("generated.m0359")),
    minTemp: z.number(),
    maxTemp: z.number(),
    maxWeight: z.number().nonnegative(translateMessage("generated.m0360")),
    maxItemWidth: z.number().positive(translateMessage("generated.m0361")),
    maxItemHeight: z.number().positive(translateMessage("generated.m0362")),
    maxItemDepth: z.number().positive(translateMessage("generated.m0363")),
    acceptsDangerous: z.boolean(),
    comment: z.string().trim().max(1000, translateMessage("generated.m0364")),
  })
  .refine((value) => value.maxTemp >= value.minTemp, {
    message: translateMessage("generated.m0365"),
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
  icon: IconComponent
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
      toast.success(
        isEdit
          ? translateMessage("generated.m0366")
          : translateMessage("generated.m0367")
      )
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
        isEdit
          ? translateMessage("generated.m0368")
          : translateMessage("generated.m0369")
      }
      formId="rack-form"
      isLoading={isSubmitting}
      onFormReset={() => form.reset(formValues)}
      onOpenChange={onOpenChange}
      open={open}
      title={
        isEdit
          ? translateMessage("generated.m0370")
          : translateMessage("generated.m0371")
      }
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
          <SectionHeader
            icon={Tag01Icon}
            title={translateMessage("generated.m0921")}
          />
          <FieldGroup className="gap-4">
            <form.Field name="marker">
              {(field) => (
                <FieldWithState
                  autoComplete="off"
                  field={field}
                  label={translateMessage("generated.m0950")}
                  layout="grid"
                  placeholder={translateMessage("generated.m0951")}
                />
              )}
            </form.Field>
          </FieldGroup>
        </section>

        <Separator />

        <section className="space-y-3">
          <SectionHeader
            icon={ThermometerIcon}
            title={translateMessage("generated.m0923")}
          />
          <FieldGroup className="gap-4">
            <div className="grid grid-cols-6 items-center gap-x-4 gap-y-1">
              <span className="col-span-2 text-start font-medium text-sm">
                {translateMessage("generated.m0924")}
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
                      placeholder={translateMessage("generated.m0209")}
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
                      placeholder={translateMessage("generated.m0210")}
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
                    {translateMessage("generated.m0372")}
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
          <SectionHeader
            icon={RulerIcon}
            title={translateMessage("generated.m0213")}
          />
          <FieldGroup className="gap-4">
            <div className="grid grid-cols-6 items-center gap-x-4 gap-y-1">
              <span className="col-span-2 font-medium text-sm">
                {translateMessage("generated.m0373")}
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
                      placeholder={translateMessage("generated.m0952")}
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
                      placeholder={translateMessage("generated.m0953")}
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
                  label={translateMessage("generated.m0374")}
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
                {translateMessage("generated.m0375")}
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
                      placeholder={translateMessage("generated.m0926")}
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
                      placeholder={translateMessage("generated.m0927")}
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
                      placeholder={translateMessage("generated.m0376")}
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
          <SectionHeader
            icon={Tag01Icon}
            title={translateMessage("generated.m0929")}
          />
          <FieldGroup className="gap-4">
            <form.Field name="comment">
              {(field) => (
                <FieldWithState
                  field={field}
                  fieldClassName="items-start"
                  label={translateMessage("generated.m0930")}
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
                      placeholder={translateMessage("generated.m0216")}
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
