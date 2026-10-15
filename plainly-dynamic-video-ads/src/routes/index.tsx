import { createFileRoute } from "@tanstack/react-router";
import { AdEditor } from "@/components/ad-editor";
import { PreviewCard } from "@/components/ad-preview";
import { ApiRequestCard } from "@/components/api-request";
import { adFor } from "@/lib/ad";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <AdEditor
      initial={adFor("sneakers")}
      aside={(ad) => (
        <div className="grid gap-6">
          <PreviewCard ad={ad} />
          <ApiRequestCard ad={ad} />
        </div>
      )}
    />
  );
}
