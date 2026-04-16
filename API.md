# Scriptum — REST API Reference

All endpoints require authentication via session cookie (obtained by logging in through the UI or `/api/auth/...`).

All request/response bodies are `application/json` unless noted.

Base URL: `https://your-domain.com`

---

## Authentication

### Register

```
POST /api/auth/register
```

**Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "min8chars"
}
```

**Response `201`:**
```json
{ "id": "clx...", "email": "jane@example.com" }
```

**Errors:** `400` missing fields, `400` password too short, `409` email already registered.

---

### Sign in / Sign out

Handled by NextAuth. Use the UI login form, or integrate via NextAuth's built-in endpoints:

```
POST /api/auth/signin/credentials
POST /api/auth/signout
GET  /api/auth/session
```

---

## Books

### List books

```
GET /api/books
```

Returns all books belonging to the authenticated user.

**Response `200`:**
```json
[
  {
    "id": "clx...",
    "title": "My Novel",
    "author": "Jane Doe",
    "genre": "fantasy",
    "status": "DRAFT",
    "wordGoal": 80000,
    "coverImage": "/uploads/covers/clx...-front-1234.jpg",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-15T12:00:00.000Z",
    "chapters": [{ "wordCount": 1200 }],
    "collection": { "id": "clx...", "title": "The Saga" }
  }
]
```

---

### Create book

```
POST /api/books
```

**Body:**
```json
{
  "title": "My Novel",
  "author": "Jane Doe",
  "genre": "fantasy",
  "description": "A story about...",
  "language": "en",
  "wordGoal": 80000
}
```

`title` is required. All other fields are optional.

**Response `201`:** The created book object.

Creates a default "Title Page" and "Chapter 1" automatically.

---

### Get book

```
GET /api/books/:bookId
```

Returns full book including chapters, scenes, characters, worldbuilding, and format settings.

**Response `200`:**
```json
{
  "id": "clx...",
  "title": "My Novel",
  "chapters": [
    {
      "id": "clx...",
      "title": "Chapter 1",
      "order": 1,
      "type": "CHAPTER",
      "content": "{...tiptap json...}",
      "wordCount": 1200,
      "isVisible": true,
      "scenes": [],
      "versions": [
        { "id": "clx...", "createdAt": "...", "label": null, "wordCount": 1100 }
      ]
    }
  ],
  "characters": [...],
  "worldbuilding": [...],
  "formatSettings": {...}
}
```

---

### Update book

```
PATCH /api/books/:bookId
```

**Body** (all fields optional):
```json
{
  "title": "New Title",
  "author": "Jane Doe",
  "genre": "fantasy",
  "description": "...",
  "status": "IN_PROGRESS",
  "wordGoal": 90000,
  "language": "en",
  "coverImage": "/uploads/covers/...",
  "backImage": "/uploads/covers/...",
  "spineImage": "/uploads/covers/...",
  "spineWidth": 0.375,
  "collectionId": "clx..."
}
```

Set `collectionId: null` to remove from collection.

**Status values:** `DRAFT` | `IN_PROGRESS` | `COMPLETED` | `PUBLISHED`

**Response `200`:** Updated book object.

---

### Delete book

```
DELETE /api/books/:bookId
```

Permanently deletes the book and all associated chapters, characters, worldbuilding, and format settings.

**Response `200`:** `{ "success": true }`

---

## Chapters

### List chapters

```
GET /api/books/:bookId/chapters
```

**Response `200`:** Array of chapter objects, ordered by `order`.

---

### Create chapter

```
POST /api/books/:bookId/chapters
```

**Body:**
```json
{
  "title": "Chapter 2",
  "type": "CHAPTER",
  "order": 2
}
```

**Chapter types:** `TITLE_PAGE` | `COPYRIGHT` | `DEDICATION` | `TOC` | `FOREWORD` | `PREFACE` | `CHAPTER` | `ABOUT_AUTHOR` | `ACKNOWLEDGEMENTS` | `ALSO_BY` | `CUSTOM`

**Response `201`:** Created chapter object.

---

### Get chapter

```
GET /api/chapters/:chapterId
```

**Response `200`:** Full chapter object including content.

---

### Update chapter

```
PATCH /api/chapters/:chapterId
```

**Body** (all fields optional):
```json
{
  "title": "Chapter 2 — The Journey",
  "content": "{...tiptap json...}",
  "wordCount": 1450,
  "notes": "Private notes, not exported",
  "isVisible": true,
  "type": "CHAPTER"
}
```

When `content` changes and differs from the current value, the previous content is automatically saved as a version snapshot.

**Response `200`:** Updated chapter object.

---

### Delete chapter

```
DELETE /api/chapters/:chapterId
```

**Response `200`:** `{ "success": true }`

---

### Reorder chapters

```
POST /api/books/:bookId/chapters/reorder
```

**Body:**
```json
{
  "chapters": [
    { "id": "clx...", "order": 0 },
    { "id": "clx...", "order": 1 },
    { "id": "clx...", "order": 2 }
  ]
}
```

**Response `200`:** `{ "success": true }`

---

## Version History

### List versions

```
GET /api/chapters/:chapterId/versions
```

Returns up to the last 20 versions, newest first.

**Response `200`:**
```json
[
  {
    "id": "clx...",
    "chapterId": "clx...",
    "wordCount": 1100,
    "label": "Before the rewrite",
    "createdAt": "2025-01-15T10:00:00.000Z"
  }
]
```

---

### Save manual snapshot

```
POST /api/chapters/:chapterId/versions
```

**Body:**
```json
{ "label": "Chapter 1 — first draft complete" }
```

`label` is optional.

**Response `201`:** Created version object.

---

### Restore a version

```
POST /api/chapters/:chapterId/versions
```

**Body:**
```json
{
  "restore": true,
  "versionId": "clx..."
}
```

The current content is automatically saved as a version labeled `"Before restore"` before overwriting.

**Response `200`:** Updated chapter object with restored content.

---

## Format Settings

### Get format settings

```
GET /api/books/:bookId/format
```

**Response `200`:** Format settings object, or `null` if not yet configured.

---

### Save format settings

```
PUT /api/books/:bookId/format
```

**Body** (all fields optional, uses upsert):
```json
{
  "trimSize": "6x9",
  "marginTop": 0.75,
  "marginBottom": 0.75,
  "marginInner": 0.875,
  "marginOuter": 0.5,
  "bleed": false,
  "chapterStartRight": true,
  "preset": "classic",
  "fontFamily": "Garamond",
  "fontSize": 11,
  "lineSpacing": 1.4,
  "paragraphSpacing": 0,
  "indentation": 0.3,
  "justification": "justify",
  "dropCaps": true,
  "widowControl": true,
  "headerEnabled": true,
  "footerEnabled": true,
  "headerContent": "title",
  "footerContent": "pageNumber",
  "sceneSeparator": "* * *"
}
```

**Trim sizes:** `5x8` | `5.25x8` | `5.5x8.5` | `6x9` | `6.14x9.21` | `7x10` | `8.5x11`

**Presets:** `classic` | `modern` | `fantasy` | `scifi` | `nonfiction`

**Justification:** `left` | `center` | `right` | `justify`

**Response `200`:** Saved format settings object.

---

### SmartFormat (AI-assisted)

```
POST /api/books/:bookId/smart-format
```

Analyzes the book's content (and AI settings if configured) to recommend format settings based on the detected genre.

**Response `200`:**
```json
{
  "settings": {
    "preset": "fantasy",
    "fontFamily": "Palatino",
    "fontSize": 11.5,
    "dropCaps": true,
    "lineSpacing": 1.5
  },
  "detectedGenre": "fantasy"
}
```

---

## Export

```
POST /api/books/:bookId/export
```

Exports the book. Hidden chapters (`isVisible: false`) are excluded from all formats.

**Body:**
```json
{
  "format": "pdf",
  "options": {}
}
```

**Formats:**

| `format` | Content-Type | Notes |
|---|---|---|
| `pdf` | `application/pdf` | KDP-ready, uses Puppeteer/Chromium |
| `epub` | `application/epub+zip` | For Kindle and e-readers |
| `docx` | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | Microsoft Word |
| `md` | `text/markdown` or `application/zip` | See options below |

**Markdown options:**
```json
{
  "format": "md",
  "options": {
    "singleFile": true,
    "separateByScene": false
  }
}
```

- `singleFile: true` — single `.md` file, returns `text/markdown`
- `singleFile: false` — one file per chapter, returns a `.zip`
- `separateByScene: true` — include scene headings within chapter files

**Response:** Binary file download. The `Content-Disposition` header contains the filename.

---

## Import

```
POST /api/books/:bookId/import
```

**Content-Type:** `multipart/form-data`

**Form fields:**

| Field | Type | Description |
|---|---|---|
| `file` | File | The file to import (DOCX, PDF, TXT, MD, EPUB) |
| `detectChapters` | `"true"` / `"false"` | Auto-detect chapter boundaries |
| `normalizeStyles` | `"true"` / `"false"` | Normalize formatting |
| `preview` | `"true"` / `"false"` | Preview only, do not save |

**Preview response `200`:**
```json
{
  "chapters": [
    { "title": "Chapter 1", "content": "Lorem ipsum...", "order": 0 }
  ],
  "warnings": ["PDF parsing may have formatting inaccuracies"]
}
```

**Import response `200`:**
```json
{
  "success": true,
  "chaptersImported": 12,
  "warnings": []
}
```

---

## KDP Validation

```
POST /api/books/:bookId/validate
```

Checks the book against KDP requirements.

**Response `200`:**
```json
{
  "issues": [
    {
      "type": "formatting_issue",
      "severity": "error",
      "message": "Book is too short for KDP (18 pages). Minimum is 24 pages."
    },
    {
      "type": "missing_page",
      "severity": "warning",
      "message": "No Copyright Page found."
    },
    {
      "type": "chapter_inconsistency",
      "severity": "warning",
      "message": "Chapter \"Chapter 3\" has no content.",
      "chapterId": "clx..."
    }
  ],
  "totalWords": 5200,
  "estimatedPages": 18
}
```

**Issue types:** `formatting_issue` | `missing_page` | `chapter_inconsistency` | `font_issue`

**Severities:** `error` | `warning`

---

## Characters

### List characters

```
GET /api/books/:bookId/characters
```

**Response `200`:** Array of character objects ordered by name.

---

### Create character

```
POST /api/books/:bookId/characters
```

**Body:**
```json
{
  "name": "Aragorn",
  "role": "protagonist",
  "description": "A ranger from the North...",
  "traits": ["brave", "honourable", "reluctant leader"],
  "relationships": [{ "character": "Gandalf", "relation": "mentor" }],
  "notes": "Appears in chapters 1, 3, 7",
  "imageUrl": "/uploads/...",
  "aiExtracted": false
}
```

`traits` and `relationships` are stored as JSON arrays.

**Response `201`:** Created character object.

---

### Update character

```
PATCH /api/books/:bookId/characters/:characterId
```

Same body shape as create. All fields optional.

**Response `200`:** Updated character object.

---

### Delete character

```
DELETE /api/books/:bookId/characters/:characterId
```

**Response `200`:** `{ "success": true }`

---

## Worldbuilding

### List entries

```
GET /api/books/:bookId/worldbuilding
```

**Response `200`:** Array ordered by type then order.

---

### Create entry

```
POST /api/books/:bookId/worldbuilding
```

**Body:**
```json
{
  "type": "LOCATION",
  "title": "The Shire",
  "content": "A peaceful land in the northwest of Middle-earth...",
  "imageUrl": null,
  "aiExtracted": false
}
```

**Types:** `LOCATION` | `LORE` | `TIMELINE` | `RULE` | `OTHER`

**Response `201`:** Created entry object.

---

### Update entry

```
PATCH /api/books/:bookId/worldbuilding/:entryId
```

**Body** (all optional): `title`, `content`, `type`, `imageUrl`

**Response `200`:** Updated entry object.

---

### Delete entry

```
DELETE /api/books/:bookId/worldbuilding/:entryId
```

**Response `200`:** `{ "success": true }`

---

## Cover Images

```
POST /api/books/:bookId/cover
```

**Content-Type:** `multipart/form-data`

**Form fields:**

| Field | Type | Values | Description |
|---|---|---|---|
| `file` | File | jpg, jpeg, png, webp | The cover image |
| `type` | String | `front` \| `back` \| `spine` | Which cover position |

**Response `200`:**
```json
{ "url": "/uploads/covers/clx...-front-1234567890.jpg" }
```

The URL is saved automatically to the book (`coverImage`, `backImage`, or `spineImage` field).

---

## Backup

### Create and download backup

```
POST /api/books/:bookId/backup
```

Downloads a ZIP archive containing all book data.

**Response:** `application/zip` binary download.

ZIP structure:
```
book.json
chapters/
  000-clx....json
  001-clx....json
