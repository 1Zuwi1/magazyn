import type { Mail01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type { AnyFieldApi } from "@tanstack/react-form"
import type { ZodError } from "zod"
import { cn } from "@/lib/utils"
import { Field, FieldLabel } from "../ui/field"
import { Input } from "../ui/input"

export function FieldState({ field }: { field: AnyFieldApi }) {
  const error = field.state.meta.errors[0] as ZodError | string | undefined

  return error ? (
    <p className="mt-1 text-wrap text-destructive text-xs" role="alert">
      {typeof error === "string" ? error : error.message}
    </p>
  ) : null
}

const SPELLCHECK_DISABLED_INPUT_TYPES = [
  "password",
  "email",
  "number",
  "tel",
  "url",
]

export function FieldWithState({
  field,
  label,
  icon,
  additionalNode,
  labelClassName,
  renderInput,
  ...props
}: {
  field: AnyFieldApi
  label: string
  icon?: typeof Mail01Icon
  additionalNode?: React.ReactNode
  labelClassName?: string
  renderInput?: (args: { id: string; isInvalid: boolean }) => React.ReactNode
} & React.ComponentProps<"input">) {
  const isInvalid = field.state.meta.errors.length > 0
  const inputId = props.id ?? field.name
  return (
    <Field>
      <div className="flex items-center justify-between">
        <FieldLabel
          className={cn(
            "font-medium text-foreground/80 text-xs uppercase tracking-wide",
            labelClassName
          )}
          htmlFor={inputId}
        >
          {label}
        </FieldLabel>
        {additionalNode}
      </div>
      {renderInput ? (
        renderInput({ id: inputId, isInvalid })
      ) : (
        <div className="relative">
          <Input
            className={cn(
              "h-10 bg-background/50 transition-all duration-200 focus:bg-background",
              {
                "border-destructive": isInvalid,
                "pl-10": !!icon,
              }
            )}
            id={inputId}
            name={field.name}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value)}
            spellCheck={
              SPELLCHECK_DISABLED_INPUT_TYPES.includes(props.type ?? "")
                ? false
                : undefined
            }
            value={field.state.value}
            {...props}
          />
          {icon && (
            <HugeiconsIcon
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground/50"
              icon={icon}
            />
          )}
        </div>
      )}
      <FieldState field={field} />
    </Field>
  )
}
