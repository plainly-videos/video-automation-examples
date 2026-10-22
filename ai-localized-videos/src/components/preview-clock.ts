import { useSyncExternalStore } from "react";
import { LENGTH, STILL } from "@/components/preview-data";

// Seconds into the video. One animation frame loop for every preview on the
// page, it runs while any of them is mounted
const clock = { t: STILL, frame: 0, listeners: new Set<() => void>() };

function subscribe(listener: () => void) {
  clock.listeners.add(listener);
  if (
    clock.listeners.size === 1 &&
    !matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    clock.frame = requestAnimationFrame(function tick(now) {
      clock.t = (now / 1000) % LENGTH;
      for (const notify of clock.listeners) notify();
      clock.frame = requestAnimationFrame(tick);
    });
  }
  return () => {
    clock.listeners.delete(listener);
    if (clock.listeners.size === 0) cancelAnimationFrame(clock.frame);
  };
}

export const useClock = () =>
  useSyncExternalStore(
    subscribe,
    () => clock.t,
    () => STILL,
  );
