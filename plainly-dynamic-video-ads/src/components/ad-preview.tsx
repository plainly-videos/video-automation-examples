import { type CSSProperties, useEffect, useState } from "react";
import { AdFrames } from "@/components/ad-frames";
import {
  CHIP_IN,
  INTRO_OUT,
  LAYOUTS,
  LENGTH,
  MOVE,
  MOVES,
  NAMES_IN,
  OUTRO_IN,
  PILL_IN,
  STILL,
} from "@/components/ad-preview-data";
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
  type Slot,
  toParameters,
} from "@/lib/ad";
import { cn } from "@/lib/utils";
import { products } from "@/products";

const cq = (n: number) => `${n}cqw`;
const clamp = (x: number) => Math.min(1, Math.max(0, x));

// Eased progress, 0 to 1, of a change that starts at `from`
const tween = (t: number, from: number, length = MOVE) => {
  const x = clamp((t - from) / length);
  return x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2;
};

// Seconds into the video
function useClock() {
  const [t, setT] = useState(STILL);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let id = requestAnimationFrame(function tick(now) {
      setT((now / 1000) % LENGTH);
      id = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(id);
  }, []);
  return t;
}

// Fades the parts in one after another, so they go from grey to black
function Reveal({
  parts,
  t,
  from,
}: {
  parts: string[];
  t: number;
  from: number;
}) {
  const step = 0.6 / Math.max(parts.length - 1, 1);
  return parts.map((part, i) => (
    // biome-ignore lint/suspicious/noArrayIndexKey: parts repeat and never move
    <span key={i} style={{ opacity: clamp((t - from - i * step) / 0.4) }}>
      {part}
    </span>
  ));
}

const words = (text: string) => text.split(/(\s+)/);

// The template's default logo, the app never replaces it
function Logo({ size, style }: { size: number; style?: CSSProperties }) {
  return (
    <span
      className="font-sans font-bold leading-none"
      style={{ fontSize: cq(size), ...style }}
    >
      plainly
    </span>
  );
}

function Photo({ slot, style }: { slot: Slot; style: CSSProperties }) {
  return (
    <img
      src={products[slot.productId].image}
      alt=""
      className="absolute aspect-square object-cover"
      style={style}
    />
  );
}

// "$79" shows the currency sign raised, like the template does
function Price({ price }: { price: string }) {
  const [, sign, amount] = price.match(/^([^\w\s]*)(.*)$/) ?? ["", "", price];
  return (
    <>
      {sign && <sup className="text-[0.5em]">{sign}</sup>}
      {amount}
    </>
  );
}

