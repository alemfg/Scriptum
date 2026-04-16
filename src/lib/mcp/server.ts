import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { db } from "@/lib/db";

// Standalone tool handler — used by both the MCP stdio server and the HTTP route
export async function handleMCPTool(
  name: string,
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
  try {
    switch (name) {
      case "list_books": {
        const books = await db.book.findMany({
          where: { userId: args.userId as string },
          include: { chapters: { select: { wordCount: true } } },
          orderBy: { updatedAt: "desc" },
        });
        const result = books.map((b) => ({
          id: b.id,
          title: b.title,
          status: b.status,
          genre: b.genre,
          totalWords: b.chapters.reduce((sum, ch) => sum + ch.wordCount, 0),
          chapterCount: b.chapters.length,
          updatedAt: b.updatedAt,
        }));
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "get_book": {
        const book = await db.book.findFirst({
          where: { id: args.bookId as string, userId: args.userId as string },
          include: {
            chapters: { orderBy: { order: "asc" } },
            characters: true,
            worldbuilding: true,
            formatSettings: true,
          },
        });
        return { content: [{ type: "text", text: JSON.stringify(book, null, 2) }] };
      }

      case "create_book": {
        const book = await db.book.create({
          data: {
            userId: args.userId as string,
            title: args.title as string,
            author: args.author as string | undefined,
            genre: args.genre as string | undefined,
            description: args.description as string | undefined,
          },
        });
        return { content: [{ type: "text", text: JSON.stringify(book, null, 2) }] };
      }

      case "add_chapter": {
        const ownedBook = await db.book.findFirst({ where: { id: args.bookId as string, userId: args.userId as string } });
        if (!ownedBook) throw new Error("Book not found");
        const count = await db.chapter.count({ where: { bookId: args.bookId as string } });
        const plainContent = args.content as string | undefined;
        const tiptapContent = plainContent
          ? JSON.stringify({
              type: "doc",
              content: plainContent.split("\n\n").map((para) => ({
                type: "paragraph",
                content: [{ type: "text", text: para }],
              })),
            })
          : null;
        const chapter = await db.chapter.create({
          data: {
            bookId: args.bookId as string,
            title: args.title as string,
            order: count,
            content: tiptapContent,
            wordCount: plainContent ? plainContent.split(/\s+/).filter(Boolean).length : 0,
          },
        });
        return { content: [{ type: "text", text: JSON.stringify(chapter, null, 2) }] };
      }

      case "update_chapter": {
        const ownedChapter = await db.chapter.findFirst({ where: { id: args.chapterId as string, book: { userId: args.userId as string } } });
        if (!ownedChapter) throw new Error("Chapter not found");
        const updates: Record<string, unknown> = {};
        if (args.title) updates.title = args.title;
        if (args.content) {
          const plainContent = args.content as string;
          updates.content = JSON.stringify({
            type: "doc",
            content: plainContent.split("\n\n").map((para) => ({
              type: "paragraph",
              content: [{ type: "text", text: para }],
            })),
          });
          updates.wordCount = plainContent.split(/\s+/).filter(Boolean).length;
        }
        const chapter = await db.chapter.update({
          where: { id: args.chapterId as string },
          data: updates,
        });
        return { content: [{ type: "text", text: JSON.stringify(chapter, null, 2) }] };
      }

      case "list_chapters": {
        const ownedBook2 = await db.book.findFirst({ where: { id: args.bookId as string, userId: args.userId as string } });
        if (!ownedBook2) throw new Error("Book not found");
        const chapters = await db.chapter.findMany({
          where: { bookId: args.bookId as string },
          orderBy: { order: "asc" },
          select: { id: true, title: true, order: true, wordCount: true, type: true, isVisible: true },
        });
        return { content: [{ type: "text", text: JSON.stringify(chapters, null, 2) }] };
      }

      case "get_chapter": {
        const chapter = await db.chapter.findFirst({
          where: { id: args.chapterId as string, book: { userId: args.userId as string } },
          include: { scenes: { orderBy: { order: "asc" } } },
        });
        return { content: [{ type: "text", text: JSON.stringify(chapter, null, 2) }] };
      }

      case "apply_format_settings": {
        const ownedBook3 = await db.book.findFirst({ where: { id: args.bookId as string, userId: args.userId as string } });
        if (!ownedBook3) throw new Error("Book not found");
        const settings = await db.formatSettings.upsert({
          where: { bookId: args.bookId as string },
          create: {
            bookId: args.bookId as string,
            trimSize: (args.trimSize as string) ?? "6x9",
            fontFamily: (args.fontFamily as string) ?? "Georgia",
            preset: (args.preset as string) ?? "classic",
          },
          update: {
            trimSize: (args.trimSize as string) ?? "6x9",
            fontFamily: (args.fontFamily as string) ?? "Georgia",
            preset: (args.preset as string) ?? "classic",
          },
        });
        return { content: [{ type: "text", text: JSON.stringify(settings, null, 2) }] };
      }

      case "extract_characters": {
        const ownedBook4 = await db.book.findFirst({ where: { id: args.bookId as string, userId: args.userId as string } });
        if (!ownedBook4) throw new Error("Book not found");
        const characters = await db.character.findMany({ where: { bookId: args.bookId as string } });
        return { content: [{ type: "text", text: JSON.stringify(characters, null, 2) }] };
      }

      case "get_book_stats": {
        const book = await db.book.findFirst({
          where: { id: args.bookId as string, userId: args.userId as string },
          include: {
            chapters: { select: { wordCount: true } },
            scenes: { select: { wordCount: true } },
          },
        });
        if (!book) throw new Error("Book not found");
        const totalWords = book.chapters.reduce((s, c) => s + c.wordCount, 0);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              totalWords,
              chapterCount: book.chapters.length,
              sceneCount: book.scenes.length,
              estimatedPages: Math.ceil(totalWords / 280),
            }, null, 2),
          }],
        };
      }

      case "finish_book": {
        const owned = await db.book.findFirst({ where: { id: args.bookId as string, userId: args.userId as string } });
        if (!owned) throw new Error("Book not found");
        const book = await db.book.update({
          where: { id: args.bookId as string },
          data: { status: "COMPLETED" },
        });
        return { content: [{ type: "text", text: JSON.stringify(book, null, 2) }] };
      }

      case "analyze_book": {
        const book = await db.book.findFirst({
          where: { id: args.bookId as string, userId: args.userId as string },
          include: { chapters: { select: { title: true, wordCount: true } } },
        });
        if (!book) throw new Error("Book not found");
        const totalWords = book.chapters.reduce((s, c) => s + c.wordCount, 0);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              title: book.title,
              genre: book.genre ?? "Unknown",
              status: book.status,
              totalWords,
              chapterCount: book.chapters.length,
              estimatedPages: Math.ceil(totalWords / 280),
              chapters: book.chapters,
            }, null, 2),
          }],
        };
      }

      case "generate_toc": {
        const tocBook = await db.book.findFirst({
          where: { id: args.bookId as string, userId: args.userId as string },
          include: { chapters: { orderBy: { order: "asc" } } },
        });
        if (!tocBook) throw new Error("Book not found");
        const tocChapter = tocBook.chapters.find((c) => c.type === "TOC");
        if (!tocChapter) throw new Error("No TOC chapter found. Add a chapter of type TOC first.");
        const mainChapters = tocBook.chapters.filter((c) => c.type === "CHAPTER" && c.isVisible);
        const tocDoc = {
          type: "doc",
          content: [
            { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Contents" }] },
            ...mainChapters.map((ch) => ({ type: "paragraph", content: [{ type: "text", text: ch.title }] })),
          ],
        };
        await db.chapter.update({
          where: { id: tocChapter.id },
          data: { content: JSON.stringify(tocDoc), wordCount: mainChapters.length + 1 },
        });
        return { content: [{ type: "text", text: `TOC generated with ${mainChapters.length} chapters.` }] };
      }

      case "list_collaborators": {
        const collabBook = await db.book.findFirst({ where: { id: args.bookId as string, userId: args.userId as string } });
        if (!collabBook) throw new Error("Book not found");
        const collaborators = await db.projectAccess.findMany({
          where: { bookId: args.bookId as string },
          include: { user: { select: { id: true, name: true, email: true } } },
        });
        return { content: [{ type: "text", text: JSON.stringify(collaborators, null, 2) }] };
      }

      case "add_collaborator": {
        const ownerBook = await db.book.findFirst({ where: { id: args.bookId as string, userId: args.userId as string } });
        if (!ownerBook) throw new Error("Book not found");
        const targetUser = await db.user.findFirst({ where: { email: args.email as string } });
        if (!targetUser) throw new Error("No user found with that email");
        const access = await db.projectAccess.upsert({
          where: { bookId_userId: { bookId: args.bookId as string, userId: targetUser.id } },
          create: { bookId: args.bookId as string, userId: targetUser.id, role: (args.role as "EDITOR" | "VIEWER") ?? "EDITOR" },
          update: { role: (args.role as "EDITOR" | "VIEWER") ?? "EDITOR" },
          include: { user: { select: { id: true, name: true, email: true } } },
        });
        return { content: [{ type: "text", text: JSON.stringify(access, null, 2) }] };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      }],
      isError: true,
    };
  }
}

