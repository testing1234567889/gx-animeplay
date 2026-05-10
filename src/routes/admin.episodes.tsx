import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  createEpisode,
  deleteEpisode,
  subscribeAnimes,
  subscribeEpisodes,
  updateEpisode,
} from "../lib/anime-api";
import type { Anime, Episode } from "../lib/types";
import { Skeleton } from "../components/Skeleton";
import { Pencil, Trash2, Plus, X } from "lucide-react";

export const Route = createFileRoute("/admin/episodes")({
  component: EpisodesAdmin,
});

type FormState = {
  number: string;
  title: string;
  dailymotion_id: string;
  okru_id: string;
};
const empty: FormState = { number: "", title: "", dailymotion_id: "", okru_id: "" };

function EpisodesAdmin() {
  const [animes, setAnimes] = useState<Anime[] | null>(null);
  const [animeId, setAnimeId] = useState<string>("");
  const [episodes, setEpisodes] = useState<Episode[] | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Episode | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const unsub = subscribeAnimes((list) => {
      list.sort((a, b) => a.title.localeCompare(b.title));
      setAnimes(list);
      if (!animeId && list[0]) setAnimeId(list[0].id);
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!animeId) {
      setEpisodes(null);
      return;
    }
    setEpisodes(null);
    const unsub = subscribeEpisodes(animeId, setEpisodes);
    return unsub;
  }, [animeId]);

  const openCreate = () => {
    if (!animeId) {
      toast.error("Create an anime first");
      return;
    }
    setEditing(null);
    setForm(empty);
    setOpen(true);
  };
  const openEdit = (ep: Episode) => {
    setEditing(ep);
    setForm({
      number: String(ep.number ?? ""),
      title: ep.title ?? "",
      dailymotion_id: ep.dailymotion_id ?? "",
      okru_id: ep.okru_id ?? "",
    });
    setOpen(true);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        anime_id: animeId,
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
        toast.success("Episode created");
      }
      setOpen(false);
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
    } catch (err: any) {
      toast.error(err?.message ?? "Delete failed");
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Episodes</h2>
          <select
            value={animeId}
            onChange={(e) => setAnimeId(e.target.value)}
            className="rounded-lg bg-card px-3 py-2 text-sm ring-1 ring-white/10"
          >
            {animes === null && <option>Loading…</option>}
            {animes?.length === 0 && <option value="">No animes</option>}
            {animes?.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> New Episode
        </button>
      </div>

      {episodes === null ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : episodes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 p-10 text-center text-sm text-muted-foreground">
          No episodes for this anime.
        </div>
      ) : (
        <ul className="space-y-2">
          {episodes.map((ep) => (
            <li key={ep.id} className="flex items-center gap-3 rounded-xl bg-card p-3 ring-1 ring-white/5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/20 text-sm font-bold text-primary">
                {ep.number}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{ep.title || `Episode ${ep.number}`}</div>
                <div className="truncate text-xs text-muted-foreground">
                  DM: {ep.dailymotion_id || "—"} · OK: {ep.okru_id || "—"}
                </div>
              </div>
              <button
                onClick={() => openEdit(ep)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-white/5 hover:text-foreground"
                aria-label="Edit"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(ep)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 p-0 md:p-4"
            onClick={() => setOpen(false)}
          >
            <motion.form
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              onSubmit={onSubmit}
              className="w-full max-w-lg rounded-t-2xl md:rounded-2xl bg-card p-5 ring-1 ring-white/10"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">{editing ? "Edit Episode" : "New Episode"}</h3>
                <button type="button" onClick={() => setOpen(false)} className="rounded-md p-1 hover:bg-white/5">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Number">
                  <input
                    required
                    type="number"
                    min={0}
                    value={form.number}
                    onChange={(e) => setForm({ ...form, number: e.target.value })}
                    className="w-full rounded-lg bg-input/40 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-primary"
                  />
                </Field>
                <Field label="Title (optional)">
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full rounded-lg bg-input/40 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-primary"
                  />
                </Field>
              </div>
              <Field label="Dailymotion ID">
                <input
                  value={form.dailymotion_id}
                  onChange={(e) => setForm({ ...form, dailymotion_id: e.target.value })}
                  placeholder="x8abcde"
                  className="w-full rounded-lg bg-input/40 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-primary"
                />
              </Field>
              <Field label="OK.RU ID">
                <input
                  value={form.okru_id}
                  onChange={(e) => setForm({ ...form, okru_id: e.target.value })}
                  placeholder="1234567890123"
                  className="w-full rounded-lg bg-input/40 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-primary"
                />
              </Field>

              <button
                type="submit"
                disabled={busy}
                className="mt-4 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {busy ? "Saving…" : editing ? "Save changes" : "Create episode"}
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
