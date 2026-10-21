import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type ClientsTableRow = {
  key: string;
  headshot?: string;
  name?: string;
  title?: string;
  company?: string;
  video: ReactNode;
  invalid?: boolean;
};

// The same table before rendering (CSV rows) and after (one render per client)
export function ClientsTable({ clients }: { clients: ClientsTableRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <span className="sr-only">Headshot</span>
          </TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Company</TableHead>
          <TableHead>Video</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.map((client) => (
          <TableRow
            key={client.key}
            className={cn(client.invalid && "text-destructive")}
          >
            <TableCell>
              {client.headshot ? (
                <img
                  src={client.headshot}
                  alt=""
                  className="size-8 rounded-full object-cover"
                />
              ) : (
                <span className="block size-8 rounded-full bg-muted" />
              )}
            </TableCell>
            <TableCell className="font-medium">{client.name}</TableCell>
            <TableCell className="max-w-48 whitespace-normal">
              {client.title}
            </TableCell>
            <TableCell>{client.company}</TableCell>
            <TableCell>{client.video}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
