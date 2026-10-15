import { Link } from "@tanstack/react-router";
import { Clapperboard } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { type AdSummary, adStatus, EXAMPLE } from "@/lib/ad";
import { products } from "@/products";

const formatDate = (date: string) =>
  new Date(date).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const BADGE_VARIANT = {
  done: "default",
  rendering: "secondary",
  failed: "destructive",
} as const;

export function RecentAds({
  ads,
  error,
}: {
  ads: AdSummary[];
  error?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent ads</CardTitle>
        <CardDescription>
          Found with the <code>example = {EXAMPLE}</code> attribute filter.
        </CardDescription>
      </CardHeader>
      <CardContent className="max-h-96 overflow-y-auto">
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load recent ads</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : ads.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Clapperboard />
              </EmptyMedia>
              <EmptyTitle>No ads yet</EmptyTitle>
              <EmptyDescription>
                Render an ad above, it will show up here.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ItemGroup className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {ads.map((summary) => (
              <AdItem key={summary.adId} summary={summary} />
            ))}
          </ItemGroup>
        )}
      </CardContent>
    </Card>
  );
}

function AdItem({ summary }: { summary: AdSummary }) {
  const status = adStatus(summary);

  return (
    <Item
      variant="outline"
      size="sm"
      // The router marks the link of the ad on screen with data-status="active"
      className="data-[status=active]:border-primary data-[status=active]:bg-muted"
      render={<Link to="/ad/$adId" params={{ adId: summary.adId }} />}
    >
      <ItemMedia variant="image">
        <img src={products[summary.ad.productId].image} alt="" />
      </ItemMedia>
      <ItemContent className="min-w-0">
        <ItemTitle className="line-clamp-1">{summary.ad.headline}</ItemTitle>
        {/* Server and browser can format dates in different time zones */}
        <ItemDescription suppressHydrationWarning>
          {formatDate(summary.createdDate)}
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <Badge variant={BADGE_VARIANT[status.tone]}>{status.label}</Badge>
      </ItemActions>
    </Item>
  );
}
