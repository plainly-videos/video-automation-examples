import { Upload } from "lucide-react";
import { useState } from "react";
import { decodeCsv } from "@/lib/recipients";
import { cn } from "@/lib/utils";

const SAMPLE_CSV = "/sample-clients.csv";

// Drop zone and file picker for the client list, plus the sample file
export function ClientUpload({
  onLoad,
}: {
  onLoad: (csvText: string) => void;
}) {
  const [dragging, setDragging] = useState(false);

  const readFile = async (file: File | undefined) => {
    if (file) onLoad(decodeCsv(await file.arrayBuffer()));
  };

  const loadSample = async () => {
    const res = await fetch(SAMPLE_CSV);
    onLoad(await res.text());
  };

  return (
    <div className="grid gap-2">
      <label
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          readFile(event.dataTransfer.files[0]);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground transition-colors hover:bg-muted/50 has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
          dragging && "border-primary bg-muted",
        )}
      >
        <Upload className="size-6" />
        <span>
          <span className="font-medium text-foreground">
            Drop your client list here
          </span>{" "}
          or click to pick a CSV file
        </span>
        <span>
          Columns: <code>name, title, company, headshot</code>
        </span>
        <input
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          onChange={(event) => {
            readFile(event.target.files?.[0]);
            // Picking the same file again after fixing it should load it again
            event.target.value = "";
          }}
        />
      </label>
      <p className="text-sm text-muted-foreground">
        No file at hand?{" "}
        <button
          type="button"
          onClick={loadSample}
          className="underline underline-offset-4 hover:text-foreground"
        >
          Use the sample CSV
        </button>{" "}
        or{" "}
        <a
          href={SAMPLE_CSV}
          download
          className="underline underline-offset-4 hover:text-foreground"
        >
          download it
        </a>{" "}
        to see the format.
      </p>
    </div>
  );
}
