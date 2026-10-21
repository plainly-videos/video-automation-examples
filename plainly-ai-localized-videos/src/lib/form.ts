import { type Font, SOURCE } from "@/lib/languages";
import type { Copy, Design, Localization } from "@/lib/localization";

// Font fields are text inputs, empty means the template fonts
export type FontFields = { url: string; name: string };
export type VersionFields = { language: string; copy: Copy; font: FontFields };

// The compose step, filled from defaults or from an earlier video
export type Initial = { copy: Copy; design: Design; languages: string[] };
export type Values = Initial & { versions: VersionFields[] };

export const toFont = ({ url, name }: FontFields): Font | undefined =>
  url.trim()
    ? { url: url.trim(), ...(name.trim() && { name: name.trim() }) }
    : undefined;

export const fontFields = (font?: Font): FontFields => ({
  url: font?.url ?? "",
  name: font?.name ?? "",
});

// What createLocalization receives: English from the compose step, then the
// reviewed translations
export const toLocalization = ({
  copy,
  design,
  versions,
}: Values): Localization => ({
  design,
  versions: [
    { language: SOURCE.code, copy },
    ...versions.map(({ language, copy, font }) => ({
      language,
      copy,
      font: toFont(font),
    })),
  ],
});

// Puts new translations into the review form. Setting the list alone keeps each
// card's fields with their old errors, since a card for the same language
// keeps its fields. Setting every field again checks the new text
export function replaceVersions(
  form: { setFieldValue: (name: never, value: never) => void },
  versions: VersionFields[],
) {
  const set = form.setFieldValue as (name: string, value: unknown) => void;
  set("versions", versions);
  versions.forEach((version, i) => {
    const fields = {
      "copy.headline": version.copy.headline,
      "copy.subheadline": version.copy.subheadline,
      "copy.cta": version.copy.cta,
      "font.url": version.font.url,
    };
    for (const [path, value] of Object.entries(fields)) {
      set(`versions[${i}].${path}`, value);
    }
  });
}
