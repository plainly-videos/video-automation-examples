import { type AnyFieldApi, useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  type Ad,
  adFor,
  adSchema,
  LABELS,
  LIMITS,
  OPTIONAL_FIELDS,
  type TextField,
} from "@/lib/ad";
import { createAd } from "@/lib/plainly";
import { cn } from "@/lib/utils";
import { type ProductId, productIds, products } from "@/products";

const FIELDS: TextField[][] = [
  ["headline"],
  ["offer"],
  ["price", "oldPrice"],
  ["cta"],
];

export function AdEditor({
  initial,
  aside,
}: {
  initial: Ad;
  aside: (ad: Ad) => React.ReactNode;
}) {
  const [error, setError] = useState<string>();
  const createAdFn = useServerFn(createAd);
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: initial,
    // The server checks the same schema again
    validators: { onChange: adSchema },
    onSubmit: async ({ value }) => {
      setError(undefined);
      try {
        const { adId } = await createAdFn({ data: value });
        await navigate({ to: "/ad/$adId", params: { adId } });
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    },
  });

  // Picking a product swaps in its copy, Reset still goes back to `initial`
  const pickProduct = (id: ProductId) =>
    form.reset(adFor(id), { keepDefaultValues: true });

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[22rem_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Ad</CardTitle>
          <CardDescription>
            One ad, rendered in 16:9, 9:16 and 1:1 with three single render
            calls.
          </CardDescription>
        </CardHeader>
        <form
          className="contents"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <CardContent className="grid gap-4">
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Failed to create ad</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <fieldset className="grid gap-2">
              <legend className="mb-2 text-sm font-medium">Product</legend>
              <form.Subscribe selector={(state) => state.values.productId}>
                {(productId) => (
                  <div className="grid grid-cols-4 gap-2">
                    {productIds.map((id) => (
                      <ProductButton
                        key={id}
                        id={id}
                        selected={productId === id}
                        onPick={() => pickProduct(id)}
                      />
                    ))}
                  </div>
                )}
              </form.Subscribe>
            </fieldset>
            {FIELDS.map((row) => (
              <div key={row.join()} className="grid grid-cols-2 gap-3">
                {row.map((name) => (
                  <form.Field key={name} name={name}>
                    {(field) => (
                      <TextInput
                        name={name}
                        field={field}
                        wide={row.length === 1}
                      />
                    )}
                  </form.Field>
                ))}
              </div>
            ))}
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
            >
              Reset
            </Button>
            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(submitting) => (
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Creating renders…" : "Render 3 formats"}
                </Button>
              )}
            </form.Subscribe>
          </CardFooter>
        </form>
      </Card>
      <form.Subscribe selector={(state) => state.values}>
        {(ad) => aside(ad)}
      </form.Subscribe>
    </div>
  );
}

function ProductButton({
  id,
  selected,
  onPick,
}: {
  id: ProductId;
  selected: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onPick}
      className={cn(
        // minmax(0, 1fr) keeps a long name from widening the image
        "grid grid-cols-[minmax(0,1fr)] gap-1 rounded-lg border p-1 text-[11px] hover:bg-muted",
        selected && "border-primary ring-1 ring-primary",
      )}
    >
      <img
        src={products[id].image}
        alt=""
        className="aspect-square w-full rounded-md object-cover"
      />
      <span className="truncate">{products[id].name}</span>
    </button>
  );
}

function TextInput({
  name,
  field,
  wide,
}: {
  name: TextField;
  field: AnyFieldApi;
  wide: boolean;
}) {
  const id = `ad-${name}`;
  const invalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Field
      data-invalid={invalid}
      className={cn("gap-1.5", wide && "col-span-2")}
    >
      <FieldLabel htmlFor={id}>
        {LABELS[name]}
        {OPTIONAL_FIELDS.includes(name) && (
          <span className="font-normal text-muted-foreground">(optional)</span>
        )}
      </FieldLabel>
      <Input
        id={id}
        name={name}
        value={field.state.value}
        maxLength={LIMITS[name]}
        aria-invalid={invalid}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
      />
      {invalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
