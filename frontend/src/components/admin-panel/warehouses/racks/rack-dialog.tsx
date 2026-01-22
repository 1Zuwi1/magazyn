"use client"

import { type AnyFieldApi, useForm } from "@tanstack/react-form"
import { useEffect } from "react"
import { FormDialog } from "@/components/admin-panel/components/form-dialog"
import type { Rack } from "@/components/dashboard/types"
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export interface RackFormData {
  id: string
  symbol?: string
  name: string
  rows: number
  cols: number
  minTemp: number
  maxTemp: number
  maxWeight: number
  comment?: string
}

interface RackDialogProps {
  currentRow?: Rack
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: RackFormData) => void
}

const getDefaultValues = (rack?: Rack): Omit<RackFormData, "id"> => ({
  symbol: rack?.symbol ?? "",
  name: rack?.name ?? "",
  rows: rack?.rows ?? 1,
  cols: rack?.cols ?? 1,
  minTemp: rack?.minTemp ?? 0,
  maxTemp: rack?.maxTemp ?? 25,
  maxWeight: rack?.maxWeight ?? 100,
  comment: rack?.comment ?? "",
})

export function RackDialog({
  currentRow,
  open,
  onOpenChange,
  onSubmit,
}: RackDialogProps) {
  const isEdit = !!currentRow

  const form = useForm({
    defaultValues: getDefaultValues(currentRow),
    onSubmit: ({ value }) => {
      const id = isEdit ? currentRow.id : `rack-${Date.now()}`
      onSubmit({
        id,
        symbol: value.symbol || undefined,
        name: value.name,
        rows: value.rows,
        cols: value.cols,
        minTemp: value.minTemp,
        maxTemp: value.maxTemp,
        maxWeight: value.maxWeight,
        comment: value.comment || undefined,
      })
      form.reset()
      onOpenChange(false)
    },
  })

  useEffect(() => {
    form.reset(getDefaultValues(currentRow))
  }, [currentRow, form])

  const renderError = (field: AnyFieldApi) => {
    const error = field.state.meta.errors[0] as { message?: string } | undefined
    const message = typeof error === "string" ? error : error?.message

    if (!message) {
      return null
    }

    return <FieldError className="col-span-4 col-start-3">{message}</FieldError>
  }

  const formId = "rack-form"

  return (
    <FormDialog
      description={
        isEdit ? "Zmień parametry regału" : "Wprowadź parametry nowego regału."
      }
      formId={formId}
      onFormReset={() => form.reset()}
      onOpenChange={onOpenChange}
      open={open}
      title={isEdit ? "Edytuj regał" : "Dodaj regał"}
    >
      <form
        className="space-y-4 px-0.5 py-4"
        id={formId}
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
      >
        <FieldGroup className="gap-4">
          <form.Field name="name">
            {(field) => (
              <Field className="grid grid-cols-6 items-center gap-x-4 gap-y-1">
                <FieldLabel
                  className="col-span-2 text-end"
                  htmlFor={field.name}
                >
                  Nazwa
                </FieldLabel>
                <FieldContent className="col-span-4">
                  <Input
                    autoComplete="off"
                    className="w-full"
                    id={field.name}
                    name={field.name}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Regał A1"
                    value={field.state.value}
                  />
                </FieldContent>
                {renderError(field)}
              </Field>
            )}
          </form.Field>

          <form.Field name="symbol">
            {(field) => (
              <Field className="grid grid-cols-6 items-center gap-x-4 gap-y-1">
                <FieldLabel
                  className="col-span-2 text-end"
                  htmlFor={field.name}
                >
                  Symbol
                </FieldLabel>
                <FieldContent className="col-span-4">
                  <Input
                    autoComplete="off"
                    className="w-full"
                    id={field.name}
                    name={field.name}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="A1-01"
                    value={field.state.value}
                  />
                </FieldContent>
                {renderError(field)}
              </Field>
            )}
          </form.Field>

          <div className="grid grid-cols-6 items-center gap-x-4 gap-y-1">
            <span className="col-span-2 text-end font-medium text-sm">
              Wymiary
            </span>
            <div className="col-span-4 flex gap-2">
              <form.Field name="rows">
                {(field) => (
                  <Input
                    className="w-full"
                    id={field.name}
                    min={1}
                    name={field.name}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                    placeholder="Wiersze"
                    type="number"
                    value={field.state.value}
                  />
                )}
              </form.Field>
              <span className="flex items-center text-muted-foreground">×</span>
              <form.Field name="cols">
                {(field) => (
                  <Input
                    className="w-full"
                    id={field.name}
                    min={1}
                    name={field.name}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                    placeholder="Kolumny"
                    type="number"
                    value={field.state.value}
                  />
                )}
              </form.Field>
            </div>
          </div>

          <div className="grid grid-cols-6 items-center gap-x-4 gap-y-1">
            <span className="col-span-2 text-end font-medium text-sm">
              Temperatura
            </span>
            <div className="col-span-4 flex gap-2">
              <form.Field name="minTemp">
                {(field) => (
                  <Input
                    className="w-full"
                    id={field.name}
                    name={field.name}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                    placeholder="Min °C"
                    type="number"
                    value={field.state.value}
                  />
                )}
              </form.Field>
              <span className="flex items-center text-muted-foreground">–</span>
              <form.Field name="maxTemp">
                {(field) => (
                  <Input
                    className="w-full"
                    id={field.name}
                    name={field.name}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                    placeholder="Max °C"
                    type="number"
                    value={field.state.value}
                  />
                )}
              </form.Field>
            </div>
          </div>

          <form.Field name="maxWeight">
            {(field) => (
              <Field className="grid grid-cols-6 items-center gap-x-4 gap-y-1">
                <FieldLabel
                  className="col-span-2 text-end"
                  htmlFor={field.name}
                >
                  Max waga (kg)
                </FieldLabel>
                <FieldContent className="col-span-4">
                  <Input
                    className="w-full"
                    id={field.name}
                    min={1}
                    name={field.name}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                    placeholder="1000"
                    type="number"
                    value={field.state.value}
                  />
                </FieldContent>
                {renderError(field)}
              </Field>
            )}
          </form.Field>

          <form.Field name="comment">
            {(field) => (
              <Field className="grid grid-cols-6 items-start gap-x-4 gap-y-1">
                <FieldLabel
                  className="col-span-2 pt-2 text-end"
                  htmlFor={field.name}
                >
                  Komentarz
                </FieldLabel>
                <FieldContent className="col-span-4">
                  <Textarea
                    className="w-full resize-none"
                    id={field.name}
                    name={field.name}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Opcjonalny komentarz..."
                    rows={3}
                    value={field.state.value}
                  />
                </FieldContent>
                {renderError(field)}
              </Field>
            )}
          </form.Field>
        </FieldGroup>
      </form>
    </FormDialog>
  )
}
