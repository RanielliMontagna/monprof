# Monprof

**Monprof** is a tiny Linux application to create, edit, and apply monitor layouts on KDE Plasma (Wayland), featuring a visual Electron UI and a Node.js core that communicates with KDE's KScreen over DBus.

## Purpose

Switch effortlessly between different monitor setups:

- **Professional Setup**
  - Left monitor: primary, horizontal
  - Right monitor: secondary, vertical

- **Gaming Setup**
  - Left monitor: OFF
  - Right monitor: primary, horizontal

Since tools like `autorandr` don't work on Wayland (X11 only), Monprof provides:

1. Read current display configuration from KDE
2. Save it as a named profile
3. Apply it later with one click or a keyboard shortcut
4. Edit profiles in a simple, visual UI

## Features

- 🖥️ **Visual UI** - Electron-based interface for easy profile management
- ⌨️ **CLI Tool** - Command-line interface for keyboard shortcuts and automation
- 📋 **System Tray** - Quick profile switching without opening the window
- 💾 **Profile Management** - Save, edit, and apply monitor configurations
- 🔄 **Wayland Support** - Native KDE Plasma (Wayland) integration via DBus

## Tech Stack

- **OS**: Linux (Arch-based)
- **DE**: KDE Plasma (Wayland)
- **App Shell**: Electron
- **Backend**: Node.js (TypeScript) with `dbus-next`
- **UI**: React with Vite
- **Config Store**: Local JSON file (`profiles.json`)

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd monprof

# Install dependencies
npm install

# Build the project
npm run build
```

## Usage

### CLI

```bash
# List all profiles
monprof list

# Save current KDE layout as a profile
monprof save professional

# Apply an existing profile
monprof apply gaming

# Show profile details
monprof show professional

# Edit a profile
monprof edit professional --output HDMI-1:rotation=right
```

### GUI

Launch the Electron application to access the visual interface:

- Browse and manage profiles in the sidebar
- Create new profiles from current display configuration
- Edit existing profiles with dropdown menus
- Quick apply via system tray menu

## Project Structure

Professional structure following modern best practices:

```
monprof/
├─ apps/                    # Application entry points
│  ├─ electron/            # Electron application
│  │  ├─ main.ts           # Main process
│  │  ├─ preload.ts        # Preload script (IPC bridge)
│  │  └─ tray.ts           # System tray implementation
│  └─ ui/                  # React UI application
│     └─ src/              # UI source code
│        ├─ components/    # React components
│        ├─ main.tsx       # Entry point
│        └─ App.tsx        # Root component
├─ src/                    # Shared core library
│  ├─ core/                # Core business logic
│  │  ├─ kscreen.ts        # DBus KScreen integration
│  │  ├─ profiles.ts       # Profile management
│  │  └─ __tests__/        # Unit tests
│  ├─ types/               # TypeScript definitions
│  └─ cli.ts               # CLI entry point
├─ data/                   # Runtime data
│  └─ profiles.json        # User profiles
├─ assets/                 # Static assets
└─ [config files]          # Root level configs
```

See `PROJECT.md` for detailed structure rules and conventions.

## Development

```bash
# Install dependencies
npm install

# Run development mode (UI + Electron)
npm run dev

# Run UI only
npm run dev:ui

# Run Electron only
npm run dev:electron

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Build for production (ALWAYS run this before committing)
npm run build
```

**Important**: Always run `npm test` and `npm run build` before committing to ensure everything works correctly.

## DBus Integration

Monprof communicates with KDE's KScreen service via DBus:

- **Service**: `org.kde.KScreen`
- **Path**: `/backend`
- **Methods**:
  - `org.kde.KScreen.Backend.getConfig` → Get current displays
  - `org.kde.KScreen.Backend.setConfig` → Apply new layout

To inspect the current config manually:

```bash
qdbus org.kde.KScreen /backend org.kde.KScreen.Backend.getConfig
```

## Data Model

Profiles are stored in `profiles.json`:

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

## Contributing

- Language: **English only**
- Linter: Biome
- Testing: Vitest
- Commit style: `feat:`, `fix:`, `chore:`
- **DO NOT create additional .md files** - use only README.md and PROJECT.md
- **Always test**: Run `npm test` before committing
- **Always build**: Run `npm run build` before committing to verify compilation
- Pull requests must include:
  - Description
  - Screenshots (for UI changes)
  - Test results (`npm test`)
  - Build verification (`npm run build`)
  - Tested on Wayland

## License

[Add your license here]

## Author

[Add your name/info here]

