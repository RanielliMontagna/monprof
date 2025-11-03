# Monitor Profiles Switcher (KDE / Wayland / Electron)

Tiny Linux app to **create, edit and apply** monitor layouts on KDE Plasma (Wayland), with a **visual Electron UI** plus a **Node core** that talks to KDE's KScreen over DBus.

---

## Purpose

Switch between monitor setups (e.g., Professional, Gaming) on Wayland. Tools like `autorandr` don't work (X11 only), so this tool:
1. Reads current display config from KDE
2. Saves it as a named profile
3. Applies it later with 1 click or a shortcut
4. Lets you edit profiles in a simple UI

---

## Tech Stack

- **OS**: Linux (Arch-based)
- **DE**: KDE Plasma (Wayland)
- **App shell**: Electron
- **Backend**: Node.js (TypeScript) with dbus-next
- **UI**: React + Vite + Tailwind CSS v4
- **Config**: local JSON file (`profiles.json`)

---

## Architecture

- **Electron main**: Window creation, IPC handlers, system tray
- **Preload**: Safe bridge exposing `window.monprof.*`
- **Renderer (React)**: Profile management UI
- **Core (shared)**: DBus KScreen integration, profile read/write

Both CLI and GUI use the same core library.

---

## DBus Integration

- **Service**: `org.kde.KScreen`
- **Path**: `/backend`
- **Methods**: `getConfig`, `setConfig`

---

## Data Model

`profiles.json` structure:
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
        }
      ]
    }
  }
}
```

---

## Project Structure

```
monprof/
├─ apps/
│  ├─ electron/     # Electron app (main.ts, preload.ts, tray.ts)
│  └─ ui/           # React UI (components, index.css)
├─ src/
│  ├─ core/         # Business logic (kscreen.ts, profiles.ts)
│  │  └─ __tests__/ # Unit tests
│  └─ cli.ts        # CLI entry point
├─ data/            # profiles.json (runtime data)
├─ scripts/         # Utility scripts
└─ [config files]   # package.json, tsconfig.json, etc.
```

**Rules:**
- Tests co-located in `__tests__/` directories
- Shared code in `src/core/`, apps import from there
- Use relative paths, include `.js` extension for ESM
- Files: `kebab-case.ts` or `PascalCase.tsx` (React)

---

## Scripts

- `npm run dev` - Start UI + Electron
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run lint:fix` - Fix linting issues

---

## Code Quality

**Core Principles:**
- SOLID principles
- Type safety (avoid `any`, use type guards)
- Error handling (try-catch, custom errors, cleanup)
- Input validation at entry points
- Resource cleanup (DBus connections, file handles)

**Standards:**
- Language: English only
- Always test (`npm test`) and build (`npm run build`) before committing
- DO NOT create additional .md files (only README.md and PROJECT.md)
- Comments: Only for complex logic, workarounds, or public API docs

**PR Requirements:**
- Description
- Screenshots (UI changes)
- Test results
- Build verification
- Tested on Wayland

---

## Troubleshooting

**Electron installation (path.txt missing):**
- Automatic: `postinstall` script handles it
- Manual: `node node_modules/electron/install.js`

**Tailwind CSS v4:**
- Uses `@import "tailwindcss"` and `@theme` directive
- Colors defined in CSS using CSS variables
- PostCSS: `@tailwindcss/postcss` (autoprefixer included)
- No `tailwind.config.ts` file (CSS-first config)

**Common Issues:**
- `ERR_CONNECTION_REFUSED`: Start Vite before Electron, or use `npm run dev`
- Preload errors: Preload must be CommonJS (compiled separately)
- CommonJS imports: Use default import for `dbus-next`

---

## Next Steps

- ✅ Core implementation (kscreen, profiles)
- ✅ CLI interface
- ✅ Electron GUI
- ✅ React UI
- ✅ System tray implementation
