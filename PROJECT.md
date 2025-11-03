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
    "dev:electron": "electronmon dist/apps/electron/main.js",
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

## Code Quality & Senior Engineering Principles

### Core Principles

#### 1. **SOLID Principles**

- **Single Responsibility Principle (SRP)**: Each module/function should have one reason to change
  - ✅ Each core module handles one domain (kscreen, profiles)
  - ✅ Separate concerns: business logic vs. IPC handlers vs. UI
  - ❌ Avoid: Functions doing multiple unrelated things

- **Open/Closed Principle (OCP)**: Open for extension, closed for modification
  - Use interfaces and abstract types
  - Allow new features via composition, not by modifying existing code

- **Liskov Substitution Principle (LSP)**: Derived classes must be substitutable for their base classes
  - Ensure interface contracts are properly maintained

- **Interface Segregation Principle (ISP)**: Clients should not depend on interfaces they don't use
  - Keep interfaces focused and minimal
  - Split large interfaces into smaller, specific ones

- **Dependency Inversion Principle (DIP)**: Depend on abstractions, not concretions
  - Use dependency injection where appropriate
  - Core logic should not depend on Electron/UI specifics

#### 2. **Error Handling**

**MUST follow these patterns:**

- **Always handle errors explicitly**: Use try-catch blocks for async operations
- **Use custom error types** for domain-specific errors:
  ```typescript
  class ProfileNotFoundError extends Error {
    constructor(name: string) {
      super(`Profile '${name}' not found`);
      this.name = 'ProfileNotFoundError';
    }
  }
  ```

- **Never swallow errors silently**: Always log or propagate
- **Resource cleanup**: Use `finally` blocks or try-with-resources pattern
  ```typescript
  // ✅ Good
  const bus = MessageBus.sessionBus();
  await bus.connect();
  try {
    // ... operations
  } finally {
    await bus.disconnect(); // Always cleanup
  }
  ```

- **Error context**: Include meaningful context in error messages
  ```typescript
  // ✅ Good
  throw new Error(`Failed to apply profile '${name}': ${error.message}`);
  
  // ❌ Bad
  throw new Error("Failed");
  ```

- **Error types**: Use appropriate error types for different scenarios
  - `ValidationError` for invalid input
  - `NotFoundError` for missing resources
  - `NetworkError` for connection issues
  - `PermissionError` for access denied

#### 3. **Type Safety**

**MUST enforce:**

- **Avoid `any` types**: Use `unknown` and type guards instead
  ```typescript
  // ✅ Good
  if (typeof value === 'string') { /* ... */ }
  
  // ❌ Bad
  const value: any = getValue();
  ```

- **Use strict TypeScript**: `strict: true` in tsconfig
- **Define interfaces** for all data structures
- **Use type guards** for runtime type checking:
  ```typescript
  function isProfile(data: unknown): data is Profile {
    return typeof data === 'object' && data !== null && 'outputs' in data;
  }
  ```

- **Prefer type unions over enums** when appropriate:
  ```typescript
  // ✅ Good
  type Rotation = "normal" | "left" | "right" | "inverted";
  
  // Consider enums only if you need reverse mapping
  ```

#### 4. **Input Validation**

**MUST validate all inputs:**

- **Function parameters**: Validate at entry points (IPC handlers, CLI, API)
  ```typescript
  function validateProfileName(name: unknown): asserts name is string {
    if (typeof name !== 'string' || name.trim().length === 0) {
      throw new ValidationError('Profile name must be a non-empty string');
    }
  }
  ```

- **User input**: Validate before processing
- **External data**: Validate DBus responses, file contents, network data
- **Defensive programming**: Don't trust external data sources

#### 5. **Resource Management**

- **Always cleanup resources**: DBus connections, file handles, timers
- **Use `finally` blocks** for guaranteed cleanup
- **Handle resource leaks**: Monitor memory, connections, file descriptors
- **Timeout operations**: Prevent hanging operations
  ```typescript
  const timeout = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Operation timeout')), 5000)
  );
  await Promise.race([operation, timeout]);
  ```

#### 6. **Code Organization**

