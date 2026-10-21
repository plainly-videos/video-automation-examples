import { expect, test } from "vitest";
import {
  emailSnippet,
  fileName,
  isBatchFinished,
  isBatchId,
  isDraft,
  isFinished,
  pickBatchInput,
  type Render,
  stateLabel,
  toBatchRequest,
  toCampaigns,
} from "@/lib/batch";

const emma = {
  name: "Emma Johnson",
  title: "Head of Marketing",
  company: "Northwind",
  headshot: "https://randomuser.me/api/portraits/women/44.jpg",
};

test("isFinished treats every state except the in-progress ones as final", () => {
  for (const state of ["DONE", "INVALID", "FAILED", "CANCELLED"]) {
    expect(isFinished({ state }), state).toBe(true);
  }
  for (const state of ["PENDING", "THROTTLED", "QUEUED", "IN_PROGRESS"]) {
    expect(isFinished({ state }), state).toBe(false);
  }
});

test("isBatchId only accepts UUIDs", () => {
  expect(isBatchId("97226b64-8b8a-437d-a76e-f014d3845c42")).toBe(true);
  for (const id of ["..", "", "a/b", "abc"]) {
    expect(isBatchId(id), id).toBe(false);
  }
});

test("isBatchFinished needs every render final", () => {
  expect(isBatchFinished([])).toBe(true);
  expect(isBatchFinished([{ state: "DONE" }, { state: "QUEUED" }])).toBe(false);
  expect(isBatchFinished([{ state: "DONE" }, { state: "FAILED" }])).toBe(true);
});

test("stateLabel turns API states into readable text", () => {
  expect(stateLabel("DONE")).toBe("Done");
  expect(stateLabel("IN_PROGRESS")).toBe("In progress");
});

test("fileName joins campaign and name into a plain ASCII file name", () => {
  expect(fileName("Holiday greetings 2026", "Emma Johnson")).toBe(
    "Holiday-greetings-2026-Emma-Johnson",
  );
  expect(fileName("Holiday greetings 2026", "Zoë Turner")).toBe(
    "Holiday-greetings-2026-Zoe-Turner",
  );
  expect(fileName("Holiday greetings 2026", "Liam O'Brien")).toBe(
    "Holiday-greetings-2026-Liam-O-Brien",
  );
  expect(fileName("Holiday greetings 2026", "???")).toBe(
    "Holiday-greetings-2026",
  );
  expect(fileName("!!", "???")).toBe("video");
});

test("toBatchRequest builds one tagged entry per client", () => {
  expect(
    toBatchRequest(
      { campaign: "Holiday greetings 2026", draft: true, recipients: [emma] },
      "project-1",
    ),
  ).toEqual({
    projectId: "project-1",
    reference: "Holiday greetings 2026",
    outputFormat: { settingsTemplate: "DRAFT" },
    options: { thumbnails: { atSeconds: [5] } },
    batchData: [
      {
        attachmentFileName: "Holiday-greetings-2026-Emma-Johnson",
        attributes: {
          example: "personalized-videos",
          campaign: "Holiday greetings 2026",
          ...emma,
        },
        parameters: {
          Name: "Emma Johnson",
          Title: "Head of Marketing",
          Company: "Northwind",
          Image: emma.headshot,
        },
      },
    ],
  });
});

test("toBatchRequest leaves out draft settings for final renders", () => {
  const body = toBatchRequest(
    { campaign: "X", draft: false, recipients: [emma] },
    "p",
  ) as Record<string, unknown>;
  expect(body.outputFormat).toBeUndefined();
});

test("pickBatchInput accepts and trims a valid input", () => {
  expect(
    pickBatchInput({
      campaign: " Holiday ",
      draft: false,
      recipients: [{ ...emma, name: " Emma Johnson " }],
    }),
  ).toEqual({ campaign: "Holiday", draft: false, recipients: [emma] });
});

test("pickBatchInput rejects hand-crafted input", () => {
  const ok = { campaign: "Holiday", draft: true, recipients: [emma] };
  const cases: [unknown, string][] = [
    [null, "Invalid request"],
    [{ ...ok, campaign: "  " }, "Campaign name is required"],
    [{ ...ok, draft: "yes" }, "Invalid request"],
    [{ ...ok, recipients: [] }, "Add at least one client"],
    [
      { ...ok, recipients: Array(101).fill(emma) },
      "At most 100 clients per batch",
    ],
    [
      { ...ok, recipients: [{ ...emma, headshot: "javascript:alert(1)" }] },
      "Client 1: Headshot must be an http(s) URL",
    ],
    [{ ...ok, recipients: [{ ...emma, name: 42 }] }, "Client 1: Missing name"],
  ];
  for (const [input, message] of cases) {
    expect(() => pickBatchInput(input), message).toThrow(message);
  }
});

test("isDraft reads the render settings template", () => {
  expect(isDraft({ outputFormat: { settingsTemplate: "DRAFT" } })).toBe(true);
  expect(isDraft({ outputFormat: { settingsTemplate: null } })).toBe(false);
  expect(isDraft({ outputFormat: null })).toBe(false);
});

test("toCampaigns groups renders by batch, newest first, and skips renders without a batch", () => {
  const render = (
    id: string,
    batch: string | undefined,
    createdDate: string,
    campaign?: string,
  ): Render => ({
    id,
    state: "DONE",
    createdDate,
    attributes: batch ? { batchRenderId: batch, campaign } : null,
    outputFormat: { settingsTemplate: "DRAFT" },
  });
  expect(
    toCampaigns([
      render("1", "a", "2026-10-20T10:00:00Z", "Old"),
      render("2", "b", "2026-10-21T10:00:01Z"),
      render("3", "a", "2026-10-20T10:00:05Z", "Old"),
      render("4", undefined, "2026-10-22T10:00:00Z"),
    ]),
  ).toEqual([
    {
      id: "b",
      name: "Untitled",
      createdDate: "2026-10-21T10:00:01Z",
      videos: 1,
      draft: true,
    },
    {
      id: "a",
      name: "Old",
      createdDate: "2026-10-20T10:00:05Z",
      videos: 2,
      draft: true,
    },
  ]);
});

test("emailSnippet links the thumbnail to the video and escapes the name", () => {
  const { html, text } = emailSnippet({
    output: "https://v/x.mp4?a=1&b=2",
    thumbnail: "https://v/x.png",
    name: `Emma "<b>" & co`,
  });
  expect(text).toBe("https://v/x.mp4?a=1&b=2");
  expect(html).toBe(
    '<a href="https://v/x.mp4?a=1&amp;b=2"><img src="https://v/x.png" alt="Holiday video for Emma &quot;&lt;b&gt;&quot; &amp; co" width="480"></a>',
  );
});