export function createMCPServer() {
  const server = new Server(
    { name: "scriptum", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "list_books",
        description: "List all books in Scriptum with their status and word count",
        inputSchema: {
          type: "object",
          properties: {
            userId: { type: "string", description: "User ID to list books for" },
          },
          required: ["userId"],
        },
      },
      {
        name: "get_book",
        description: "Get full book details including chapters, characters, and worldbuilding",
        inputSchema: {
          type: "object",
          properties: {
            bookId: { type: "string" },
          },
          required: ["bookId"],
        },
      },
      {
        name: "create_book",
        description: "Create a new book in Scriptum",
        inputSchema: {
          type: "object",
          properties: {
            userId: { type: "string" },
            title: { type: "string" },
            author: { type: "string" },
            genre: { type: "string" },
            description: { type: "string" },
          },
          required: ["userId", "title"],
        },
      },
      {
        name: "add_chapter",
        description: "Add a new chapter to a book",
        inputSchema: {
          type: "object",
          properties: {
            bookId: { type: "string" },
            title: { type: "string" },
            content: { type: "string", description: "Chapter content as plain text" },
          },
          required: ["bookId", "title"],
        },
      },
      {
        name: "update_chapter",
        description: "Update the content of an existing chapter",
        inputSchema: {
          type: "object",
          properties: {
            chapterId: { type: "string" },
            content: { type: "string" },
            title: { type: "string" },
          },
          required: ["chapterId"],
        },
      },
      {
        name: "list_chapters",
        description: "List all chapters of a book",
        inputSchema: {
          type: "object",
          properties: {
            bookId: { type: "string" },
          },
          required: ["bookId"],
        },
      },
      {
        name: "get_chapter",
        description: "Get full chapter content",
        inputSchema: {
          type: "object",
          properties: {
            chapterId: { type: "string" },
          },
          required: ["chapterId"],
        },
      },
      {
        name: "apply_format_settings",
        description: "Apply formatting settings to a book",
        inputSchema: {
          type: "object",
          properties: {
            bookId: { type: "string" },
            trimSize: { type: "string", enum: ["5x8", "5.5x8.5", "6x9", "7x10"] },
            fontFamily: { type: "string" },
            preset: { type: "string", enum: ["classic", "modern", "fantasy", "scifi", "nonfiction"] },
          },
          required: ["bookId"],
        },
      },
      {
        name: "extract_characters",
        description: "Extract characters from a book's content",
        inputSchema: {
          type: "object",
          properties: {
            bookId: { type: "string" },
          },
          required: ["bookId"],
        },
      },
      {
        name: "get_book_stats",
        description: "Get word count and writing stats for a book",
        inputSchema: {
          type: "object",
          properties: {
            bookId: { type: "string" },
          },
          required: ["bookId"],
        },
      },
      {
        name: "finish_book",
        description: "Mark a book as completed",
        inputSchema: {
          type: "object",
          properties: {
            bookId: { type: "string" },
          },
          required: ["bookId"],
        },
      },
      {
        name: "analyze_book",
        description: "Analyze a book and return insights about genre, tone, and structure",
        inputSchema: {
          type: "object",
          properties: {
            bookId: { type: "string" },
          },
          required: ["bookId"],
        },
      },
      {
        name: "generate_toc",
        description: "Auto-generate the Table of Contents chapter from the book's chapter list",
        inputSchema: {
          type: "object",
          properties: {
            userId: { type: "string" },
            bookId: { type: "string" },
          },
          required: ["bookId"],
        },
      },
      {
        name: "list_collaborators",
        description: "List all collaborators who have access to a book",
        inputSchema: {
          type: "object",
          properties: {
            userId: { type: "string" },
            bookId: { type: "string" },
          },
          required: ["bookId"],
        },
      },
      {
        name: "add_collaborator",
        description: "Grant another user access to a book by their email address",
        inputSchema: {
          type: "object",
          properties: {
            userId: { type: "string" },
            bookId: { type: "string" },
            email: { type: "string", description: "Email address of the user to invite" },
            role: { type: "string", enum: ["EDITOR", "VIEWER"], description: "Access role (default: EDITOR)" },
          },
          required: ["bookId", "email"],
        },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    return handleMCPTool(name, (args ?? {}) as Record<string, unknown>);
  });

  return server;
}

// CLI entry point for standalone MCP server
export async function startMCPServer() {
  const server = createMCPServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Scriptum MCP server running on stdio");
}
