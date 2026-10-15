import { createFileRoute } from "@tanstack/react-router";
import { AdEditor } from "@/components/ad-editor";
import { PreviewCard } from "@/components/ad-preview";
import { adFor } from "@/lib/ad";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <AdEditor
      initial={adFor("sneakers")}
      aside={(ad) => <PreviewCard ad={ad} />}
    />
  );
}
