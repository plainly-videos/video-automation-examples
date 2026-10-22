import { useEffect, useState } from "react";
import type { Font } from "@/lib/languages";

// One FontFace per URL and weight, shared by every preview on the page
const fonts = new Map<string, Promise<string>>();
let nextId = 0;

function loadFont({ url, name }: Font) {
  const key = `${url}#${name ? 700 : 400}`;
  let family = fonts.get(key);
  if (!family) {
    const id = `preview-font-${nextId++}`;
    // A variable font draws its default weight, Thin for Noto. Bold is close
    // to what the PostScript name picks in the render
    family = new FontFace(id, `url(${url})`, { weight: name ? "700" : "400" })
      .load()
      .then((face) => {
        document.fonts.add(face);
        return id;
      });
    // A failed URL can be fixed and tried again
    family.catch(() => fonts.delete(key));
    fonts.set(key, family);
  }
  return family;
}

// Loads a font from its URL, like Plainly does for the render. Undefined until
// it is ready, or when it fails, then the template fonts stay
export function useFont(font?: Font) {
  const [family, setFamily] = useState<string>();
  const url = font?.url;
  const name = font?.name;
  useEffect(() => {
    setFamily(undefined);
    if (!url) return;
    let active = true;
    loadFont({ url, name })
      .then((id) => active && setFamily(id))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [url, name]);
  return family;
}
