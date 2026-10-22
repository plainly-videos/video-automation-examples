// Hand-made preview data for this one template. Plainly has no live preview,
// so we rendered the template and measured the video frame by frame.
// LocalizedPreview plays these numbers back in HTML. They don't follow
// template changes and fit no other template. For your own app, measure your
// template the same way, export it with Bodymovin/Lottie, show a rendered
// sample video, or skip the preview.

// Timings in seconds, read off a render of the template
export const LENGTH = 8;
export const BOTTLE_IN = [0.05, 1.2]; // the product rises from below
export const HEADLINE_ZOOM = 2.5; // the headline grows into place
export const SUBHEADLINE_IN = 1.2; // its words fade in one after another
export const BUTTON_IN = [1.3, 0.8]; // the button slides up and fades in
// Shown before the clock starts, and to people who prefer reduced motion
export const STILL = 4;

// Sizes and positions in cqw (percent of the frame width) at STILL.
// `y` values are vertical centers, `top` values top edges
export const LAYOUT = {
  logo: { y: 10.6, size: 5.6 },
  text: {
    top: 15.6,
    headline: 7.9,
    subheadline: 2.85,
    width: 83,
    subWidth: 60,
  },
  bottle: { left: 35.2, top: 38.7, width: 30.5 },
  button: { top: 83, height: 7.3, padX: 5, size: 4.6 },
  // The whole scene zooms in slowly, this much per second
  zoom: 0.006,
  leaves: [
    // Top right corner
    {
      src: "/preview/leaves-2.png",
      left: 78,
      top: -24,
      width: 34,
      rotate: 190,
      blur: 0,
    },
    // Left edge, behind the product
    {
      src: "/preview/leaves-1.png",
      left: -31,
      top: 38,
      width: 50,
      rotate: 15,
      blur: 0,
    },
    // Out of focus at the bottom
    {
      src: "/preview/monstera.png",
      left: 2,
      top: 60,
      width: 52,
      rotate: 0,
      blur: 0.5,
    },
  ],
};
