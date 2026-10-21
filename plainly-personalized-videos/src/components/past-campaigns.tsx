import { Link } from "@tanstack/react-router";
import { Gift } from "lucide-react";
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
  ItemTitle,
} from "@/components/ui/item";
import type { Campaign } from "@/lib/batch";
import { formatDate } from "@/lib/utils";

export function PastCampaigns({
  campaigns,
  error,
}: {
  campaigns: Campaign[];
  error?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Past campaigns</CardTitle>
        <CardDescription>
          Campaigns made with this app, newest first.
        </CardDescription>
      </CardHeader>
      <CardContent className="max-h-96 overflow-y-auto">
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load past campaigns</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : campaigns.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Gift />
              </EmptyMedia>
              <EmptyTitle>No campaigns yet</EmptyTitle>
              <EmptyDescription>
                Render a client list above, it will show up here.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ItemGroup className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((campaign) => (
              <Item
                key={campaign.id}
                variant="outline"
                size="sm"
                // The router marks the link of the campaign on screen with data-status="active"
                className="data-[status=active]:border-primary data-[status=active]:bg-muted"
                render={<Link to="/" search={{ batch: campaign.id }} />}
              >
                <ItemContent className="min-w-0">
                  <ItemTitle className="line-clamp-1">
                    {campaign.name}
                  </ItemTitle>
                  {/* Server and browser can format dates in different time zones */}
                  <ItemDescription suppressHydrationWarning>
                    {formatDate(campaign.createdDate)} · {campaign.videos}{" "}
                    {campaign.videos === 1 ? "video" : "videos"}
                  </ItemDescription>
                </ItemContent>
                {campaign.draft && (
                  <ItemActions>
                    <Badge variant="secondary">Draft</Badge>
                  </ItemActions>
                )}
              </Item>
            ))}
          </ItemGroup>
        )}
      </CardContent>
    </Card>
  );
}
