import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type Ad, FORMATS, type Format } from "@/lib/ad";
import { cn } from "@/lib/utils";
import { products } from "@/products";

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

// Text size relative to the frame width, so the copy fits every format
const TEXT_SIZE: Record<Format, string> = {
  "16:9": "3.5cqw",
  "9:16": "8cqw",
  "1:1": "5.5cqw",
};

// A rough HTML version of the ad, the real one comes from After Effects
export function AdPreview({ ad, format }: { ad: Ad; format: Format }) {
  return (
    <div
      className="absolute inset-0 text-white"
      style={{ fontSize: TEXT_SIZE[format] }}
    >
      <img
        src={products[ad.productId].image}
        alt=""
        className="absolute inset-0 size-full object-cover"
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 grid justify-items-start gap-[0.5em] p-[1.2em]">
        {ad.offer && (
          <span className="rounded-sm bg-white px-[0.5em] py-[0.15em] font-extrabold text-black">
            {ad.offer}
          </span>
        )}
        <p className="text-[1.8em] leading-none font-extrabold text-balance">
          {ad.headline}
        </p>
        <p className="text-[1.4em] font-bold">
          {ad.price}
          {ad.oldPrice && (
            <s className="ml-[0.4em] text-[0.65em] font-normal opacity-70">
              {ad.oldPrice}
            </s>
          )}
        </p>
        {ad.cta && (
          <span className="rounded-full bg-white px-[0.9em] py-[0.35em] font-semibold text-black">
            {ad.cta}
          </span>
        )}
      </div>
    </div>
  );
}

export function PreviewCard({ ad }: { ad: Ad }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Preview</CardTitle>
        <CardDescription>
          Layout preview only. The final look comes from the After Effects
          template.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AdFrames frame={(format) => <AdPreview ad={ad} format={format} />} />
      </CardContent>
    </Card>
  );
}
