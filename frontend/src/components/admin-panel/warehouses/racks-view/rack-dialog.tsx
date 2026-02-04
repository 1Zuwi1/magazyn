"use client"

import { useForm } from "@tanstack/react-form"
import { FormDialog } from "@/components/admin-panel/components/dialogs"
import type { Rack } from "@/components/dashboard/types"
import { FieldWithState } from "@/components/helpers/field-state"
import { FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { DEFAULT_RACK } from "../../lib/constants"
import type { RackFormData } from "../csv/utils/types"

interface RackDialogProps {
  currentRow?: Rack
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: RackFormData) => void
}

export function RackDialog({
  currentRow,
  open,
  onOpenChange,
  onSubmit,
}: RackDialogProps) {
  const isEdit = !!currentRow
  const formValues = { ...DEFAULT_RACK, ...currentRow }

  const form = useForm({
    defaultValues: formValues,
    onSubmit: ({ value }) => {
      onSubmit({
        symbol: value.symbol || undefined,
        name: value.name,
        rows: value.rows || 1,
        cols: value.cols || 1,
        minTemp: value.minTemp || 0,
        maxTemp: value.maxTemp || 0,
        maxWeight: value.maxWeight || 0,
        maxItemWidth: value.maxItemWidth || DEFAULT_RACK.maxItemWidth,
        maxItemHeight: value.maxItemHeight || DEFAULT_RACK.maxItemHeight,
        maxItemDepth: value.maxItemDepth || DEFAULT_RACK.maxItemDepth,
        comment: value.comment || undefined,
      })
      form.reset()
      onOpenChange(false)
    },
  })

  return (
    <FormDialog
      description={
        isEdit ? "Zmień parametry regału" : "Wprowadź parametry nowego regału."
      }
      formId="rack-form"
      onFormReset={() => form.reset()}
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
          <form.Field name="name">
            {(field) => (
              <FieldWithState
                autoComplete="off"
                field={field}
                label="Nazwa"
                layout="grid"
                placeholder="Regał A1"
              />
            )}
          </form.Field>

          <form.Field name="symbol">
            {(field) => (
              <FieldWithState
                autoComplete="off"
                field={field}
                label="Symbol"
                layout="grid"
                placeholder="A1-01"
              />
            )}
          </form.Field>

          <div className="grid grid-cols-6 items-center gap-x-4 gap-y-1">
            <span className="col-span-2 text-left font-medium text-sm">
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

          <form.Field name="maxWeight">
            {(field) => (
              <FieldWithState
                field={field}
                label="Max waga (kg)"
                layout="grid"
                renderInput={({ id, isInvalid }) => (
                  <Input
                    className={isInvalid ? "border-destructive" : ""}
                    id={id}
                    min={1}
                    name={field.name}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
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
                  <Input
                    className="w-full"
                    id={field.name}
                    min={1}
                    name={field.name}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                    placeholder="Szer."
                    type="number"
                    value={field.state.value}
                  />
                )}
              </form.Field>
              <span className="flex items-center text-muted-foreground">×</span>
              <form.Field name="maxItemHeight">
                {(field) => (
                  <Input
                    className="w-full"
                    id={field.name}
                    min={1}
                    name={field.name}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                    placeholder="Wys."
                    type="number"
                    value={field.state.value}
                  />
                )}
              </form.Field>
              <span className="flex items-center text-muted-foreground">×</span>
              <form.Field name="maxItemDepth">
                {(field) => (
                  <Input
                    className="w-full"
                    id={field.name}
                    min={1}
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
