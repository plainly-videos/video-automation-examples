import { Link } from "@tanstack/react-router";
import { ChevronRight, History } from "lucide-react";
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
import { type PastBatch, useBatchHistory } from "@/lib/history";
import { teams } from "@/teams";

// As many matchups as fit one line on the narrowest (two column) layout
const SHOWN_GAMES = 4;

const formatDate = (time: number) =>
  new Date(time).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export function BatchHistory() {
  const history = useBatchHistory();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent batches</CardTitle>
        <CardDescription>
          Batches rendered in this browser, open one to see its videos.
        </CardDescription>
      </CardHeader>
      <CardContent className="max-h-96 overflow-y-auto">
        {history.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <History />
              </EmptyMedia>
              <EmptyTitle>No batches yet</EmptyTitle>
              <EmptyDescription>
                Pick some games above and render them, the batch will show up
                here.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ItemGroup className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {history.map((batch) => (
              <BatchItem key={batch.id} batch={batch} />
            ))}
          </ItemGroup>
        )}
      </CardContent>
    </Card>
  );
}

function BatchItem({ batch }: { batch: PastBatch }) {
  const count = batch.games.length;

  return (
    <Item
      variant="outline"
      size="sm"
      // The router marks the link of the batch on screen with data-status="active"
      className="data-[status=active]:border-primary data-[status=active]:bg-muted"
      render={<Link to="/batch/$batchId" params={{ batchId: batch.id }} />}
    >
      <ItemContent>
        <ItemTitle>
          {count} game{count === 1 ? "" : "s"}
        </ItemTitle>
        <ItemDescription>{formatDate(batch.createdAt)}</ItemDescription>
        {/* One line only, so every item keeps the same height */}
        <span className="flex items-center gap-2 overflow-hidden">
          {batch.games.slice(0, SHOWN_GAMES).map(({ home, away }) => (
            <span key={home} className="flex">
              <img
                src={teams[home].logo}
                alt=""
                className="size-5 object-contain"
              />
              <img
                src={teams[away].logo}
                alt=""
                className="size-5 object-contain"
              />
            </span>
          ))}
          {count > SHOWN_GAMES && (
            <span className="text-xs text-muted-foreground">
              +{count - SHOWN_GAMES}
            </span>
          )}
        </span>
      </ItemContent>
      <ItemActions>
        <ChevronRight className="size-4 text-muted-foreground" />
      </ItemActions>
    </Item>
  );
}
