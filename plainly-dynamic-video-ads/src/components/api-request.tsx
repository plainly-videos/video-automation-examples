import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type Ad,
  FORMATS,
  type Format,
  renderBody,
  toParameters,
} from "@/lib/ad";

// The body createAd sends for one format, with placeholders for what only
// the server knows
const bodyFor = (ad: Ad, format: Format) =>
  JSON.stringify(
    renderBody({
      projectId: "[PROJECT_ID]",
      templateId: `[TEMPLATE_ID_${format.replace(":", "x")}]`,
      adId: "[AD_ID]",
      format,
      parameters: toParameters(ad),
    }),
    null,
    2,
  );

// The capture group keeps strings and punctuation as the odd entries of split
const TOKEN = /("(?:[^"\\]|\\.)*"|[{}[\],:])/;

// Enough highlighting for JSON.stringify output, no highlighter library.
// Spans instead of innerHTML, so typed ad text can't inject markup
function Json({ text }: { text: string }) {
  const parts = text.split(TOKEN);
  return parts.map((part, i) => {
    if (i % 2 === 0) return part;
    // JSON.stringify puts the colon right after a key
    const className = !part.startsWith('"')
      ? "text-muted-foreground"
      : parts[i + 2] === ":"
        ? "text-sky-700 dark:text-sky-300"
        : undefined;
    return (
      // biome-ignore lint/suspicious/noArrayIndexKey: the text is re-split on every render
      <span key={i} className={className}>
        {part}
      </span>
    );
  });
}

// Second half of the preview card, below the frames
export function ApiRequest({ ad }: { ad: Ad }) {
  const [format, setFormat] = useState<Format>("16:9");
  const [copied, setCopied] = useState(false);
  const body = bodyFor(ad, format);

  const copy = async () => {
    await navigator.clipboard.writeText(body);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <>
      <CardHeader className="rounded-none border-t pt-(--card-spacing)">
        <CardTitle>API request</CardTitle>
        <CardDescription>
          What Render sends, once per format. Updates as you edit the ad.
        </CardDescription>
        <CardAction className="flex rounded-lg border p-0.5">
          {FORMATS.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={format === f}
              onClick={() => setFormat(f)}
              className="rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground aria-pressed:bg-muted aria-pressed:text-foreground"
            >
              {f}
            </button>
          ))}
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border font-mono text-xs">
          <div className="flex items-center justify-between gap-2 border-b py-1.5 pr-1.5 pl-3">
            <span className="truncate">
              <span className="text-emerald-500">POST</span>{" "}
              https://api.plainlyvideos.com/api/v2/renders
            </span>
            <Button variant="outline" size="sm" onClick={copy}>
              {copied ? <Check /> : <Copy />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <pre className="overflow-x-auto p-3 leading-relaxed">
            <Json text={body} />
          </pre>
        </div>
      </CardContent>
    </>
  );
}
