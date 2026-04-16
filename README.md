# Scriptum

> The fastest way to go from manuscript → KDP-ready book.

A production-ready, self-hosted platform for writers to write, format, and publish books to Amazon KDP — all in one place.

---

## Features

- **Write Mode** — Distraction-free TipTap editor with chapter/scene management, drag & drop reorder, word count goals, version history, autosave, focus mode, dark mode
- **Format Mode** — KDP formatting engine with live preview, typography presets, SmartFormat™ AI engine
- **Import** — DOCX, PDF, TXT, Markdown, EPUB with auto chapter detection and preview
- **Export** — KDP-ready PDF (Puppeteer), EPUB, DOCX, Markdown (single file or chapter-separated ZIP)
- **KDP Validation** — checks margins, page count, missing required pages, font compatibility
- **Characters** — Profile cards with AI extraction from manuscript
- **Worldbuilding** — Locations, lore, timeline, world rules with AI extraction
- **Cover & Spine** — Upload front/back/spine images, auto spine-width calculation
- **AI Integration** — Use your own OpenAI, Claude, Ollama, or custom API key
- **MCP Server** — Let Claude Desktop write, format, and manage books via natural language
- **Collections** — Group books into series/sagas
- **Backup** — Per-book ZIP backup (chapters, characters, worldbuilding, settings)
- **Auth** — Email/password with Admin/Author/Editor roles
- **Docker** — One-command production deployment with PostgreSQL

---

## Quick Start

### Development (SQLite, no database setup)

```bash
cp .env.example .env
npm install
npm run db:push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and register your first account.

### Production (Docker + PostgreSQL)

```bash
cp .env.example .env
# Edit .env — set NEXTAUTH_SECRET, POSTGRES_PASSWORD, NEXTAUTH_URL
docker compose up -d --build
```

See [INSTALL.md](INSTALL.md) for full installation instructions, reverse proxy setup, TLS, and upgrade guide.

---

## Documentation

| Document | Description |
|---|---|
| [INSTALL.md](INSTALL.md) | Full installation guide — Docker, bare metal, Nginx, TLS, upgrades |
| [API.md](API.md) | Complete REST API reference |
| [MCP.md](MCP.md) | MCP server setup and tool reference |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXTAUTH_SECRET` | Yes | JWT signing secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Yes | Full public URL of your instance |
| `DATABASE_URL` | Yes | Connection string (PostgreSQL or SQLite) |
| `POSTGRES_PASSWORD` | Docker | PostgreSQL password |
| `PORT` | No | Port (default: `3000`) |

Full variable reference in [INSTALL.md → Environment Variables](INSTALL.md#environment-variables).

---

## Tech Stack

- **Next.js 16** (App Router, standalone output) + TypeScript
- **TipTap 2** — rich text editor (ProseMirror-based)
- **Prisma 6** — ORM (PostgreSQL / SQLite)
- **NextAuth v5** — authentication (JWT strategy)
- **Zustand** — client state management
- **Tailwind CSS 4** — styling
- **Puppeteer** — PDF generation via headless Chromium
- **MCP SDK** — Model Context Protocol server

---

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run db:push      # Sync schema to database (development)
npm run db:migrate   # Create migration (development)
npm run db:studio    # Open Prisma Studio GUI
npm run mcp          # Start stdio MCP server
npm run lint         # Run ESLint
```
