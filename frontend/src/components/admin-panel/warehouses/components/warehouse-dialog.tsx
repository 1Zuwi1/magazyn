"use client"

import { useForm } from "@tanstack/react-form"
import { useEffect } from "react"
import { FormDialog } from "@/components/admin-panel/components/dialogs"
import { FieldWithState } from "@/components/helpers/field-state"
import { FieldGroup } from "@/components/ui/field"

export interface WarehouseFormData {
  id: string
  name: string
}

interface WarehouseDialogProps {
  currentRow?: WarehouseFormData
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: WarehouseFormData) => void
  formId: string
}

export function WarehouseDialog({
  currentRow,
  open,
  onOpenChange,
  onSubmit,
  formId,
}: WarehouseDialogProps) {
  const isEdit = !!currentRow

  const form = useForm({
    defaultValues: isEdit ? { name: currentRow.name } : { name: "" },
    onSubmit: ({ value }) => {
      const id = isEdit ? currentRow.id : `warehouse-${Date.now()}`
      onSubmit({ id, name: value.name })
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

  return (
    <FormDialog
      description={
        isEdit
          ? "Zmień informacje o magazynie"
          : "Wprowadź informacje o nowym magazynie."
      }
      formId={formId}
      onFormReset={() => form.reset()}
      onOpenChange={onOpenChange}
      open={open}
      title={isEdit ? "Edytuj magazyn" : "Dodaj magazyn"}
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
          <form.Field name="name">
            {(field) => (
              <FieldWithState
                autoComplete="off"
                field={field}
                label="Nazwa"
                layout="grid"
                placeholder="Magazyn A1"
              />
            )}
          </form.Field>
        </FieldGroup>
      </form>
    </FormDialog>
  )
}
