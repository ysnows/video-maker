import { GoogleGenAI } from "@google/genai";
import { readFileSync, readdirSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import "dotenv/config";

const RESULTS_DIR = "/Users/ysnows/Documents/video-maker/analysis/results";
const OUTPUT_PATH = "/Users/ysnows/Documents/video-maker/skills/flashmotion-style/SKILL.md";

async function main() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) { console.error("GOOGLE_API_KEY not set"); process.exit(1); }

  const ai = new GoogleGenAI({ apiKey });

  const files = readdirSync(RESULTS_DIR).filter(f => f.endsWith(".md"));
  console.log(`Reading ${files.length} analysis files...`);

  const analyses: string[] = [];
  for (const f of files) {
    const content = readFileSync(join(RESULTS_DIR, f), "utf-8");
    analyses.push(content);
  }

  const allText = analyses.join("\n\n---\n\n");
  console.log(`Total analysis text: ${(allText.length / 1024).toFixed(0)} KB`);

  // Use Gemini with the File API for large context
  const tmpPath = "/tmp/flashmotion-analyses.txt";
  writeFileSync(tmpPath, allText);

  const uploaded = await ai.files.upload({
    file: tmpPath,
    config: { mimeType: "text/plain" },
  });

  let file = uploaded;
  while (file.state === "PROCESSING") {
    await new Promise(r => setTimeout(r, 2000));
    file = await ai.files.get({ name: file.name! });
  }

  console.log("Generating synthesis...");

  const response = await ai.models.generateContent({
    model: "gemini-2.5-pro",
    contents: [{
      parts: [
        { fileData: { fileUri: file.uri!, mimeType: "text/plain" } },
        { text: `You are a world-class video production analyst. I've provided individual deep analyses of ${files.length} professional SaaS product videos from FlashMotion studio (flashmotion.io).

Your task: Synthesize ALL analyses into a comprehensive, actionable VIDEO PRODUCTION SKILL GUIDE. This guide will be used by AI agents and developers building videos with Remotion (React-based video framework).

Structure your synthesis as follows:

# FlashMotion Production Style Guide

## Executive Summary
2-3 paragraphs: What makes FlashMotion videos exceptional? What is their signature style?

## 1. Visual Design System

### Color Palettes
- The dominant color strategies across all videos
- Dark mode vs light mode patterns
- Gradient usage patterns
- Glow and accent color patterns
- Background treatment (solid, gradient, mesh, noise, etc.)

### Typography
- Font style patterns (sans-serif families, weights)
- Text sizing hierarchy
- Text color on dark/light backgrounds
- Badge/pill text patterns

### Layout & Composition
- Grid and spacing patterns
- Device mockup styles
- Floating window arrangements
- Negative space usage

## 2. Motion Design Playbook

### Opening Sequences (First 3 Seconds)
Catalog ALL distinct opening patterns found. For each:
- Name it (e.g., "Logo Burst", "Problem Statement Fade", "UI Zoom-In")
- How frequently it appears (count)
- Step-by-step description
- Remotion implementation hint

### Text Animations
Catalog every text animation technique observed:
- Entry animations (fade, slide, scale, blur, typewriter, etc.)
- Exit animations
- Emphasis animations
- Which contexts each is used in

### UI Element Animations
- How product UI appears on screen
- Browser/device frame animations
- Feature highlight techniques
- Cursor and click animations

### Scene Transitions
Every transition type observed:
- Cut (hard cut patterns)
- Dissolve/crossfade
- Zoom transitions
- Slide/push
- Morph transitions
- Color flash transitions
- Geometric wipes

### Micro-Animations
- Button interactions
- Loading indicators
- Hover states
- Icon animations
- Particle effects
- Abstract background motion

## 3. Screen Recording & Product Demo Patterns

### Display Contexts
How is the product UI shown? Catalog all patterns:
- Full-screen recording
- Browser frame mockup
- Device mockup (laptop, phone)
- Floating/angled windows
- Split screen
- Picture-in-picture

### Focus Techniques
- Zoom into specific areas
- Spotlight/dim surroundings
- Highlight box/outline
- Cursor focus
- Annotation arrows

### Recording Quality
- Resolution and cropping patterns
- Speed adjustments (2x, slow-mo)
- Scroll behavior

## 4. Audio & Sound Design Patterns

### Music
- Genre/mood categories used
- Energy curves across video duration
- BPM ranges observed

### Sound Effects
- UI interaction sounds
- Transition sounds
- Emphasis sounds
- Brand sounds

### Voiceover
- When present vs absent
- Tone and pace patterns
- Script structure patterns

## 5. Pacing & Editing Framework

### Shot Duration Patterns
- Average scene length by video type
- Pacing curves (energy over time)
- Cut frequency patterns

### Rhythm Formulas
- "Problem-Solution" rhythm
- "Feature cascade" rhythm
- "Story arc" rhythm
- Name and describe each distinct pacing pattern

### Video Length by Category
- Product demos
- Founder-led videos
- Brand announcements
- Feature explainers

## 6. Storytelling Templates

### The FlashMotion Narrative Structures
Identify and name each distinct story structure. For each:
- Name (e.g., "Pain-Solution-Proof", "Feature Tour", "Founder Story")
- How many videos use it
- Section breakdown with timing
- Example video(s)

### Hook Patterns (First 3 Seconds)
Catalog every hook technique with frequency

### CTA Patterns
How do videos end? Catalog all patterns

### Social Proof Integration
Where and how credibility is established

## 7. Remotion Implementation Recipes

For the TOP 20 most impactful techniques across all videos, provide:
- Technique name
- Visual description
- Which videos use it
- Conceptual Remotion implementation (React component structure, key interpolation patterns, spring configs)
- When to use this technique

## 8. Style Taxonomy

### Video Categories & Their Recipes
Group the 78 videos into style categories. For each category:
- Category name and description
- Videos in this category
- Defining visual characteristics
- Typical duration
- Common techniques
- When to use this style

## 9. Quality Scorecard

### Top 10 Videos (with reasons)
The absolute best videos and what makes each exceptional

### Common Quality Markers
What separates a 9/10 from a 7/10

### Common Pitfalls
Any patterns that didn't work as well

## 10. Quick Reference: Technique Frequency Table

A table showing each major technique and how many of the 78 videos use it, sorted by frequency. This helps prioritize which techniques to learn first.

Be extremely detailed, specific, and actionable. Use exact color values when identifiable. Name specific animation timings. This guide should enable someone to recreate the FlashMotion style from scratch.` },
      ],
    }],
  });

  const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("No synthesis returned");

  // Ensure output dir exists
  const outDir = "/Users/ysnows/Documents/video-maker/skills/flashmotion-style";
  if (!existsSync(outDir)) {
    const { mkdirSync } = await import("fs");
    mkdirSync(outDir, { recursive: true });
  }

  writeFileSync(OUTPUT_PATH, text);
  console.log(`\nSynthesis written to ${OUTPUT_PATH}`);
  console.log(`Length: ${(text.length / 1024).toFixed(0)} KB`);
}

main().catch(err => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
