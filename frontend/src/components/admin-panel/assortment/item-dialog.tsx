"use client"

import { useForm, useStore } from "@tanstack/react-form"
import { FormDialog } from "@/components/admin-panel/components/dialogs"
import type { Item } from "@/components/dashboard/types"
import { FieldWithState } from "@/components/helpers/field-state"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldContent, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

export interface ItemFormData {
  id: string
  name: string
  imageUrl?: string | null
  minTemp: number
  maxTemp: number
  weight: number
  width: number
  height: number
  depth: number
  comment?: string
  daysToExpiry: number
  isDangerous: boolean
}

const DEFAULT_ITEM: ItemFormData = {
  id: "",
  name: "",
  imageUrl: "",
  minTemp: 0,
  maxTemp: 25,
  weight: 0,
  width: 0,
  height: 0,
  depth: 0,
  comment: "",
  daysToExpiry: 30,
  isDangerous: false,
}

interface ItemDialogProps {
  currentRow?: Item
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: ItemFormData) => void
}

export function ItemDialog({
  currentRow,
  open,
  onOpenChange,
  onSubmit,
}: ItemDialogProps) {
  const isEdit = !!currentRow
  const formValues: ItemFormData = currentRow
    ? {
        id: currentRow.id,
        name: currentRow.name,
        imageUrl: currentRow.imageUrl,
        minTemp: currentRow.minTemp,
        maxTemp: currentRow.maxTemp,
        weight: currentRow.weight,
        width: currentRow.width,
        height: currentRow.height,
        depth: currentRow.depth,
        comment: currentRow.comment,
        daysToExpiry: currentRow.daysToExpiry,
        isDangerous: currentRow.isDangerous,
      }
    : DEFAULT_ITEM

  const form = useForm({
    defaultValues: formValues,
    onSubmit: ({ value }) => {
      onSubmit({
        id: value.id || crypto.randomUUID(),
        name: value.name,
        imageUrl: value.imageUrl || null,
        minTemp: value.minTemp,
        maxTemp: value.maxTemp,
        weight: value.weight || 0,
        width: value.width || 0,
        height: value.height || 0,
        depth: value.depth || 0,
        comment: value.comment || undefined,
        daysToExpiry: value.daysToExpiry || 30,
        isDangerous: value.isDangerous,
      })
      form.reset()
      onOpenChange(false)
    },
  })

  const isSubmitting = useStore(form.store, (state) => state.isSubmitting)

  return (
    <FormDialog
      description={
        isEdit
          ? "Zmień parametry przedmiotu"
          : "Wprowadź parametry nowego przedmiotu."
      }
      formId="item-form"
      isLoading={isSubmitting}
      onFormReset={() => form.reset()}
      onOpenChange={onOpenChange}
      open={open}
      title={isEdit ? "Edytuj przedmiot" : "Dodaj przedmiot"}
    >
      <form
        className="space-y-4 px-0.5 py-4"
        id="item-form"
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
                placeholder="Mleko 3,2%"
              />
            )}
          </form.Field>

          <form.Field name="id">
            {(field) => (
              <FieldWithState
                autoComplete="off"
                disabled={isEdit}
                field={field}
                label="ID / Kod"
                layout="grid"
                placeholder="5901234567890"
              />
            )}
          </form.Field>

          <form.Field name="imageUrl">
            {(field) => (
              <FieldWithState
                field={field}
                label="URL zdjęcia"
                layout="grid"
                renderInput={({ id, isInvalid }) => (
                  <Input
                    autoComplete="off"
                    className={isInvalid ? "border-destructive" : ""}
                    id={id}
                    name={field.name}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="/images/produkt.jpg"
                    value={field.state.value ?? ""}
                  />
                )}
              />
            )}
          </form.Field>

          <div className="grid grid-cols-6 items-center gap-x-4 gap-y-1">
            <span className="col-span-2 text-left font-medium text-sm">
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

          <form.Field name="weight">
            {(field) => (
              <FieldWithState
                field={field}
                label="Waga (kg)"
                layout="grid"
                renderInput={({ id, isInvalid }) => (
                  <Input
                    className={isInvalid ? "border-destructive" : ""}
                    id={id}
                    min={0}
                    name={field.name}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                    placeholder="1.0"
                    step="0.1"
                    type="number"
                    value={field.state.value}
                  />
                )}
              />
            )}
          </form.Field>

          <div className="grid grid-cols-6 items-center gap-x-4 gap-y-1">
            <span className="col-span-2 text-left font-medium text-sm">
              Wymiary (mm)
            </span>
            <div className="col-span-4 flex gap-2">
              <form.Field name="width">
                {(field) => (
                  <Input
                    className="w-full"
                    id={field.name}
                    min={0}
                    name={field.name}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                    placeholder="Szer."
                    type="number"
                    value={field.state.value}
                  />
                )}
              </form.Field>
              <span className="flex items-center text-muted-foreground">×</span>
              <form.Field name="height">
                {(field) => (
                  <Input
                    className="w-full"
                    id={field.name}
                    min={0}
                    name={field.name}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                    placeholder="Wys."
                    type="number"
                    value={field.state.value}
                  />
                )}
              </form.Field>
              <span className="flex items-center text-muted-foreground">×</span>
              <form.Field name="depth">
                {(field) => (
                  <Input
                    className="w-full"
                    id={field.name}
                    min={0}
                    name={field.name}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                    placeholder="Gł."
                    type="number"
                    value={field.state.value}
                  />
                )}
              </form.Field>
            </div>
          </div>

          <form.Field name="daysToExpiry">
            {(field) => (
              <FieldWithState
                field={field}
                label="Ważność (dni)"
                layout="grid"
                renderInput={({ id, isInvalid }) => (
                  <Input
                    className={isInvalid ? "border-destructive" : ""}
                    id={id}
                    min={1}
                    name={field.name}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                    placeholder="30"
                    type="number"
                    value={field.state.value}
                  />
                )}
              />
            )}
          </form.Field>

          <form.Field name="isDangerous">
            {(field) => (
              <Field className="grid grid-cols-6 items-center gap-x-4 gap-y-1">
                <span className="col-span-2" />
                <FieldContent className="col-span-4 flex items-center gap-2">
                  <Checkbox
                    checked={field.state.value}
                    id={field.name}
                    onCheckedChange={(checked) =>
                      field.handleChange(checked === true)
                    }
                  />
                  <Label className="cursor-pointer" htmlFor={field.name}>
                    Materiał niebezpieczny
                  </Label>
                </FieldContent>
              </Field>
            )}
          </form.Field>

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
