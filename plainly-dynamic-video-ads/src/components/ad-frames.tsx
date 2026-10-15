import { FORMATS, type Format } from "@/lib/ad";
import { cn } from "@/lib/utils";

const FRAMES: Record<
  Format,
  { aspect: string; placement: string; figure?: string }
> = {
  "16:9": { aspect: "aspect-video", placement: "YouTube, in-stream" },
  "9:16": {
    aspect: "aspect-[9/16]",
    placement: "Stories, Reels, TikTok",
    // Full width would be very tall on phones
    figure: "max-sm:w-1/2 max-sm:justify-self-center",
  },
  "1:1": { aspect: "aspect-square", placement: "Feed" },
};

// Column widths follow the aspect ratios (16/9 : 9/16 : 1, times 9),
// so all three frames share one height
export function AdFrames({
  frame,
  badge,
}: {
  frame: (format: Format) => React.ReactNode;
  badge?: (format: Format) => React.ReactNode;
}) {
  return (
    <div className="grid items-start gap-4 sm:grid-cols-[16fr_5.0625fr_9fr]">
      {FORMATS.map((format) => (
        <figure
          key={format}
          className={cn("grid min-w-0 gap-1.5", FRAMES[format].figure)}
        >
          <figcaption className="flex flex-wrap items-center justify-between gap-1 text-xs font-medium">
            {format}
            {badge?.(format)}
          </figcaption>
          <div
            className={cn(
              "@container relative flex items-center justify-center overflow-hidden rounded-md bg-muted",
              FRAMES[format].aspect,
            )}
          >
            {frame(format)}
          </div>
          <span className="text-xs text-muted-foreground">
            {FRAMES[format].placement}
          </span>
        </figure>
      ))}
    </div>
  );
}
