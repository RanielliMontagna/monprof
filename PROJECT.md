# Monitor Profiles Switcher (KDE / Wayland / Electron)

Tiny Linux app to **create, edit and apply** monitor layouts on KDE Plasma (Wayland), with a **visual Electron UI** plus a **Node core** that talks to KDE’s KScreen over DBus.

---

## Purpose

I often switch between monitor setups like:

- **01 - Professional**
  - Left monitor: primary, horizontal
  - Right monitor: secondary, vertical
- **02 - Gaming with steering**
  - Left monitor: OFF
  - Right monitor: primary, horizontal

On Wayland, tools like `autorandr` don’t work (X11 only), so I want my own tool that:

1. Reads current display config from KDE,
2. Saves it as a named profile,
3. Applies it later with 1 click or a shortcut,
4. Lets me edit profiles in a simple UI.

---

## Tech Stack

- **OS**: CatchyOS (Arch-based)
- **DE**: KDE Plasma (Wayland)
- **App shell**: **Electron**
- **Backend / system access**: **Node.js (TypeScript)** with **dbus-next**
- **UI**: React (or plain Electron renderer)
- **Config store**: local JSON file (`profiles.json`)

---

## High-Level Architecture

- **Electron main process**
  - creates the window
  - creates a **tray icon** with quick actions (apply profile)
  - exposes IPC handlers:
    - `profiles:list`
    - `profiles:apply`
    - `profiles:save`
    - `profiles:update`
- **Preload**
  - safe bridge: `window.monprof.*`
- **Renderer (React)**
  - shows profiles
  - form to create/edit profile
  - button: “save current display as profile”
- **Core (shared)**
  - code to call KDE KScreen via DBus
  - code to read/write `profiles.json`

---

## CLI vs GUI

The project should ship **both**:

1. **CLI** (for KDE shortcuts):
   ```bash
   monprof apply gaming
   monprof apply professional
   ```
2. **Electron GUI** (for editing / creating).

Both should use the **same core** so logic is not duplicated.

---

## DBus (KDE / KScreen)

We will talk to:

- Service: `org.kde.KScreen`
- Path: `/backend`
- Methods:
  - `org.kde.KScreen.Backend.getConfig` → get current displays
  - `org.kde.KScreen.Backend.setConfig` → apply new layout

In dev, to inspect current config:

```bash
qdbus org.kde.KScreen /backend org.kde.KScreen.Backend.getConfig
```

The Node part (using `dbus-next`) will wrap those calls and normalize the structure.

---

## Data Model

`profiles.json` (user-editable):

```json
{
  "profiles": {
    "professional": {
      "outputs": [
        {
          "name": "DP-1",
          "enabled": true,
          "primary": true,
          "rotation": "normal",
          "mode": "2560x1440@60",
          "position": [0, 0]
        },
        {
          "name": "HDMI-1",
          "enabled": true,
          "primary": false,
          "rotation": "right",
          "mode": "1920x1080@60",
          "position": [2560, 0]
        }
      ]
    },
    "gaming": {
      "outputs": [
        {
          "name": "DP-1",
          "enabled": true,
          "primary": true,
          "rotation": "normal",
          "mode": "2560x1440@60",
          "position": [0, 0]
        },
        {
          "name": "HDMI-1",
          "enabled": false
        }
      ]
    }
  }
}
```

Notes:

- `name` must match the name reported by KScreen.
- If `mode` is missing, we keep the current one.
- If `enabled` is `false`, we disable that output.
- We can extend this structure later (scale, refresh, transform).

---

## CLI Design

```text
monprof list
monprof save <profile-name>
monprof apply <profile-name>
monprof show <profile-name>
monprof edit <profile-name> [--output ...]
```

Examples:

```bash
# Save current KDE layout
monprof save professional

# Apply an existing layout
monprof apply gaming

# Edit an existing layout (patch)
monprof edit professional --output HDMI-1:rotation=right
```

The CLI will just call functions from `src/core`.

---

## Electron IPC Contract

