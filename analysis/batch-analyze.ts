import { GoogleGenAI } from "@google/genai";
import { readFileSync, readdirSync, writeFileSync, existsSync, statSync } from "fs";
import { basename, extname, join } from "path";
import "dotenv/config";

const VIDEOS_DIR = "/Users/ysnows/Documents/video-maker/analysis/videos";
const RESULTS_DIR = "/Users/ysnows/Documents/video-maker/analysis/results";

const VIDEO_MAP: Record<string, string> = {
  WLTjrAl6sT0: "Bloom by Medusa: AI Chat Platform",
  "74lpKobtucY": "Bleu AI: Create AI Workflows",
  tkdA4bGzlNc: "Draftboard: Founder-Led Product Video",
  DLj3z9rtpBo: "NextSlide: AI Presentation Builder",
  "_cUfI2GO1Hs": "Code Sa: Automated QA",
  KTATrZ2YsLc: "Origami: Founder-Led Launch Video",
  "NxGYez-NLJQ": "Chatly AI: AI Workspace",
  "_KFnXMf7vuc": "Atrium: AI Relationship Studio",
  G2jzT_JBYJM: "Epiminds: Agentic AI for Marketing",
  LmUmSDo0PQ8: "Ayyla: AI OS for Wedding Planners",
  xxNX8gIxoLI: "Blink: AI App Builder",
  "90r5N6ukjsc": "Feltsense: Agentic Founders Platform",
  DvvOLP174v8: "Lyngo: AI Receptionist for Clinics",
  "4IxrH8xota8": "AirOps: AI Search Growth Platform",
  EwkmGxwG8uw: "Loman AI: Founder-Led Story Video",
  "3S-VVUmy_0w": "Matterfact: AI Superagent for Investors",
  R4mGGCHkifg: "ServiceUp: Brand Announcement",
  qPC1fC7GNwc: "CAMB.AI: AI Localization Platform",
  bYQJjM2Xpf4: "ArmorIQ: AI Agent Security Platform",
  X3wzzdFweO4: "Baio: Longevity Operating System",
  thV4kqYclHg: "Anglera: AI Product Data Enrichment",
  kQc_xfFtNtI: "Anglera: AI Product Data Platform",
  gEpL0ovciIc: "Sternify: Shopify Upsells",
  Bwa2HbxOURk: "Chamelio: Founder-Led Feature Video",
  "eXK6-BmbU7o": "Cervo: AI for Customs Brokers",
  KuE_S9Cj60g: "The Additive: Retail Media Platform",
  EaQsSPOsAmE: "Parfour: Founder-Led Launch Video",
  a05baYEJkS4: "Dreem: AI Fashion Visuals",
  JGseMqRS6aM: "Dreem 2.0: AI Product Asset Platform",
  gpuevrTxYf4: "Horizon: AI Productivity Platform",
  "3NeUUuRIxZo": "Alchemy: AI Prompt Management",
  eIYQ1A8Zgro: "Tamio: eCommerce Website Builder",
  YMUNXZ6_LL0: "Appspace: Workplace Platform",
  "L3l4ePO6-5g": "Creative Force: Content Operations",
  MTYFUaD8IM8: "Secureframe: Compliance Automation",
  BTvhyYHxHLo: "FL0CK: AI Personas Platform",
  pxRBep52txU: "Traycer: AI Product Planner",
  afXSqJCvlFg: "UXCam: Product Analytics Platform",
  "7vI0p4HTyrE": "Abode: Early-Career Talent Platform",
  kYGHnU9BUzw: "AI Hub: AI Tools Marketplace",
  mVIshJK0zhA: "Applied Labs: AI Customer Support",
  XnC8tX7PT2I: "Bleu AI: Polymath",
  BCCEvPDlC6M: "Bloom AI: Adaptive Learning Platform",
  tROeWnT2fAQ: "Context AI: Enterprise AI Agents",
  AHkksCMmMUQ: "Context AI: Generate, Refine, Share",
  L4guEqLxB2E: "Datavine: Data Intelligence Platform",
  bdDAcZUE8Uw: "Diana: AI Employee",
  J2iJW5ecvfo: "FeedNest: News Intelligence Platform",
  "2yW_f_PxqmE": "Flyway Health: Healthcare Revenue",
  "0MTDr-hcABs": "Genstore AI: AI E-commerce Platform",
  "evO0Dj-rDrw": "GoAudience: Audience Intelligence",
  "lk-grXVR1GE": "Handshaik: B2B Growth Platform",
  VJWQMD4z6_c: "HeyGen: AI e-Learning",
  fBvDpMYv264: "HeyGen: AI Video Translation",
  "5bP-hRzKoK4": "Timeliner: Video Agency OS",
  VPHOIsn6brA: "IP World: Rewards Platform",
  lowxFz89Ano: "Jampack AI: Wholesale Automation",
  g_V23Wl8rcY: "Kite AI: Autonomous Website Builder",
  "2bI2mFek-PI": "Komo AI: AI Search Platform",
  lllKSjUTsKo: "LangGuard: AI Agent Governance",
  lW8YT4VUfLI: "LM Studio: Local AI Platform",
  "3dWjP8GgunY": "Perigon Signals: Web Intelligence",
  "hQiK-O1ni9A": "Quotivity: HubSpot-Native CPQ",
  pnUHR5KP_9A: "Scout AI: AI Sales Prospecting Agent",
  CP5QbjiniGo: "ServiceUp: Product Explainer",
  MQbUNb8eKNg: "ServiceUp: Homepage Video",
  JQCeTRtGLHk: "Tendersight: AI for Gov Contracting",
  VXK2ZUm8wrk: "Edugram: Online Course Platform",
  "JQLum-d3k6c": "Chamelio: Legal Intelligence Platform",
  "7Y1sOpRIXFw": "Chamelio: Agent Feature Explainer",
  cuVANEytZpw: "PaySet: FX Ad",
  sX7zfzngTFs: "PaySet: Network to Revenue",
  UP3RAWNzZow: "PaySet: Slow Transfers",
  DLTlqN2vkk0: "BREAD: Crypto Payments Concept",
  "10peX5N8Q2I": "PluginPlay: Adobe Plugin Marketplace",
  "5GcXYGoK1sI": "Zania: AI GRC Agents Platform",
  xuiZhWBQPJM: "RangerX: Industrial AI Walkthrough",
  "2iFc4mdKjJY": "NeuroSoph: Gen Studio AI Chatbot",
};

