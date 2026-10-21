import Papa from "papaparse";

export const RECIPIENT_COLUMNS = [
  "name",
  "title",
  "company",
  "headshot",
] as const;

// One batch request per campaign, kept small so a wrong file can't burn
// through a lot of render minutes at once
export const MAX_RECIPIENTS = 100;

export type Recipient = Record<(typeof RECIPIENT_COLUMNS)[number], string>;

export type ClientRow = Recipient & { error?: string };

// Plainly downloads the headshot itself, so it has to be a public web URL
function isHttpUrl(value: string) {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

// Returns the first problem with a client, or undefined when it can be rendered
export function checkRecipient(recipient: Recipient): string | undefined {
  for (const column of RECIPIENT_COLUMNS) {
    if (!recipient[column].trim()) return `Missing ${column}`;
  }
  if (!isHttpUrl(recipient.headshot.trim())) {
    return "Headshot must be an http(s) URL";
  }
}

// Reads a CRM or spreadsheet export. Headers are matched loosely (any order,
// any case, extra spaces), extra columns are ignored
export function readClients(csvText: string): {
  rows: ClientRow[];
  error?: string;
} {
  const { data, meta } = Papa.parse<Record<string, string | undefined>>(
    csvText,
    {
      header: true,
      // Skips blank lines and lines of only commas, which spreadsheets leave behind
      skipEmptyLines: "greedy",
      // trim() also drops the BOM that Excel puts before the first header
      transformHeader: (header) => header.trim().toLowerCase(),
    },
  );

  const fields = (meta.fields ?? []).filter(Boolean);
  if (fields.length === 0) return { rows: [], error: "The CSV file is empty." };

  const missing = RECIPIENT_COLUMNS.filter(
    (column) => !fields.includes(column),
  );
  if (missing.length > 0) {
    return {
      rows: [],
      error: `Missing columns: ${missing.join(", ")}. Expected headers: ${RECIPIENT_COLUMNS.join(", ")}.`,
    };
  }

  const rows = data.map((record) => {
    const recipient = {
      name: record.name?.trim() ?? "",
      title: record.title?.trim() ?? "",
      company: record.company?.trim() ?? "",
      headshot: record.headshot?.trim() ?? "",
    };
    const error = checkRecipient(recipient);
    return error ? { ...recipient, error } : recipient;
  });

  const valid = rows.filter((row) => !("error" in row)).length;
  if (valid > MAX_RECIPIENTS) {
    return {
      rows,
      error: `Too many clients: ${valid} valid rows, at most ${MAX_RECIPIENTS} per batch.`,
    };
  }
  return { rows };
}
