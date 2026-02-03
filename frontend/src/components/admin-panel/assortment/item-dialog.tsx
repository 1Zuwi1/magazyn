"use client"

import { type AnyFieldApi, useForm } from "@tanstack/react-form"
import { FormDialog } from "@/components/admin-panel/components/dialogs"
import type { Item } from "@/components/dashboard/types"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

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
          ? "Zmień parametry przedmiotu"
          : "Wprowadź parametry nowego przedmiotu."
      }
      formId="item-form"
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
                    placeholder="Mleko 3,2%"
                    value={field.state.value}
                  />
                </FieldContent>
                {renderError(field)}
              </Field>
            )}
          </form.Field>

          <form.Field name="id">
            {(field) => (
              <Field className="grid grid-cols-6 items-center gap-x-4 gap-y-1">
                <FieldLabel
                  className="col-span-2 text-end"
                  htmlFor={field.name}
                >
                  ID / Kod
                </FieldLabel>
                <FieldContent className="col-span-4">
                  <Input
                    autoComplete="off"
                    className="w-full"
                    disabled={isEdit}
                    id={field.name}
                    name={field.name}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="5901234567890"
                    value={field.state.value}
                  />
                </FieldContent>
                {renderError(field)}
              </Field>
            )}
          </form.Field>

          <form.Field name="imageUrl">
            {(field) => (
              <Field className="grid grid-cols-6 items-center gap-x-4 gap-y-1">
                <FieldLabel
                  className="col-span-2 text-end"
                  htmlFor={field.name}
                >
                  URL zdjęcia
                </FieldLabel>
                <FieldContent className="col-span-4">
                  <Input
                    autoComplete="off"
                    className="w-full"
                    id={field.name}
                    name={field.name}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="/images/produkt.jpg"
                    value={field.state.value || ""}
                  />
                </FieldContent>
                {renderError(field)}
              </Field>
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
              <Field className="grid grid-cols-6 items-center gap-x-4 gap-y-1">
                <FieldLabel
                  className="col-span-2 text-end"
                  htmlFor={field.name}
                >
                  Waga (kg)
                </FieldLabel>
                <FieldContent className="col-span-4">
                  <Input
                    className="w-full"
                    id={field.name}
                    min={0}
                    name={field.name}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                    placeholder="1.0"
                    step="0.1"
                    type="number"
                    value={field.state.value}
                  />
                </FieldContent>
                {renderError(field)}
              </Field>
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
              <Field className="grid grid-cols-6 items-center gap-x-4 gap-y-1">
                <FieldLabel
                  className="col-span-2 text-end"
                  htmlFor={field.name}
                >
                  Ważność (dni)
                </FieldLabel>
                <FieldContent className="col-span-4">
                  <Input
                    className="w-full"
                    id={field.name}
                    min={1}
                    name={field.name}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                    placeholder="30"
                    type="number"
                    value={field.state.value}
                  />
                </FieldContent>
                {renderError(field)}
              </Field>
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
              <Field className="grid grid-cols-6 items-start gap-x-4 gap-y-1">
                <FieldLabel
                  className="col-span-2 pt-2 text-left"
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
                    value={field.state.value || ""}
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
