import { execFileSync } from "node:child_process";
import { expect, test } from "vitest";
import {
  adFor,
  adSchema,
  adStatus,
  canRetry,
  findTemplates,
  formatOf,
  fromParameters,
  groupAds,
  isAdFinished,
  isAdId,
  isFinished,
  latestPerFormat,
  type Render,
  renderBody,
  stateLabel,
  templatesByFormat,
  toCurl,
  toParameters,
  toRender,
} from "@/lib/ad";

const valid = {
  productId: "sneakers",
  headline: "Run further. Recover faster.",
  offer: "20% OFF",
  price: "$79",
  oldPrice: "$99",
  cta: "Shop now",
};

test("formatOf maps resolutions to aspect ratios", () => {
  expect(formatOf({ width: 1920, height: 1080 })).toBe("16:9");
  expect(formatOf({ width: 1080, height: 1920 })).toBe("9:16");
  expect(formatOf({ width: 1080, height: 1080 })).toBe("1:1");
  // Not exactly 16:9, but close enough to be used as one
  expect(formatOf({ width: 1366, height: 768 })).toBe("16:9");
  expect(formatOf({ width: 800, height: 600 })).toBeUndefined();
  expect(formatOf({ width: 1920, height: 0 })).toBeUndefined();
  expect(formatOf(undefined)).toBeUndefined();
});

test("templatesByFormat picks the first template per format", () => {
  expect(
    templatesByFormat([
      { id: "wide", resolution: { width: 1920, height: 1080 } },
      { id: "wide-4k", resolution: { width: 3840, height: 2160 } },
      { id: "no-resolution" },
      { id: "tall", resolution: { width: 1080, height: 1920 } },
      { id: "old-tv", resolution: { width: 800, height: 600 } },
      { id: "square", resolution: { width: 1080, height: 1080 } },
    ]),
  ).toEqual({ "16:9": "wide", "9:16": "tall", "1:1": "square" });
});

test("findTemplates leaves out formats without a template", () => {
  expect(
    findTemplates([{ id: "wide", resolution: { width: 1920, height: 1080 } }]),
  ).toEqual({ "16:9": "wide" });
});

test("templatesByFormat names the missing format", () => {
  expect(() =>
    templatesByFormat([
      { id: "wide", resolution: { width: 1920, height: 1080 } },
      { id: "square", resolution: { width: 1080, height: 1080 } },
    ]),
  ).toThrow("Project has no 9:16 template");
  expect(() => templatesByFormat([])).toThrow("Project has no 16:9 template");
});

test("adFor fills an ad with the product's copy", () => {
  expect(adFor("sneakers")).toEqual(valid);
});

test("adSchema trims fields and allows an empty old price", () => {
  expect(
    adSchema.parse({
      ...valid,
      headline: "  Run further. Recover faster.  ",
      oldPrice: "",
    }),
  ).toEqual({ ...valid, oldPrice: "" });
});

test("adSchema rejects unknown products", () => {
  expect(() => adSchema.parse({ ...valid, productId: "boat" })).toThrow(
    "Unknown product",
  );
  // Inherited object keys are not products
  expect(() => adSchema.parse({ ...valid, productId: "toString" })).toThrow(
    "Unknown product",
  );
  expect(() => adSchema.parse(null)).toThrow("expected object");
});

test("adSchema requires every field except old price", () => {
  expect(() => adSchema.parse({ ...valid, headline: "   " })).toThrow(
    "Headline is required",
  );
  expect(() => adSchema.parse({ ...valid, offer: undefined })).toThrow(
    "expected string",
  );
  // The browser can send anything, a number is not text
  expect(() => adSchema.parse({ ...valid, cta: 42 })).toThrow(
    "expected string",
  );
});

test("adSchema enforces length limits", () => {
  expect(() => adSchema.parse({ ...valid, headline: "x".repeat(41) })).toThrow(
    "Headline can be at most 40 characters",
  );
  expect(
    adSchema.parse({ ...valid, headline: "x".repeat(40) }).headline,
  ).toHaveLength(40);
  expect(() => adSchema.parse({ ...valid, oldPrice: "x".repeat(11) })).toThrow(
    "Old price can be at most 10 characters",
  );
});

