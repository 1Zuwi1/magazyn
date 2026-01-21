"use client"

import { type AnyFieldApi, useForm } from "@tanstack/react-form"
import { useEffect } from "react"
import { FormDialog } from "@/components/admin-panel/components/form-dialog"
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export interface WarehouseFormData {
  id: string
  name: string
}

interface WarehouseDialogProps {
  currentRow?: WarehouseFormData
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: WarehouseFormData) => void
}

export function WarehouseDialog({
  currentRow,
  open,
  onOpenChange,
  onSubmit,
}: WarehouseDialogProps) {
  const isEdit = !!currentRow

  const form = useForm({
    defaultValues: isEdit ? { name: currentRow.name } : { name: "" },
    onSubmit: ({ value }) => {
      const id = isEdit ? currentRow.id : `warehouse-${Date.now()}`
      onSubmit({ id, name: value.name })
      form.reset()
      onOpenChange(false)
    },
  })

  useEffect(() => {
    if (currentRow) {
      form.reset({ name: currentRow.name })
    } else {
      form.reset({ name: "" })
    }
  }, [currentRow, form])

  const renderError = (field: AnyFieldApi) => {
    const error = field.state.meta.errors[0] as { message?: string } | undefined
    const message = typeof error === "string" ? error : error?.message

    if (!message) {
      return null
    }

    return <FieldError className="col-span-4 col-start-3">{message}</FieldError>
  }

  return (
    <FormDialog
      description={
        isEdit
          ? "Zmień informacje o magazynie"
          : "Wprowadź informacje o nowym magazynie."
      }
      formId="warehouse-form"
      onFormReset={() => form.reset()}
      onOpenChange={onOpenChange}
      open={open}
      submitLabel={isEdit ? "Zapisz zmiany" : "Dodaj magazyn"}
      title={isEdit ? "Edytuj magazyn" : "Dodaj magazyn"}
    >
      <form
        className="space-y-4 px-0.5 py-4"
        id="warehouse-form"
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
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="Magazyn A1"
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
