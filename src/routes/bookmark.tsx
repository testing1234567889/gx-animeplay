import { createFileRoute } from "@tanstack/react-router";
import { Bookmark } from "lucide-react";

export const Route = createFileRoute("/bookmark")({
  component: BookmarkPage,
  head: () => ({ meta: [{ title: "Bookmarks — AnimePlay" }] }),
});

function BookmarkPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 pb-32 pt-10 animate-fade-in">
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 rounded-full bg-primary/10 p-4 ring-1 ring-primary/30">
          <Bookmark className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Your Bookmarks</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Save your favourite anime here to pick up where you left off. Bookmarking is coming soon.
        </p>
      </div>
    </main>
  );
}
