import type { Copy } from "@/lib/localization";

// Font fields are text inputs, empty means the template fonts
export type FontFields = { url: string; name: string };
export type VersionFields = { language: string; copy: Copy; font: FontFields };

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
