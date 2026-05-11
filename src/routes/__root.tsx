import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useLocation,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { AuthProvider } from "../lib/auth-context";
import { Toaster } from "sonner";
import { TopNav } from "../components/TopNav";
import { BottomNav } from "../components/BottomNav";
import { AnnouncementBar } from "../components/AnnouncementBar";
import { BannedOverlay } from "../components/BannedOverlay";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong. Try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AnimePlay — Watch Anime Online" },
      { name: "description", content: "Stream anime episodes in HD on AnimePlay." },
      { name: "author", content: "AnimePlay" },
      { property: "og:title", content: "AnimePlay" },
      { property: "og:description", content: "Stream anime episodes in HD." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="bg-background text-foreground antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { pathname } = useLocation();
  const hideTop = pathname.startsWith("/admin") || pathname.startsWith("/login");
  const hideBottom = pathname.startsWith("/admin") || pathname.startsWith("/login") || pathname.startsWith("/watch");
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div onContextMenu={(e) => e.preventDefault()} className="flex min-h-dvh flex-col">
          <AnnouncementBar />
          {!hideTop && <TopNav />}
          <main
            className="flex-1"
            style={{
              paddingBottom: hideBottom
                ? "env(safe-area-inset-bottom)"
                : "calc(env(safe-area-inset-bottom) + 64px)",
            }}
          >
            <Outlet />
          </main>
          <BottomNav />
          <BannedOverlay />
          <Toaster theme="dark" position="top-center" richColors />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}
