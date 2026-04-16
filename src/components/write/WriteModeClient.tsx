"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import {
  PenLine, Layout, Plus, Moon, Sun, Maximize2, Minimize2,
  GripVertical, ChevronRight, ChevronDown, Trash2,
  Target, FileText, BookOpen, Sparkles, History, ListOrdered,
  Settings, Archive,
} from "lucide-react";
import Link from "next/link";
import { cn, formatWordCount, estimateReadingTime } from "@/lib/utils";
import { TiptapEditor } from "./TiptapEditor";
import { AIPanel } from "./AIPanel";
import { VersionHistoryPanel } from "./VersionHistoryPanel";
import { useBookStore } from "@/store/bookStore";
import type { Chapter, Scene } from "@/types";

interface BookWithChapters {
  id: string;
  title: string;
  author: string | null;
  wordGoal: number | null;
  chapters: (Chapter & {
    scenes: Scene[];
    versions: { id: string; createdAt: Date; label: string | null; wordCount: number }[];
  })[];
}

interface WriteModeClientProps {
  book: BookWithChapters;
  userId: string;
  readOnly?: boolean;
}

export function WriteModeClient({ book: initialBook, userId, readOnly = false }: WriteModeClientProps) {
  const [book, setBook] = useState(initialBook);
  const [selectedChapterId, setSelectedChapterId] = useState<string>(
    book.chapters[0]?.id ?? ""
  );
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [focusMode, setFocusMode] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const { theme, setTheme } = useBookStore();
  const darkMode = theme === "dark";
  const setDarkMode = (v: boolean) => setTheme(v ? "dark" : "light");
  const [savingStatus, setSavingStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [showHistory, setShowHistory] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [sessionWords, setSessionWords] = useState(0);
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const sessionStartWordsRef = useRef(initialBook.chapters.reduce((s, c) => s + c.wordCount, 0));
  const sessionStartTimeRef = useRef(Date.now());
  const latestTotalWordsRef = useRef(sessionStartWordsRef.current);

  const selectedChapter = book.chapters.find((c) => c.id === selectedChapterId);

  const totalWords = book.chapters.reduce((s, c) => s + c.wordCount, 0);
  const progress = book.wordGoal ? Math.min(100, Math.round((totalWords / book.wordGoal) * 100)) : null;

  // Keep session word count in sync and display it live
  useEffect(() => {
    latestTotalWordsRef.current = totalWords;
    setSessionWords(Math.max(0, totalWords - sessionStartWordsRef.current));
  }, [totalWords]);

  // Post writing session to API when leaving write mode; clear any pending save timers
  useEffect(() => {
    return () => {
      // Flush all pending save timers
      Object.values(saveTimers.current).forEach(clearTimeout);

      const wordsWritten = latestTotalWordsRef.current - sessionStartWordsRef.current;
      const durationSeconds = Math.round((Date.now() - sessionStartTimeRef.current) / 1000);
      if (wordsWritten > 0 && durationSeconds > 30) {
        fetch(`/api/books/${book.id}/writing-session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ words: wordsWritten, duration: durationSeconds }),
          keepalive: true,
        }).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleContentChange = useCallback(
    async (content: string, wordCount: number) => {
      if (!selectedChapterId) return;

      setSavingStatus("unsaved");

      // Clear any pending save for THIS chapter only — other chapters keep their timers
      if (saveTimers.current[selectedChapterId]) {
        clearTimeout(saveTimers.current[selectedChapterId]);
      }

      // Optimistic update
      setBook((prev) => ({
        ...prev,
        chapters: prev.chapters.map((ch) =>
          ch.id === selectedChapterId ? { ...ch, content, wordCount } : ch
        ),
      }));

      saveTimers.current[selectedChapterId] = setTimeout(async () => {
        setSavingStatus("saving");
        try {
          await fetch(`/api/chapters/${selectedChapterId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content, wordCount }),
          });
          setSavingStatus("saved");
        } catch {
          setSavingStatus("unsaved");
        }
      }, 1500);
    },
    [selectedChapterId]
  );

  const addChapter = async () => {
    const res = await fetch(`/api/books/${book.id}/chapters`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: `Chapter ${book.chapters.filter(c => c.type === "CHAPTER").length + 1}` }),
    });
    if (res.ok) {
      const chapter = await res.json();
      setBook((prev) => ({ ...prev, chapters: [...prev.chapters, { ...chapter, scenes: [], versions: [] }] }));
      setSelectedChapterId(chapter.id);
    }
  };

  const deleteChapter = async (chapterId: string) => {
    if (!confirm("Delete this chapter? This cannot be undone.")) return;
    await fetch(`/api/chapters/${chapterId}`, { method: "DELETE" });
    setBook((prev) => ({
      ...prev,
      chapters: prev.chapters.filter((c) => c.id !== chapterId),
    }));
    if (selectedChapterId === chapterId) {
      setSelectedChapterId(book.chapters.find((c) => c.id !== chapterId)?.id ?? "");
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(book.chapters);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    const reordered = items.map((ch, i) => ({ ...ch, order: i }));
    setBook((prev) => ({ ...prev, chapters: reordered }));
    await fetch(`/api/books/${book.id}/chapters/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chapters: reordered.map((c) => ({ id: c.id, order: c.order })) }),
    });
  };

  const generateToc = async () => {
    const res = await fetch(`/api/books/${book.id}/toc`, { method: "POST" });
    if (res.ok) {
      const refreshed = await fetch(`/api/chapters/${selectedChapterId}`);
      if (refreshed.ok) {
        const chapter = await refreshed.json();
        setBook((prev) => ({
          ...prev,
          chapters: prev.chapters.map((ch) => ch.id === selectedChapterId ? { ...ch, ...chapter } : ch),
        }));
        setEditorKey((k) => k + 1);
      }
    }
  };

  const handleVersionRestore = useCallback(async () => {
    if (!selectedChapterId) return;
    const res = await fetch(`/api/chapters/${selectedChapterId}`);
    if (res.ok) {
      const chapter = await res.json();
      setBook((prev) => ({
        ...prev,
        chapters: prev.chapters.map((ch) => ch.id === selectedChapterId ? { ...ch, ...chapter } : ch),
      }));
      setEditorKey((k) => k + 1);
    }
  }, [selectedChapterId]);

  const toggleExpand = (id: string) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className={cn("flex h-screen overflow-hidden", darkMode ? "dark" : "")} style={{ background: "var(--background)" }}>
      {/* Sidebar */}
      {!focusMode && (
        <aside className="sidebar w-64 border-r border-[var(--border)] flex flex-col bg-[var(--card)] flex-shrink-0">
          {/* Mode Toggle Header */}
          <div className="px-3 py-3 border-b border-[var(--border)] flex items-center gap-2">
            <Link href="/books" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
              <BookOpen className="h-4 w-4" />
            </Link>
            <h2 className="flex-1 text-sm font-semibold text-[var(--foreground)] truncate">{book.title}</h2>
            <Link
              href={`/books/${book.id}/format`}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              title="Format Mode"
            >
              <Layout className="h-3 w-3" />
              Format
            </Link>
            <Link
              href={`/books/${book.id}/backup`}
              className="p-1 rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
              title="Backup & Restore"
            >
              <Archive className="h-3.5 w-3.5" />
            </Link>
            <Link
              href={`/books/${book.id}/settings`}
              className="p-1 rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
              title="Book Settings & Collaborators"
            >
              <Settings className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Stats bar */}
          <div className="px-3 py-2 border-b border-[var(--border)] flex items-center justify-between text-xs text-[var(--muted-foreground)]">
            <span>{formatWordCount(totalWords)} words</span>
            {progress !== null && (
              <span>{progress}% of goal</span>
            )}
          </div>

          {/* Chapter list */}
          <div className="flex-1 overflow-y-auto p-2">
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="chapters">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-0.5">
                    {book.chapters.map((chapter, idx) => (
                      <Draggable key={chapter.id} draggableId={chapter.id} index={idx}>
                        {(drag) => (
                          <div ref={drag.innerRef} {...drag.draggableProps}>
                            <div
                              className={cn(
                                "flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer group transition-colors",
                                selectedChapterId === chapter.id
                                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                                  : "hover:bg-[var(--secondary)] text-[var(--foreground)]"
                              )}
                              onClick={() => setSelectedChapterId(chapter.id)}
                            >
                              <div {...drag.dragHandleProps} className="opacity-0 group-hover:opacity-40 cursor-grab">
                                <GripVertical className="h-3 w-3" />
                              </div>
                              {chapter.scenes.length > 0 && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); toggleExpand(chapter.id); }}
                                  className="opacity-60 hover:opacity-100"
                                >
                                  {expandedChapters.has(chapter.id)
                                    ? <ChevronDown className="h-3 w-3" />
                                    : <ChevronRight className="h-3 w-3" />}
                                </button>
                              )}
                              <span className="flex-1 text-xs font-medium truncate">{chapter.title}</span>
                              <span className={cn("text-xs opacity-60", selectedChapterId === chapter.id ? "text-[var(--primary-foreground)]" : "text-[var(--muted-foreground)]")}>
                                {formatWordCount(chapter.wordCount)}
                              </span>
                              {!readOnly && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); deleteChapter(chapter.id); }}
                                  className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>

                            {/* Scenes */}
                            {expandedChapters.has(chapter.id) && chapter.scenes.map((scene) => (
                              <div key={scene.id} className="pl-6 mt-0.5">
                                <div className="flex items-center gap-2 px-2 py-1 rounded-md text-xs text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)] cursor-pointer transition-colors">
                                  <FileText className="h-3 w-3" />
                                  <span className="truncate">{scene.title}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          {/* Add chapter */}
          {!readOnly && (
            <div className="p-3 border-t border-[var(--border)]">
              <button
                onClick={addChapter}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)] transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Chapter
              </button>
            </div>
          )}
        </aside>
      )}

      {/* Editor Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className={cn("toolbar flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--card)]", focusMode && "transition-opacity opacity-0 hover:opacity-100")}>
          <div className="flex items-center gap-3">
            {focusMode && (
              <span className="text-sm font-medium text-[var(--foreground)]">
                {selectedChapter?.title}
              </span>
            )}
            {readOnly ? (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full text-amber-600 bg-amber-50">
                Viewing (read-only)
              </span>
            ) : (
              <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", {
                "text-green-600 bg-green-50": savingStatus === "saved",
                "text-yellow-600 bg-yellow-50": savingStatus === "saving",
                "text-[var(--muted-foreground)] bg-[var(--secondary)]": savingStatus === "unsaved",
              })}>
                {savingStatus === "saved" ? "Saved" : savingStatus === "saving" ? "Saving…" : "Unsaved"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {selectedChapter?.type === "TOC" && (
              <button
                onClick={generateToc}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                title="Auto-generate Table of Contents from chapters"
              >
                <ListOrdered className="h-3.5 w-3.5" />
                Generate TOC
              </button>
            )}
            <button
              onClick={() => { setShowHistory(!showHistory); if (!showHistory) setShowAI(false); }}
              className={cn("p-1.5 rounded-lg transition-colors", showHistory ? "bg-amber-100 text-amber-600" : "text-[var(--muted-foreground)] hover:bg-[var(--secondary)]")}
              title="Version History"
            >
              <History className="h-4 w-4" />
            </button>
            <button
              onClick={() => { setShowAI(!showAI); if (!showAI) setShowHistory(false); }}
              className={cn("p-1.5 rounded-lg transition-colors", showAI ? "bg-purple-100 text-purple-600" : "text-[var(--muted-foreground)] hover:bg-[var(--secondary)]")}
              title="AI Assistant"
            >
              <Sparkles className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--secondary)] transition-colors"
              title="Toggle dark mode"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setFocusMode(!focusMode)}
              className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--secondary)] transition-colors"
              title="Focus mode"
            >
              {focusMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Editor + AI Panel */}
        <div className="flex-1 flex overflow-hidden">
          <div className={cn("flex-1 overflow-y-auto", focusMode ? "max-w-2xl mx-auto px-8" : "")}>
            {selectedChapter ? (
              <TiptapEditor
                key={`${selectedChapter.id}-${editorKey}`}
                chapterId={selectedChapter.id}
                initialContent={selectedChapter.content ?? ""}
                onUpdate={readOnly ? () => {} : handleContentChange}
                focusMode={focusMode}
                readOnly={readOnly}
                placeholder={`Start writing ${selectedChapter.title}…`}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-[var(--muted-foreground)]">
                <div className="text-center">
                  <PenLine className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>Select a chapter to start writing</p>
                </div>
              </div>
            )}
          </div>

          {showAI && selectedChapter && (
            <div className="w-80 border-l border-[var(--border)] bg-[var(--card)] overflow-y-auto flex-shrink-0">
              <AIPanel
                bookId={book.id}
                chapterId={selectedChapter.id}
                content={selectedChapter.content ?? ""}
              />
            </div>
          )}
          {showHistory && selectedChapter && (
            <div className="w-80 border-l border-[var(--border)] bg-[var(--card)] overflow-y-auto flex-shrink-0">
              <VersionHistoryPanel
                chapterId={selectedChapter.id}
                onRestore={handleVersionRestore}
              />
            </div>
          )}
        </div>

        {/* Status bar */}
        {!focusMode && (
          <div className="flex items-center justify-between px-4 py-1.5 border-t border-[var(--border)] bg-[var(--card)] text-xs text-[var(--muted-foreground)]">
            <div className="flex items-center gap-4">
              <span>{selectedChapter?.wordCount ?? 0} words in chapter</span>
              <span>{formatWordCount(totalWords)} total words</span>
              <span>{estimateReadingTime(totalWords)} reading time</span>
              {sessionWords > 0 && (
                <span className="text-green-600">+{sessionWords} this session</span>
              )}
            </div>
            <div className="flex items-center gap-4">
              {book.wordGoal && (
                <span className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  {progress}% of {formatWordCount(book.wordGoal)} goal
                </span>
              )}
              <span>{book.chapters.length} chapters</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
