import { useNavigate } from "@tanstack/react-router";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { ClientUpload } from "@/components/client-upload";
import { ClientsTable } from "@/components/clients-table";
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
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { DEFAULT_CAMPAIGN } from "@/lib/batch";
import { createBatch } from "@/lib/plainly";
import { type ClientRow, readClients } from "@/lib/recipients";

export function CampaignForm() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [fileError, setFileError] = useState<string>();
  const [campaign, setCampaign] = useState(DEFAULT_CAMPAIGN);
  const [draft, setDraft] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();

  const valid = rows.filter((row) => !row.error);
  const canRender =
    valid.length > 0 && !fileError && campaign.trim() !== "" && !submitting;

  const loadCsv = (csvText: string) => {
    const result = readClients(csvText);
    setRows(result.rows);
    setFileError(result.error);
    setSubmitError(undefined);
  };

  const render = async () => {
    setSubmitting(true);
    setSubmitError(undefined);
    try {
      const { id } = await createBatch({
        data: {
          campaign,
          draft,
          // Only the rows that passed the checks, without their error field
          recipients: valid.map(({ name, title, company, headshot }) => ({
            name,
            title,
            company,
            headshot,
          })),
        },
      });
      await navigate({ to: "/", search: { batch: id } });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : String(err));
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personalized holiday greetings</CardTitle>
        <CardDescription>
          Upload your client list and get one video per client, with their name,
          title, company and headshot.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <ClientUpload onLoad={loadCsv} />
        {fileError && (
          <Alert variant="destructive">
            <AlertTitle>Can't use this file</AlertTitle>
            <AlertDescription>{fileError}</AlertDescription>
          </Alert>
        )}
        <div className="grid gap-6 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="campaign">Campaign name</FieldLabel>
            <Input
              id="campaign"
              value={campaign}
              onChange={(event) => setCampaign(event.target.value)}
              aria-invalid={campaign.trim() === ""}
              required
            />
            <FieldDescription>
              Also names each video file, like{" "}
              <code>Holiday-greetings-2026-Emma-Johnson.mp4</code>.
            </FieldDescription>
          </Field>
          <Field orientation="horizontal">
            <Switch id="draft" checked={draft} onCheckedChange={setDraft} />
            <FieldContent>
              <FieldLabel htmlFor="draft">Draft preview (free)</FieldLabel>
              <FieldDescription>
                Half resolution, no video minutes used. Check every video, then
                turn it off for the final render.
              </FieldDescription>
            </FieldContent>
          </Field>
        </div>
        {rows.length > 0 && (
          <ClientsTable
            clients={rows.map((row, index) => ({
              key: String(index),
              headshot: row.error ? undefined : row.headshot,
              name: row.name,
              title: row.title,
              company: row.company,
              invalid: Boolean(row.error),
              video: row.error ?? (
                <span className="text-muted-foreground">Ready</span>
              ),
            }))}
          />
        )}
        {submitError && (
          <Alert variant="destructive">
            <AlertTitle>Could not start the render</AlertTitle>
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="justify-end">
        <Button onClick={render} disabled={!canRender}>
          {submitting && <LoaderCircle className="animate-spin" />}
          Render {valid.length} {draft ? "drafts" : "videos"}
        </Button>
      </CardFooter>
    </Card>
  );
}
