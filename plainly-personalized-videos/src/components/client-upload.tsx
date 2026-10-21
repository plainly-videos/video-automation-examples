import { FileText, Upload } from "lucide-react";
import { useState } from "react";
import { decodeCsv } from "@/lib/recipients";
import { cn } from "@/lib/utils";

const SAMPLE_CSV = "/sample-clients.csv";

export function ClientUpload({
  onLoad,
  onError,
}: {
  onLoad: (csvText: string) => void;
  onError: (message: string) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [loaded, setLoaded] = useState<string>();

  const readFile = async (file: File | undefined) => {
    if (!file) return;
    onLoad(decodeCsv(await file.arrayBuffer()));
    setLoaded(file.name);
  };

  const loadSample = async () => {
    try {
      const res = await fetch(SAMPLE_CSV);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      onLoad(await res.text());
      setLoaded("sample-clients.csv");
    } catch (err) {
      setLoaded(undefined);
      onError(
        `Could not load the sample CSV (${err instanceof Error ? err.message : String(err)})`,
      );
    }
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
          "flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-8 text-center text-sm text-muted-foreground transition-colors hover:bg-muted/50 has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
          dragging && "border-primary bg-muted",
        )}
      >
        <span className="flex size-10 items-center justify-center rounded-full ring-1 ring-foreground/10">
          {loaded ? (
            <FileText className="size-5" />
          ) : (
            <Upload className="size-5" />
          )}
        </span>
        {loaded ? (
          <span className="grid gap-1">
            <span className="font-medium text-foreground">{loaded}</span>
            Drop or click to pick another file
          </span>
        ) : (
          <span>
            <span className="font-medium text-foreground">
              Drop your client list here
            </span>{" "}
            or click to pick a CSV file
          </span>
        )}
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
