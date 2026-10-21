import type { AnyFieldApi } from "@tanstack/react-form";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isProjectFile, PROJECT_FOLDER } from "@/lib/localization";
import { cn } from "@/lib/utils";

type FrameProps = {
  field: AnyFieldApi;
  label: string;
  description?: string;
  className?: string;
  // Errors show right away instead of after the field was touched
  showErrors?: boolean;
};

// Label, description and errors around one input
function FieldFrame({
  field,
  label,
  aside,
  description,
  className,
  showErrors,
  children,
}: FrameProps & {
  aside?: React.ReactNode;
  children: (input: { id: string; invalid: boolean }) => React.ReactNode;
}) {
  // Field names like versions[0].copy.headline are not valid in a selector
  const id = `field-${field.name.replace(/\W+/g, "-")}`;
  const invalid =
    (showErrors || field.state.meta.isTouched) && !field.state.meta.isValid;

  return (
    <Field data-invalid={invalid} className={cn("gap-1.5", className)}>
      <FieldLabel htmlFor={id} className="justify-between">
        {label}
        {aside}
      </FieldLabel>
      {children({ id, invalid })}
      {description && !invalid && (
        <FieldDescription className="text-xs">{description}</FieldDescription>
      )}
      {invalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}

export function TextInput({
  max,
  ...frame
}: FrameProps & {
  // Shows a counter. Longer text can still be typed, the error says why it
  // can't be rendered
  max?: number;
}) {
  const { field } = frame;
  return (
    <FieldFrame
      {...frame}
      aside={
        max && (
          <span className="text-xs font-normal text-muted-foreground tabular-nums">
            {String(field.state.value).length}/{max}
          </span>
        )
      }
    >
      {({ id, invalid }) => (
        <Input
          id={id}
          name={field.name}
          value={field.state.value}
          aria-invalid={invalid}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
        />
      )}
    </FieldFrame>
  );
}

const SOURCES = { project: "Project file", url: "URL" };

// An image from the uploaded project or from a URL. The value keeps the
// (Footage)/ prefix for project files, so the source is not stored separately
export function MediaInput({
  projectFile,
  ...frame
}: Omit<FrameProps, "description"> & {
  // Picked when switching back to the project
  projectFile: string;
}) {
  const { field } = frame;
  const value: string = field.state.value;
  const source = isProjectFile(value) ? "project" : "url";

  return (
    <FieldFrame
      {...frame}
      description={
        source === "project"
          ? "A file in the uploaded After Effects project"
          : "A public https:// link to the image"
      }
    >
      {({ id, invalid }) => (
        <ButtonGroup className="w-full">
          <Select
            items={SOURCES}
            value={source}
            onValueChange={(next) =>
              field.handleChange(next === "project" ? projectFile : "")
            }
          >
            <SelectTrigger aria-label={`${frame.label} source`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SOURCES).map(([key, name]) => (
                <SelectItem key={key} value={key}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            id={id}
            name={field.name}
            value={
              source === "project" ? value.slice(PROJECT_FOLDER.length) : value
            }
            placeholder={source === "url" ? "https://" : undefined}
            aria-invalid={invalid}
            onBlur={field.handleBlur}
            onChange={(e) =>
              field.handleChange(
                source === "project"
                  ? PROJECT_FOLDER + e.target.value
                  : e.target.value,
              )
            }
          />
        </ButtonGroup>
      )}
    </FieldFrame>
  );
}

// The browser's color picker next to the hex value, both edit the same #RRGGBB
export function ColorInput(frame: Omit<FrameProps, "description">) {
  const { field } = frame;
  const value: string = field.state.value;
  return (
    <FieldFrame {...frame}>
      {({ id, invalid }) => (
        <ButtonGroup className="w-full">
          <input
            type="color"
            data-slot="color-picker"
            aria-label={`${frame.label} picker`}
            // The picker only takes a full #RRGGBB, it shows black until one is typed
            value={/^#[0-9A-F]{6}$/i.test(value) ? value : "#000000"}
            onChange={(e) => field.handleChange(e.target.value.toUpperCase())}
            className="size-8 flex-none! cursor-pointer appearance-none overflow-hidden rounded-lg border-0 bg-transparent p-0 [&::-moz-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-0"
          />
          <Input
            id={id}
            name={field.name}
            value={value}
            maxLength={7}
            spellCheck={false}
            aria-invalid={invalid}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value.toUpperCase())}
            className="font-mono"
          />
        </ButtonGroup>
      )}
    </FieldFrame>
  );
}
