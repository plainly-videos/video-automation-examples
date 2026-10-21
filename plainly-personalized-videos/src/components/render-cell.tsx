import { Check, Copy, LoaderCircle, Mail } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { emailSnippet, isFinished, type Render, stateLabel } from "@/lib/batch";

// Copies, then says so for a moment
function CopyButton({
  label,
  icon,
  copy,
}: {
  label: string;
  icon: React.ReactNode;
  copy: () => Promise<void>;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        await copy();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? <Check /> : icon}
      {copied ? "Copied" : label}
    </Button>
  );
}

export function RenderCell({ render }: { render: Render }) {
  if (!isFinished(render)) {
    return (
      <span className="flex items-center gap-2 text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin" />
        {stateLabel(render.state)}
      </span>
    );
  }
  if (render.state !== "DONE") {
    return <span className="text-destructive">Failed</span>;
  }
  if (render.expired || !render.output) {
    return <span className="text-muted-foreground">Expired</span>;
  }

  const { output } = render;
  const thumbnail = render.thumbnailUris?.[0];

  return (
    <div className="grid w-60 gap-2">
      {/* biome-ignore lint/a11y/useMediaCaption: generated greeting video has no captions */}
      <video
        src={output}
        poster={thumbnail}
        controls
        preload="metadata"
        className="aspect-video w-full rounded-md bg-muted"
      />
      <div className="flex flex-wrap gap-2">
        <CopyButton
          label="Copy link"
          icon={<Copy />}
          copy={() => navigator.clipboard.writeText(output)}
        />
        {thumbnail && (
          <CopyButton
            label="Copy for email"
            icon={<Mail />}
            copy={() => {
              const { html, text } = emailSnippet({
                output,
                thumbnail,
                name: render.attributes?.name ?? "you",
              });
              // Gmail pastes the HTML as a clickable picture, plain text editors get the link
              return navigator.clipboard.write([
                new ClipboardItem({
                  "text/html": new Blob([html], { type: "text/html" }),
                  "text/plain": new Blob([text], { type: "text/plain" }),
                }),
              ]);
            }}
          />
        )}
      </div>
    </div>
  );
}
