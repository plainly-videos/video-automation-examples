import { FieldApi, FormApi } from "@tanstack/react-form";
import { expect, test } from "vitest";
import { replaceVersions, type VersionFields } from "@/lib/form";
import { copySchema } from "@/lib/localization";

const version = (subheadline: string): VersionFields => ({
  language: "de",
  copy: { headline: "Creme", subheadline, cta: "Kaufen" },
  font: { url: "", name: "" },
});

// The review form with one card's subheadline field, validated like the app does
function reviewForm(first: string) {
  const form = new FormApi({
    defaultValues: { versions: [] as VersionFields[] },
  });
  form.mount();
  replaceVersions(form, [version(first)]);
  const schema = copySchema("latin").shape.subheadline;
  const field = new FieldApi({
    form,
    name: "versions[0].copy.subheadline",
    validators: { onMount: schema, onChange: schema },
  });
  field.mount();
  return { form, field };
}

test("translating again clears an error the new text no longer has", () => {
  const { form, field } = reviewForm("x".repeat(81));
  expect(field.state.meta.errors).not.toEqual([]);

  replaceVersions(form, [version("x".repeat(70))]);
  expect(field.state.meta.errors).toEqual([]);
  expect(form.state.canSubmit).toBe(true);
});

test("translating again flags new text that is too long", () => {
  const { form, field } = reviewForm("x".repeat(10));
  expect(field.state.meta.errors).toEqual([]);

  replaceVersions(form, [version("x".repeat(90))]);
  expect(field.state.meta.errors).not.toEqual([]);
  expect(form.state.canSubmit).toBe(false);
});
