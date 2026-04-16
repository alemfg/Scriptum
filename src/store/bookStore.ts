import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BookFull } from "@/types";

interface BookStore {
  currentBook: BookFull | null;
  currentChapterId: string | null;
  mode: "write" | "format";
  focusMode: boolean;
  sidebarOpen: boolean;
  theme: "light" | "dark";

  setCurrentBook: (book: BookFull | null) => void;
  setCurrentChapter: (chapterId: string | null) => void;
  setMode: (mode: "write" | "format") => void;
  toggleFocusMode: () => void;
  toggleSidebar: () => void;
  setTheme: (theme: "light" | "dark") => void;
  updateChapterWordCount: (chapterId: string, count: number) => void;
  reorderChapters: (chapters: BookFull["chapters"]) => void;
}

export const useBookStore = create<BookStore>()(
  persist(
    (set) => ({
      currentBook: null,
      currentChapterId: null,
      mode: "write",
      focusMode: false,
      sidebarOpen: true,
      theme: "light",

      setCurrentBook: (book) => set({ currentBook: book }),
      setCurrentChapter: (chapterId) =>
        set({ currentChapterId: chapterId }),
      setMode: (mode) => set({ mode }),
      toggleFocusMode: () =>
        set((s) => ({ focusMode: !s.focusMode })),
      toggleSidebar: () =>
        set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setTheme: (theme) => set({ theme }),
      updateChapterWordCount: (chapterId, count) =>
        set((s) => {
          if (!s.currentBook) return s;
          return {
            currentBook: {
              ...s.currentBook,
              chapters: s.currentBook.chapters.map((ch) =>
                ch.id === chapterId ? { ...ch, wordCount: count } : ch
              ),
            },
          };
        }),
      reorderChapters: (chapters) =>
        set((s) => {
          if (!s.currentBook) return s;
          return {
            currentBook: { ...s.currentBook, chapters },
          };
        }),
    }),
    {
      name: "scriptum-book-store",
      partialize: (s) => ({
        currentChapterId: s.currentChapterId,
        mode: s.mode,
        sidebarOpen: s.sidebarOpen,
        theme: s.theme,
      }),
    }
  )
);
