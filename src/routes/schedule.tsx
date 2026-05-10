import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";

export const Route = createFileRoute("/schedule")({
  component: SchedulePage,
  head: () => ({ meta: [{ title: "Schedule — AnimePlay" }] }),
});

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function SchedulePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 pb-32 pt-10 animate-fade-in">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-full bg-primary/10 p-2.5 ring-1 ring-primary/30">
          <CalendarDays className="h-5 w-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Weekly Schedule</h1>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((d) => (
          <div
            key={d}
            className="rounded-xl bg-card p-3 text-center text-xs font-semibold ring-1 ring-white/5"
          >
            {d}
          </div>
        ))}
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Episode release schedule will appear here.
      </p>
    </main>
  );
}
