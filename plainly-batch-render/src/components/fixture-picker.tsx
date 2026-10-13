import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Matchup } from "@/components/matchup";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { fixtures } from "@/fixtures";
import { createBatch } from "@/lib/plainly";

export function FixturePicker() {
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const createBatchFn = useServerFn(createBatch);
  const navigate = useNavigate();

  const allSelected = selected.length === fixtures.length;
  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    setSubmitting(true);

    try {
      // One request creates a render for every selected matchup
      const { id } = await createBatchFn({ data: selected });
      setSelected([]);
      await navigate({ to: "/", search: { batch: id } });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Game night</CardTitle>
        <CardDescription>
          Pick the matchups to render. All of them are sent in a single batch
          request.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Failed to create batch</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-2 sm:grid-cols-2">
            {fixtures.map((fixture) => (
              <div
                key={fixture.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <Checkbox
                  id={fixture.id}
                  checked={selected.includes(fixture.id)}
                  onCheckedChange={() => toggle(fixture.id)}
                />
                <Label htmlFor={fixture.id} className="cursor-pointer">
                  <Matchup home={fixture.home} away={fixture.away} />
                </Label>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setSelected(allSelected ? [] : fixtures.map((f) => f.id))
              }
            >
              {allSelected ? "Clear" : "Select all"}
            </Button>
            <Button
              type="submit"
              disabled={selected.length === 0 || submitting}
            >
              {submitting
                ? "Creating batch…"
                : `Render ${selected.length} video${selected.length === 1 ? "" : "s"}`}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
