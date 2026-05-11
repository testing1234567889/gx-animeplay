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
      const payload = { ...form, latest_ep: form.latest_ep || "" };
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

  const onDelete = async (a: Anime) => {
    if (!confirm(`Delete "${a.title}" and all its episodes?`)) return;
    try {
      await deleteAnime(a.id);
      toast.success("Deleted");
    } catch (err: any) {
      toast.error(err?.message ?? "Delete failed");
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
                onClick={() => onDelete(a)}
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
    </div>
  );
}

/* ------------ Episodes Manager (nested) ------------ */

type EpForm = { number: string; title: string; dailymotion_id: string; okru_id: string };
const emptyEp: EpForm = { number: "", title: "", dailymotion_id: "", okru_id: "" };

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
      const payload = {
        anime_id: anime.id,
        number: Number(form.number) || 0,
        title: form.title,
        dailymotion_id: form.dailymotion_id,
        okru_id: form.okru_id,
      };
      if (editing) {
        await updateEpisode(editing.id, payload);
        toast.success("Episode updated");
      } else {
        await createEpisode(payload);
        toast.success("Episode added");
      }
      reset();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save");
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (ep: Episode) => {
    if (!confirm(`Delete episode ${ep.number}?`)) return;
    try {
      await deleteEpisode(ep.id);
      toast.success("Deleted");
      if (editing?.id === ep.id) reset();
    } catch (err: any) {
      toast.error(err?.message ?? "Delete failed");
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
                    DM: {ep.dailymotion_id || "—"} · OK: {ep.okru_id || "—"}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setEditing(ep);
                    setForm({
                      number: String(ep.number ?? ""),
                      title: ep.title ?? "",
                      dailymotion_id: ep.dailymotion_id ?? "",
                      okru_id: ep.okru_id ?? "",
                    });
                  }}
                  className="rounded p-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  aria-label="Edit"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onDelete(ep)}
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
        <Field label="Dailymotion ID">
          <input
            value={form.dailymotion_id}
            onChange={(e) => setForm({ ...form, dailymotion_id: e.target.value })}
            placeholder="x8abcde"
            className="input"
          />
        </Field>
        <Field label="OK.RU ID">
          <input
            value={form.okru_id}
            onChange={(e) => setForm({ ...form, okru_id: e.target.value })}
            placeholder="1234567890123"
            className="input"
          />
        </Field>
        <button
          type="submit"
          disabled={busy}
          className="mt-2 w-full rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {busy ? "Saving…" : editing ? "Save changes" : "Add Episode"}
        </button>
      </form>
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
