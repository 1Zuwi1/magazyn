import type { AnyFieldApi } from "@tanstack/react-form"
import type { ZodError } from "zod"
import { Field, FieldLabel } from "../ui/field"
import { Input } from "../ui/input"

export function FieldState({ field }: { field: AnyFieldApi }) {
  const error = field.state.meta.errors[0] as ZodError | string | undefined

  return error ? (
    <p className="mt-1 text-wrap text-destructive text-xs">
      {typeof error === "string" ? error : error.message}
    </p>
  ) : null
}

export function FieldWithState({
  field,
  label,
  ...props
}: {
  field: AnyFieldApi
  label: string
} & React.ComponentProps<"input">) {
  const isInvalid = field.state.meta.errors.length > 0
  return (
    <Field>
      <FieldLabel htmlFor={props.id ?? field.name}>{label}</FieldLabel>
      <Input
        className={isInvalid ? "border-destructive" : ""}
        id={field.name}
        name={field.name}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        value={field.state.value}
        {...props}
      />
      <FieldState field={field} />
    </Field>
  )
}
