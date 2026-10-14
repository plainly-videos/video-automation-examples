import Image from "next/image";
import MatchupForm from "@/components/matchup-form";
import { columns } from "@/components/matchups/columns";
import { DataTable } from "@/components/matchups/data-table";
import { ModeToggle } from "@/components/mode-toggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import WebhookStatus from "@/components/webhook-status";
import prisma from "../../lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await prisma.matchup.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <div className="w-full flex items-center justify-center" id="logo-card">
          <Image
            src="/plainly logo black.png"
            alt="Plainly Videos logo"
            width={160}
            height={32}
            priority
          />
          <Image
            src="/plainly logo white.png"
            alt="Plainly Videos logo"
            width={160}
            height={32}
            priority
          />
        </div>
        <Card className="w-full max-w-sm min-w-full lg:min-w-3xl">
          <CardHeader>
            <CardTitle>Create new matchup</CardTitle>
            <CardDescription>Enter the matchup details below.</CardDescription>
          </CardHeader>
          <CardContent>
            <MatchupForm />
          </CardContent>
        </Card>
        <DataTable columns={columns} data={data} />
        <WebhookStatus />
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <ModeToggle />
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://help.plainlyvideos.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://github.com/plainly-videos/video-automation-examples/tree/master/plainly-render-and-webhook"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/github-142-svgrepo-com.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          View on GitHub
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://app.plainlyvideos.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to app.plainlyvideos.com →
        </a>
      </footer>
    </div>
  );
}
