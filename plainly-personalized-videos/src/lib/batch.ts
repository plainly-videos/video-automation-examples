import {
  checkRecipient,
  MAX_RECIPIENTS,
  type Recipient,
} from "@/lib/recipients";

// Tags every render, so the app only ever lists its own renders,
// never batches made in the Plainly app or by other tools
export const EXAMPLE = "personalized-videos";
export const DEFAULT_CAMPAIGN = "Holiday greetings 2026";
// The frame where the client's headshot, title and name are all on screen
export const THUMBNAIL_AT_SECONDS = 5;

// Ours, plus the batchRender* keys Plainly adds to every batch render
export type RenderAttributes = Partial<Recipient> & {
  example?: string;
  campaign?: string;
  batchRenderId?: string;
  batchRenderDataEntryNo?: number;
};

// Subset of the render object returned by the Plainly API
export type Render = {
  id: string;
  state: string;
  createdDate: string;
  attributes: RenderAttributes | null;
  output?: string;
  thumbnailUris?: string[];
  expired?: boolean;
  outputFormat?: { settingsTemplate?: string | null } | null;
};

export type Campaign = {
  id: string;
  name: string;
  createdDate: string;
  videos: number;
  draft: boolean;
};

export type BatchInput = {
  campaign: string;
  draft: boolean;
  recipients: Recipient[];
};

const IN_PROGRESS_STATES = ["PENDING", "THROTTLED", "QUEUED", "IN_PROGRESS"];

// Anything else (DONE, INVALID, FAILED, CANCELLED) is final
export const isFinished = (render: Pick<Render, "state">) =>
  !IN_PROGRESS_STATES.includes(render.state);

export const isBatchFinished = (renders: Pick<Render, "state">[]) =>
  renders.every(isFinished);

// IN_PROGRESS -> "In progress", for people instead of the API
export const stateLabel = (state: string) =>
  state.charAt(0) + state.slice(1).toLowerCase().replaceAll("_", " ");

// Plainly batch ids are UUIDs, anything else never reaches the API
export const isBatchId = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

export const isDraft = (render: Pick<Render, "outputFormat">) =>
  render.outputFormat?.settingsTemplate === "DRAFT";

// Renders come back one by one, a campaign is all renders of one batch
export function toCampaigns(renders: Render[]): Campaign[] {
  const campaigns = new Map<string, Campaign>();
  for (const render of renders) {
    const id = render.attributes?.batchRenderId;
    if (!id) continue;
    const campaign = campaigns.get(id);
    if (!campaign) {
      campaigns.set(id, {
        id,
        name: render.attributes?.campaign ?? "Untitled",
        createdDate: render.createdDate,
        videos: 1,
        draft: isDraft(render),
      });
      continue;
    }
    campaign.videos++;
    if (render.createdDate > campaign.createdDate) {
      campaign.createdDate = render.createdDate;
    }
  }
  return [...campaigns.values()].sort((a, b) =>
    b.createdDate.localeCompare(a.createdDate),
  );
}

// "Zoë Turner" -> "Zoe-Turner": accents dropped, anything else becomes a dash
const slug = (text: string) =>
  text
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Plainly adds the extension. The video still plays in the browser,
// this only names the file when the client saves it
export const fileName = (campaign: string, name: string) =>
  [slug(campaign), slug(name)].filter(Boolean).join("-") || "video";

const text = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

// Server functions can be called with anything, so the browser's checks are repeated here
export function pickBatchInput(input: unknown): BatchInput {
  if (typeof input !== "object" || input === null) {
    throw new Error("Invalid request");
  }
  const { campaign, draft, recipients } = input as Record<string, unknown>;
  if (typeof draft !== "boolean" || !Array.isArray(recipients)) {
    throw new Error("Invalid request");
  }
  if (!text(campaign)) throw new Error("Campaign name is required");
  if (recipients.length === 0) throw new Error("Add at least one client");
  if (recipients.length > MAX_RECIPIENTS) {
    throw new Error(`At most ${MAX_RECIPIENTS} clients per batch`);
  }

  return {
    campaign: text(campaign),
    draft,
    recipients: recipients.map((value, index) => {
      const fields = (typeof value === "object" && value) || {};
      const recipient = {
        name: text(fields.name),
        title: text(fields.title),
        company: text(fields.company),
        headshot: text(fields.headshot),
      };
      const error = checkRecipient(recipient);
      if (error) throw new Error(`Client ${index + 1}: ${error}`);
      return recipient;
    }),
  };
}

// One batch data entry per client, each entry becomes its own render
// https://help.plainlyvideos.com/docs/developer-guide/batch-renders-api
export function toBatchRequest(input: BatchInput, projectId: string) {
  return {
    projectId,
    // Names the batch in Plainly too
    reference: input.campaign,
    // Draft renders are half resolution and free of charge
    ...(input.draft && { outputFormat: { settingsTemplate: "DRAFT" } }),
    options: { thumbnails: { atSeconds: [THUMBNAIL_AT_SECONDS] } },
    batchData: input.recipients.map((recipient) => ({
      attachmentFileName: fileName(input.campaign, recipient.name),
      // Render responses have no parameters, so the client comes back through attributes
      attributes: { example: EXAMPLE, campaign: input.campaign, ...recipient },
      parameters: {
        Name: recipient.name,
        Title: recipient.title,
        Company: recipient.company,
        Image: recipient.headshot,
      },
    })),
  };
}

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

// Pasted into Gmail, the HTML shows the client's thumbnail linked to their video.
// The image is referenced by URL: Plainly storage sends no CORS headers,
// so the browser cannot copy the picture itself
export function emailSnippet({
  output,
  thumbnail,
  name,
}: {
  output: string;
  thumbnail: string;
  name: string;
}) {
  return {
    html: `<a href="${escapeHtml(output)}"><img src="${escapeHtml(thumbnail)}" alt="Holiday video for ${escapeHtml(name)}" width="480"></a>`,
    text: output,
  };
}
