import { ApiRequest, type RenderTarget } from "@/components/api-request";
import { ComposeCard } from "@/components/compose-card";
import { ReviewCard } from "@/components/review-card";
import { Card } from "@/components/ui/card";
import { useLocalizer } from "@/components/use-localizer";
import { type Initial, toLocalization } from "@/lib/form";

// Write in English, translate, review, render. One form across both steps,
// without a <form> element, so Enter in a field never starts the renders
export function Localizer({
  initial,
  localizationId,
  target,
}: {
  initial: Initial;
  // Shown in the API request card, the server makes its own when rendering
  localizationId: string;
  target?: RenderTarget;
}) {
  const localizer = useLocalizer(initial);
  const { form } = localizer;

  return (
    <div className="grid gap-6">
      <ComposeCard localizer={localizer} />
      <ReviewCard localizer={localizer} />
      <Card>
        <form.Subscribe selector={(state) => state.values}>
          {(values) => (
            <ApiRequest
              localization={toLocalization(values)}
              localizationId={localizationId}
              target={target}
            />
          )}
        </form.Subscribe>
      </Card>
    </div>
  );
}
