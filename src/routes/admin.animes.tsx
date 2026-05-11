import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import {
  createAnime,
  deleteAnime,
  subscribeAnimes,
  updateAnime,
  subscribeEpisodes,
  createEpisode,
  updateEpisode,
  deleteEpisode,
} from "../lib/anime-api";
import type { Anime, Episode } from "../lib/types";
import { Skeleton } from "../components/Skeleton";
import { Pencil, Trash2, Plus, X, ListVideo } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "../components/ui/alert-dialog";

export const Route = createFileRoute("/admin/animes")({
  component: AnimesAdmin,
});

type AnimeForm = {
  title: string;
  description: string;
  poster_url: string;
  banner_url: string;
  type: string;
  status: string;
  latest_ep: string;
  schedule_day: string;
  genres: string;
  isTrending: boolean;
  isLatest: boolean;
  isMovie: boolean;
  isUpcoming: boolean;
};

const emptyAnime: AnimeForm = {
  title: "",
  description: "",
  poster_url: "",
  banner_url: "",
  type: "Donghua",
  status: "Ongoing",
  latest_ep: "",
  schedule_day: "",
  genres: "",
  isTrending: false,
  isLatest: false,
  isMovie: false,
  isUpcoming: false,
};

function AnimesAdmin() {
  const [animes, setAnimes] = useState<Anime[] | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Anime | null>(null);
  const [form, setForm] = useState<AnimeForm>(emptyAnime);
  const [busy, setBusy] = useState(false);
  const [episodesFor, setEpisodesFor] = useState<Anime | null>(null);

  useEffect(() => {
    const unsub = subscribeAnimes((list) => {
      list.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
      setAnimes(list);
    });
    return unsub;
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyAnime);
    setOpen(true);
  };
  const openEdit = (a: Anime) => {
    setEditing(a);
    setForm({
      title: a.title ?? "",
      description: a.description ?? "",
      poster_url: a.poster_url ?? "",
      banner_url: a.banner_url ?? "",
      type: a.type ?? "Donghua",
      status: a.status ?? "Ongoing",
      latest_ep: a.latest_ep != null ? String(a.latest_ep) : "",
      schedule_day: a.schedule_day ?? "",
      genres: Array.isArray(a.genres) ? a.genres.join(", ") : "",
      isTrending: !!a.isTrending,
      isLatest: !!a.isLatest,
      isMovie: !!a.isMovie,
      isUpcoming: !!a.isUpcoming,
    });
    setOpen(true);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const genresArr = form.genres
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean);
      const { genres: _drop, ...rest } = form;
      const payload = { ...rest, latest_ep: form.latest_ep || "", genres: genresArr };
      if (editing) {
        await updateAnime(editing.id, payload);
        toast.success("Anime updated");
      } else {
        await createAnime(payload);
        toast.success("Anime created");
      }
      setOpen(false);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save");
    } finally {
      setBusy(false);
    }
  };

  const [confirmAnime, setConfirmAnime] = useState<Anime | null>(null);
  const doDeleteAnime = async () => {
    if (!confirmAnime) return;
    try {
      await deleteAnime(confirmAnime.id);
      toast.success("Deleted");
    } catch (err: any) {
      toast.error(err?.message ?? "Delete failed");
    } finally {
      setConfirmAnime(null);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Animes</h2>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> New Anime
        </button>
      </div>

      {animes === null ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : animes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 p-10 text-center text-sm text-muted-foreground">
          No animes yet. Create your first one.
        </div>
      ) : (
        <ul className="space-y-2">
          {animes.map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-3 rounded-xl bg-card p-3 ring-1 ring-white/5"
            >
              <div className="h-14 w-10 shrink-0 overflow-hidden rounded-md bg-white/5">
                {a.poster_url && (
                  <img
                    src={a.poster_url}
                    alt=""
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      e.currentTarget.src = "https://placehold.co/400x600?text=No+Image";
                    }}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{a.title}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {a.type || "—"} · {a.status || "—"}
                  {a.latest_ep ? ` · Ep ${a.latest_ep}` : ""}
                </div>
              </div>
              <button
                onClick={() => setEpisodesFor(a)}
                className="hidden sm:inline-flex items-center gap-1 rounded-lg bg-primary/15 px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/25"
              >
                <ListVideo className="h-3.5 w-3.5" /> Episodes
              </button>
              <button
                onClick={() => setEpisodesFor(a)}
                className="sm:hidden rounded-lg p-2 text-primary hover:bg-primary/10"
                aria-label="Episodes"
              >
                <ListVideo className="h-4 w-4" />
              </button>
              <button
                onClick={() => openEdit(a)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-white/5 hover:text-foreground"
                aria-label="Edit"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => setConfirmAnime(a)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Anime form modal */}
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit Anime" : "New Anime"}>
        <form onSubmit={onSubmit}>
          <Field label="Title">
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="Description">
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Poster URL">
              <input
                value={form.poster_url}
                onChange={(e) => setForm({ ...form, poster_url: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="Banner URL">
              <input
                value={form.banner_url}
                onChange={(e) => setForm({ ...form, banner_url: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="Type">
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="input"
              >
                <option>Donghua</option>
                <option>Anime</option>
                <option>Movie</option>
                <option>OVA</option>
                <option>TV</option>
              </select>
            </Field>
            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="input"
              >
                <option>Ongoing</option>
                <option>Completed</option>
                <option>Upcoming</option>
              </select>
            </Field>
            <Field label="Latest Episode">
              <input
                value={form.latest_ep}
                onChange={(e) => setForm({ ...form, latest_ep: e.target.value })}
                placeholder="e.g. 140"
                className="input"
              />
            </Field>
            <Field label="Schedule Day">
              <select
                value={form.schedule_day}
                onChange={(e) => setForm({ ...form, schedule_day: e.target.value })}
                className="input"
              >
                <option value="">—</option>
                <option>Monday</option>
                <option>Tuesday</option>
                <option>Wednesday</option>
                <option>Thursday</option>
                <option>Friday</option>
                <option>Saturday</option>
                <option>Sunday</option>
              </select>
            </Field>
          </div>
          <Field label="Genres (comma-separated)">
            <input
              value={form.genres}
              onChange={(e) => setForm({ ...form, genres: e.target.value })}
              placeholder="Action, Fantasy, Adventure"
              className="input"
            />
          </Field>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(["isTrending", "isLatest", "isMovie", "isUpcoming"] as const).map((k) => (
              <label
                key={k}
                className="flex cursor-pointer items-center gap-2 rounded-lg bg-input/40 px-2.5 py-2 text-xs ring-1 ring-white/10"
              >
                <input
                  type="checkbox"
                  checked={form[k]}
                  onChange={(e) => setForm({ ...form, [k]: e.target.checked })}
                />
                {k.replace("is", "")}
              </label>
            ))}
          </div>

          <button
            type="submit"
            disabled={busy}
            className="mt-5 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {busy ? "Saving…" : editing ? "Save changes" : "Create anime"}
          </button>
        </form>
      </Modal>

      {/* Episodes manager modal */}
      <Modal
        open={!!episodesFor}
        onClose={() => setEpisodesFor(null)}
        title={episodesFor ? `Episodes — ${episodesFor.title}` : ""}
        wide
      >
        {episodesFor && <EpisodesManager anime={episodesFor} />}
      </Modal>

      <AlertDialog open={!!confirmAnime} onOpenChange={(o) => !o && setConfirmAnime(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this anime?</AlertDialogTitle>
            <AlertDialogDescription>
              "{confirmAnime?.title}" and all of its episodes will be permanently removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doDeleteAnime} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ------------ Episodes Manager (nested) ------------ */

type EpForm = {
  number: string;
  title: string;
  server1_data: string; server1_name: string;
  server2_data: string; server2_name: string;
  server3_data: string; server3_name: string;
  vip_only: boolean;
  release_time: string;
  skipStart: string;
  skipEnd: string;
};
const emptyEp: EpForm = {
  number: "", title: "",
  server1_data: "", server1_name: "",
  server2_data: "", server2_name: "",
  server3_data: "", server3_name: "",
  vip_only: false, release_time: "",
  skipStart: "", skipEnd: "",
};

function toLocalInput(ms?: number) {
  if (!ms) return "";
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function EpisodesManager({ anime }: { anime: Anime }) {
  const [eps, setEps] = useState<Episode[] | null>(null);
  const [editing, setEditing] = useState<Episode | null>(null);
  const [form, setForm] = useState<EpForm>(emptyEp);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setEps(null);
    return subscribeEpisodes(anime.id, setEps);
  }, [anime.id]);

  const reset = () => {
    setEditing(null);
    setForm(emptyEp);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const num = Number(form.number) || 0;
      const release_ms = form.release_time ? new Date(form.release_time).getTime() : Date.now();
      const payload = {
        anime_id: anime.id,
        number: num,
        title: form.title,
        server1_data: form.server1_data,
        server1_name: form.server1_name,
        server2_data: form.server2_data,
        server2_name: form.server2_name,
        server3_data: form.server3_data,
        server3_name: form.server3_name,
        vip_only: form.vip_only,
        release_time: release_ms,
        skipStart: form.skipStart ? Number(form.skipStart) : 0,
        skipEnd: form.skipEnd ? Number(form.skipEnd) : 0,
      };
      if (editing) {
        await updateEpisode(editing.id, payload);
        toast.success("Episode updated");
      } else {
        await createEpisode(payload);
        toast.success("Episode added");
      }
      // Sync parent anime's latest_ep if this is higher
      const currentLatest = Number(anime.latest_ep) || 0;
      if (num > currentLatest) {
        await updateAnime(anime.id, { latest_ep: num });
      }
      reset();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save");
    } finally {
      setBusy(false);
    }
  };

  const [confirmEp, setConfirmEp] = useState<Episode | null>(null);
  const doDeleteEp = async () => {
    if (!confirmEp) return;
    try {
      await deleteEpisode(confirmEp.id);
      toast.success("Deleted");
      if (editing?.id === confirmEp.id) reset();
    } catch (err: any) {
      toast.error(err?.message ?? "Delete failed");
    } finally {
      setConfirmEp(null);
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
      {/* List */}
      <div className="max-h-[50vh] overflow-y-auto pr-1">
        {eps === null ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : eps.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-muted-foreground">
            No episodes yet.
          </div>
        ) : (
          <ul className="space-y-2">
            {eps.map((ep) => (
              <li
                key={ep.id}
                className="flex items-center gap-2 rounded-lg bg-card p-2 ring-1 ring-white/5"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/20 text-xs font-bold text-primary">
                  {ep.number}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    {ep.title || `Episode ${ep.number}`}
                  </div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    S1: {ep.server1_data || ep.dailymotion_id || "—"} · S2: {ep.server2_data || ep.okru_id || "—"} · S3: {ep.server3_data || "—"}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setEditing(ep);
                    setForm({
                      number: String(ep.number ?? ""),
                      title: ep.title ?? "",
                      server1_data: ep.server1_data ?? ep.dailymotion_id ?? "",
                      server1_name: ep.server1_name ?? "",
                      server2_data: ep.server2_data ?? ep.okru_id ?? "",
                      server2_name: ep.server2_name ?? "",
                      server3_data: ep.server3_data ?? "",
                      server3_name: ep.server3_name ?? "",
                      vip_only: !!ep.vip_only,
                      release_time: toLocalInput(ep.release_time),
                      skipStart: ep.skipStart != null ? String(ep.skipStart) : "",
                      skipEnd: ep.skipEnd != null ? String(ep.skipEnd) : "",
                    });
                  }}
                  className="rounded p-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  aria-label="Edit"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setConfirmEp(ep)}
                  className="rounded p-1.5 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
                  aria-label="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="rounded-xl bg-background/40 p-3 ring-1 ring-white/5">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-sm font-semibold">
            {editing ? `Edit Episode ${editing.number}` : "Add Episode"}
          </h4>
          {editing && (
            <button
              type="button"
              onClick={reset}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel edit
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Number">
            <input
              required
              type="number"
              min={0}
              value={form.number}
              onChange={(e) => setForm({ ...form, number: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="Title">
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input"
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Server 1 Data (DM Video ID)">
            <input
              value={form.server1_data}
              onChange={(e) => setForm({ ...form, server1_data: e.target.value })}
              placeholder="x8abcde"
              className="input"
            />
          </Field>
          <Field label="Server 1 Name">
            <input
              value={form.server1_name}
              onChange={(e) => setForm({ ...form, server1_name: e.target.value })}
              placeholder="Server 1"
              className="input"
            />
          </Field>
          <Field label="Server 2 Data (OK.ru ID)">
            <input
              value={form.server2_data}
              onChange={(e) => setForm({ ...form, server2_data: e.target.value })}
              placeholder="1234567890123"
              className="input"
            />
          </Field>
          <Field label="Server 2 Name">
            <input
              value={form.server2_name}
              onChange={(e) => setForm({ ...form, server2_name: e.target.value })}
              placeholder="Server 2"
              className="input"
            />
          </Field>
          <Field label="Server 3 Data (Embed URL)">
            <input
              value={form.server3_data}
              onChange={(e) => setForm({ ...form, server3_data: e.target.value })}
              placeholder="https://..."
              className="input"
            />
          </Field>
          <Field label="Server 3 Name">
            <input
              value={form.server3_name}
              onChange={(e) => setForm({ ...form, server3_name: e.target.value })}
              placeholder="Server 3"
              className="input"
            />
          </Field>
        </div>
        <Field label="Release Time (basis for VIP early-access timer)">
          <input
            type="datetime-local"
            value={form.release_time}
            onChange={(e) => setForm({ ...form, release_time: e.target.value })}
            className="input"
          />
        </Field>
        <label className="mb-3 flex cursor-pointer items-center gap-2 rounded-lg bg-input/40 px-3 py-2 text-xs ring-1 ring-yellow-400/30">
          <input
            type="checkbox"
            checked={form.vip_only}
            onChange={(e) => setForm({ ...form, vip_only: e.target.checked })}
          />
          <span className="font-semibold text-yellow-300">VIP Only</span>
          <span className="text-muted-foreground">— free users wait 30 min from release</span>
        </label>
        <button
          type="submit"
          disabled={busy}
          className="mt-2 w-full rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {busy ? "Saving…" : editing ? "Save changes" : "Add Episode"}
        </button>
      </form>

      <AlertDialog open={!!confirmEp} onOpenChange={(o) => !o && setConfirmEp(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this episode?</AlertDialogTitle>
            <AlertDialogDescription>
              Episode {confirmEp?.number} will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doDeleteEp} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ------------ Shared bits ------------ */

function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={
          "relative max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-card p-5 ring-1 ring-white/10 shadow-2xl " +
          (wide ? "max-w-3xl" : "max-w-lg")
        }
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 hover:bg-white/5"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-3">
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
