import { Check, CircleAlert, Clock, Copy, Mail } from "lucide-react";
import { useState } from "react";
import { Headshot } from "@/components/clients-table";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { emailSnippet, isFinished, type Render, stateLabel } from "@/lib/batch";
import { cn } from "@/lib/utils";

function CopyButton({
  label,
  icon,
  copy,
}: {
  label: string;
  icon: React.ReactNode;
  copy: () => Promise<void>;
}) {
  const [copied, setCopied] = useState<"copied" | "failed">();
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        try {
          await copy();
          setCopied("copied");
        } catch {
          // The clipboard only exists on https and localhost, and can be denied
          setCopied("failed");
        }
        setTimeout(() => setCopied(undefined), 2000);
      }}
    >
      {copied === "copied" ? <Check /> : icon}
      {copied === "copied"
        ? "Copied"
        : copied === "failed"
          ? "Copy failed"
          : label}
    </Button>
  );
}

export function RenderCard({ render }: { render: Render }) {
  const { output } = render;
  const thumbnail = render.thumbnailUris?.[0];
  const ready = render.state === "DONE" && !render.expired && output;
  const subtitle = [render.attributes?.title, render.attributes?.company]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <RenderMedia render={render} />
      <div className="grid grid-cols-1 gap-3 p-3">
        <div className="flex items-center gap-3">
          <Headshot
            src={render.attributes?.headshot}
            name={render.attributes?.name}
          />
          <div className="min-w-0">
            <p className="truncate font-medium">
              {render.attributes?.name ?? "Unknown client"}
            </p>
            <p className="truncate text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        {ready && (
          <div className="grid grid-cols-2 gap-2">
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
        )}
      </div>
    </div>
  );
}

function RenderMedia({ render }: { render: Render }) {
  const placeholder = (
    icon: React.ReactNode,
    title: string,
    className: string,
    description?: string,
  ) => (
    <Empty className={cn("aspect-video gap-2 rounded-none p-4", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon">{icon}</EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {description && (
          <EmptyDescription className="line-clamp-3 text-xs text-current">
            {description}
          </EmptyDescription>
        )}
      </EmptyHeader>
    </Empty>
  );

  if (!isFinished(render)) {
    return placeholder(<Spinner />, stateLabel(render.state), "bg-muted");
  }
  if (render.state !== "DONE") {
    // message can be null, code is always set
    const reason = render.error?.message ?? render.error?.code;
    return placeholder(
      <CircleAlert />,
      "Failed",
      "bg-destructive/10 text-destructive",
      reason,
    );
  }
  if (render.expired || !render.output) {
    return placeholder(<Clock />, "Expired", "bg-muted");
  }
  return (
    // biome-ignore lint/a11y/useMediaCaption: generated greeting video has no captions
    <video
      src={render.output}
      poster={render.thumbnailUris?.[0]}
      controls
      preload="metadata"
      className="aspect-video w-full bg-muted"
    />
  );
}