characters.json
worldbuilding.json
scenes.json
format-settings.json
```

---

### List backups

```
GET /api/books/:bookId/backup
```

**Response `200`:**
```json
[
  {
    "id": "clx...",
    "bookId": "clx...",
    "filename": "My Novel-backup-2025-01-15.zip",
    "size": 48231,
    "createdAt": "2025-01-15T12:00:00.000Z"
  }
]
```

---

## AI

```
POST /api/ai
```

Runs an AI capability against provided text. Requires AI settings to be configured in Settings → AI.

**Body:**
```json
{
  "capability": "rewrite",
  "content": "The man walked into the room. He sat down.",
  "prompt": "Make this more literary and atmospheric."
}
```

**Capabilities:**

| `capability` | Description |
|---|---|
| `suggest` | Continue the text |
| `rewrite` | Rewrite for clarity and style |
| `expand` | Add more detail and depth |
| `grammar` | Fix grammar and punctuation |
| `style` | Adjust literary style |
| `tone` | Adjust tone |
| `translate` | Translate (use `targetLanguage` field) |
| `extract_characters` | Extract character data as JSON |
| `extract_worldbuilding` | Extract worldbuilding data as JSON |
| `generate_chapter` | Generate chapter content |
| `analyze` | Analyze genre, tone, structure |

For `translate`, add `"targetLanguage": "Portuguese"` to the body.

**Response `200`:**
```json
{ "result": "The man stepped into the dimly lit room, the silence pressing in around him as he lowered himself into the chair..." }
```

**Error `422`:** No AI API key configured.

---

## AI Settings

### Save AI settings

```
PUT /api/settings/ai
```

**Body:**
```json
{
  "provider": "CLAUDE",
  "apiKey": "sk-ant-...",
  "model": "claude-opus-4-6",
  "baseUrl": null,
  "mcpEnabled": false
}
```

**Providers:** `OPENAI` | `CLAUDE` | `OLLAMA` | `CUSTOM`

For `OLLAMA` or `CUSTOM`, set `baseUrl` (e.g., `http://localhost:11434/v1`).

