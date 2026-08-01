import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";
import { ensureUserProfile, subscribeUserProfile, subscribeAdminFlag } from "./users";
import type { UserProfile } from "./types";

type AuthCtx = {
  user: User | null;
  profile: UserProfile | null;
  /** Resolved from RTDB `/admins/{uid}` — never hardcoded on the client. */
  isAdmin: boolean;
  /** True until both the auth state and the admin flag have been resolved. */
  loading: boolean;
  adminChecked: boolean;
  loginWithGoogle: () => Promise<void>;
  /** Email/password sign-in — reserved for the admin dashboard only. */
  loginWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        try {
          await ensureUserProfile(u);
        } catch (e) {
          console.error("ensureUserProfile failed", e);
        }
      } else {
        setProfile(null);
        setIsAdmin(false);
        setAdminChecked(true);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    return subscribeUserProfile(user.uid, setProfile);
  }, [user]);

  // Admin allowlist lives in RTDB (`/admins/{uid}`) and is enforced by the
  // security rules — the client only reads it, never decides it.
  useEffect(() => {
    if (!user) return;
    setAdminChecked(false);
    return subscribeAdminFlag(user.uid, (v) => {
      setIsAdmin(v);
      setAdminChecked(true);
    });
  }, [user]);

  const loginWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };
  const loginWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };
  const logout = async () => {
    await signOut(auth);
  };

  const merged: UserProfile | null = profile
    ? { ...profile, isAdmin: isAdmin || !!profile.isAdmin }
    : null;

  return (
    <Ctx.Provider
      value={{
        user,
        profile: merged,
        isAdmin,
        adminChecked,
        loading,
        loginWithGoogle,
        loginWithEmail,
        logout,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}
