import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatWordCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
}

export function estimateReadingTime(wordCount: number): string {
  const minutes = Math.ceil(wordCount / 200);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function estimatePageCount(wordCount: number, trimSize = "6x9"): number {
  // Average words per page by trim size
  const wpp: Record<string, number> = {
    "5x8": 230,
    "5.25x8": 245,
    "5.5x8.5": 260,
    "6x9": 280,
    "6.14x9.21": 285,
    "7x10": 350,
    "8.5x11": 450,
  };
  const wordsPerPage = wpp[trimSize] ?? 280;
  return Math.ceil(wordCount / wordsPerPage);
}

export function calculateSpineWidth(
  pageCount: number,
  paperType: "cream" | "white" = "cream"
): number {
  // KDP spine width formula: pages × paper thickness (inches)
  const thickness = paperType === "cream" ? 0.0025 : 0.002252;
  return pageCount * thickness;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + "…";
}
