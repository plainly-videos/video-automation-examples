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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type Ad, adSchema, LIMITS, slotFor } from "@/lib/ad";
import { createAd } from "@/lib/plainly";
import {
  type Category,
  categories,
  isProductId,
  type ProductId,
  products,
  productsIn,
} from "@/products";

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

  return (
    <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Ad</CardTitle>
          <CardDescription>
            One video that shows three products, rendered in 16:9, 9:16 and 1:1.
          </CardDescription>
        </CardHeader>
        <form
          className="contents"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          {/* Between md and lg the texts share a row, and so do the products */}
          <CardContent className="grid gap-4 md:grid-cols-3 lg:grid-cols-1">
            {error && (
              <Alert variant="destructive" className="col-span-full">
                <AlertTitle>Failed to create ad</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form.Field name="hook">
              {(field) => (
                <TextInput field={field} label="Hook" max={LIMITS.hook} />
              )}
            </form.Field>
            <form.Field name="button">
              {(field) => (
                <TextInput field={field} label="Button" max={LIMITS.button} />
              )}
            </form.Field>
            <form.Field name="cta">
              {(field) => (
                <TextInput
                  field={field}
                  label="Call to action"
                  max={LIMITS.cta}
                />
              )}
            </form.Field>
            <form.Subscribe
              selector={(state) =>
                products[state.values.slots[0].productId].category
              }
            >
              {(category) => (
                <Field className="gap-1.5 md:col-span-full lg:col-span-1">
                  <FieldLabel htmlFor="ad-category">Category</FieldLabel>
                  <Select
                    value={category}
                    // A new category brings its own three products
                    onValueChange={(next) =>
                      next &&
                      form.setFieldValue(
                        "slots",
                        productsIn(next)
                          .slice(0, initial.slots.length)
                          .map(slotFor),
                      )
                    }
                  >
                    <SelectTrigger id="ad-category" className="w-full">
                      <SelectValue>
                        {(id: Category) => categories[id]}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categories).map(([id, label]) => (
                        <SelectItem key={id} value={id}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            </form.Subscribe>
            {initial.slots.map((_, i) => (
              <fieldset
                // biome-ignore lint/suspicious/noArrayIndexKey: the slots never move
                key={i}
                className="grid grid-cols-[minmax(0,1fr)_5rem] gap-3"
              >
                <legend className="mb-2 text-sm font-medium">
                  Product {i + 1}
                </legend>
                <form.Field name={`slots[${i}].productId`}>
                  {(field) => (
                    <>
                      <Select
                        value={field.state.value}
                        // A new product brings its own name and price
                        onValueChange={(id) =>
                          isProductId(id) &&
                          form.setFieldValue(`slots[${i}]`, slotFor(id))
                        }
                      >
                        <SelectTrigger
                          aria-label={`Product ${i + 1}`}
                          className="col-span-2 w-full"
                        >
                          <SelectValue>
                            {(id: ProductId) => <ProductOption id={id} />}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <form.Subscribe
                            selector={(state) =>
                              state.values.slots.map((slot) => slot.productId)
                            }
                          >
                            {(picked) =>
                              productsIn(products[picked[0]].category).map(
                                (id) => (
                                  <SelectItem
                                    key={id}
                                    value={id}
                                    // Each product appears once per ad
                                    disabled={picked.some(
                                      (other, j) => j !== i && other === id,
                                    )}
                                  >
                                    <ProductOption id={id} />
                                  </SelectItem>
                                ),
                              )
                            }
                          </form.Subscribe>
                        </SelectContent>
                      </Select>
                      {/* Shows up when an earlier ad repeats a product or mixes categories */}
                      {!field.state.meta.isValid && (
                        <FieldError
                          className="col-span-2"
                          errors={field.state.meta.errors}
                        />
                      )}
                    </>
                  )}
                </form.Field>
                <form.Field name={`slots[${i}].name`}>
                  {(field) => (
                    <TextInput field={field} label="Name" max={LIMITS.name} />
                  )}
                </form.Field>
                <form.Field name={`slots[${i}].price`}>
                  {(field) => (
                    <TextInput field={field} label="Price" max={LIMITS.price} />
                  )}
                </form.Field>
              </fieldset>
            ))}
          </CardContent>
          {/* mt-auto keeps the buttons at the bottom when the card stretches */}
          <CardFooter className="mt-auto justify-end gap-2">
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

function ProductOption({ id }: { id: ProductId }) {
  return (
    <>
      <img
        src={products[id].image}
        alt=""
        className="size-5 rounded-sm object-cover"
      />
      {products[id].name}
    </>
  );
}

function TextInput({
  field,
  label,
  max,
}: {
  field: AnyFieldApi;
  label: string;
  max: number;
}) {
  // Field names like slots[0].name are not valid in a selector
  const id = `ad-${field.name.replace(/\W+/g, "-")}`;
  const invalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Field data-invalid={invalid} className="gap-1.5">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        name={field.name}
        value={field.state.value}
        maxLength={max}
        aria-invalid={invalid}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
      />
      {invalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
