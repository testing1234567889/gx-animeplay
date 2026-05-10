- Anime Streaming SPA — Build Plan

A high-performance anime streaming SPA on TanStack Start (React 19 + Tailwind v4), Firebase for Auth + Realtime Database, Framer Motion animations, and a mobile-first admin dashboard.

## Stack & Setup

- Add deps: `firebase`, `framer-motion`
- Create `src/lib/firebase.ts` with the provided config, exporting `app`, `auth`, `db` (getDatabase)
- Slate-950 dark theme tokens in `src/styles.css` (oklch); set `<html class="dark">` in `__root.tsx`
- Keep `src/routes/__root.tsx` shell; add a top nav (Home, Admin) hidden behind responsive logic

## Routes (file-based)

```
src/routes/
  __root.tsx              # shell + QueryClientProvider + AuthProvider + theme
  index.tsx               # Home: hero + horizontal rails (mobile) / grid (desktop)
  anime.$animeId.tsx      # Anime detail: poster, description, episode grid
  watch.$animeId.$episodeId.tsx  # Player page
  login.tsx               # Firebase email/password login
  admin.tsx               # Admin layout (auth gate + bottom tab bar on mobile)
  admin.index.tsx         # redirect to /admin/animes
  admin.animes.tsx        # CRUD list + form for animes
  admin.episodes.tsx      # CRUD list + form for episodes (filter by anime)
```

## Data Layer

- `src/lib/anime-api.ts`: thin wrappers over RTDB
  - `listAnimes()` → `ref(db, 'animes')` once + onValue subscribe hook
  - `getAnime(id)`, `listEpisodes(animeId)` (query orderByChild `anime_id` equalTo)
  - CRUD: `createAnime`, `updateAnime`, `deleteAnime` (cascade-delete its episodes), same for episodes
- `src/hooks/useRealtime.ts`: subscribe helper returning `{ data, loading, error }`
- `src/hooks/useAuth.ts` + `AuthProvider`: wraps `onAuthStateChanged`

## Player

- Component `<VideoPlayer servers={{dm, okru}} />`
  - Aspect 16:9 container (`aspect-video`), max-width cinema layout
  - Glassmorphism tab switcher (Server 1 DM / Server 2 OK) with Framer Motion layoutId underline
  - Iframe srcs:
    - DM: `https://www.dailymotion.com/embed/video/${dm}`
    - OK: `https://ok.ru/videoembed/${okru}`
  - If selected server id missing → `<VideoOffline />` fallback
- Episode grid below player; clicking updates URL via `useNavigate` (no full reload, query stays cached)
- SEO: route `head()` derives title from loader/data — `${anime.title} — Ep ${ep.number} | AnimePlay`

## Home

- Mobile (<768px): horizontal snap-scroll rails per category (Trending / Recently Added) with overflow-x cards
- Desktop: responsive grid (`grid-cols-2 md:grid-cols-4 lg:grid-cols-6`)
- Card: poster, title, hover scale (Framer Motion `whileHover`), tap feedback for touch

## Admin Dashboard

- Auth gate in `admin.tsx`: if `!user` → redirect to `/login`
- Layout:
  - Desktop: top tabs (Animes / Episodes / Logout)
  - Mobile (<768px): fixed bottom tab bar with icons (lucide), 56px height, safe-area padding; NO sidebar
- Animes page: table/list + modal form (Title, Description, Poster URL). Edit/Delete actions
- Episodes page: anime selector → list of episodes for that anime + form (Episode #, Title, Dailymotion ID, OKRU ID). Edit/Delete

## Polish

- `<Skeleton />` shimmer components for cards, player, lists (Tailwind animate-pulse w/ slate gradient)
- `<NotFound />` and `<VideoOffline />` shared components
- Framer Motion: `AnimatePresence` page transitions in `__root.tsx` Outlet wrapper (fade+y)
- Toasts via existing `sonner` for CRUD feedback
- Touch targets ≥ 44px; no hover-only affordances on mobile

## Theme tokens (styles.css)

- `--background: oklch(0.13 0.02 250)` (slate-950)
- `--card: oklch(0.18 0.02 250)`
- `--primary: oklch(0.7 0.18 25)` (anime red accent) — confirm if you'd prefer a different accent
- Glass: `bg-white/5 backdrop-blur border border-white/10`

## Security note

Firebase web config is publishable (safe in code). RTDB security rules are managed in the Firebase console — recommend locking writes to authed users; I'll note this in the README but cannot configure it from here.

## Open questions (will assume defaults if unanswered)

1. Accent color — red (anime classic) vs violet vs cyan? Default: red.
2. Login method — email/password only? Default: yes (Google sign-in not requested).
3. Seed data — do you already have `/animes` + `/episodes` populated in RTDB, or should I include a one-time "seed sample data" button in admin? Default: no seed, assume data exists or admin will add it.
  &nbsp;