# Public assets

Files placed in this `public/` directory are served at the site root
(e.g. `public/favicon.ico` → `/favicon.ico`). They are NOT processed by the
Vite bundler — drop them in and reference by absolute URL.

## Replacing the favicons (anime logo)

1. Generate or design your anime logo. Recommended: a solid 512×512 PNG with
   transparent background. Free generators: realfavicongenerator.net,
   favicon.io.
2. Export the following files and place them directly inside this folder:

   ```
   public/
     favicon.ico              # 32×32 ICO, browser tab icon (legacy)
     favicon-16x16.png        # 16×16 PNG
     favicon-32x32.png        # 32×32 PNG
     apple-touch-icon.png     # 180×180 PNG, iOS home-screen icon
     android-chrome-192.png   # 192×192 PNG, Android
     android-chrome-512.png   # 512×512 PNG, Android / PWA
     site.webmanifest         # optional PWA manifest
   ```

3. Reference them from `src/routes/__root.tsx` inside the root route's
   `head().links` array. Example:

   ```ts
   links: [
     { rel: "stylesheet", href: appCss },
     { rel: "icon", href: "/favicon.ico", sizes: "any" },
     { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" },
     { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16x16.png" },
     { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
     { rel: "manifest", href: "/site.webmanifest" },
   ],
   ```

4. Hard-refresh (Ctrl/Cmd + Shift + R) — browsers aggressively cache
   favicons. The new icon should appear in the browser tab.

The in-app top-bar logo is separate and is configured at runtime via
**Admin → Settings → Site Logo** (writes to Firebase RTDB
`settings/site_logo_url`). That logo can be changed without redeploying.
