import { GoogleGenAI, type Part } from "@google/genai";
import { readFileSync, statSync } from "fs";
import { extname } from "path";
import "dotenv/config";

const MIME_MAP: Record<string, string> = {
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".avi": "video/x-msvideo",
  ".webm": "video/webm",
  ".mkv": "video/x-matroska",
  ".m4v": "video/x-m4v",
  ".flv": "video/x-flv",
  ".wmv": "video/x-ms-wmv",
  ".3gp": "video/3gpp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

const INLINE_SIZE_LIMIT = 20 * 1024 * 1024; // 20 MB — use File API above this

function getClient(): GoogleGenAI {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_API_KEY not set in .env");
  return new GoogleGenAI({ apiKey });
}

function getMimeType(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  const mime = MIME_MAP[ext];
  if (!mime) throw new Error(`Unsupported format: ${ext}`);
  return mime;
}

async function buildFilePart(
  ai: GoogleGenAI,
  filePath: string
): Promise<Part> {
  const mimeType = getMimeType(filePath);
  const size = statSync(filePath).size;

  if (size <= INLINE_SIZE_LIMIT) {
    const data = readFileSync(filePath).toString("base64");
    return { inlineData: { mimeType, data } };
  }

  const uploaded = await ai.files.upload({
    file: filePath,
    config: { mimeType },
  });

  if (!uploaded.uri) throw new Error("File upload returned no URI");

  let file = uploaded;
  while (file.state === "PROCESSING") {
    await new Promise((r) => setTimeout(r, 2000));
    const fetched = await ai.files.get({ name: file.name! });
    file = fetched;
  }

  if (file.state === "FAILED") {
    throw new Error(`File processing failed: ${file.name}`);
  }

  return { fileData: { fileUri: file.uri!, mimeType } };
}

export interface GeminiRequest {
  files?: string[];
  prompt: string;
  model?: string;
}

export async function gemini({
  files = [],
  prompt,
  model = "gemini-2.5-flash",
}: GeminiRequest): Promise<string> {
  const ai = getClient();

  const parts: Part[] = [];
  for (const f of files) {
    parts.push(await buildFilePart(ai, f));
  }
  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts }],
  });

  const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned no content");
  return text;
}
