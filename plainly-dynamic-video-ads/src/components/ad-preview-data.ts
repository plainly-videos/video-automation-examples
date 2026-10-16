// ============================================================================
// HAND-MADE PREVIEW DATA, SPECIFIC TO OUR TEMPLATE
//
// Plainly does not give you a live preview of a template. We made this one
// ourselves for this example: we rendered the "Dynamic Video Ads" template
// once per format, went through the videos frame by frame, and wrote down
// when things happen and where they sit. The numbers below are those
// measurements, and AdPreview plays them back in HTML.
//
// None of this comes from Plainly or from the After Effects project. It
// does not update when the template changes, and it does not work for any
// other template. If you build your own app and want a preview like this,
// you need your own solution: measure your template the same way, export
// it with a tool such as Bodymovin/Lottie, show a rendered sample video, or
// skip the preview. Treat this file as an example of the idea, not as
// something to reuse.
// ============================================================================

import type { Format } from "@/lib/ad";

// Timings in seconds, read off renders of the template
export const LENGTH = 13;
export const MOVE = 0.6; // how long a scene change takes
export const INTRO_OUT = 1.2; // the products push the intro down
export const PILL_IN = 1.8;
export const CHIP_IN = 2.6;
export const NAMES_IN = [2.6, 5, 7.9]; // each product's name and price
export const MOVES = [4.45, 7.35]; // the carousel moves to the next product
export const OUTRO_IN = 9.55; // the outro pushes the products out to the left
// Shown before the clock starts, and to people who prefer reduced motion
export const STILL = 3.4;

// Sizes and positions in cqw (percent of the frame width), measured on the
// rendered videos. `y` values are vertical centers
export type Layout = {
  intro: {
    logo: { y: number; size: number };
    hook: { top: number; size: number; width: number };
    cards: {
      size: number;
      top: number;
      side: number;
      sideX: number;
      sideTop: number;
      tilt: number;
    };
  };
  slide: {
    logo?: { y: number; size: number };
    card: number;
    top: number;
    spacing: number;
    sideScale: number;
    sideOpacity: number;
    tilt: number;
  };
  chip: { x: number; y: number; size: number };
  pill: { inset: number; y: number; size: number };
  outro: { logo: number; size: number; width: number };
  // Square ads show the photo edge to edge with white pill and button
  fullBleed?: boolean;
};

export const LAYOUTS: Record<Format, Layout> = {
  "16:9": {
    intro: {
      logo: { y: 8.9, size: 3.1 },
      hook: { top: 10.6, size: 7, width: 56 },
      cards: { size: 34, top: 32, side: 36, sideX: 27, sideTop: 38, tilt: 7 },
    },
    slide: {
      card: 39.5,
      top: 4.2,
      spacing: 44,
      sideScale: 0.5,
      sideOpacity: 0.55,
      tilt: 6,
    },
    chip: { x: 74, y: 43, size: 3.1 },
    pill: { inset: 5.2, y: 49.4, size: 2.7 },
    outro: { logo: 4.2, size: 6.25, width: 52 },
  },
  "9:16": {
    intro: {
      logo: { y: 34, size: 7.5 },
      hook: { top: 69.2, size: 11.7, width: 80 },
      cards: {
        size: 60,
        top: 128,
        side: 40,
        sideX: 45,
        sideTop: 140,
        tilt: 10,
      },
    },
    slide: {
      logo: { y: 26, size: 7.8 },
      card: 85,
      top: 38.5,
      spacing: 100,
      sideScale: 1,
      sideOpacity: 1,
      tilt: 0,
    },
    chip: { x: 50, y: 122.5, size: 4.4 },
    pill: { inset: 7.5, y: 134.5, size: 4.8 },
    outro: { logo: 7.5, size: 9.3, width: 75 },
  },
  "1:1": {
    intro: {
      logo: { y: 26, size: 6 },
      hook: { top: 29.4, size: 10.6, width: 88 },
      cards: { size: 37, top: 70, side: 30, sideX: 27, sideTop: 78, tilt: 9 },
    },
    slide: {
      card: 100,
      top: 0,
      spacing: 100,
      sideScale: 1,
      sideOpacity: 1,
      tilt: 0,
    },
    chip: { x: 79.6, y: 76.3, size: 5.4 },
    pill: { inset: 7.4, y: 88.2, size: 4.8 },
    outro: { logo: 5.6, size: 7.5, width: 65 },
    fullBleed: true,
  },
};
