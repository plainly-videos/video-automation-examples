import type { AnyFieldApi } from "@tanstack/react-form";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Field names like versions[0].copy.headline are not valid in a selector
const idOf = (field: AnyFieldApi) => `field-${field.name.replace(/\W+/g, "-")}`;

export function TextInput({
  field,
  label,
  max,
  description,
  className,
  showErrors,
}: {
  field: AnyFieldApi;
  label: string;
  // Shows a counter. Longer text can still be typed, the error says why it
  // can't be rendered
  max?: number;
  description?: string;
  className?: string;
  // Errors show right away instead of after the field was touched
  showErrors?: boolean;
}) {
  const id = idOf(field);
  const invalid =
    (showErrors || field.state.meta.isTouched) && !field.state.meta.isValid;

  return (
    <Field data-invalid={invalid} className={cn("gap-1.5", className)}>
      <FieldLabel htmlFor={id} className="justify-between">
        {label}
        {max && (
          <span className="text-xs font-normal text-muted-foreground tabular-nums">
            {String(field.state.value).length}/{max}
          </span>
        )}
      </FieldLabel>
      <Input
        id={id}
        name={field.name}
        value={field.state.value}
        aria-invalid={invalid}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
      />
      {description && !invalid && (
        <FieldDescription className="text-xs">{description}</FieldDescription>
      )}
      {invalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}

// The browser's own color picker, the value is #RRGGBB
export function ColorInput({
  field,
  label,
}: {
  field: AnyFieldApi;
  label: string;
}) {
  const id = idOf(field);
  return (
    <Field className="gap-1.5">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={field.state.value}
          onChange={(e) => field.handleChange(e.target.value.toUpperCase())}
          className="h-9 w-12 cursor-pointer rounded-md border bg-transparent p-1"
        />
        <code className="text-xs text-muted-foreground">
          {field.state.value}
        </code>
      </div>
    </Field>
  );
}
