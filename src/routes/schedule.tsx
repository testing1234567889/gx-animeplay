import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";
import { useEffect, useState } from "react";
import { subscribeAnimes } from "../lib/anime-api";
import type { Anime } from "../lib/types";
import { AnimeCard } from "../components/AnimeCard";
import { Skeleton } from "../components/Skeleton";

export const Route = createFileRoute("/schedule")({
  component: SchedulePage,
  head: () => ({ meta: [{ title: "Schedule — AnimePlay" }] }),
});

const dayTabs = [
  { short: "Mon", full: "Monday" },
  { short: "Tue", full: "Tuesday" },
  { short: "Wed", full: "Wednesday" },
  { short: "Thu", full: "Thursday" },
  { short: "Fri", full: "Friday" },
  { short: "Sat", full: "Saturday" },
  { short: "Sun", full: "Sunday" },
];

function todayFull() {
  return dayTabs[(new Date().getDay() + 6) % 7].full;
}

function normalize(d?: string) {
  if (!d) return "";
  const s = d.trim().toLowerCase();
  const map: Record<string, string> = {
    mon: "monday", monday: "monday",
    tue: "tuesday", tues: "tuesday", tuesday: "tuesday",
    wed: "wednesday", weds: "wednesday", wednesday: "wednesday",
    thu: "thursday", thur: "thursday", thurs: "thursday", thursday: "thursday",
    fri: "friday", friday: "friday",
    sat: "saturday", saturday: "saturday",
    sun: "sunday", sunday: "sunday",
  };
  return map[s] ?? s;
}

function SchedulePage() {
  const [animes, setAnimes] = useState<Anime[] | null>(null);
  const [activeDay, setActiveDay] = useState<string>(todayFull());

  useEffect(() => {
    const unsub = subscribeAnimes((list) => setAnimes(list));
    return unsub;
  }, []);

  const filtered =
    animes?.filter((a) => normalize(a.schedule_day) === normalize(activeDay)) ?? [];

  return (
    <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 animate-fade-in">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-full bg-primary/10 p-2.5 ring-1 ring-primary/30">
          <CalendarDays className="h-5 w-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Weekly Schedule</h1>
      </div>

      <div className="-mx-4 mb-6 overflow-x-auto no-scrollbar px-4">
        <div className="flex gap-2">
          {dayTabs.map((d) => {
            const active = normalize(activeDay) === normalize(d.full);
            return (
              <button
                key={d.full}
                onClick={() => setActiveDay(d.full)}
                className={
                  "shrink-0 rounded-full px-4 py-2 text-sm font-semibold ring-1 transition " +
                  (active
                    ? "bg-primary text-primary-foreground ring-primary"
                    : "bg-card text-muted-foreground ring-white/10 hover:text-foreground hover:ring-white/20")
                }
              >
                {d.short}
              </button>
            );
          })}
        </div>
      </div>

      {animes === null ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 p-10 text-center text-sm text-muted-foreground">
          No episodes scheduled for this day.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((a) => (
            <AnimeCard key={a.id} a={a} />
          ))}
        </div>
      )}
    </main>
  );
}