- **DRY (Don't Repeat Yourself)**: Extract common patterns
  ```typescript
  // ✅ Good: Extract error handling pattern
  async function handleIpcError<T>(
    operation: () => Promise<T>,
    errorMessage: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      throw new Error(`${errorMessage}: ${error.message}`);
    }
  }
  ```

- **Separation of Concerns**: 
  - Business logic in `src/core/`
  - IPC handlers in `apps/electron/main.ts`
  - UI logic in `apps/ui/src/`
  - Never mix these concerns

- **Single level of abstraction**: Functions should operate at one level
  ```typescript
  // ✅ Good: High-level function
  async function applyProfile(name: string) {
    const profile = await getProfile(name);
    if (!profile) throw new ProfileNotFoundError(name);
    await setConfig({ outputs: profile.outputs });
  }
  
  // ❌ Bad: Mixing high and low level
  async function applyProfile(name: string) {
    const bus = MessageBus.sessionBus(); // Too low-level
    await bus.connect();
    // ...
  }
  ```

#### 7. **Naming Conventions**

- **Descriptive names**: Function names should describe what they do
  ```typescript
  // ✅ Good
  function parseRotationFromNumber(rotation: number): Rotation
  
  // ❌ Bad
  function parse(r: number): string
  ```

- **Boolean functions**: Use `is*`, `has*`, `can*` prefixes
- **Constants**: UPPER_SNAKE_CASE for true constants
- **Interfaces**: PascalCase, descriptive
- **Private functions**: Prefix with underscore `_` if needed for clarity

#### 8. **Performance**

- **Avoid premature optimization**: Profile first, optimize where needed
- **Batch operations**: Group I/O operations when possible
- **Lazy loading**: Load data only when needed
- **Cache appropriately**: Cache expensive operations, invalidate when needed
- **Debounce/throttle**: For frequent UI operations

#### 9. **Security**

- **Input sanitization**: Never trust user input
- **Path validation**: Prevent directory traversal
  ```typescript
  function validatePath(path: string): void {
    if (path.includes('..') || path.includes('~')) {
      throw new SecurityError('Invalid path');
    }
  }
  ```

- **Error messages**: Don't leak sensitive information
- **Electron security**: Follow Electron security best practices
  - ✅ `contextIsolation: true`
  - ✅ `nodeIntegration: false`
  - ✅ `webSecurity: true`

#### 10. **Testing**

- **Test coverage**: Aim for >80% coverage on core logic
- **Test types**: Unit tests, integration tests, E2E tests
- **Test edge cases**: Null, undefined, empty, invalid inputs
- **Mock external dependencies**: DBus, file system, Electron APIs
- **Test error paths**: Verify error handling works correctly

#### 11. **Magic Numbers & Constants**

**MUST extract:**

- **Magic numbers** into named constants:
  ```typescript
  // ✅ Good
  const VITE_DEV_SERVER_PORT = 5173;
  const VITE_STARTUP_TIMEOUT_MS = 1000;
  const OPERATION_TIMEOUT_MS = 5000;
  
  // ❌ Bad
  setTimeout(() => { /* ... */ }, 1000);
  ```

- **Repeated strings** into constants:
  ```typescript
  const KSCREEN_SERVICE = "org.kde.KScreen";
  const PROFILES_FILE_NAME = "profiles.json";
  ```

#### 12. **Logging**

- **Use structured logging**: Include context, timestamps, levels
  ```typescript
  console.error('[KScreen]', { operation: 'getConfig', error: error.message });
  ```

- **Log levels**: Use appropriate levels (error, warn, info, debug)
- **Don't log sensitive data**: Profiles, user data, tokens
- **Production logging**: Less verbose in production

#### 13. **Documentation**

- **JSDoc for public APIs**: Document all exported functions
  ```typescript
  /**
   * Applies a display profile configuration to KScreen
   * @param config - The display configuration to apply
   * @throws {KScreenError} If the configuration cannot be applied
   */
  export async function setConfig(config: KScreenConfig): Promise<void>
  ```

- **Inline comments**: Only for non-obvious logic
- **README/Changelog**: Document breaking changes

#### 14. **Code Review Checklist**

Before submitting code, verify:

- [ ] All functions have single responsibility
- [ ] Errors are handled appropriately
- [ ] Inputs are validated
- [ ] Resources are cleaned up
- [ ] Types are strict (no `any` without justification)
- [ ] No magic numbers/strings
- [ ] Code is DRY (no duplication)
- [ ] Tests pass and coverage is maintained
- [ ] Security considerations addressed
- [ ] Performance implications considered
- [ ] Documentation updated if needed

### Quality Standards

- Language: **English only**
- Lint: Biome or ESLint (must pass)
- Commit style: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`
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
  - Code review checklist completed

---

## Electron Troubleshooting

### Preload script not loading

If the preload script is not loading:

1. **Check if preload.js exists:**
   ```bash
   ls -la dist/apps/electron/preload.js
   ```

2. **Verify path in main.js:**
   The preload path should be: `dist/apps/electron/preload.js`

3. **Check Electron console:**
   Open DevTools (Cmd+Option+I / Ctrl+Shift+I) and check for errors in console

### Development mode

In development:
- **Start both UI and Electron**: Use `npm run dev` (starts Vite + Electron together)
- **Or start separately**:
  - Terminal 1: `npm run dev:ui` (Vite on port 5173)
  - Terminal 2: `npm run dev:electron` (after Vite is running)
- UI loads from `http://localhost:5173` (Vite dev server)
- Preload loads from `dist/apps/electron/preload.js`
- **Important**: Vite must be running before Electron starts, or you'll get `ERR_CONNECTION_REFUSED`

### Production mode

In production:
- UI loads from `dist/ui/index.html` (built files)
- Preload loads from `dist/apps/electron/preload.js`
- Run `npm run build` to build everything

### Common issues

- **Window not showing**: Check if `show: false` is set and `ready-to-show` event is handled
- **IPC not working**: Verify `window.monprof` is available in renderer (check preload script loaded)
- **Module not found**: Ensure all imports use `.js` extension for ESM compatibility
- **ERR_CONNECTION_REFUSED**: Electron can't connect to Vite dev server (port 5173). Solutions:
  - **Best**: Use `npm run dev` which starts both Vite and Electron together
  - **Or**: Start Vite first (`npm run dev:ui`), wait until it shows "ready", then start Electron (`npm run dev:electron`)
  - **Check**: Verify port is available: `lsof -i :5173` or `netstat -tuln | grep 5173`
- **Preload script ESM error**: If you get "Cannot use import statement outside a module" in preload:
  
  Electron preload scripts **must be CommonJS**, not ESM. The project compiles preload separately:
  ```bash
  # Preload is compiled with CommonJS module system
  tsc -p apps/electron/tsconfig.json
  ```
  
  The build script automatically handles this: `npm run build:ts` compiles both main code (ESM) and preload (CommonJS).
  
- **CommonJS import error**: If you get "Named export 'X' not found" from CommonJS modules like `dbus-next`, use default import:
  ```typescript
  // ❌ Wrong (named import from CommonJS)
  import { MessageBus } from "dbus-next";
  
  // ✅ Correct (default import)
  import dbusNext from "dbus-next";
  const { MessageBus } = dbusNext;
  ```
- **Electron installation error (path.txt missing)**: If you get "Electron failed to install correctly" or "path.txt is missing":
  
  **The Problem**: The Electron `postinstall` script may fail silently (especially with pnpm or slow networks), preventing the `path.txt` file from being created. This file tells Electron where to find its binary.
  
  **Automatic Solution**: The project includes a `postinstall` script that automatically checks and installs Electron if needed:
  ```bash
  # After npm/pnpm install, the postinstall script runs automatically
  # It checks if path.txt exists and downloads Electron binary if missing
  npm install  # or pnpm install
  
  # The script is: scripts/postinstall-electron.js
  ```
  
  **Manual Solution** (if automatic fails):
  ```bash
  # Run the Electron install script manually
  node node_modules/electron/install.js
  
  # For slow connections, use timeout to allow more time:
  timeout 120 node node_modules/electron/install.js
  
  # Verify installation succeeded
  ls -la node_modules/electron/path.txt
  npx electron --version
  ```
  
  **Why this happens**: The `downloadArtifact` function in `install.js` may timeout if the network is slow, preventing `path.txt` creation. The automatic postinstall script handles this, but you can run it manually if needed.

---

## Next steps

1. ✅ Implement `src/core/kscreen.ts` with `dbus-next` (getConfig, setConfig).
2. ✅ Implement `src/core/profiles.ts` (read/write/merge).
3. ✅ Create CLI (`monprof`) that uses the core.
4. ✅ Wrap with Electron main + preload.
5. ✅ Build minimal React UI to:
   - list profiles
   - create new from current
   - edit and save
6. ⏳ Add tray for quick apply.
