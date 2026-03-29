# Madhuban 360 — Frontend Monorepo

A **pnpm workspace** monorepo containing two apps and three shared packages:

| App / Package | Path | Description |
|---|---|---|
| `@madhuban/mobile` | `apps/mobile/` | Expo (React Native) field-staff app |
| `@madhuban/web-admin` | `apps/web-admin/` | Vite + React admin dashboard |
| `@madhuban/api` | `packages/api/` | Shared API client (auth, tasks, users…) |
| `@madhuban/theme` | `packages/theme/` | Design tokens + ThemeProvider |
| `@madhuban/types` | `packages/types/` | Shared TypeScript types |

All apps and packages are linked automatically by pnpm workspaces. Turbo is used as the task runner for builds, typechecks, and linting across the repo.

Product context → [`PRD.md`](PRD.md)

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Install dependencies](#install-dependencies)
3. [Environment setup](#environment-setup)
4. [Project structure](#project-structure)
5. [Mobile app (`apps/mobile`)](#mobile-app-appsmobile)
6. [Web admin (`apps/web-admin`)](#web-admin-appsweb-admin)
7. [Shared packages](#shared-packages)
8. [Running the apps](#running-the-apps)
9. [Building an APK (Android)](#building-an-apk-android)
10. [Repo-wide scripts](#repo-wide-scripts)

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| **Node.js** | LTS (20+) | [nodejs.org](https://nodejs.org) |
| **pnpm** | 10+ | `npm install -g pnpm` |
| **Expo Go** *(optional)* | Latest | App Store / Play Store |
| **EAS CLI** *(for APK builds)* | 14+ | `npm install -g eas-cli` |
| **Android Studio** *(for local builds)* | Latest | [developer.android.com](https://developer.android.com/studio) |

> This repo pins `packageManager: "pnpm@10.32.1"` in `package.json`. Corepack can enforce this automatically — run `corepack enable` once.

---

## Install dependencies

Run **from the repository root** (the folder containing `pnpm-workspace.yaml`). You never need to `cd` into individual apps to install.

```bash
pnpm install
```

This installs all dependencies for every workspace package and app in one pass and symlinks the local `@madhuban/*` packages together.

---

## Environment setup

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

| Variable | Used by | Purpose |
|---|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | Mobile app | Base URL for the REST API (e.g. `https://api.madhuban360.com`) |
| `VITE_API_BASE_URL` | Web admin | Same API base for the Vite dev server |
| `VITE_DEV_TOKEN` | Web admin | Optional dev token to skip auth during development |

> **Mobile:** Variables prefixed `EXPO_PUBLIC_` are inlined at build time by the Expo bundler and are safe to read on the client.
> **Web:** Variables prefixed `VITE_` are inlined by Vite at build time.

---

## Project structure

```
madhuban360-frontend-mono/
├── apps/
│   ├── mobile/                  # Expo React Native app
│   │   ├── app/                 # File-based routes (Expo Router)
│   │   │   ├── (auth)/          # Login, OTP, splash, reset password
│   │   │   ├── staff/           # Staff tab group + attendance
│   │   │   ├── supervisor/      # Supervisor tab group + attendance
│   │   │   └── manager/         # Manager tab group + attendance
│   │   ├── src/
│   │   │   ├── components/      # Reusable UI components
│   │   │   ├── context/         # AuthContext
│   │   │   ├── hooks/           # Custom hooks (e.g. usePullToRefresh)
│   │   │   ├── layouts/         # RolePageLayout, AuthLayout
│   │   │   ├── navigation/      # Tab bar, tab config, role guards
│   │   │   ├── screens/         # Screen components by feature
│   │   │   │   ├── attendance/  # Check-in / check-out flow
│   │   │   │   ├── dashboards/  # Home screens per role
│   │   │   │   ├── supervisor/  # Supervisor-only screens
│   │   │   │   └── tabs/        # Shared tab screens (Tasks, Reports, Profile)
│   │   │   ├── styles/          # Co-located StyleSheet files
│   │   │   └── utils/           # Helpers (validation, etc.)
│   │   ├── assets/              # Icons, splash, images
│   │   ├── app.json             # Expo config (bundle ID, icons, splash)
│   │   ├── eas.json             # EAS Build profiles
│   │   ├── babel.config.js
│   │   └── metro.config.js
│   │
│   └── web-admin/               # Vite + React admin dashboard
│       ├── src/
│       │   ├── pages/           # AdminDashboardPage, UsersPlaceholderPage
│       │   ├── layouts/         # AdminShellLayout
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── public/
│       ├── index.html
│       └── vite.config.ts
│
├── packages/
│   ├── api/                     # @madhuban/api — REST client
│   │   └── src/
│   │       ├── auth.ts          # Token / header helpers
│   │       ├── mobileAuth.ts    # OTP / mobile login
│   │       ├── tasks.ts         # CRUD + filters for tasks
│   │       ├── users.ts         # Users + assignee helpers
│   │       ├── endUser.ts       # getMyTasks, getCurrentUser
│   │       ├── supervisor.ts    # Supervisor dashboard
│   │       └── dashboard.ts     # Metrics, pipeline, alerts
│   │
│   ├── theme/                   # @madhuban/theme — design tokens
│   │   └── src/
│   │       ├── primitives.ts    # colors, radii, space, font
│   │       ├── tokens.css       # CSS custom properties (web)
│   │       └── ThemeProvider.tsx
│   │
│   └── types/                   # @madhuban/types — shared TS types
│       └── src/
│           └── index.ts         # UserRole, Task, AuthUser, TaskStatus…
│
├── turbo.json                   # Turbo pipeline config
├── pnpm-workspace.yaml          # Workspace package roots
├── tsconfig.base.json           # Shared TS compiler options
├── .env.example                 # Environment variable template
└── PRD.md                       # Product Requirements Document
```

---

## Mobile app (`apps/mobile`)

### Tech stack

| Layer | Choice |
|---|---|
| Framework | **Expo SDK 54** + **React Native 0.81** |
| Routing | **Expo Router 6** (file-based, similar to Next.js App Router) |
| UI icons | `@expo/vector-icons` (Ionicons, Feather, MaterialCommunityIcons) |
| Fonts | Montserrat via `@expo-google-fonts/montserrat` |
| State | React `useState` / `useContext` + AsyncStorage for persistence |
| API | `@madhuban/api` workspace package |
| Design tokens | `@madhuban/theme` (`colors`, `font`, `space`, `radii`) |

### Role-based routing

The app supports three field roles. Each has its own route group with isolated tab navigation:

```
app/
├── (auth)/        → login, OTP, forgot password, splash
├── staff/
│   ├── (tabs)/    → Home, Tasks, Reports, Profile
│   └── attendance/[mode].tsx   → check-in / check-out
├── supervisor/
│   ├── (tabs)/    → Home, Tasks, Reports, Profile
│   └── attendance/[mode].tsx
└── manager/
    ├── (tabs)/    → Home, Tasks, Reports, Profile
    └── attendance/[mode].tsx
```

After login, `AuthContext` reads the user's role and navigates to the correct route group. The `RoleTabBar` and `tabConfig.ts` define which tabs appear per role.

### Attendance flow

Each role has a shared `AttendanceActionCard` on their home screen. It shows **Check In** initially and toggles to **Check Out** after a successful check-in. The state is persisted in AsyncStorage. The underlying `AttendanceActionScreen` handles selfie capture + geofence validation.

### Task workflow (staff)

Staff tasks follow a before/after photo flow:

1. **Task list** → tap action button → task detail modal
2. **Start Task** → before photo capture
3. Before photo submitted → task card turns **Ongoing** (amber) on the list
4. Tap ongoing card → confirmation modal → "Take After Photo"
5. After photo submitted → task marked **Done**, shift progress updates

---

## Web admin (`apps/web-admin`)

### Tech stack

| Layer | Choice |
|---|---|
| Bundler | **Vite 8** |
| Framework | **React 19** |
| Routing | **React Router DOM 7** |
| Styling | CSS modules + `@madhuban/theme` tokens |
| API | `@madhuban/api` workspace package |

The web admin is a separate SPA targeting admin/manager roles on desktop. It shares API logic and TypeScript types with the mobile app via workspace packages but has its own completely independent UI.

---

## Shared packages

### `@madhuban/api`

REST client used by both the mobile app and web admin. Exports:

- `login`, `mobileLogin`, `requestOtp`, `verifyOtp` — authentication
- `getMyTasks`, `getTasks`, `createTask`, `updateTaskStatus` — task management
- `getUsers`, `getSupervisors` — user management
- `getDashboardMetrics`, `getSupervisorDashboard` — analytics
- `configureApiBaseUrl`, `configureAuthTokenGetter` — runtime config

### `@madhuban/theme`

Design tokens consumed by both apps:

```ts
import { colors, font, radii, space } from "@madhuban/theme";
```

Web apps can also import `tokens.css` for CSS custom properties.

### `@madhuban/types`

Shared TypeScript interfaces: `UserRole`, `AuthUser`, `Task`, `TaskStatus`, `LoginCredentials`, and more.

---

## Running the apps

All commands can be run from the **repo root** using `--filter`, or from inside the app directory directly.

### Install (always run first)

```bash
# From repo root
pnpm install
```

### Start the mobile app (Expo)

```bash
# From repo root
pnpm --filter @madhuban/mobile start

# Or from apps/mobile
cd apps/mobile
pnpm start
```

Then in the Expo terminal:
- Press `a` → open on Android emulator / connected device
- Press `i` → open on iOS simulator (macOS only)
- Press `w` → open in browser (web target)
- Scan the QR code with **Expo Go** on a physical device

### Start the web admin (Vite)

```bash
# From repo root
pnpm --filter @madhuban/web-admin dev

# Or from apps/web-admin
cd apps/web-admin
pnpm dev
```

Dev server runs at `http://localhost:5173` by default.

### Run both apps simultaneously

```bash
# From repo root
pnpm dev
```

This uses Turbo to start both apps in parallel.

---

## Building an APK (Android)

APK builds are handled by **EAS Build** (Expo's cloud build service). Builds are configured in [`apps/mobile/eas.json`](apps/mobile/eas.json).

### Step 1 — One-time setup

```bash
# Install EAS CLI globally (skip if already installed)
npm install -g eas-cli

# Log in to your Expo account (sign up free at expo.dev)
eas login

# Link this project to your account (run from apps/mobile, only needed once)
cd apps/mobile
eas init
```

### Step 2 — Build the APK

Run all EAS commands from `apps/mobile/`:

```bash
cd apps/mobile
```

| Build type | Command | Output | Use for |
|---|---|---|---|
| **Preview APK** *(internal testing)* | `pnpm run eas:apk` | `.apk` | Sideload on any Android device |
| **Development APK** *(Expo dev client)* | `pnpm run eas:dev` | `.apk` debug | Hot reload during development |
| **Production** *(Play Store)* | `eas build --platform android --profile production` | `.aab` | Google Play Store submission |

The `eas:apk` shortcut runs:
```bash
eas build --platform android --profile preview
```

When the build completes (~10–15 min), EAS prints a download link for the `.apk`. You can also track all builds at [expo.dev](https://expo.dev).

### Build profiles (`eas.json`)

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "development": {
      "developmentClient": true,
      "android": { "buildType": "apk" }
    },
    "production": {
      "autoIncrement": true,
      "android": { "buildType": "app-bundle" }
    }
  }
}
```

### Local build (no cloud required)

Requires Android Studio + Android SDK installed locally:

```bash
cd apps/mobile
pnpm run eas:apk:local
```

Output APK location: `android/app/build/outputs/apk/release/`

### Monorepo note

EAS automatically detects the pnpm workspace. Always run `eas build` from `apps/mobile/` — EAS CLI walks up to find `pnpm-workspace.yaml` and installs all workspace packages (including `@madhuban/api`, `@madhuban/theme`, `@madhuban/types`) before building.

---

## Repo-wide scripts

Run from the **repository root**:

| Command | What it does |
|---|---|
| `pnpm install` | Install all workspace dependencies |
| `pnpm dev` | Start mobile (Expo) + web admin (Vite) in parallel |
| `pnpm build` | Build all packages and apps via Turbo |
| `pnpm typecheck` | Run TypeScript checks across all workspaces |
| `pnpm lint` | Run ESLint across all workspaces |

Per-app scripts (run from `apps/mobile` or `apps/web-admin`, or use `--filter`):

```bash
# Mobile
pnpm --filter @madhuban/mobile start       # Expo dev server
pnpm --filter @madhuban/mobile run android # Android emulator
pnpm --filter @madhuban/mobile run ios     # iOS simulator
pnpm --filter @madhuban/mobile run web     # Web browser

# Web admin
pnpm --filter @madhuban/web-admin dev      # Vite dev server
pnpm --filter @madhuban/web-admin build    # Production build
pnpm --filter @madhuban/web-admin preview  # Preview production build

# APK (must run from apps/mobile)
cd apps/mobile
pnpm run eas:apk          # Cloud APK build (preview)
pnpm run eas:apk:local    # Local APK build (needs Android Studio)
pnpm run eas:dev          # Cloud development APK
```
