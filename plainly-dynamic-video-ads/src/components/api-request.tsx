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
  FORMATS,
  type Format,
  RENDERS_URL,
  type RenderTarget,
  renderBody,
  toCurl,
} from "@/lib/ad";

// The body createAd sends for one format. Placeholders stay when the server
// could not load the project
const bodyFor = (
  parameters: Record<string, string>,
  format: Format,
  adId: string,
  target?: RenderTarget,
) =>
  JSON.stringify(
    renderBody({
      projectId: target?.projectId ?? "[PROJECT_ID]",
      templateId:
        target?.templates[format] ??
        `[TEMPLATE_ID_${format.replace(":", "x")}]`,
      adId,
      format,
      parameters,
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
export function ApiRequest({
  parameters,
  adId,
  target,
  className,
}: {
  parameters: Record<string, string>;
  adId: string;
  target?: RenderTarget;
  className?: string;
}) {
  const [format, setFormat] = useState<Format>("16:9");
  const [copied, setCopied] = useState<"copied" | "failed">();
  const body = bodyFor(parameters, format, adId, target);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(toCurl(body));
      setCopied("copied");
    } catch {
      // The clipboard only exists on https and localhost, and can be denied
      setCopied("failed");
    }
    setTimeout(() => setCopied(undefined), 1500);
  };

  return (
    <>
      <CardHeader className={className}>
        <CardTitle>API request</CardTitle>
        <CardDescription>
          One request per format. Copy gives a curl command that reads
          PLAINLY_API_KEY from your shell.
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
      {/* Fills the card when the form next to it is taller */}
      <CardContent className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col rounded-lg border font-mono text-xs">
          <div className="flex items-center justify-between gap-2 border-b py-1.5 pr-1.5 pl-3">
            <span className="truncate">
              <span className="text-emerald-500">POST</span> {RENDERS_URL}
            </span>
            <Button variant="outline" size="sm" onClick={copy}>
              {copied === "copied" ? <Check /> : <Copy />}
              {copied === "copied"
                ? "Copied"
                : copied === "failed"
                  ? "Copy failed"
                  : "Copy curl"}
            </Button>
          </div>
          <pre className="flex flex-1 items-center overflow-x-auto p-3 leading-relaxed">
            {/* One flex item, so the text nodes stay inline */}
            <code>
              <Json text={body} />
            </code>
          </pre>
        </div>
      </CardContent>
    </>
  );
}