test("toParameters maps an ad to the template parameters", () => {
  expect(toParameters(adFor("sneakers"))).toEqual({
    plainlyEditHeadline: "Run further. Recover faster.",
    plainlyEditOffer: "20% OFF",
    plainlyEditPrice: "$79",
    plainlyEditOldPrice: "$99",
    plainlyEditCta: "Shop now",
    plainlyEditImage:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1080&q=80",
  });
});

test("fromParameters reverses toParameters", () => {
  const ad = adFor("watch");
  expect(fromParameters(toParameters(ad))).toEqual(ad);
});

test("fromParameters falls back for unknown images and missing values", () => {
  expect(
    fromParameters({ plainlyEditImage: "https://example.com/boat.png" }),
  ).toEqual({
    productId: "sneakers",
    headline: "",
    offer: "",
    price: "",
    oldPrice: "",
    cta: "",
  });
});

test("renderBody tags the render with the example, ad and format", () => {
  expect(
    renderBody({
      projectId: "project",
      templateId: "template",
      adId: "ad",
      format: "9:16",
      parameters: { plainlyEditHeadline: "Hi" },
    }),
  ).toEqual({
    projectId: "project",
    templateId: "template",
    parameters: { plainlyEditHeadline: "Hi" },
    attributes: { example: "dynamic-video-ads", adId: "ad", format: "9:16" },
  });
});

const AD = "97226b64-8b8a-437d-a76e-f014d3845c42";
const OTHER_AD = "1b4e28ba-2fa1-41d2-883f-0016d3cca427";

const render = (
  format: string,
  state: string,
  createdDate: string,
  adId = AD,
): Render => ({
  id: `${adId}-${format}-${createdDate}`,
  state,
  createdDate,
  attributes: { adId, format },
  parameters: toParameters(adFor("coffee")),
});

test("isFinished treats every state except the in-progress ones as final", () => {
  for (const state of ["DONE", "INVALID", "FAILED", "CANCELLED"]) {
    expect(isFinished({ state }), state).toBe(true);
  }
  for (const state of ["PENDING", "THROTTLED", "QUEUED", "IN_PROGRESS"]) {
    expect(isFinished({ state }), state).toBe(false);
  }
});

test("stateLabel turns API states into readable text", () => {
  expect(stateLabel("DONE")).toBe("Done");
  expect(stateLabel("IN_PROGRESS")).toBe("In progress");
});

test("isAdId only accepts UUIDs", () => {
  expect(isAdId(AD)).toBe(true);
  for (const id of ["..", "", "a/b", "abc", 42, undefined, null]) {
    expect(isAdId(id), String(id)).toBe(false);
  }
});

test("latestPerFormat picks the newest render, whatever the API order", () => {
  const failed = render("1:1", "FAILED", "2026-10-15T10:00:00Z");
  const retried = render("1:1", "QUEUED", "2026-10-15T10:05:00Z");
  expect(latestPerFormat([failed, retried])["1:1"]).toBe(retried);
  expect(latestPerFormat([retried, failed])["1:1"]).toBe(retried);
});

test("latestPerFormat ignores renders without a known format", () => {
  const unknownFormat = render("4:3", "DONE", "2026-10-15T10:00:00Z");
  const noAttributes: Render = {
    ...render("1:1", "DONE", "2026-10-15T10:00:00Z"),
    attributes: null,
  };
  expect(latestPerFormat([unknownFormat, noAttributes])).toEqual({});
});

test("isAdFinished waits only for the newest render of each format", () => {
  expect(isAdFinished([])).toBe(true);
  // Formats that were never created have nothing to wait for
  expect(isAdFinished([render("16:9", "DONE", "2026-10-15T10:00:00Z")])).toBe(
    true,
  );
  expect(
    isAdFinished([
      render("16:9", "DONE", "2026-10-15T10:00:00Z"),
      render("9:16", "FAILED", "2026-10-15T10:00:00Z"),
    ]),
  ).toBe(true);
  // A retry of a failed render is in progress again
  expect(
    isAdFinished([
      render("1:1", "FAILED", "2026-10-15T10:00:00Z"),
      render("1:1", "QUEUED", "2026-10-15T10:05:00Z"),
    ]),
  ).toBe(false);
});

