"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Matchup } from "@/app/generated/prisma/client";
import { cn } from "@/lib/utils";
import RefreshButton from "../refresh-button";
import { Badge } from "../ui/badge";
import type { features } from "./data-table";

export const columns: ColumnDef<typeof features, Matchup>[] = [
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) =>
      new Date(row.original.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
  },
  {
    accessorKey: "teamA",
    header: "Team A",
  },
  {
    accessorKey: "teamB",
    header: "Team B",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge
        className={cn(row.original.status === "pending" && "animate-pulse")}
        variant={
          row.original.status === "pending"
            ? "secondary"
            : row.original.status === "completed"
              ? "default"
              : "destructive"
        }
      >
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "videoUrl",
    header: "Video",
    cell: ({ row }) => {
      const videoUrl = row.original.videoUrl;
      const expirationDate = row.original.expirationDate;

      if (!videoUrl) {
        if (row.original.status === "pending") {
          return <RefreshButton />;
        }

        return "N/A";
      }
      if (expirationDate && new Date(expirationDate) < new Date()) {
        return "Expired";
      }

      return (
        <a
          href={videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
        >
          Preview
        </a>
      );
    },
  },
];
