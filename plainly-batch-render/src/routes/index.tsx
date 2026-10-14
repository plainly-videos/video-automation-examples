import { createFileRoute } from "@tanstack/react-router";

// Game night is rendered by the root layout, nothing else lives on "/"
export const Route = createFileRoute("/")();
