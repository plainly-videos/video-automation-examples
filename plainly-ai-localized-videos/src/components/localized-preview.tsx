import type { CSSProperties } from "react";
import { useClock } from "@/components/preview-clock";
import {
  BOTTLE_IN,
  BUTTON_IN,
  HEADLINE_ZOOM,
  LAYOUT,
  STILL,
  SUBHEADLINE_IN,
} from "@/components/preview-data";
import { useFont } from "@/components/preview-font";
import type { Font } from "@/lib/languages";
import type { Copy, Design } from "@/lib/localization";

const cq = (n: number) => `${n}cqw`;
const clamp = (x: number) => Math.min(1, Math.max(0, x));
// Eased progress, 0 to 1, of a change that starts at `from`
const easeOut = (t: number, from: number, length: number) =>
  1 - (1 - clamp((t - from) / length)) ** 3;

// Media inside the project can't load in the browser, the preview shows the
// same files from /public instead
const imageOf = (value: string, fallback: string) =>
  value.startsWith("https://") ? value : fallback;

// Words fade in one after another. Text without spaces, like Japanese, goes
// character by character
const words = (text: string) =>
  /\s/.test(text.trim()) ? text.split(/(\s+)/) : [...text];

// A preview that plays, kept apart so only it re-renders on every frame
export function PlayingPreview(
  props: Omit<Parameters<typeof LocalizedPreview>[0], "t">,
) {
  return <LocalizedPreview {...props} t={useClock()} />;
}

// An HTML version of the video that plays the same 8 seconds. Close to the
// template, the final look still comes from After Effects
export function LocalizedPreview({
  copy,
  design,
  font,
  t,
}: {
  copy: Copy;
  design: Design;
  font?: Font;
  t: number;
}) {
  const family = useFont(font);
  const fontOf = (template: string): CSSProperties => ({
    fontFamily: family ? `"${family}", ${template}` : template,
    fontWeight: family ? 700 : undefined,
  });
  const { logo, text, bottle, button, leaves } = LAYOUT;
  const zoom = 1 + LAYOUT.zoom * (t - STILL);
  const bottleIn = easeOut(t, BOTTLE_IN[0], BOTTLE_IN[1]);
  const buttonIn = easeOut(t, BUTTON_IN[0], BUTTON_IN[1]);
  const parts = words(copy.subheadline);
  const step = 0.8 / Math.max(parts.length - 1, 1);
  const wordIn = (i: number) => clamp((t - SUBHEADLINE_IN - i * step) / 0.3);
  // The template's gradient, lighter at the top and black at the bottom
  const background = `linear-gradient(to bottom, oklch(from ${design.colorBackground} calc(l + 0.2) calc(c * 1.5) h), oklch(from ${design.colorBackground} calc(l + 0.1) calc(c * 1.4) h) 40%, ${design.colorBackground} 65%, #000)`;

  return (
    <div
      className="@container relative aspect-square w-full overflow-hidden"
      style={{ background }}
    >
      <div className="absolute inset-0" style={{ transform: `scale(${zoom})` }}>
        {leaves.map((leaf) => (
          <img
            key={leaf.src}
            src={leaf.src}
            alt=""
            className="absolute max-w-none"
            style={{
              left: cq(leaf.left),
              top: cq(leaf.top),
              width: cq(leaf.width),
              transform: `rotate(${leaf.rotate}deg)`,
              filter: leaf.blur ? `blur(${cq(leaf.blur)})` : undefined,
            }}
          />
        ))}
        <img
          src={imageOf(design.productImage, "/product.png")}
          alt=""
          className="absolute max-w-none"
          style={{
            left: cq(bottle.left),
            top: cq(bottle.top + (1 - bottleIn) * (100 - bottle.top)),
            width: cq(bottle.width),
          }}
        />
        <img
          src={imageOf(design.logo, "/logo.png")}
          alt=""
          className="absolute -translate-x-1/2 -translate-y-1/2 object-contain"
          style={{
            left: "50%",
            top: cq(logo.y),
            width: cq(logo.size),
            height: cq(logo.size),
          }}
        />
        <div
          className="absolute inset-x-0 mx-auto flex flex-col items-center text-center text-white"
          style={{ top: cq(text.top), maxWidth: cq(text.width) }}
        >
          <p
            className="uppercase leading-none"
            style={{
              ...fontOf("var(--font-anton)"),
              fontSize: cq(text.headline),
              transform: `scale(${0.88 + 0.12 * easeOut(t, 0, HEADLINE_ZOOM)})`,
            }}
          >
            {copy.headline}
          </p>
          <p
            className="leading-[1.3]"
            style={{
              ...fontOf("var(--font-jost)"),
              fontSize: cq(text.subheadline),
              maxWidth: cq(text.subWidth),
            }}
          >
            {parts.map((part, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: parts repeat and never move
              <span key={i} style={{ opacity: wordIn(i) }}>
                {part}
              </span>
            ))}
          </p>
        </div>
        <div
          className="absolute left-1/2 flex -translate-x-1/2 items-center rounded-[0.6cqw] whitespace-nowrap text-white uppercase"
          style={{
            ...fontOf("var(--font-din)"),
            top: cq(button.top + (1 - buttonIn) * 11),
            height: cq(button.height),
            paddingInline: cq(button.padX),
            fontSize: cq(button.size),
            fontWeight: 700,
            background: design.colorButton,
            opacity: buttonIn > 0 ? 1 : 0,
          }}
        >
          {copy.cta}
        </div>
      </div>
    </div>
  );
}
