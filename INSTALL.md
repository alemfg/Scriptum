# Scriptum — Installation Guide

## Table of Contents

- [Requirements](#requirements)
- [Docker Installation (Recommended)](#docker-installation-recommended)
- [Manual Installation (Bare Metal)](#manual-installation-bare-metal)
- [Development Setup](#development-setup)
- [Environment Variables](#environment-variables)
- [Reverse Proxy (Nginx)](#reverse-proxy-nginx)
- [TLS / HTTPS with Let's Encrypt](#tls--https-with-lets-encrypt)
- [Database](#database)
- [Upgrading](#upgrading)
- [Backup and Restore](#backup-and-restore)
- [Troubleshooting](#troubleshooting)

---

## Requirements

### Docker (recommended)
- Docker 24+
- Docker Compose v2+
- 1 GB RAM minimum (2 GB recommended for PDF export)
- 2 GB disk space

### Bare metal
- Node.js 20+
- npm 10+
- PostgreSQL 14+ (or SQLite for single-user)
- Chromium or Google Chrome (for PDF export)

---

## Docker Installation (Recommended)

This is the fastest way to get Scriptum running in production.

### 1. Get the source

```bash
git clone https://github.com/youruser/scriptum.git
cd scriptum
```

### 2. Configure environment

```bash
cp .env.example .env
```

Open `.env` and set **at minimum**:

```bash
# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET=your-secret-here

# Strong database password
POSTGRES_PASSWORD=your-db-password

# Full public URL of your instance (no trailing slash)
NEXTAUTH_URL=https://your-domain.com
```

### 3. Build and start

```bash
docker compose up -d --build
```

The first build takes 3–5 minutes (downloads dependencies, builds Next.js, installs Chromium).

On startup the container automatically runs `prisma db push` to create all tables before starting the app.

### 4. Access the app

Open `http://your-server-ip:3000` (or your domain if Nginx is configured).

Register the first account — there is no default admin account.

### Useful commands

```bash
# View logs
docker compose logs -f app

# Stop
docker compose down

# Restart after config change
docker compose up -d

# Rebuild after code update
docker compose up -d --build
```

---

## Manual Installation (Bare Metal)

Use this if you prefer to run without Docker, behind your own process manager (systemd, PM2, etc.).

### 1. Clone and install

```bash
git clone https://github.com/youruser/scriptum.git
cd scriptum
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```bash
DATABASE_PROVIDER=postgresql
DATABASE_URL=postgresql://user:password@localhost:5432/scriptum
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=https://your-domain.com
```

### 3. Set up database

Create the PostgreSQL database and user:

```sql
CREATE DATABASE scriptum;
CREATE USER scriptum WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE scriptum TO scriptum;
```

Switch the Prisma schema to PostgreSQL:

```bash
cp prisma/schema.postgresql.prisma prisma/schema.prisma
```

Apply the schema:

```bash
npx prisma db push
```

### 4. Build

```bash
npm run build
```

### 5. Start

```bash
npm start
```

Or with PM2 for process management:

```bash
npm install -g pm2
pm2 start npm --name scriptum -- start
pm2 save
pm2 startup
```

### Chromium for PDF export

Scriptum uses Puppeteer to generate PDF files. It needs Chromium installed:

**Debian/Ubuntu:**
```bash
apt-get install -y chromium-browser
```

**Alpine:**
```bash
apk add chromium
```

Set the path in `.env` if Puppeteer can't find it:

```bash
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
```

---

## Development Setup

For local development with hot reload and SQLite (no database setup required):

```bash
cp .env.example .env
npm install
npm run db:push      # Creates dev.db (SQLite)
npm run dev          # Starts on http://localhost:3000
```

### Development with Docker

Uses source code mounting and hot reload:

```bash
docker compose -f docker-compose.dev.yml up
```

### Useful dev commands

```bash
npm run db:studio    # Prisma Studio (database GUI) → http://localhost:5555
npm run db:push      # Sync schema changes to database
npm run lint         # ESLint
```

---

## Environment Variables

| Variable | Required | Description | Default |
|---|---|---|---|
| `NEXTAUTH_SECRET` | **Yes** | Secret for signing JWTs. Generate: `openssl rand -base64 32` | — |
| `NEXTAUTH_URL` | **Yes** | Full public URL of your instance | `http://localhost:3000` |
| `DATABASE_URL` | **Yes** | Database connection string | `file:./dev.db` |
| `DATABASE_PROVIDER` | No | `postgresql` \| `sqlite` | `sqlite` |
| `POSTGRES_USER` | No | PostgreSQL username (Docker only) | `scriptum` |
| `POSTGRES_PASSWORD` | No | PostgreSQL password (Docker only) | `scriptum_secret` |
| `PORT` | No | Port the app listens on | `3000` |
| `NEXT_PUBLIC_APP_URL` | No | Same as NEXTAUTH_URL | — |
| `MCP_ENABLED` | No | Enable the MCP server endpoint | `false` |
| `PUPPETEER_EXECUTABLE_PATH` | No | Path to Chromium binary | auto-detected |
| `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD` | No | Skip bundled Chromium download | `true` in Docker |

### Connection string examples

**PostgreSQL:**
```
postgresql://user:password@host:5432/scriptum
```

**PostgreSQL with SSL:**
```
postgresql://user:password@host:5432/scriptum?sslmode=require
```

**SQLite (development only):**
```
file:./dev.db
```

---

## Reverse Proxy (Nginx)

### HTTP only

```nginx
server {
    listen 80;
    server_name your-domain.com;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

The `client_max_body_size 50M` is required for DOCX/EPUB import and cover image uploads.

---

## TLS / HTTPS with Let's Encrypt

```bash
apt-get install certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

Certbot will modify your Nginx config automatically and set up auto-renewal.

After enabling HTTPS, update `.env`:

```bash
NEXTAUTH_URL=https://your-domain.com
```

Then restart:

```bash
docker compose up -d
```

---

## Database

### Switching from SQLite to PostgreSQL

If you started with SQLite and want to move to PostgreSQL:

1. Export your data from SQLite (manual or via Prisma Studio)
2. Set up PostgreSQL and update `DATABASE_URL`
3. Switch schema: `cp prisma/schema.postgresql.prisma prisma/schema.prisma`
4. Run `npx prisma db push`
5. Re-import your data

There is no automatic migration tool between providers.

### Running database backups

**Docker:**
```bash
docker compose exec db pg_dump -U scriptum scriptum > scriptum-$(date +%Y%m%d).sql
```

**Restore:**
```bash
docker compose exec -T db psql -U scriptum scriptum < scriptum-20250101.sql
```

**SQLite (development):**
```bash
cp prisma/dev.db dev-$(date +%Y%m%d).db
```

---

## Upgrading

### Docker

```bash
git pull
docker compose up -d --build
```

The `prisma db push` on startup will apply any schema changes automatically.

### Bare metal

```bash
git pull
npm install
npx prisma db push
npm run build
pm2 restart scriptum
```

---

## Backup and Restore

### Application-level backup (from the UI)

Each book has a **Backup** page (book nav → Backup). Clicking "Create & Download Backup" downloads a ZIP file containing:

- `book.json` — book metadata
- `chapters/` — all chapter content (TipTap JSON)
- `characters.json`
- `worldbuilding.json`
- `scenes.json`
- `format-settings.json`

These backups are for individual books. For full server backups, use the database dump commands above.

### Cover images

Cover images are stored in `public/uploads/covers/`. In Docker they are in the `uploads_data` volume.

To back up the volume:

```bash
docker run --rm \
  -v scriptum_uploads_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/uploads-$(date +%Y%m%d).tar.gz /data
```

---

## Troubleshooting

### App won't start — "NEXTAUTH_SECRET is required"

Set `NEXTAUTH_SECRET` in your `.env` file. Generate one with:

```bash
openssl rand -base64 32
```

### PDF export fails

Scriptum uses Chromium for PDF generation. Ensure:

1. Chromium is installed on the host (bare metal) or that the Docker image built successfully (it installs Chromium via `apk add chromium`).
2. The environment variable is set correctly:
   ```bash
   PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
   ```
3. On some systems (especially ARM), you may need to install additional fonts:
   ```bash
   apk add ttf-freefont font-noto
   ```

### "Database connection failed"

- Verify `DATABASE_URL` is correct in `.env`
- For Docker: ensure the `db` service is healthy (`docker compose ps`)
- Check logs: `docker compose logs db`

### Upload fails (cover images, import files)

- Check `client_max_body_size` is set to at least `50M` in Nginx
- Verify the `uploads_data` volume is writable: `docker compose exec app ls -la public/uploads/`

### Port 3000 already in use

Change the port in `.env`:

```bash
PORT=3001
```

And in `docker-compose.yml`:

```yaml
ports:
  - "3001:3000"
```

### Prisma schema error on Docker startup

If you see a Prisma schema error mentioning `sqlite`, rebuild the image:

```bash
docker compose down
docker compose up -d --build
```

The build process copies `schema.postgresql.prisma` over `schema.prisma` to ensure the correct provider is used.