test("groupAds groups renders per ad, newest ad first", () => {
  const ads = groupAds([
    render("16:9", "DONE", "2026-10-15T09:00:00Z", OTHER_AD),
    render("16:9", "DONE", "2026-10-15T10:00:00Z"),
    render("9:16", "IN_PROGRESS", "2026-10-15T10:00:01Z"),
    render("1:1", "FAILED", "2026-10-15T10:00:02Z"),
    // Not created by this app
    { ...render("1:1", "DONE", "2026-10-15T12:00:00Z"), attributes: null },
  ]);

  expect(ads.map((ad) => ad.adId)).toEqual([AD, OTHER_AD]);
  expect(ads[0]).toEqual({
    adId: AD,
    createdDate: "2026-10-15T10:00:00Z",
    ad: adFor("coffee"),
    done: 1,
    rendering: 1,
    failed: 1,
  });
  // Formats that were never created count as failed
  expect(ads[1]).toMatchObject({ done: 1, rendering: 0, failed: 2 });
});

test("groupAds keeps the ad's creation time when a format is retried", () => {
  const [ad] = groupAds([
    render("1:1", "DONE", "2026-10-15T10:05:00Z"),
    render("1:1", "FAILED", "2026-10-15T10:00:00Z"),
  ]);
  expect(ad.createdDate).toBe("2026-10-15T10:00:00Z");
  expect(ad).toMatchObject({ done: 1, failed: 2, rendering: 0 });
});

test("adStatus summarizes an ad in one badge", () => {
  expect(adStatus({ done: 1, failed: 1, rendering: 1 })).toEqual({
    label: "Rendering",
    tone: "rendering",
  });
  expect(adStatus({ done: 2, failed: 1, rendering: 0 })).toEqual({
    label: "1 failed",
    tone: "failed",
  });
  expect(adStatus({ done: 3, failed: 0, rendering: 0 })).toEqual({
    label: "3/3 done",
    tone: "done",
  });
});

test("canRetry allows only failed or missing formats", () => {
  expect(canRetry(undefined)).toBe(true);
  for (const state of ["FAILED", "INVALID", "CANCELLED"]) {
    expect(canRetry({ state }), state).toBe(true);
  }
  // Retrying these would only create duplicate renders
  for (const state of ["DONE", "PENDING", "QUEUED", "IN_PROGRESS"]) {
    expect(canRetry({ state }), state).toBe(false);
  }
});

test("fromParameters ignores values that are not text", () => {
  // Any render in the org can carry the example attribute with odd parameters
  const ad = fromParameters({
    plainlyEditHeadline: 42,
    plainlyEditOffer: { text: "20% OFF" },
    plainlyEditPrice: "$79",
  });
  expect(ad).toMatchObject({ headline: "", offer: "", price: "$79" });
});

test("toRender keeps only the fields the app shows", () => {
  const raw = {
    ...render("16:9", "DONE", "2026-10-15T10:00:00Z"),
    output: "https://cdn.example.com/ad.mp4",
    projectZipUrl: "https://storage.example.com/project.zip",
    createdBy: "user-id",
    webhook: { url: "https://example.com/hook" },
  };
  const slim = toRender(raw);
  expect(slim).not.toHaveProperty("projectZipUrl");
  expect(slim).not.toHaveProperty("createdBy");
  expect(slim).not.toHaveProperty("webhook");
  expect(slim).toMatchObject({
    id: raw.id,
    state: "DONE",
    output: "https://cdn.example.com/ad.mp4",
    attributes: raw.attributes,
    parameters: raw.parameters,
  });
});

test("toRender keeps only the error message", () => {
  const failed = {
    ...render("16:9", "FAILED", "2026-10-15T10:00:00Z"),
    error: { message: "Missing font", details: "stack trace" },
  };
  expect(toRender(failed).error).toEqual({ message: "Missing font" });
});

test("groupAds falls back to defaults when no render has parameters", () => {
  const { parameters: _, ...bare } = render(
    "16:9",
    "DONE",
    "2026-10-15T10:00:00Z",
  );
  const [ad] = groupAds([bare]);
  expect(ad.ad).toEqual(fromParameters({}));
});

test("toCurl passes the body to the shell unchanged", () => {
  const body = JSON.stringify({ headline: `Don't "wait" $(rm -rf /) \`x\`` });
  // A fake curl prints its last argument, the body the shell handed over
  const fakeCurl = 'curl() { for arg; do :; done; printf %s "$arg"; }\n';
  const out = execFileSync("sh", ["-c", fakeCurl + toCurl(body)], {
    encoding: "utf8",
  });
  expect(out).toBe(body);
});
