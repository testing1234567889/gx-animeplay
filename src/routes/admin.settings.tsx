import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ImageIcon, Megaphone, Save } from "lucide-react";
import { ref, onValue } from "firebase/database";
import { db } from "../lib/firebase";
import {
  setSiteLogo,
  setAnnouncement,
  subscribeAnnouncement,
} from "../lib/settings";
import type { Announcement } from "../lib/types";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  const [logoUrl, setLogoUrl] = useState("");
  const [busyLogo, setBusyLogo] = useState(false);
  const [ann, setAnn] = useState<Announcement>({ enabled: false, text: "", href: "" });
  const [busyAnn, setBusyAnn] = useState(false);

  useEffect(() => {
    const off = onValue(ref(db, "settings/site_logo_url"), (s) => {
      setLogoUrl((s.val() as string) ?? "");
    });
    return off;
  }, []);

  useEffect(() => subscribeAnnouncement((a) => a && setAnn(a)), []);

  const saveLogo = async (e: FormEvent) => {
    e.preventDefault();
    setBusyLogo(true);
    try {
      await setSiteLogo(logoUrl);
      toast.success("Site logo saved");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed");
    } finally {
      setBusyLogo(false);
    }
  };

  const saveAnn = async (e: FormEvent) => {
    e.preventDefault();
    if (ann.href && !/^https?:\/\//i.test(ann.href)) {
      toast.error("Link must start with https://");
      return;
    }
    setBusyAnn(true);
    try {
      await setAnnouncement(ann);
      toast.success("Announcement saved");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed");
    } finally {
      setBusyAnn(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Site Settings</h2>

      <form onSubmit={saveLogo} className="rounded-2xl bg-card p-4 ring-1 ring-white/5">
        <div className="mb-3 flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Site Logo</h3>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          URL used for the top-bar logo. Leave empty to fall back to the site title.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {logoUrl && (
            <img
              src={logoUrl}
              alt="logo preview"
              referrerPolicy="no-referrer"
              draggable={false}
              className="h-10 w-auto max-w-[140px] rounded-md bg-black/40 object-contain p-1 ring-1 ring-white/10"
            />
          )}
          <input
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://…/logo.png"
            className="input flex-1 min-w-[200px]"
          />
        </div>
        <button
          type="submit"
          disabled={busyLogo}
          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          <Save className="h-4 w-4" /> {busyLogo ? "Saving…" : "Save logo"}
        </button>
      </form>

      <form onSubmit={saveAnn} className="rounded-2xl bg-card p-4 ring-1 ring-white/5">
        <div className="mb-3 flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Announcement Bar</h3>
        </div>
        <label className="mb-3 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!ann.enabled}
            onChange={(e) => setAnn({ ...ann, enabled: e.target.checked })}
            className="h-4 w-4 accent-primary"
          />
          Enable announcement
        </label>
        <input
          value={ann.text ?? ""}
          onChange={(e) => setAnn({ ...ann, text: e.target.value })}
          placeholder="Announcement text"
          className="input"
        />
        <input
          value={ann.href ?? ""}
          onChange={(e) => setAnn({ ...ann, href: e.target.value })}
          placeholder="Optional link URL"
          className="input mt-2"
        />
        <button
          type="submit"
          disabled={busyAnn}
          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          <Save className="h-4 w-4" /> {busyAnn ? "Saving…" : "Save announcement"}
        </button>
      </form>
    </div>
  );
}
