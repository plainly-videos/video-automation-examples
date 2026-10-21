import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
  status: ReactNode;
  invalid?: boolean;
  onRemove?: () => void;
};

export function Headshot({ src, name }: { src?: string; name?: string }) {
  const initials = name
    ?.split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <Avatar size="lg">
      {src && <AvatarImage src={src} alt="" />}
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
}

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
          <TableHead>Status</TableHead>
          <TableHead className="w-10">
            <span className="sr-only">Remove</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.map((client) => (
          <TableRow
            key={client.key}
            className={cn(client.invalid && "text-muted-foreground")}
          >
            <TableCell>
              <Headshot src={client.headshot} name={client.name} />
            </TableCell>
            <TableCell className="font-medium">{client.name}</TableCell>
            <TableCell>{client.title}</TableCell>
            <TableCell>{client.company}</TableCell>
            <TableCell>{client.status}</TableCell>
            <TableCell>
              {client.onRemove && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove ${client.name ?? "row"}`}
                  onClick={client.onRemove}
                >
                  <X />
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