The API key is stored encrypted in the database and never returned in responses.

**Response `200`:**
```json
{ "success": true, "provider": "CLAUDE" }
```

---

## Collections

### List collections

```
GET /api/collections
```

**Response `200`:**
```json
[
  {
    "id": "clx...",
    "title": "The Saga",
    "description": "A trilogy",
    "books": [
      { "id": "clx...", "title": "Book One" }
    ]
  }
]
```

---

### Create collection

```
POST /api/collections
```

**Body:**
```json
{
  "title": "The Saga",
  "description": "A trilogy"
}
```

**Response `201`:** Created collection object.

---

## MCP Server (HTTP)

```
POST /api/mcp
```

Requires MCP to be enabled in Settings → AI → MCP Server toggle.

**Body:**
```json
{
  "tool": "list_books",
  "args": {}
}
```

See [MCP.md](MCP.md) for full tool reference.

**Response `200`:**
```json
{
  "result": [
    { "type": "text", "text": "[{\"id\":\"clx...\",\"title\":\"My Novel\",...}]" }
  ]
}
```

**Error `403`:** MCP not enabled.

---

## Writing Sessions

### Record a session

```
POST /api/books/:bookId/writing-session
```

Called automatically by the Write mode client when you leave the editor.

**Body:**
```json
{
  "words": 450,
  "duration": 1800
}
```

