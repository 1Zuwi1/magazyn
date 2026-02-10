"use client"

import { useForm, useStore } from "@tanstack/react-form"

import { useEffect } from "react"
import { FormDialog } from "@/components/admin-panel/components/dialogs"
import { FieldWithState } from "@/components/helpers/field-state"
import { FieldGroup } from "@/components/ui/field"
import { useAppTranslations } from "@/i18n/use-translations"
export interface WarehouseFormData {
  id: string
  name: string
}

interface WarehouseDialogProps {
  currentRow?: WarehouseFormData
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: WarehouseFormData) => Promise<void>
  formId: string
}

export function WarehouseDialog({
  currentRow,
  open,
  onOpenChange,
  onSubmit,
  formId,
}: WarehouseDialogProps) {
  const t = useAppTranslations()

  const isEdit = !!currentRow

  const form = useForm({
    defaultValues: isEdit ? { name: currentRow.name } : { name: "" },
    onSubmit: async ({ value }) => {
      const id = isEdit ? currentRow.id : `warehouse-${Date.now()}`
      await onSubmit({ id, name: value.name })
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

  const isSubmitting = useStore(form.store, (state) => state.isSubmitting)

  return (
    <FormDialog
      description={
        isEdit
          ? t("generated.admin.warehouses.changeStockInformation")
          : t("generated.admin.warehouses.enterInformationAboutNewWarehouse")
      }
      formId={formId}
      isLoading={isSubmitting}
      onFormReset={() => form.reset()}
      onOpenChange={onOpenChange}
      open={open}
      title={
        isEdit
          ? t("generated.admin.warehouses.editWarehouse")
          : t("generated.admin.warehouses.addWarehouse2")
      }
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
                label={t("generated.shared.name")}
                layout="grid"
                placeholder={t("generated.admin.warehouses.a1Warehouse")}
              />
            )}
          </form.Field>
        </FieldGroup>
      </form>
    </FormDialog>
  )
}
