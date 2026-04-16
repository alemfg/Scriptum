# Scriptum — MCP Server

Scriptum includes an MCP (Model Context Protocol) server that exposes your books to external AI tools such as Claude Desktop. This lets you use Claude (or any MCP-compatible client) to write, analyze, format, and manage books through natural language.

## Table of Contents

- [Enabling the MCP Server](#enabling-the-mcp-server)
- [Connection Methods](#connection-methods)
  - [HTTP (Web)](#http-web)
  - [Stdio (Claude Desktop / CLI)](#stdio-claude-desktop--cli)
- [Tool Reference](#tool-reference)
- [Example Prompts](#example-prompts)
- [Security](#security)

---

## Enabling the MCP Server

1. Open Scriptum → **Settings → AI**
2. Toggle **MCP Server** on
3. Click **Save Settings**

The HTTP endpoint becomes active at `POST /api/mcp`.

---

## Connection Methods

### HTTP (Web)

Send MCP tool calls directly to the Scriptum API:

```
POST /api/mcp
Authorization: session cookie (must be logged in)
Content-Type: application/json

{
  "tool": "tool_name",
  "args": { ... }
}
```

Your authenticated session is used automatically — no additional `userId` needed.

### Stdio (Claude Desktop / CLI)

The stdio MCP server runs as a local process connected directly to your Scriptum database. Add it to your Claude Desktop configuration:

**`~/Library/Application Support/Claude/claude_desktop_config.json`** (macOS)
**`%APPDATA%\Claude\claude_desktop_config.json`** (Windows)

```json
{
  "mcpServers": {
    "scriptum": {
      "command": "npx",
      "args": ["tsx", "/path/to/scriptum/src/lib/mcp/cli.ts"],
      "env": {
        "DATABASE_URL": "file:///path/to/scriptum/prisma/dev.db"
      }
    }
  }
}
```

For a PostgreSQL installation:

```json
{
  "mcpServers": {
    "scriptum": {
      "command": "npx",
      "args": ["tsx", "/path/to/scriptum/src/lib/mcp/cli.ts"],
      "env": {
        "DATABASE_URL": "postgresql://scriptum:password@localhost:5432/scriptum"
      }
    }
  }
}
```

After saving, restart Claude Desktop. You will see "scriptum" listed in the MCP servers panel.

---

## Tool Reference

### `list_books`

Lists all books for a user with word count and status.

**Arguments:**
```json
{ "userId": "clx..." }
```

**Returns:**
```json
[
  {
    "id": "clx...",
    "title": "My Novel",
    "status": "IN_PROGRESS",
    "genre": "fantasy",
    "totalWords": 52000,
    "chapterCount": 18,
    "updatedAt": "2025-01-15T12:00:00.000Z"
  }
]
```

---

### `get_book`

Returns full book details including chapters, characters, worldbuilding, and format settings.

**Arguments:**
```json
{ "bookId": "clx..." }
```

**Returns:** Complete book object.

---

### `create_book`

Creates a new book.

**Arguments:**
```json
{
  "userId": "clx...",
  "title": "The Dark Tower",
  "author": "Stephen King",
  "genre": "fantasy",
  "description": "A gunslinger pursues the Man in Black..."
}
```

`userId` and `title` are required.

**Returns:** Created book object.

---

### `add_chapter`

Adds a new chapter to a book with optional content.

**Arguments:**
```json
{
  "bookId": "clx...",
  "title": "The Gunslinger",
  "content": "The man in black fled across the desert, and the gunslinger followed.\n\nThe desert was the apotheosis of all deserts..."
}
```

Content is provided as plain text paragraphs separated by `\n\n`. It is converted to TipTap JSON automatically.

**Returns:** Created chapter object.

---

### `update_chapter`

Updates the title or content of an existing chapter.

**Arguments:**
```json
{
  "chapterId": "clx...",
  "title": "The Gunslinger — Revised",
  "content": "The man in black fled across the desert..."
}
```

All fields except `chapterId` are optional.

**Returns:** Updated chapter object.

---

### `list_chapters`

Lists all chapters of a book.

**Arguments:**
```json
{ "bookId": "clx..." }
```

**Returns:**
```json
[
  {
    "id": "clx...",
    "title": "Chapter 1",
    "order": 1,
    "wordCount": 2800,
    "type": "CHAPTER",
    "isVisible": true
  }
]
```

---

### `get_chapter`

Returns full chapter content and its scenes.

**Arguments:**
```json
{ "chapterId": "clx..." }
```

**Returns:** Chapter object with `content` (TipTap JSON string) and `scenes`.

---

### `apply_format_settings`

Applies formatting settings to a book.

**Arguments:**
```json
{
  "bookId": "clx...",
  "trimSize": "6x9",
  "fontFamily": "Garamond",
  "preset": "classic"
}
```

**`trimSize` options:** `5x8` | `5.5x8.5` | `6x9` | `7x10`

**`preset` options:** `classic` | `modern` | `fantasy` | `scifi` | `nonfiction`

**Returns:** Saved format settings object.

---

### `extract_characters`

Returns all characters defined for a book.

**Arguments:**
```json
{ "bookId": "clx..." }
```

**Returns:**
```json
[
  {
    "id": "clx...",
    "name": "Aragorn",
    "role": "protagonist",
    "description": "...",
    "traits": "[\"brave\",\"honourable\"]",
    "relationships": "[...]"
  }
]
```

---

### `get_book_stats`

Returns word count and writing statistics for a book.

**Arguments:**
```json
{ "bookId": "clx..." }
```

**Returns:**
```json
{
  "totalWords": 52000,
  "chapterCount": 18,
  "sceneCount": 42,
  "estimatedPages": 185
}
```

Page estimate uses 280 words/page (standard KDP paperback average).

---

### `finish_book`

Marks a book's status as `COMPLETED`.

**Arguments:**
```json
{ "bookId": "clx..." }
```

**Returns:** Updated book object.

---

### `analyze_book`

Returns an analysis of the book including word count, chapter breakdown, and estimated page count.

**Arguments:**
```json
{ "bookId": "clx..." }
```

**Returns:**
```json
{
  "title": "My Novel",
  "genre": "fantasy",
  "status": "IN_PROGRESS",
  "totalWords": 52000,
  "chapterCount": 18,
  "estimatedPages": 185,
  "chapters": [
    { "title": "Chapter 1", "wordCount": 2800 }
  ]
}
```

---

### `generate_toc`

Auto-generates the Table of Contents chapter from all visible `CHAPTER`-type chapters. The book must already have a chapter with type `TOC`.

**Arguments:**
```json
{ "userId": "clx...", "bookId": "clx..." }
```

**Returns:**
```json
{ "chapterId": "clx...", "chapters": 18 }
```

---

### `list_collaborators`

Lists all users who have access to a book (excluding the owner).

**Arguments:**
```json
{ "userId": "clx...", "bookId": "clx..." }
```

**Returns:**
```json
[
  {
    "id": "clx...",
    "role": "EDITOR",
    "user": { "id": "clx...", "name": "Jane Doe", "email": "jane@example.com" }
  }
]
```

---

### `add_collaborator`

Grants another registered user access to a book by their email address.

**Arguments:**
```json
{
  "userId": "clx...",
  "bookId": "clx...",
  "email": "jane@example.com",
  "role": "EDITOR"
}
```

`role` must be `"EDITOR"` or `"VIEWER"`. Defaults to `"EDITOR"`.

**Returns:** The created collaborator access record.

---

## Example Prompts

Once connected via Claude Desktop, you can give Claude natural language instructions:

**List all your books:**
> "List all my books in Scriptum and show me their word counts."

**Write a chapter:**
> "Add a new chapter to my book 'The Dark Tower' called 'The Oracle'. Write a scene where the gunslinger reaches a town in the desert and meets a strange child."

**Analyze and format:**
> "Analyze my book 'My Fantasy Novel' and apply the appropriate formatting preset based on the genre."

**Full workflow:**
> "I want to write a short story. Create a new book called 'The Last Light', add three chapters — an opening scene, a confrontation, and a resolution — then apply fantasy formatting and mark it as completed."

**Check progress:**
> "How many words have I written across all my books? Which one is furthest along?"

**Generate TOC:**
> "Generate the table of contents for my book 'The Dark Tower'."

**Invite a collaborator:**
> "Give jane@example.com editor access to my book 'My Novel'."

---

## Security

### HTTP endpoint

The HTTP endpoint (`POST /api/mcp`) is protected by NextAuth session authentication. You must be logged in to call it. The `userId` is always taken from the authenticated session — it cannot be overridden by the request body.

MCP must also be explicitly enabled per-user in Settings.

### Stdio server

The stdio server connects directly to the database using the `DATABASE_URL` environment variable. It has no authentication layer — it is designed for **local use only** (Claude Desktop running on the same machine as your database, or with direct database access).

Do not expose the stdio server over a network. For remote AI access, use the HTTP endpoint instead.

### Ownership enforcement

All tools that accept a `bookId` or `chapterId` verify that the resource belongs to the authenticated user (HTTP mode) before operating on it. In stdio mode, the server trusts the caller has database access.