`duration` is in seconds.

**Response `201`:** Created session object.

---

## Table of Contents Generation

### Generate TOC

```
POST /api/books/:bookId/toc
```

Generates a Table of Contents from all visible `CHAPTER`-type chapters and writes it into the book's `TOC`-type chapter. The book must already have a chapter with type `TOC` (created via Page Types in Format Mode).

**Response `200`:**
```json
{ "chapterId": "clx...", "chapters": 18 }
```

**Errors:** `400` no TOC chapter found, `404` book not found.

---

## Collaborators

### List Collaborators

```
GET /api/books/:bookId/collaborators
```

Returns all users (other than the owner) who have access to the book.

**Response `200`:**
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

### Invite Collaborator

```
POST /api/books/:bookId/collaborators
```

**Body:**
```json
{ "email": "jane@example.com", "role": "EDITOR" }
```

`role` must be `"EDITOR"` or `"VIEWER"`. The user must already have a Scriptum account.

**Response `201`:** Collaborator object (same shape as list item).

**Errors:** `400` email required, `400` invalid role, `404` no user with that email, `409` user already has access.

---

### Remove Collaborator

```
DELETE /api/books/:bookId/collaborators/:userId
```

**Response `200`:** `{ "success": true }`

---

### Change Collaborator Role

```
PATCH /api/books/:bookId/collaborators/:userId
```

