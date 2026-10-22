import { Link } from "@tanstack/react-router";
import { Languages } from "lucide-react";
import { LocalizationStatusBadge } from "@/components/render-frame";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import type { LocalizationSummary } from "@/lib/renders";
import { formatDate } from "@/lib/utils";

export function RecentLocalizations({
  localizations,
  error,
}: {
  localizations: LocalizationSummary[];
  error?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent videos</CardTitle>
        <CardDescription>
          Localized videos made with this app, newest first.
        </CardDescription>
      </CardHeader>
      <CardContent className="max-h-96 overflow-y-auto">
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load recent videos</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : localizations.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Languages />
              </EmptyMedia>
              <EmptyTitle>No videos yet</EmptyTitle>
              <EmptyDescription>
                Translate and render an ad above, it will show up here.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ItemGroup className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {localizations.map((summary) => (
              <LocalizationItem
                key={summary.localizationId}
                summary={summary}
              />
            ))}
          </ItemGroup>
        )}
      </CardContent>
    </Card>
  );
}

function LocalizationItem({ summary }: { summary: LocalizationSummary }) {
  return (
    <Item
      variant="outline"
      size="sm"
      // The router marks the link of the video on screen with data-status="active"
      className="data-[status=active]:border-primary data-[status=active]:bg-muted"
      render={
        <Link
          to="/video/$localizationId"
          params={{ localizationId: summary.localizationId }}
        />
      }
    >
      <ItemContent className="min-w-0">
        <ItemTitle className="line-clamp-1">
          {summary.headline || "Untitled"}
        </ItemTitle>
        {/* Server and browser can format dates in different time zones */}
        <ItemDescription suppressHydrationWarning>
          {summary.languages.join(" ").toUpperCase()} ·{" "}
          {formatDate(summary.createdDate)}
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <LocalizationStatusBadge summary={summary} />
      </ItemActions>
    </Item>
  );
}
