import { HugeiconsIcon } from "@hugeicons/react"
import type { AnyFieldApi } from "@tanstack/react-form"
import { useTranslations } from "next-intl"
import type { ZodError } from "zod"
import type { AppTranslate } from "@/i18n/use-translations"
import { cn } from "@/lib/utils"
import { translateZodMessage } from "@/lib/zod-message"
import type { IconComponent } from "../dashboard/types"
import { Field, FieldContent, FieldError, FieldLabel } from "../ui/field"
import { Input } from "../ui/input"

const getFieldErrorMessage = (
  field: AnyFieldApi,
  t: AppTranslate
): string | undefined => {
  const error = field.state.meta.errors[0] as ZodError | string | undefined
  const message = typeof error === "string" ? error : error?.message

  if (!message) {
    return undefined
  }

  return translateZodMessage(message, t)
}

export function FieldState({
  field,
  className,
}: {
  field: AnyFieldApi
  className?: string
}) {
  const t = useTranslations()
  const message = getFieldErrorMessage(field, t)

  return message ? (
    <p
      className={cn("mt-1 text-wrap text-destructive text-xs", className)}
      role="alert"
    >
      {message}
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
  layout = "stacked",
  fieldClassName,
  labelClassName,
  contentClassName,
  errorClassName,
  renderInput,
  className,
  ...props
}: {
  field: AnyFieldApi
  label: string
  icon?: IconComponent
  additionalNode?: React.ReactNode
  layout?: "stacked" | "grid"
  fieldClassName?: string
  labelClassName?: string
  contentClassName?: string
  errorClassName?: string
  renderInput?: (args: { id: string; isInvalid: boolean }) => React.ReactNode
} & React.ComponentProps<"input">) {
  const t = useTranslations()
  const isInvalid = field.state.meta.errors.length > 0
  const inputId = props.id ?? field.name
  const errorMessage = getFieldErrorMessage(field, t)
  const inputNode = renderInput ? (
    renderInput({ id: inputId, isInvalid })
  ) : (
    <div className="relative">
      <Input
        className={cn(
          layout === "grid"
            ? ""
            : "h-10 bg-background/50 transition-all duration-200 focus:bg-background",
          {
            "border-destructive": isInvalid,
            "pl-10": !!icon,
          },
          className
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
  )

  if (layout === "grid") {
    return (
      <Field
        className={cn(
          "grid grid-cols-6 items-center gap-x-4 gap-y-1",
          fieldClassName
        )}
      >
        <FieldLabel
          className={cn("col-span-2 text-end", labelClassName)}
          htmlFor={inputId}
        >
          {label}
        </FieldLabel>
        <FieldContent className={cn("col-span-4", contentClassName)}>
          {inputNode}
        </FieldContent>
        {errorMessage ? (
          <FieldError className={cn("col-span-4 col-start-3", errorClassName)}>
            {errorMessage}
          </FieldError>
        ) : null}
      </Field>
    )
  }

  return (
    <Field className={fieldClassName}>
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
      {inputNode}
      <FieldState className={errorClassName} field={field} />
    </Field>
  )
}
