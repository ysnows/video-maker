import { GoogleGenAI } from "@google/genai";
import { readFileSync } from "fs";
import { basename, extname } from "path";
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
};

interface AnalyzeOptions {
  videoPath: string;
  prompt?: string;
  model?: string;
}

export async function analyzeVideo({
  videoPath,
  prompt,
  model = "gemini-2.5-flash",
}: AnalyzeOptions): Promise<string> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_API_KEY not set in .env");

  const ai = new GoogleGenAI({ apiKey });

  const ext = extname(videoPath).toLowerCase();
  const mimeType = MIME_MAP[ext];
  if (!mimeType) {
    throw new Error(`Unsupported video format: ${ext}`);
  }

  const videoData = readFileSync(videoPath);
  const base64 = videoData.toString("base64");

  const defaultPrompt = `Analyze this video in detail. Provide:

1. **Overview**: What is this video about? Duration estimate, resolution quality.
2. **Scene Breakdown**: List each distinct scene/shot with timestamps and description.
3. **Visual Style**: Color palette, lighting, camera movements, transitions used.
4. **Audio**: Background music, voiceover, sound effects (if detectable).
5. **Text/Graphics**: Any on-screen text, titles, lower thirds, watermarks.
6. **Pacing & Editing**: Cut frequency, rhythm, any slow-mo or speed ramps.
7. **Production Quality**: Professional assessment — what works well, what could improve.
8. **Suggestions**: Specific improvements for making this more engaging.`;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64,
            },
          },
          { text: prompt || defaultPrompt },
        ],
      },
    ],
  });

  const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned no analysis text");

  return text;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`Usage: npx tsx src/tools/analyze-video.ts <video-path> [prompt] [model]

Arguments:
  video-path  Path to a video file (mp4, mov, webm, mkv, etc.)
  prompt      Custom analysis prompt (optional)
  model       Gemini model to use (default: gemini-2.5-flash)

Examples:
  npx tsx src/tools/analyze-video.ts demo.mp4
  npx tsx src/tools/analyze-video.ts demo.mp4 "Count all scene transitions"
  npx tsx src/tools/analyze-video.ts demo.mp4 "Describe the color grading" gemini-2.5-pro`);
    process.exit(1);
  }

  const [videoPath, prompt, model] = args;

  console.log(`Analyzing: ${basename(videoPath)}`);
  console.log(`Model: ${model || "gemini-2.5-flash"}`);
  console.log("---");

  const result = await analyzeVideo({ videoPath, prompt, model });
  console.log(result);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
