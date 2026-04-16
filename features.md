# 🧠 ROLE

You are a senior full-stack architect, SaaS system designer, and UX expert.

Your task is to design a **complete, production-ready web-based platform** called **Scriptum**.

This system must allow writers to **write, format, manage, and publish books for Amazon KDP** in a single unified platform.

This is NOT a high-level task. Provide **deep, implementation-ready output**.

---

# 🎯 PRODUCT GOAL

Scriptum is:

> “The fastest way to go from manuscript → KDP-ready book”

It must:

1. Allow distraction-free writing  
2. Support importing full or partial manuscripts  
3. Provide powerful formatting for KDP (print + ebook)  
4. Export fully compliant files  
5. Integrate with external AI tools (user-owned)  
6. Support AI-driven book creation and automation via MCP  

---

# 🧠 CORE PRODUCT PRINCIPLE

The system MUST have TWO COMPLETELY SEPARATED MODES:

## ✍️ WRITE MODE
- Minimal, distraction-free
- No formatting controls visible
- Focus only on writing

## 🎨 FORMAT MODE
- Full formatting control
- Visual layout preview
- Typography and structure tools

⚠️ These modes must be completely separated in UX and logic.

---

# ✍️ WRITE MODE REQUIREMENTS

- Minimal editor (IA Writer–like)
- Chapter-based structure
- Scene support within chapters
- Drag & reorder chapters/scenes
- Focus mode (full screen)
- Word count (total, chapter, session)
- Writing goals
- Autosave
- Version history
- Dark/light mode
- Notes/comments per chapter (non-exported)
- Optional Markdown-lite support
- Drag & drop text/images

---

# 📥 IMPORT SYSTEM

Support:

- DOC / DOCX
- PDF (intelligent parsing)
- TXT
- Markdown (MD)
- EPUB

Features:

- Auto-detect chapters
- Detect headings
- Clean formatting issues
- Normalize styles
- Import preview
- AI-assisted cleanup

---

# 🎨 FORMAT MODE

---

## ⚙️ SmartFormat™ (AI Formatting Engine)

A one-click system that:

- Analyses the book using AI
- Detects genre, tone, and structure
- Applies full formatting automatically:
  - Typography
  - Layout
  - Page types

User can override settings manually.

---

## 🔤 TYPOGRAPHY SYSTEM

Presets:

- Classic Novel
- Modern Minimal
- Fantasy / Epic
- Sci-fi
- Non-fiction

Controls:

- Font family (Google Fonts + upload)
- Font size
- Line spacing
- Paragraph spacing
- Indentation
- Drop caps
- Justification
- Widow/orphan control

---

## 📄 PAGE TYPES

- Title Page
- Copyright
- Dedication
- Table of Contents
- Foreword / Preface
- Chapters
- About the Author
- Acknowledgements
- “Also By”

Each:
- Has templates
- Is reorderable
- Can be toggled on/off

---

## 📐 KDP FORMATTING ENGINE

- Trim sizes (all KDP)
- Margin + gutter calculation
- Bleed support
- Page count preview
- Chapter start on right page
- Header/footer logic

---

## 👁️ LIVE PREVIEW

- Real-time preview
- Paperback mode
- Ebook (Kindle simulation)
- Page flipping
- Zoom

---

## 📤 EXPORT SYSTEM

Formats:

- PDF (KDP-ready)
- EPUB
- DOCX
- Markdown (MD)

Markdown options:
- Single file
- Chapter-separated files
- Scene-separated files (optional checkbox)

---

## 🧪 VALIDATION SYSTEM

Detect:

- Formatting issues
- Missing pages
- Orphan/widow lines
- Chapter inconsistencies
- Font issues

---

## 🎭 SCENE SEPARATORS

- Built-in styles
- SVG upload
- Auto spacing

---

## 🧱 ADVANCED LAYOUT

Support:

- Letters
- Reports
- Poetry
- Logs

Allow per-section overrides.

---

# 🧑‍🤝‍🧑 COLLECTIONS & CONTENT STRUCTURE

## 📚 Collections (Sagas)

- Group multiple books
- Add/remove books
- Maintain consistency across series

---

## 👤 CHARACTER SYSTEM

- Dedicated character profiles
- Fields:
  - Name
  - Description
  - Traits
  - Relationships
- Can be:
  - Manually created
  - Extracted via AI

AI uses this to:
- Maintain consistency
- Generate new content

---

## 🌍 WORLDBUILDING SYSTEM

Sections for:

- Locations
- Lore
- Timeline
- Rules of the world

Can be:
- Manual
- AI-extracted

---

## 🎬 SCENES DATABASE

- Structured scene storage
- Linked to chapters
- AI can:
  - Reuse
  - Rewrite
  - Expand

---

# 🤖 AI INTEGRATION LAYER

Users use THEIR OWN AI subscriptions.

System must support:

- OpenAI
- Claude
- Local models (Ollama)
- Custom APIs

Capabilities:

- Suggest
- Rewrite
- Translate
- Expand
- Correct grammar
- Style adjustment
- Tone consistency

⚠️ All AI calls use USER credentials.

---

# 🧠 MCP SERVER (CRITICAL FEATURE)

Internal MCP server (enable/disable via config).

Allows external AI tools to control Scriptum.

Examples of supported commands:

- “Write a full book using Scriptum”
- “Analyse book X and add chapters”
- “Finish the most complete book”
- “List all books and analyse them”
- “Apply formatting to book X”
- “Extract characters and worldbuilding”

The MCP server must expose:

- Book data
- Chapter structure
- Formatting tools
- Export functions

---

# 🎨 COVER & SPINE SYSTEM

Users can upload:

- Front cover
- Back cover
- Spine

Features:

- Spine width auto-calculated from page count
- Manual override
- Full wrap preview (front + spine + back)

---

# 💾 BACKUP & RESTORE

- Full project backup (ZIP)
- Includes:
  - Text
  - Formatting
  - Assets
- Restore:
  - Full
  - Partial

---

# 🔐 USER SYSTEM

- Authentication (email/password)
- Roles:
  - Admin
  - Author
  - Editor
- Permissions per project

---

# 🧱 DEPLOYMENT

## TAR Deployment

- Runs on:
  - NGINX
  - Apache
- User selects database:
  - PostgreSQL
  - MySQL
  - SQLite (dev)

---

## DOCKER Deployment

- Preconfigured
- Uses PostgreSQL by default
- Supports volumes for persistence

---

# 🗄️ DATABASE

Must support:

- PostgreSQL (primary)
- MySQL (optional)
- SQLite (dev)

---

# 🧪 GRAMMAR & STYLE CHECKER

- Built-in basic checker
- AI-powered advanced checker

---

# 🎯 UX PRINCIPLES

- Writing = frictionless
- Formatting = powerful but guided
- Never mix modes
- Fast performance

---

# 🧱 OUTPUT REQUIREMENTS

Provide:

1. System architecture (detailed)
2. Database schema
3. Frontend component structure
4. API design
5. Rendering pipeline (PDF/EPUB)
6. AI integration architecture
7. MCP server design
8. Deployment architecture (TAR + Docker)
9. MVP roadmap
10. Scaling strategy
11. Risks and challenges
12. UI wireframe descriptions

---

# ⚠️ IMPORTANT

- Do NOT be vague
- Be implementation-focused
- Think like a startup CTO

---

# 🎯 FINAL OBJECTIVE

Design a system that enables:

- Writing
- Formatting
- AI-assisted creation
- Full book automation

All in one place.

---

Now begin.