**main.ts**

```ts
ipcMain.handle("profiles:list", async () => listProfiles());
ipcMain.handle("profiles:apply", async (_evt, name) => applyProfile(name));
ipcMain.handle("profiles:save", async (_evt, name) => saveCurrentAs(name));
ipcMain.handle("profiles:update", async (_evt, payload) =>
  updateProfile(payload)
);
```

**preload.ts**

```ts
contextBridge.exposeInMainWorld("monprof", {
  list: () => ipcRenderer.invoke("profiles:list"),
  apply: (name) => ipcRenderer.invoke("profiles:apply", name),
  save: (name) => ipcRenderer.invoke("profiles:save", name),
  update: (payload) => ipcRenderer.invoke("profiles:update", payload),
});
```

**renderer (React)**

```ts
const profiles = await window.monprof.list();
await window.monprof.apply("gaming");
await window.monprof.save("professional");
```

---

## UI (first version)

- **Sidebar**: list of profiles
  - click → apply
  - right-click → edit / delete
- **Main panel**:
  - shows outputs for that profile
  - dropdowns for:
    - enabled/on/off
    - primary
    - rotation
    - mode
  - “Save profile”
- **Header**:
  - “Save current KDE layout as…” (opens small modal)

Later:

- “detect displays now”
- “import/export profiles.json”

---

## Tray

Electron tray with:

- “Apply: professional”
- “Apply: gaming”
- “Open Monitor Profiles…”
- “Reload displays”
- “Quit”

This allows switching without opening the window.

---

## Project Structure

The project follows modern professional structure patterns for maintainability and scalability.

```text
monprof/
├─ apps/                    # Application entry points
│  ├─ electron/            # Electron application
│  │  ├─ main.ts           # Main process
│  │  ├─ preload.ts        # Preload script (IPC bridge)
│  │  └─ tray.ts           # System tray implementation
│  └─ ui/                  # React UI application
│     ├─ index.html        # HTML entry point
│     ├─ src/
│     │  ├─ main.tsx       # React entry point
│     │  ├─ App.tsx        # Root component
│     │  ├─ components/    # React components
│     │  │  ├─ Header.tsx
│     │  │  ├─ Sidebar.tsx
│     │  │  ├─ MainPanel.tsx
│     │  │  └─ SaveModal.tsx
│     │  ├─ types.ts       # TypeScript types for UI
│     │  ├─ index.css      # Global styles
│     │  └─ vite-env.d.ts  # Vite type declarations
│     └─ tsconfig.json     # TypeScript config for UI
├─ src/                    # Shared core library
│  ├─ core/                # Core business logic
│  │  ├─ kscreen.ts        # DBus KScreen integration
│  │  ├─ profiles.ts       # Profile management
│  │  └─ __tests__/        # Unit tests for core
│  │     ├─ kscreen.test.ts
│  │     └─ profiles.test.ts
│  ├─ types/               # TypeScript type definitions
│  │  └─ kscreen.d.ts      # DBus type definitions
│  └─ cli.ts               # CLI entry point
├─ data/                   # Application data (runtime)
│  └─ profiles.json        # User profiles (gitignored in production)
├─ assets/                 # Static assets (icons, images)
├─ config/                 # Configuration files (optional)
├─ dist/                   # Build output (gitignored)
│  ├─ apps/                # Compiled apps
│  └─ src/                 # Compiled core library
├─ .gitignore              # Git ignore rules
├─ biome.json              # Biome linter configuration
├─ package.json            # Project dependencies and scripts
├─ tsconfig.json           # TypeScript configuration (root)
├─ vite.config.ts          # Vite configuration for UI
├─ vitest.config.ts        # Vitest test configuration
├─ README.md               # Project documentation
└─ PROJECT.md              # This file - project specification
```

### Structure Rules

**MUST follow these patterns:**

1. **Applications (`apps/`)**
   - Each application (electron, ui) has its own directory
   - Self-contained with own `tsconfig.json` if needed
   - Imports from shared `src/` core library
   - No cross-app dependencies

