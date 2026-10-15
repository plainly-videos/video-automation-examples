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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type Ad,
  adFor,
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
  const [ad, setAd] = useState(initial);
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const createAdFn = useServerFn(createAd);
  const navigate = useNavigate();

  const setField = (field: TextField, value: string) =>
    setAd((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    setSubmitting(true);

    try {
      const { adId } = await createAdFn({ data: ad });
      await navigate({ to: "/ad/$adId", params: { adId } });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

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
        <form className="contents" onSubmit={handleSubmit}>
          <CardContent className="grid gap-4">
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Failed to create ad</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <fieldset className="grid gap-2">
              <legend className="mb-2 text-sm font-medium">Product</legend>
              <div className="grid grid-cols-4 gap-2">
                {productIds.map((id) => (
                  <ProductButton
                    key={id}
                    id={id}
                    selected={ad.productId === id}
                    onPick={() => setAd(adFor(id))}
                  />
                ))}
              </div>
            </fieldset>
            {FIELDS.map((row) => (
              <div key={row.join()} className="grid grid-cols-2 gap-3">
                {row.map((field) => (
                  <TextInput
                    key={field}
                    field={field}
                    value={ad[field]}
                    onChange={setField}
                    wide={row.length === 1}
                  />
                ))}
              </div>
            ))}
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAd(initial)}
            >
              Reset
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating renders…" : "Render 3 formats"}
            </Button>
          </CardFooter>
        </form>
      </Card>
      {aside(ad)}
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
  field,
  value,
  onChange,
  wide,
}: {
  field: TextField;
  value: string;
  onChange: (field: TextField, value: string) => void;
  wide: boolean;
}) {
  const id = `ad-${field}`;
  const optional = OPTIONAL_FIELDS.includes(field);

  return (
    <div className={cn("grid gap-1.5", wide && "col-span-2")}>
      <Label htmlFor={id}>
        {LABELS[field]}
        {optional && (
          <span className="font-normal text-muted-foreground">(optional)</span>
        )}
      </Label>
      <Input
        id={id}
        value={value}
        required={!optional}
        maxLength={LIMITS[field]}
        onChange={(e) => onChange(field, e.target.value)}
      />
    </div>
  );
}
