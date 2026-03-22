# Madhuban 360 — frontend monorepo

pnpm workspace with shared packages (`@madhuban/theme`, `@madhuban/api`, `@madhuban/types`), a **React + Vite** admin web app, and an **Expo (React Native)** mobile app for field roles.

## Prerequisites

- **Node.js** (LTS recommended)
- **pnpm** (`npm install -g pnpm` or [Corepack](https://nodejs.org/api/corepack.html))

This repo pins the package manager in [`package.json`](package.json) (`packageManager`).

## First-time setup

Run **from the repository root** (the folder that contains `pnpm-workspace.yaml`):

```bash
pnpm install
```

You do **not** need to `cd` into `apps/mobile` or `apps/web-admin` to install dependencies; the root install links all workspaces.

Optional: copy [`.env.example`](.env.example) to `.env` and adjust `VITE_*` / `EXPO_PUBLIC_*` values for API URLs.

---

## Where to run commands

| Goal | Recommended |
|------|----------------|
| Install deps, build everything, run filters | **Repository root** |
| Quick local dev of one app | **Root** with `pnpm --filter …` *or* **`cd` into that app** and use the same scripts |

Using **`pnpm --filter`** from the root avoids changing directories and is usually easiest.

---

## Web admin (`apps/web-admin`, package `@madhuban/web-admin`)

**From the repo root:**

```bash
pnpm --filter @madhuban/web-admin dev
```

**Or** from `apps/web-admin`:

```bash
cd apps/web-admin
pnpm dev
```

- Dev server: Vite (URL printed in the terminal, typically `http://localhost:5173`).
- Production build: `pnpm --filter @madhuban/web-admin build`

In development, Vite proxies `/api` to the backend (see [`apps/web-admin/vite.config.ts`](apps/web-admin/vite.config.ts)) so you can use a relative API base when configured.

---

## Mobile (`apps/mobile`, package `@madhuban/mobile`)

**From the repo root:**

```bash
pnpm --filter @madhuban/mobile start
```

**Or** from `apps/mobile`:

```bash
cd apps/mobile
pnpm start
```

That runs the Expo CLI (`expo start`). Then:

- Press **`a`** for Android emulator / device, **`i`** for iOS simulator (macOS), or scan the QR code with **Expo Go**.

Other scripts (same root vs `apps/mobile` pattern):

```bash
pnpm --filter @madhuban/mobile run android
pnpm --filter @madhuban/mobile run ios
pnpm --filter @madhuban/mobile run web
```

`react-native-web` and `react-dom` are installed for the **web** target (Expo’s web bundler). **`react` and `react-dom` must be the exact same version** (React 19 enforces this on web). Use `npx expo install react react-dom` from `apps/mobile` so both match the SDK. If you see missing `react-native-web` errors, run `npx expo install react-native-web react-dom` there too.

The app uses **Expo Router**; the default API base is set in [`apps/mobile/app/_layout.tsx`](apps/mobile/app/_layout.tsx) (override with `EXPO_PUBLIC_API_BASE_URL`).

---

## Repo-wide scripts (from root)

| Command | What it does |
|------------------|----------------|
| `pnpm install` | Install all workspace dependencies |
| `pnpm build` | `turbo run build` — builds/typechecks packages and apps that define a `build` script |
| `pnpm exec turbo run typecheck` | Run `typecheck` where defined (if you add it per package) |
| `pnpm run lint` | `turbo run lint` — runs only where a `lint` script exists |

**Note:** Root `pnpm dev` runs `turbo run dev`. Only apps that define a `dev` script participate; the mobile app uses `start` for Expo, so run it with **`pnpm --filter @madhuban/mobile start`** as above.

---

## Layout

```
apps/
  web-admin/    # React admin (Vite)
  mobile/       # Expo + React Native (field roles)
packages/
  api/          # Shared API client
  theme/        # Design tokens + ThemeProvider
  types/        # Shared TypeScript types
```

Product context: `PRD.md`. Legacy REST reference: `reference api files/`. Design exports: `screens/`.
