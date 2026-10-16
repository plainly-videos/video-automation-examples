import { AdFrames } from "@/components/ad-frames";
import { ApiRequest } from "@/components/api-request";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type Ad,
  type Format,
  type RenderTarget,
  toParameters,
} from "@/lib/ad";
import { products } from "@/products";

// Text size relative to the frame width, so the copy fits every format
const TEXT_SIZE: Record<Format, string> = {
  "16:9": "3.5cqw",
  "9:16": "8cqw",
  "1:1": "5.5cqw",
};

// A rough HTML version of the ad, the real one comes from After Effects.
// The video shows the hook, one slide per product and the call to action
// one after another, the preview puts them on one frame
export function AdPreview({ ad, format }: { ad: Ad; format: Format }) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-evenly bg-linear-to-b from-white to-neutral-200 p-[0.8em] text-black"
      style={{ fontSize: TEXT_SIZE[format] }}
    >
      <p className="text-center text-[1.6em] leading-none font-extrabold uppercase text-balance">
        {ad.hook}
      </p>
      <div className="grid w-full grid-cols-3 gap-[0.6em]">
        {ad.slots.map((slot, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: the slots never move
          <div key={i} className="grid grid-cols-[minmax(0,1fr)] gap-[0.4em]">
            <div className="relative">
              <img
                src={products[slot.productId].image}
                alt=""
                className="aspect-square w-full rounded-[0.4em] object-cover"
              />
              <span className="absolute right-[0.3em] bottom-[0.3em] max-w-[90%] truncate rounded-full bg-black px-[0.5em] text-[0.55em] font-bold text-white">
                {ad.button}
              </span>
            </div>
            <div className="flex items-center gap-[0.3em] rounded-full border border-black p-[0.15em] pl-[0.5em] text-[0.6em] font-bold uppercase">
              <span className="min-w-0 flex-1 truncate">{slot.name}</span>
              <span className="rounded-full bg-black px-[0.4em] text-white">
                {slot.price}
              </span>
            </div>
          </div>
        ))}
      </div>
      <p className="text-center text-[1.3em] leading-none font-extrabold uppercase text-balance">
        {ad.cta}
      </p>
    </div>
  );
}

export function PreviewCard({
  ad,
  adId,
  target,
}: {
  ad: Ad;
  adId: string;
  target?: RenderTarget;
}) {
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
      <ApiRequest
        parameters={toParameters(ad)}
        adId={adId}
        target={target}
        className="rounded-none border-t pt-(--card-spacing)"
      />
    </Card>
  );
}