const ANALYSIS_PROMPT = `You are a professional video production analyst. Analyze this video in extreme detail for a video production skill guide. This is a high-quality SaaS product video from FlashMotion studio.

Provide your analysis in the following structure:

## 1. Video Overview
- Estimated duration
- Overall category (product demo, founder-led, brand story, explainer, etc.)
- Target audience
- Core message / value proposition

## 2. Visual Style & Art Direction
- Color palette (dominant colors, accent colors, background treatment)
- Typography (font styles, sizes, weight, animation of text)
- Layout & composition patterns (grid usage, spacing, alignment)
- Brand consistency elements
- Dark mode vs light mode usage
- Gradient and glow effects

## 3. Motion Design & Animation Techniques
- Opening sequence technique (how does it start? first 3 seconds)
- UI element animations (how do interface elements appear/transition?)
- Text animation patterns (typewriter, fade, slide, scale, blur-in?)
- Transition types between scenes (cut, dissolve, zoom, morph, wipe?)
- Easing curves observed (spring, ease-out, linear?)
- Parallax or depth effects
- Particle effects or abstract motion graphics
- Loading/progress animations
- Micro-interactions shown

## 4. Screen Recording & Product Demo Techniques
- How is the product UI shown? (full screen, device mockup, floating window, perspective?)
- Mouse cursor behavior (custom cursor, highlight clicks, smooth movement?)
- Zoom/focus techniques (how does it draw attention to specific UI areas?)
- Screen recording quality and cropping
- How are features highlighted vs contextual UI?

## 5. Audio & Sound Design
- Background music style and energy level
- Sound effects (UI clicks, whooshes, transitions)
- Voiceover presence and style
- Audio-visual sync points

## 6. Pacing & Editing Rhythm
- Average shot/scene duration
- Pacing pattern (fast-slow-fast? building energy? consistent?)
- How many distinct "beats" or sections?
- Call-to-action placement and timing

## 7. Storytelling Structure
- Hook (first 3 seconds)
- Problem statement presentation
- Solution reveal
- Feature showcase flow
- Social proof / credibility elements
- CTA / ending

## 8. Specific Techniques Worth Replicating
List the TOP 5 most impressive or unique techniques in this video that could be replicated in Remotion. For each:
- What it is
- When it appears (approximate timestamp)
- How to implement it (conceptual approach)

## 9. Production Quality Score (1-10)
Rate and briefly justify:
- Visual design: X/10
- Animation quality: X/10
- Pacing: X/10
- Storytelling: X/10
- Overall: X/10`;

