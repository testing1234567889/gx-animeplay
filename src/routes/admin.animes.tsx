import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { createAnime, deleteAnime, subscribeAnimes, updateAnime } from "../lib/anime-api";
import type { Anime } from "../lib/types";
import { Skeleton } from "../components/Skeleton";
import { Pencil, Trash2, Plus, X } from "lucide-react";

export const Route = createFileRoute("/admin/animes")({
  component: AnimesAdmin,
});

type FormState = { title: string; description: string; poster_url: string };
const empty: FormState = { title: "", description: "", poster_url: "" };

function AnimesAdmin() {
  const [animes, setAnimes] = useState<Anime[] | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Anime | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const unsub = subscribeAnimes((list) => {
      list.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
      setAnimes(list);
    });
    return unsub;
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  };
  const openEdit = (a: Anime) => {
    setEditing(a);
    setForm({ title: a.title, description: a.description ?? "", poster_url: a.poster_url ?? "" });
    setOpen(true);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (editing) {
        await updateAnime(editing.id, form);
        toast.success("Anime updated");
      } else {
        await createAnime(form);
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
            <li key={a.id} className="flex items-center gap-3 rounded-xl bg-card p-3 ring-1 ring-white/5">
              <div className="h-14 w-10 shrink-0 overflow-hidden rounded-md bg-white/5">
                {a.poster_url && <img src={a.poster_url} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{a.title}</div>
                <div className="truncate text-xs text-muted-foreground">{a.description || "No description"}</div>
              </div>
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
                <h3 className="text-lg font-semibold">{editing ? "Edit Anime" : "New Anime"}</h3>
                <button type="button" onClick={() => setOpen(false)} className="rounded-md p-1 hover:bg-white/5">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <Field label="Title">
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-lg bg-input/40 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-primary"
                />
              </Field>
              <Field label="Description">
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-lg bg-input/40 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-primary"
                />
              </Field>
              <Field label="Poster URL">
                <input
                  value={form.poster_url}
                  onChange={(e) => setForm({ ...form, poster_url: e.target.value })}
                  placeholder="https://…"
                  className="w-full rounded-lg bg-input/40 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-primary"
                />
              </Field>

              <button
                type="submit"
                disabled={busy}
                className="mt-4 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {busy ? "Saving…" : editing ? "Save changes" : "Create anime"}
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