2. **Source Code (`src/`)**
   - Shared business logic used by all applications
   - Tests in `__tests__/` subdirectories (co-located)
   - Types in `src/types/` directory
   - CLI entry point at root level

3. **Data (`data/`)**
   - Runtime user data (profiles.json)
   - Should be gitignored in production builds
   - Path: `data/profiles.json`

4. **Assets (`assets/`)**
   - Static files (icons, images)
   - Not compiled, copied during build if needed

5. **Tests**
   - Unit tests: `src/**/__tests__/*.test.ts`
   - Co-located with source files
   - Use `.test.ts` suffix

6. **Build Output (`dist/`)**
   - Compiled code goes to `dist/`
   - Mirrors source structure
   - Gitignored

7. **Configuration Files**
   - Root level: `package.json`, `tsconfig.json`, etc.
   - App-specific: `apps/*/tsconfig.json` if needed
   - Tool configs: `vite.config.ts`, `vitest.config.ts`, `biome.json`

**DO NOT:**
- Mix test files with source files (use `__tests__/`)
- Put data files in root (use `data/`)
- Create deep nested directories unnecessarily
- Mix app-specific code with shared core code

### Naming Conventions

- **Files**: `kebab-case.ts` or `PascalCase.tsx` (React components)
- **Directories**: `kebab-case` or `PascalCase` (if matching component name)
- **Tests**: `*.test.ts` or `*.spec.ts` in `__tests__/` directories
- **Types**: `*.d.ts` in `src/types/` or co-located with source

### Import Paths

- **From apps to src**: Use relative paths `../../src/core/...`
- **Within same app**: Use relative paths `./components/...`
- **Within src**: Use relative paths `../core/...`
- **Always include `.js` extension** in TypeScript imports for ESM compatibility

### Example Import Patterns

```typescript
// In apps/electron/main.ts
import { getConfig } from "../../src/core/kscreen.js";

// In src/core/profiles.ts
import type { DisplayOutput } from "./kscreen.js";

// In apps/ui/src/App.tsx
import Header from "./components/Header";
```

---

## Scripts

```json
{
  "scripts": {
    "dev": "concurrently \"npm:dev:ui\" \"npm:dev:electron\"",
    "dev:ui": "vite --host",
    "dev:electron": "electronmon dist/electron/main.js",
    "build": "tsc && vite build && electron-builder",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "biome check ."
  }
}
```

### Testing

- **Framework**: Vitest (fast, ESM-native, TypeScript-friendly)
- **Command**: `npm test` - run tests once
- **Watch mode**: `npm run test:watch` - run tests in watch mode
- **Coverage**: `npm run test:coverage` - run tests with coverage report
- **Always run tests before committing**: `npm test`
- **Always build before committing**: `npm run build`

---

## Quality

- Language: **English only**
- Lint: Biome or ESLint
- Commit style: `feat:`, `fix:`, `chore:`
- **DO NOT create additional .md files** - use only README.md and PROJECT.md
- **Always test the project** using the test suite before submitting changes
- **Always build the project** at the end to verify everything compiles correctly (`npm run build`)
- **Comments**: Use comments where necessary to explain:
  - Complex logic or business rules
  - Workarounds or limitations
  - Non-obvious code decisions
  - Public API documentation (JSDoc)
- **Remove unnecessary comments**:
  - Obvious code explanations
  - Redundant comments
  - Commented-out code (unless temporarily kept for reference)
- PRs must include:
  - description
  - screenshots (UI)
  - tested on Wayland
  - test results (`npm test`)
  - build verification (`npm run build`)

---

## Next steps

1. Implement `src/core/kscreen.ts` with `dbus-next` (getConfig, setConfig).
2. Implement `src/core/profiles.ts` (read/write/merge).
3. Create CLI (`monprof`) that uses the core.
4. Wrap with Electron main + preload.
5. Build minimal React UI to:
   - list profiles
   - create new from current
   - edit and save
6. Add tray for quick apply.
