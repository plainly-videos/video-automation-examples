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
  type Localization,
  RENDERS_URL,
  renderBody,
  toCurl,
} from "@/lib/localization";

export type RenderTarget = { projectId: string; templateId?: string };

// The body createLocalization sends for one language. Placeholders stay when
// the server could not load the project
const bodyFor = (
  { design, versions }: Localization,
  language: string,
  localizationId: string,
  target?: RenderTarget,
) =>
  JSON.stringify(
    renderBody({
      projectId: target?.projectId ?? "[PROJECT_ID]",
      templateId: target?.templateId ?? "[TEMPLATE_ID]",
      localizationId,
      languages: versions.map((version) => version.language),
      design,
      version:
        versions.find((version) => version.language === language) ??
        versions[0],
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

export function ApiRequest({
  localization,
  localizationId,
  target,
  className,
}: {
  localization: Localization;
  localizationId: string;
  target?: RenderTarget;
  className?: string;
}) {
  const codes = localization.versions.map((version) => version.language);
  // Starts on the first translation, where a font may show up in properties
  const [picked, setPicked] = useState<string>();
  const language =
    picked && codes.includes(picked) ? picked : (codes[1] ?? codes[0]);
  const [copied, setCopied] = useState<"copied" | "failed">();
  const body = bodyFor(localization, language, localizationId, target);

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
          One request per language. Copy gives a curl command that reads
          PLAINLY_API_KEY from your shell.
        </CardDescription>
        <CardAction className="flex flex-wrap justify-end rounded-lg border p-0.5">
          {codes.map((code) => (
            <button
              key={code}
              type="button"
              aria-pressed={language === code}
              onClick={() => setPicked(code)}
              className="rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground uppercase aria-pressed:bg-muted aria-pressed:text-foreground"
            >
              {code}
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
