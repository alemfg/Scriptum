import type {
  Book,
  Chapter,
  Scene,
  Character,
  WorldBuilding,
  FormatSettings,
  WritingSession,
  Collection,
  Backup,
  AISettings,
  IsbnEntry,
  UserRole,
  BookStatus,
  BookMode,
  ChapterType,
  WorldBuildingType,
  AIProvider,
  IsbnType,
} from "@prisma/client";

export type {
  Book,
  Chapter,
  Scene,
  Character,
  WorldBuilding,
  FormatSettings,
  WritingSession,
  Collection,
  Backup,
  AISettings,
  IsbnEntry,
  UserRole,
  BookStatus,
  BookMode,
  ChapterType,
  WorldBuildingType,
  AIProvider,
  IsbnType,
};

export type BookWithChapters = Book & {
  chapters: Chapter[];
};

export type BookFull = Book & {
  chapters: (Chapter & { scenes: Scene[]; versions: { id: string; createdAt: Date; label: string | null }[] })[];
  characters: Character[];
  worldbuilding: WorldBuilding[];
  scenes: Scene[];
  formatSettings: FormatSettings | null;
  isbns: IsbnEntry[];
};

export type TrimSize =
  | "5x8"
  | "5.25x8"
  | "5.5x8.5"
  | "6x9"
  | "6.14x9.21"
  | "7x10"
  | "8.5x11";

export type TypographyPreset =
  | "classic"
  | "modern"
  | "fantasy"
  | "scifi"
  | "nonfiction";

export type ExportFormat = "pdf" | "epub" | "docx" | "md";

export type ImportFormat = "docx" | "pdf" | "txt" | "md" | "epub";

export interface AICapability {
  type:
    | "suggest"
    | "rewrite"
    | "translate"
    | "expand"
    | "grammar"
    | "style"
    | "tone"
    | "extract_characters"
    | "extract_worldbuilding"
    | "generate_chapter"
    | "analyze";
  prompt?: string;
  context?: string;
  targetLanguage?: string;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: object;
}

export interface WritingStats {
  totalWords: number;
  chapterCount: number;
  sceneCount: number;
  sessionWords: number;
  dailyWords: number;
  estimatedPages: number;
  estimatedReadingTime: string;
}

export interface ValidationIssue {
  type:
    | "orphan_line"
    | "widow_line"
    | "missing_page"
    | "chapter_inconsistency"
    | "font_issue"
    | "formatting_issue";
  severity: "error" | "warning";
  message: string;
  chapterId?: string;
  pageNumber?: number;
}

export interface ImportResult {
  success: boolean;
  chapters: Array<{
    title: string;
    content: string;
    order: number;
  }>;
  errors: string[];
  warnings: string[];
}
