import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

const ALLOWED_FONT_EXTS = ["ttf", "otf", "woff", "woff2"];

/**
 * POST /api/fonts
 * Uploads a custom font file (TTF/OTF/WOFF/WOFF2) and returns its URL.
 * The font is stored per-user in /public/uploads/fonts/.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const rawExt = (file.name.split(".").pop() ?? "").toLowerCase();
  if (!ALLOWED_FONT_EXTS.includes(rawExt)) {
    return NextResponse.json({ error: `Only ${ALLOWED_FONT_EXTS.join(", ")} files are allowed` }, { status: 400 });
  }

  // Derive a CSS-safe font family name from the filename (strip extension, replace non-alphanumeric)
  const baseName = file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9\s-]/g, "").trim();
  const fontFamily = baseName || "CustomFont";

  const filename = `${session.user.id}-${Date.now()}-${fontFamily.replace(/\s+/g, "-")}.${rawExt}`;
  const uploadDir = join(process.cwd(), "public", "uploads", "fonts");
  await mkdir(uploadDir, { recursive: true });

  const bytes = await file.arrayBuffer();
  await writeFile(join(uploadDir, filename), Buffer.from(bytes));

  const url = `/uploads/fonts/${filename}`;

  return NextResponse.json({ url, fontFamily, ext: rawExt });
}
