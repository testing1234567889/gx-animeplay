import { ShieldAlert } from "lucide-react";
import { useAuth } from "../lib/auth-context";

export function BannedOverlay() {
  const { profile, logout } = useAuth();
  if (!profile?.banned) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-md p-6 animate-fade-in">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/15 ring-1 ring-destructive/40">
          <ShieldAlert className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold">Account Suspended</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account is suspended. Reason:{" "}
          <span className="font-medium text-foreground">
            {profile.ban_reason || "Violation of community guidelines."}
          </span>
        </p>
        <button
          onClick={() => logout()}
          className="mt-6 rounded-lg bg-card px-4 py-2 text-sm font-semibold ring-1 ring-white/10 hover:ring-primary/50"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