**Body:**
```json
{ "role": "VIEWER" }
```

**Response `200`:** Updated collaborator object.

---

## Custom Fonts

### Upload Font

```
POST /api/fonts
Content-Type: multipart/form-data
```

Uploads a custom font file (TTF, OTF, WOFF, WOFF2). The returned `fontFamily` can then be saved via the format settings API.

**Form field:** `file` — the font file.

**Response `200`:**
```json
{
  "url": "/uploads/fonts/user123-1700000000000-MyFont.ttf",
  "fontFamily": "MyFont",
  "ext": "ttf"
}
```

**Errors:** `400` no file, `400` unsupported extension.

---

## SVG Scene Separator

### Upload SVG Separator

```
POST /api/books/:bookId/format/svg-separator
Content-Type: multipart/form-data
```

**Form field:** `file` — an SVG file.

**Response `200`:**
```json
{ "url": "/uploads/separators/bookId-separator-1700000000000.svg" }
```

The URL is automatically saved to the book's format settings as `sceneSeparatorSvg`.

---

### Remove SVG Separator

```
DELETE /api/books/:bookId/format/svg-separator
```

Clears `sceneSeparatorSvg` from format settings.

**Response `200`:** `{ "success": true }`

---

## Backup & Restore

### Create Backup

```
POST /api/books/:bookId/backup
```

Creates a ZIP backup and returns it as a download. Also records the backup in the database.

**Response:** `application/zip` file download.

---

### List Backups

```
GET /api/books/:bookId/backup
```

**Response `200`:** Array of backup records.

---

### Restore from Backup

```
POST /api/books/:bookId/restore
Content-Type: multipart/form-data
```

Restores chapters, characters, worldbuilding, and format settings from a previously downloaded backup ZIP. Replaces all existing data — book title and author are preserved.

**Form field:** `file` — the backup ZIP file.

**Response `200`:** `{ "success": true }`

**Errors:** `400` no file, `400` not a ZIP, `400` not a valid Scriptum backup.

---

## Error Responses

All endpoints return consistent error objects:

```json
{ "error": "Description of the error" }
```

| Status | Meaning |
|---|---|
| `400` | Bad request — missing or invalid fields |
| `401` | Unauthorized — not logged in |
| `403` | Forbidden — feature not enabled |
| `404` | Not found — resource doesn't exist or doesn't belong to you |
| `409` | Conflict — e.g. email already registered |
| `422` | Unprocessable — e.g. AI not configured |
| `500` | Server error — check server logs |

---

## Content Format (TipTap JSON)

Chapter content is stored as TipTap/ProseMirror JSON. Example:

```json
{
  "type": "doc",
  "content": [
    {
      "type": "paragraph",
      "content": [
        { "type": "text", "text": "It was a dark and stormy night." }
      ]
    },
    {
      "type": "paragraph",
      "content": [
        {
          "type": "text",
          "text": "Bold text",
          "marks": [{ "type": "bold" }]
        }
      ]
    },
    { "type": "horizontalRule" }
  ]
}
```

**Supported node types:** `doc`, `paragraph`, `heading` (levels 1–3), `blockquote`, `bulletList`, `orderedList`, `listItem`, `horizontalRule`, `hardBreak`, `image`

**Supported marks:** `bold`, `italic`, `underline`, `strike`, `highlight`, `code`, `link`, `textAlign`
