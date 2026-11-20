<div align="center">

<img src="https://raw.githubusercontent.com/RajaskaJanuardani/lego-openbot-agent/main/assets/logo.svg" width="88" height="88" alt="LEGO OpenBot Agent Logo" />

# LEGO OpenBot Agent (`openbot-lego`)

**An interactive 3D LEGO Tropical House and real-time visual headquarters for OpenBot Desktop AI agents.**

Built procedurally with **React**, **TypeScript**, **Three.js (`@react-three/fiber` / `@react-three/drei`)**, **Hono**, and **Tailwind CSS** — with zero external `.glb`/`.gltf` model dependencies and zero-config OpenBot synchronization.

[![npm version](https://img.shields.io/npm/v/openbot-lego?color=cb3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/openbot-lego)
[![node version](https://img.shields.io/node/v/openbot-lego?color=339933&style=flat-square&logo=node.js)](https://nodejs.org/)
[![license](https://img.shields.io/github/license/RajaskaJanuardani/lego-openbot-agent?color=6366f1&style=flat-square)](./LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/RajaskaJanuardani/lego-openbot-agent?style=flat-square&logo=github)](https://github.com/RajaskaJanuardani/lego-openbot-agent)

[Quick Start](#quick-start) · [CLI Reference](#cli-reference) · [How It Works](#how-it-works) · [Features](#features) · [Development](#development)

</div>

---

## Overview

`openbot-lego` turns your local **OpenBot Desktop** workspace into a living 2-story LEGO diorama in the browser. Each OpenBot agent automatically spawns as a custom LEGO minifigure inside the house:

- **Live presence & task state**: When an agent receives a prompt, runs a tool, or executes a scheduled routine, its minifigure immediately switches to **Working**, walks downstairs to an open computer desk in the **Floor 1 Studio**, and displays a concise task summary.
- **Autonomous idle life**: When finished, agents return to **Idle** and roam across the house and beachfront — watching TV, grabbing cold drinks from the fridge, cooking, showering, sleeping, swinging in the hammock, swimming in the ocean, playing hopscotch, or chatting with one another.
- **Zero manual setup**: No `.env` files, no manual bearer token configuration, and no second terminal required.

---

## Prerequisites

| Requirement | Version / Notes |
| :--- | :--- |
| **Node.js** | `>= 22.5.0` *(required for built-in `node:sqlite` read-only watcher)* |
| **OpenBot Desktop** | Installed on Windows, macOS, or Linux |

Verify your Node.js version:

```bash
node -v
```

---

## Quick Start

### Option 1 — Global CLI *(Recommended)*

Install once globally and launch from any directory:

```bash
npm install -g openbot-lego
openbot-lego
```

### Option 2 — Run via `npx`

```bash
npx openbot-lego
```

Running `openbot-lego` automatically locates your local OpenBot SQLite database, starts the unified HTTP + SSE + 3D web server on `http://localhost:4310` (or the next free port), and opens your default browser.

---

## CLI Reference

### Commands

| Command | Description |
| :--- | :--- |
| `openbot-lego` | Start the server, sync OpenBot agents, and open the 3D web UI |
| `openbot-lego start` | Explicit alias for the default launch command |
| `openbot-lego background` | Run detached in the background with a System Tray icon *(Windows)* |
| `openbot-lego tray` | Alias for `openbot-lego background` |
| `openbot-lego stop` | Stop the running background daemon and close its System Tray icon |
| `openbot-lego autostart <on\|off\|status>` | Enable, disable, or inspect launch-at-login startup entry |
| `openbot-lego status` | Print background daemon state and all detected OpenBot agents |
| `openbot-lego doctor` | Run diagnostics (Node.js version, bundle, database path, auto-start) |
| `openbot-lego update` | Self-update to the latest published version on npm |
| `openbot-lego logs` | Print recent lines from the background daemon log |
| `openbot-lego reset` | Clear local bridge configuration and cached state (`~/.openbot-lego`) |

### Flags

| Flag | Default | Description |
| :--- | :--- | :--- |
| `-p, --port <port>` | `4310` | HTTP server bind port |
| `--host <host>` | `127.0.0.1` | Host interface to bind |
| `-d, --daemon, --tray` | `false` | Launch directly in background / System Tray mode |
| `--no-open` | `false` | Start server without automatically opening a browser tab |
| `-v, --version` | — | Print installed package version |
| `-h, --help` | — | Print CLI usage help |

### Interactive Terminal Shortcuts

While `openbot-lego` is running in an interactive terminal:

| Key | Action |
| :---: | :--- |
| `H` | **Hide to Tray** — seamlessly hand off to background daemon + System Tray icon |
| `A` | **Toggle Auto-Start** — enable or disable silent startup on OS login |
| `U` | **One-Key Update** — update to the latest npm release when notified |
| `O` | Open the 3D web UI in your browser |
| `Q` | Stop the server and exit cleanly (`Ctrl+C` also supported) |

---

## How It Works

```text
┌────────────────────────┐     strict read-only     ┌──────────────────────────┐
│    OpenBot Desktop     │ ───────────────────────▶ │   openbot-lego Bridge    │
│      (openbot.db)      │      800ms SQLite poll   │   Hono HTTP + SSE Server │
└────────────────────────┘                          └────────────┬─────────────┘
                                                                 │ /api/events (SSE)
                                                                 ▼
┌────────────────────────┐                          ┌──────────────────────────┐
│   3D LEGO Minifigures  │ ◀─────────────────────── │   React + R3F Frontend   │
│  A* Pathfinding & AI   │    real-time state sync  │  Interactive Tropical HQ │
└────────────────────────┘                          └──────────────────────────┘
```

### Automatic OS Database Discovery

By default, the bridge watches `openbot.db` in **strict read-only** mode (WAL-safe, never writes to OpenBot's database):

| Platform | Default Path |
| :--- | :--- |
| **Windows** | `%APPDATA%\OpenBot\openbot.db` |
| **macOS** | `~/Library/Application Support/OpenBot/openbot.db` |
| **Linux** | `~/.config/OpenBot/openbot.db` |

### 1:1 Agent Lifecycle Sync

- **0 agents created**: The house starts clean with zero placeholder characters until you create an agent in OpenBot (or manually add a character via `+ Karakter Baru`).
- **Agent added / deleted**: Creating or removing an agent in OpenBot Desktop automatically adds or removes its corresponding LEGO minifigure on the map in real time.
- **Persistent per-agent customization**: Custom minifigure outfits edited in the Character Creator are remembered per `agentId`.
- **Safe log & snippet handling**: Setup prompts are normalized cleanly, and strings matching common API key / bearer token patterns are automatically redacted before display.

---

## Web UI Configuration

Click **`Atur`** (or the status pill) in the top-left HUD to configure everything without touching config files or CLI flags:

- **Auto-Sync Toggle & Custom DB Path**: Enable/disable SQLite polling, point to a non-default `openbot.db` file, or trigger an immediate rescan.
- **Launch at System Startup**: Toggle OS auto-start directly from the browser.
- **Per-Agent Controls**: Open the 3D **Edit Outfit** studio or trigger a 12-second **Test** working animation directly from the panel.
- **Full Factory Reset**: Clear persisted outfits, room customizations, and local bridge config via **Atur → Reset ke Awal** or by visiting `http://localhost:4310/?reset=1`.

---

## Features

- **Two-Story Cutaway Tropical House**:
  - **Floor 1**: Foyer & Living Room (with animated LEGO TV), Agent Studio (6 computer workstations), Guest Bedroom, Mint Bathroom (walk-in glass shower), Laundry Room, 12-step precision wooden staircase, and Front Porch with Tuk-Tuk (`bajaj`).
  - **Floor 2**: Kitchen (fridge, stove, sink, dining nook), Canopy Master Bedroom, Dressing Room (suspended hammock & vanity mirror), Living & Dining Area, Left Terrace (hopscotch), and Right Terrace.
  - **Floor View Modes (`Semua` · `Lantai 2` · `Lantai 1`)**: Selecting `Lantai 1` cleanly hides Floor 2 geometry and raycasts so you can inspect and click directly inside the ground floor.
- **Asset-Matched Character Animations & AI**:
  - Multi-floor & outdoor **A\*** navigation graph with narrow-corridor/stair reservations and horizontal obstacle avoidance.
  - Expressive animations for desk typing, sleeping (`Zzz…`), swinging in the hammock, watching TV with remote, drinking from the fridge, cooking with steam puffs, washing with soap bubbles, showering, hopscotch jumping, beach sunbathing, and freestyle ocean swimming.
  - Multi-character speech bubbles aware of personality, room context, and recent agent tasks.
- **Free Camera & Interactive Minimap**:
  - `CameraControls` with 360° orbit, right-drag / `Shift+drag` / `WASD` / Arrow pan, `Q`/`E` rotation, double-click floor focus, **Ikuti Karakter** follow mode, room presets, and click-to-teleport **Minimap**.
- **Modular Character Creator**: Customize skin tone, head shape/scale, canvas-rendered facial expressions, 10 hair styles, 7 headwear types, 10 torso styles with patterns, bottoms, footwear, body posture, and 6 accessory slots with a live 3D turntable.
- **Build Mode (`Mode Bangun`)**: Recolor individual walls, top trims, and floors with a 24-color LEGO palette; place, rotate, move, or recolor 29+ catalog assets with stud-grid snapping and AABB collision detection; 60-step Undo/Redo; and Zod-validated JSON Export/Import.

---

## Advanced: External Webhook API

For external scripts or remote agents that want to push status updates explicitly alongside or instead of SQLite sync, the bridge exposes authenticated REST endpoints (view/copy your generated Bearer token under **Atur → Opsi Lanjutan**):

- `GET /api/health` — Bridge health, active mode, and sync diagnostics
- `GET /api/agents` — Current agent snapshot
- `GET /api/events` — Real-time Server-Sent Events (`snapshot`, `agents`, `ping`)
- `POST /api/agents/register` — Register or update agent metadata *(Bearer auth)*
- `POST /api/agents/:agentId/status` — Update `working` / `idle` state and task text *(Bearer auth)*
- `POST /api/agents/:agentId/heartbeat` — Refresh timeout timestamp for long tasks *(Bearer auth)*

---

## Development

```bash
git clone https://github.com/RajaskaJanuardani/lego-openbot-agent.git
cd lego-openbot-agent
npm install
npm run dev
```

During development, Vite embeds the OpenBot Bridge middleware directly (`bridge/vitePlugin.ts`), so `npm run dev` serves both the frontend and `/api/*` endpoints on `http://localhost:5173`.

### Useful Scripts

| Script | Purpose |
| :--- | :--- |
| `npm run dev` | Start Vite dev server with embedded OpenBot Bridge (`:5173`) |
| `npm run build` | Type-check (`tsc -b`), bundle web assets (`dist/`), and build CLI (`dist-cli/cli.mjs`) |
| `npm run build:cli` | Rebuild CLI executable only |
| `npm run preview` | Preview production build with embedded Bridge |
| `npm run bridge` | Run standalone Bridge server (`:4310`) |
| `npm run simulate-agent` | Run local multi-agent status simulator script |

---

## Troubleshooting

- **OpenBot Desktop is installed, but `0 agents` appear**: Open **Atur** in the top-left HUD and verify the resolved `openbot.db` path, or paste the exact path to your `openbot.db` file and click **Simpan**.
- **Auto-Sync reports SQLite unsupported**: Upgrade Node.js to **`>= 22.5.0`** (Node 22 LTS or Node 24+ recommended).
- **Reset local CLI or web configuration**: Run `openbot-lego reset` in your terminal or open `http://localhost:4310/?reset=1` in your browser.

---

## License

Released under the [MIT License](./LICENSE).
