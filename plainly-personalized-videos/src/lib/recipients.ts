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

// Longest title or company that fits on one line of the badge in the video,
// found with draft renders of the Christmas Greetings template
export const MAX_BADGE_LENGTH = 22;

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

// First problem with a client, if any
export function checkRecipient(recipient: Recipient): string | undefined {
  for (const column of RECIPIENT_COLUMNS) {
    if (!recipient[column].trim()) return `Missing ${column}`;
  }
  // The template's badge wraps longer text, and the two lines run into each other.
  // ponytail: a character count only approximates the width, wide letters can still wrap
  if (recipient.title.trim().length > MAX_BADGE_LENGTH) {
    return `Title is too long (max ${MAX_BADGE_LENGTH} characters)`;
  }
  if (recipient.company.trim().length > MAX_BADGE_LENGTH) {
    return `Company is too long (max ${MAX_BADGE_LENGTH} characters)`;
  }
  if (!isHttpUrl(recipient.headshot.trim())) {
    return "Headshot must be an http(s) URL";
  }
}

// Excel on Windows saves "CSV (Comma delimited)" as Windows-1252, not UTF-8.
// Read as UTF-8 that would turn "Zoë" into "Zo\uFFFD", right into the video
export function decodeCsv(bytes: ArrayBuffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder("windows-1252").decode(bytes);
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