// An HTML version of the ad that plays the same 13 seconds as the video.
// Close to the template, the final look still comes from After Effects.
// The timings and layouts are hand-measured, see ad-preview-data.ts
function AdPreview({ ad, format, t }: { ad: Ad; format: Format; t: number }) {
  const { intro, slide, chip, pill, outro, fullBleed } = LAYOUTS[format];
  const introOut = tween(t, INTRO_OUT);
  const outroIn = tween(t, OUTRO_IN);
  // 0 to 2 as the carousel moves from the first product to the last
  const position = tween(t, MOVES[0]) + tween(t, MOVES[1]);
  const current = Math.round(position);
  const slot = ad.slots[current];
  // The price bubble swaps sides on every move, right, left, right
  const priceX = 1 - tween(t, MOVES[0]) + tween(t, MOVES[1]);
  const fill = fullBleed ? "bg-white text-black" : "bg-black text-white";

  return (
    <div className="absolute inset-0 overflow-hidden bg-linear-to-b from-white to-neutral-200 font-anton text-black">
      <div
        className="absolute inset-0"
        style={{ transform: `translateY(${introOut * 100}%)` }}
      >
        <Logo
          size={intro.logo.size}
          style={{
            position: "absolute",
            left: "50%",
            top: cq(intro.logo.y),
            transform: "translate(-50%, -50%)",
            opacity: clamp((t - 0.5) / 0.3),
          }}
        />
        <p
          className="absolute inset-x-0 mx-auto text-center leading-[1.25]"
          style={{
            top: cq(intro.hook.top),
            fontSize: cq(intro.hook.size),
            maxWidth: cq(intro.hook.width),
          }}
        >
          <Reveal parts={words(ad.hook)} t={t} from={0} />
        </p>
        {[
          [2, -1],
          [1, 1],
          [0, 0],
        ].map(([i, side]) => {
          const { cards } = intro;
          const size = side ? cards.side : cards.size;
          const rise = 1 - tween(t, side ? 0.1 : -0.4, 0.7);
          return (
            <Photo
              key={i}
              slot={ad.slots[i]}
              style={{
                width: cq(size),
                left: cq(50 + side * cards.sideX - size / 2),
                top: cq((side ? cards.sideTop : cards.top) + rise * 30),
                borderRadius: cq(size * 0.06),
                transform: `rotate(${side * cards.tilt}deg)`,
              }}
            />
          );
        })}
      </div>

      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${-outroIn * 100}%, ${(introOut - 1) * 100}%)`,
          // Parked behind the outro, its edge would show through
          visibility: outroIn === 1 ? "hidden" : undefined,
        }}
      >
        {slide.logo && (
          <Logo
            size={slide.logo.size}
            style={{
              position: "absolute",
              left: "50%",
              top: cq(slide.logo.y),
              transform: "translate(-50%, -50%)",
            }}
          />
        )}
        {ad.slots.map((s, i) => {
          // -1 left of the current product, 0 centered, 1 right of it
          const d = ((i - position + 4.5) % 3) - 1.5;
          const away = Math.min(Math.abs(d), 1);
          return (
            <Photo
              // biome-ignore lint/suspicious/noArrayIndexKey: the slots never move
              key={i}
              slot={s}
              style={{
                width: cq(slide.card),
                left: cq(50 - slide.card / 2 + d * slide.spacing),
                top: cq(slide.top),
                borderRadius: fullBleed ? 0 : cq(slide.card * 0.055),
                opacity:
                  (1 - (1 - slide.sideOpacity) * away) *
                  clamp((1.5 - Math.abs(d)) / 0.3),
                transform: `rotate(${d * slide.tilt}deg) scale(${1 - (1 - slide.sideScale) * away})`,
                zIndex: Math.round(10 - away * 5),
              }}
            />
          );
        })}
        <span
          className={cn(
            "absolute z-20 flex items-center rounded-full px-[0.8em] whitespace-nowrap",
            fill,
          )}
          style={{
            left: cq(chip.x),
            top: cq(chip.y),
            fontSize: cq(chip.size),
            height: cq(chip.size * 1.7),
            transform: `translate(-50%, -50%) scale(${tween(t, CHIP_IN, 0.3)})`,
          }}
        >
          {ad.button}
        </span>
        <div
          className={cn(
            "absolute z-20 rounded-full border-[0.07em]",
            fullBleed ? "border-white text-white" : "border-black",
          )}
          style={{
            left: cq(pill.inset),
            right: cq(pill.inset),
            top: cq(pill.y),
            height: cq(pill.size * 1.9),
            fontSize: cq(pill.size),
            transform: `translateY(-50%) scaleX(${tween(t, PILL_IN, 0.5)})`,
          }}
        >
          <span
            className={cn(
              "absolute inset-y-0 flex items-center px-[0.9em] whitespace-nowrap",
              current % 2 ? "right-0" : "left-0",
            )}
          >
            <span>
              <Reveal
                key={current}
                parts={Array.from(slot.name)}
                t={t}
                from={NAMES_IN[current]}
              />
            </span>
          </span>
          <span
            className={cn(
              "absolute -inset-y-[0.07em] flex items-center rounded-full px-[0.6em] whitespace-nowrap",
              fill,
            )}
            style={{
              left: `calc(${priceX} * (100% + 0.14em) - 0.07em)`,
              transform: `translateX(${-priceX * 100}%) scale(${tween(t, CHIP_IN, 0.3)})`,
            }}
          >
            <Price price={slot.price} />
          </span>
        </div>
      </div>

      <div
        className="absolute inset-0 flex flex-col items-center justify-center bg-linear-to-b from-white to-neutral-200"
        style={{
          paddingBottom: cq(10),
          transform: `translateX(${(1 - outroIn) * 100}%)`,
        }}
      >
        <Logo size={outro.logo} />
        <p
          className="text-center leading-[1.15]"
          style={{ fontSize: cq(outro.size), maxWidth: cq(outro.width) }}
        >
          <Reveal parts={words(ad.cta)} t={t} from={OUTRO_IN + 0.4} />
        </p>
      </div>
    </div>
  );
}

// One clock for the three frames. Ticking here re-renders only them
function Previews({ ad }: { ad: Ad }) {
  const t = useClock();
  return (
    <AdFrames frame={(format) => <AdPreview ad={ad} format={format} t={t} />} />
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
          Plays like the video, built in HTML. The final look comes from the
          After Effects template.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Previews ad={ad} />
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