async function analyzeVideo(
  ai: GoogleGenAI,
  videoPath: string,
  videoId: string,
  title: string,
  index: number,
  total: number
): Promise<string> {
  const resultPath = join(RESULTS_DIR, `${videoId}.md`);
  if (existsSync(resultPath)) {
    console.log(`[${index}/${total}] Skip (analyzed): ${title}`);
    return readFileSync(resultPath, "utf-8");
  }

  console.log(`[${index}/${total}] Analyzing: ${title} (${videoId})`);

  const videoData = readFileSync(videoPath);
  const base64 = videoData.toString("base64");
  const size = statSync(videoPath).size;

  let response;
  if (size <= 20 * 1024 * 1024) {
    response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          parts: [
            { inlineData: { mimeType: "video/mp4", data: base64 } },
            { text: `Video title: "${title}"\n\n${ANALYSIS_PROMPT}` },
          ],
        },
      ],
    });
  } else {
    const uploaded = await ai.files.upload({
      file: videoPath,
      config: { mimeType: "video/mp4" },
    });
    let file = uploaded;
    while (file.state === "PROCESSING") {
      await new Promise((r) => setTimeout(r, 2000));
      file = await ai.files.get({ name: file.name! });
    }
    if (file.state === "FAILED") throw new Error(`Upload failed: ${videoId}`);

    response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          parts: [
            { fileData: { fileUri: file.uri!, mimeType: "video/mp4" } },
            { text: `Video title: "${title}"\n\n${ANALYSIS_PROMPT}` },
          ],
        },
      ],
    });
  }

  const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error(`No analysis returned for ${videoId}`);

  const markdown = `# ${title}\n\nVideo ID: ${videoId}\nSource: https://www.youtube.com/watch?v=${videoId}\n\n${text}`;
  writeFileSync(resultPath, markdown);
  console.log(`[${index}/${total}] Done: ${title}`);
  return markdown;
}

async function main() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("GOOGLE_API_KEY not set");
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey });

  // Ensure results dir
  if (!existsSync(RESULTS_DIR)) {
    const { mkdirSync } = await import("fs");
    mkdirSync(RESULTS_DIR, { recursive: true });
  }

  // Find all downloaded videos
  const files = readdirSync(VIDEOS_DIR).filter(
    (f) => f.endsWith(".mp4") && !f.includes(".f136.") && !f.includes(".f140.")
  );

  console.log(`Found ${files.length} videos to analyze`);

  const CONCURRENCY = 3;
  let idx = 0;

  async function processNext(): Promise<void> {
    while (idx < files.length) {
      const i = idx++;
      const file = files[i];
      const videoId = basename(file, ".mp4");
      const title = VIDEO_MAP[videoId] || videoId;
      const videoPath = join(VIDEOS_DIR, file);

      try {
        await analyzeVideo(ai, videoPath, videoId, title, i + 1, files.length);
      } catch (err: any) {
        console.error(`[${i + 1}/${files.length}] ERROR ${title}: ${err.message}`);
        // Write error file so we can retry later
        writeFileSync(
          join(RESULTS_DIR, `${videoId}.error.txt`),
          `Error analyzing ${title}: ${err.message}`
        );
      }
      // Small delay to avoid rate limits
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => processNext());
  await Promise.all(workers);

  // Summary
  const results = readdirSync(RESULTS_DIR).filter((f) => f.endsWith(".md"));
  const errors = readdirSync(RESULTS_DIR).filter((f) => f.endsWith(".error.txt"));
  console.log(`\nAnalysis complete: ${results.length} analyzed, ${errors.length} errors`);
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
