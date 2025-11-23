import { Label } from "@medusajs/ui"
import React, { TextareaHTMLAttributes } from "react"

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string
  errors?: Record<string, string>
  touched?: Record<string, boolean>
  name: string
}

const Textarea: React.FC<TextareaProps> = ({
  label,
  errors,
  touched,
  name,
  required,
  ...textareaProps
}) => {
  const hasError = errors && touched && errors[name] && touched[name]

  return (
    <div className="flex flex-col w-full">
      <Label htmlFor={name} className="mb-2 txt-compact-medium-plus">
        {label}
        {required && <span className="text-rose-500">*</span>}
      </Label>
      <textarea
        id={name}
        name={name}
        required={required}
        className={`w-full rounded-md border ${
          hasError ? "border-rose-500" : "border-ui-border-base"
        } bg-ui-bg-field px-3 py-2 text-ui-fg-base placeholder:text-ui-fg-subtle focus:border-ui-fg-base focus:outline-none focus:ring-2 focus:ring-ui-fg-base/10`}
        {...textareaProps}
      />
      {hasError && errors && (
        <span className="text-rose-500 text-xs mt-1">
          {errors[name]}
        </span>
      )}
    </div>
  )
}

export default Textarea
