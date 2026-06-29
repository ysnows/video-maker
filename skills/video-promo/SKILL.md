# Video Promo Production Workflow

One Remotion project, one composition per feature. Each feature lives in
`public/{feature}/` (source media + narration) and `src/features/{feature}.tsx`
(composition code).

## Project Structure

```
distribution/marketing/video/
├── package.json                # npm run render:{feature}
├── src/
│   ├── index.ts                # registerRoot
│   ├── Root.tsx                # All compositions
│   ├── shared/
│   │   ├── LogoCard.tsx        # Enconvo "Encore" logo card ending
│   │   └── SubtitleBar.tsx     # Fade-in/out subtitle pill overlay
│   └── features/
│       └── {feature}.tsx       # Per-feature composition
├── public/
│   ├── logo.png                # Shared Enconvo logo
│   └── {feature}/
│       ├── source.mp4          # Raw screen recording (always renamed)
│       ├── subtitles.srt       # Reference SRT
│       └── narr_01..04.wav     # TTS narration segments
└── out/
    └── {feature}.mp4           # Rendered output
```

## Adding a New Feature

### 1. Prepare source video

Copy the raw screen recording into the feature directory and rename it:

```bash
mkdir -p public/{feature}
cp "/path/to/Original Name.mp4" public/{feature}/source.mp4
```

### 2. Analyze the video

Extract keyframes to understand timing:

```bash
ffmpeg -i public/{feature}/source.mp4 -vf "fps=1" -q:v 2 /tmp/frames/frame_%03d.jpg
```

Read frames to map what happens at each second.

### 3. Write narration script

Write 3-4 short segments that match the video timeline. Each segment is a
single sentence or two, timed to appear when the corresponding action is
on screen. Style: concise, present tense, product-demo register.

The last segment always ends with:
`"Enconvo — your AI productivity assistant."`

### 4. Generate TTS

Use the local Enconvo TTS API (Gemini male voice — Charon):

```bash
curl -X POST http://localhost:54535/tts/gemini_tts/generate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Narration text here.",
    "voice": "Charon",
    "output_dir": "public/{feature}",
    "file_name": "narr_01"
  }'
```

Repeat for narr_02, narr_03, narr_04. Then check durations:

```bash
for f in public/{feature}/narr_*.wav; do
  echo "$(basename $f): $(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$f")s"
done
```

### 5. Create SRT subtitles

Write `public/{feature}/subtitles.srt` with timings matched to TTS durations.
Format: two lines per subtitle, timed to the narration start + duration.

### 6. Create composition

Create `src/features/{feature}.tsx`. Follow the pattern in existing features:

- Import shared `LogoCard` and `SubtitleBar`
- Define `SUBTITLES` array with `{start, end, line1, line2}`
- Export `VIDEO_SECONDS`, `LOGO_SECONDS`, `TOTAL_SECONDS`
- Render: `OffthreadVideo` + `SubtitleBar` overlay → fade → `LogoCard`
- Audio: one `<Sequence>` + `<Audio>` per narration segment

### 7. Register composition

Add the composition to `src/Root.tsx`:

```tsx
import { NewFeature, TOTAL_SECONDS as NEW_TOTAL } from "./features/{feature}";

<Composition
  id="NewFeaturePromo"
  component={NewFeature}
  durationInFrames={Math.round(NEW_TOTAL * FPS)}
  fps={FPS}
  width={1920}
  height={1080}
/>
```

Add render script to `package.json`:

```json
"render:{feature}": "remotion render src/index.ts NewFeaturePromo out/{feature}.mp4"
```

### 8. Preview and render

```bash
npm run studio              # Preview in browser
npm run render:{feature}    # Render to out/{feature}.mp4
```

### 9. Verify

```bash
ffprobe -v quiet -show_entries format=duration,size -of csv=p=0 out/{feature}.mp4
```

## Shared Components

### LogoCard
Enconvo logo + tagline with fade-in animation. Used as the "Encore" ending
for all promo videos. Takes `startFrame` prop.

### SubtitleBar
Two-line subtitle pill at bottom of screen with 0.3s fade in/out.
Takes `time` (seconds) and `subtitles` array. Reused across all features.

## Remotion Quick Reference

### Series — auto-sequential Sequences

```tsx
<Series>
  <Series.Sequence durationInFrames={90}><Intro /></Series.Sequence>
  <Series.Sequence durationInFrames={120}><Main /></Series.Sequence>
</Series>
```

### Centralized timing object

```tsx
const FPS = 60;
const T = {
  intro:    { start: 0,         dur: 3 * FPS },
  features: { start: 3 * FPS,   dur: 5 * FPS },
  logo:     { start: 8 * FPS,   dur: 5 * FPS },
};
```

### Advanced Sequence props

| Prop | Purpose |
|------|---------|
| `trimBefore` | Skip initial frames of child timeline |
| `freeze` | Freeze children at a specific frame |
| `premountFor` | Mount N frames before `from` for preloading |
| `postmountFor` | Keep mounted N frames after duration ends |

### OffthreadVideo vs Video

Default to `<OffthreadVideo>` for rendering, `<Video>` for Player/preview.
Hybrid: check `useRemotionEnvironment().isRendering`.

### @remotion/captions — TikTok-style

`createTikTokStyleCaptions({ captions, combineTokensWithinMilliseconds: 1200 })`
returns pages with per-token timing for word highlighting.

### Reusable components to consider

- **LowerThird** — name/title overlay with spring slide-in
- **ProgressBar** — timeline indicator at bottom
- **AnimatedCounter** — interpolated number display
- **WordReveal** — word-by-word fade+slide with stagger

### delayRender pattern

```tsx
const { delayRender, continueRender, cancelRender } = useDelayRender();
const [handle] = useState(() => delayRender("Loading..."));
useEffect(() => {
  loadData().then(() => continueRender(handle)).catch(cancelRender);
}, [handle]);
```

### Prefetching

```tsx
const { waitUntilDone } = prefetch("https://example.com/video.mp4");
await waitUntilDone();
```

## Conventions

- Source videos are always renamed to `source.mp4` before use
- Narration files are always `narr_01.wav` through `narr_04.wav`
- All promos end with a 5-second LogoCard ("Encore" ending)
- Output resolution: 1920×1080 @ 60fps
- TTS voice: Gemini Charon (male, informative) unless specified otherwise
- Closing tagline: "Enconvo — your AI productivity assistant."

---

# Video Analysis Techniques

Adapted from bsisduck/video-analyzer-skill. Use when analyzing source video
for promo creation or any video understanding task.

## Adaptive Frame Extraction Tiers

| Tier | Duration | FPS | Max Frames |
|------|----------|-----|------------|
| Short | < 1 min | 2 fps | 200 |
| Medium | 1–3 min | 1 fps | 200 |
| Long | 3–10 min | 0.1 fps (1/10s) | 200 |
| Extended | 10+ min | 0.05 fps (1/20s) | 60 |

## Smart Stream Detection

Skip social media thumbnail streams (MJPEG with 0/0 framerate):

```bash
STREAM_INDEX=$(ffprobe -v error -show_streams -of json "$INPUT" | python3 -c "
import sys, json
d = json.load(sys.stdin)
for s in d.get('streams', []):
    if s.get('codec_type') == 'video':
        if s.get('disposition', {}).get('attached_pic', 0) == 1: continue
        if s.get('codec_name') == 'mjpeg' and s.get('avg_frame_rate') == '0/0': continue
        print(s.get('index', 0)); break
")
```

## Timestamp-Burned Frames

```bash
ffmpeg -i source.mp4 -map 0:$STREAM_INDEX \
  -vf "fps=1,scale='min(1280,iw)':-2,drawtext=text='%{pts\:hms}':x=10:y=10:fontsize=28:fontcolor=white:borderw=2:bordercolor=black" \
  -q:v 2 -frames:v 200 /tmp/frames/frame_%05d.jpg
```

## Montage Grid Creation

```bash
# 4x4 landscape (16 per image) / 3x5 portrait (15 per image)
ffmpeg -i source.mp4 \
  -vf "fps=1,scale='min(640,iw)':-2,drawtext=text='%{pts\:hms}':x=5:y=5:fontsize=16:fontcolor=white:borderw=1:bordercolor=black,tile=4x4" \
  -q:v 2 /tmp/grids/grid_%03d.jpg
```

## Scene Change Detection

```bash
ffmpeg -i source.mp4 -vf "select='gt(scene,0.3)',showinfo" \
  -f null - 2>&1 | grep 'pts_time' | sed 's/.*pts_time:\([0-9.]*\).*/\1/' > scenes.txt
```

Thresholds: `0.1` (static/slides), `0.3` (typical), `0.4` (fast-action).

## Key Frame Extraction at Scene Boundaries

```bash
while IFS= read -r TS; do
  ffmpeg -i source.mp4 -ss "$TS" -frames:v 1 \
    -vf "scale='min(1280,iw)':-2" -q:v 1 -update 1 "key_frames/scene_${TS}s.jpg"
done < scenes.txt
```

`-update 1` required for single-frame extraction with decimal filenames.

## Audio for Whisper

```bash
ffmpeg -i source.mp4 -vn -acodec pcm_s16le -ar 16000 -ac 1 audio.wav
ffmpeg -i audio.wav -af silencedetect=noise=-30dB:d=0.5 -f null - 2>&1 | grep silence
```

See `~/.claude/skills/video-promo/SKILL.md` for full details and parallel
analysis pattern.

---

# Remotion Best Practices & Reference

## Sequence & Timing Patterns

### Series — auto-sequential Sequences

`<Series>` auto-calculates `from` offsets so you don't do the math:

```tsx
import { Series } from "remotion";
<Series>
  <Series.Sequence durationInFrames={90}><Intro /></Series.Sequence>
  <Series.Sequence durationInFrames={120}><Main /></Series.Sequence>
  <Series.Sequence durationInFrames={90}><Outro /></Series.Sequence>
</Series>
```

### Centralized timing object

```tsx
const FPS = 60;
const T = {
  intro:    { start: 0,         dur: 3 * FPS },
  features: { start: 3 * FPS,   dur: 5 * FPS },
  demo:     { start: 8 * FPS,   dur: 4 * FPS },
  logo:     { start: 12 * FPS,  dur: 5 * FPS },
};
const TOTAL = Math.max(...Object.values(T).map(t => t.start + t.dur));
```

### Advanced Sequence props

| Prop | Purpose |
|------|---------|
| `trimBefore` | Skip initial frames of child timeline (v4.0.482+) |
| `freeze` | Freeze children at a specific frame (v4.0.476+) |
| `premountFor` | Mount N frames before `from` for preloading (v4.0.140+) |
| `postmountFor` | Keep mounted N frames after duration ends (v4.0.340+) |

## Animation

### interpolate() — the workhorse

Maps input ranges to output ranges. Use for nearly all frame-driven animations.

```tsx
const opacity = interpolate(frame, [0, 20], [0, 1], {
  extrapolateRight: "clamp",
});
```

**Extrapolation modes:** `extend` (default, continues curve), `clamp` (caps at
boundary — use this), `wrap` (loops), `identity` (returns input as-is).

**Always clamp.** Set `extrapolateRight: "clamp"` (and `extrapolateLeft: "clamp"`)
to prevent values overshooting your intended range.

**Multi-keyframe fades** — fade in, hold, fade out:

```tsx
const opacity = interpolate(
  frame,
  [0, 20, durationInFrames - 20, durationInFrames],
  [0, 1, 1, 0],
);
```

**Easing** — add `Easing` for non-linear motion:

```tsx
import { Easing } from "remotion";
interpolate(frame, [0, 60], [0, 1], {
  easing: Easing.bezier(0.8, 0.22, 0.96, 0.65),
});
```

Per-segment easing (array, length = inputRange.length - 1):

```tsx
interpolate(frame, [0, 100, 200], [0, 1, 2], {
  easing: [Easing.out(Easing.cubic), Easing.in(Easing.cubic)],
});
```

**CSS transform interpolation** (v4.0.472+ — string-based):

```tsx
<div style={{
  scale: interpolate(frame, [0, 30], ['1', '2 3']),
  translate: interpolate(frame, [0, 30], ['0px 0px', '100px 50px']),
  rotate: interpolate(frame, [0, 30], ['0deg', '90deg']),
}} />
```

Available easing functions: `Easing.linear`, `ease`, `quad`, `cubic`, `sin`,
`circle`, `exp`, `bounce`, `bezier(x1,y1,x2,y2)`, `in(fn)`, `out(fn)`,
`inOut(fn)`, `spring(config)`.

**Posterize** — step-quantize for stylistic effects:

```tsx
interpolate(frame, [0, 60], [0, 1], { posterize: 3 });
```

### spring() — physics-based motion

Creates natural animations with overshoot/bounce. Returns 0→1 by default.

```tsx
const scale = spring({ frame, fps, config: { damping: 12, stiffness: 200 } });
```

**Config presets:**

| Preset | damping | stiffness | mass | Character |
|--------|---------|-----------|------|-----------|
| Snappy | 20 | 200 | 0.5 | Fast, minimal bounce |
| Bouncy | 8 | 100 | 1 | Playful overshoot |
| Elegant | 15 | 50 | 2 | Slow, weighty |
| Pop | 12 | 300 | 0.8 | Quick burst, slight bounce |

**Duration-based spring** — stretch to exact length:

```tsx
spring({ frame, fps, durationInFrames: 40 });
```

**Delay and reverse:**

```tsx
spring({ frame, fps, delay: 15, reverse: true });
```

**Drive interpolate with spring:**

```tsx
const driver = spring({ frame, fps });
const marginLeft = interpolate(driver, [0, 1], [0, 200]);
```

### Key animation rules

- **Never use CSS transitions or Tailwind animation classes** — they don't render
  correctly in Remotion. All animation must be driven by `useCurrentFrame()`.
- **Prefer `interpolate()` over `spring()`** unless you specifically want
  physics-based bounce/overshoot.
- Keep `interpolate()` calls inline in style props with individual CSS properties
  rather than composed transform strings.

## Text Animation Patterns

**Typewriter effect** — always use string slicing, never per-character opacity:

```tsx
const chars = Math.floor(frame / 2);
const displayed = fullText.slice(0, chars);
```

Per-character opacity creates invisible characters that still occupy space,
causing cursor misalignment.

**Blinking cursor** — smooth fade, not hard on/off:

```tsx
const cursorOpacity = interpolate(
  frame % 30, [0, 10, 20, 30], [1, 1, 0, 0]
);
```

**Staggered list items** — spring with per-item delay:

```tsx
items.map((item, i) => {
  const s = spring({ frame, fps, delay: i * 5 });
  return <div style={{ opacity: s, transform: `translateY(${(1 - s) * 20}px)` }}>{item}</div>;
});
```

**Word-by-word reveal** — opacity + translateY per word:

```tsx
const words = text.split(" ");
{words.map((word, i) => {
  const wordStart = i * 8;
  const opacity = interpolate(frame, [wordStart, wordStart + 10], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [wordStart, wordStart + 10], [20, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return <span style={{ opacity, transform: `translateY(${y}px)` }}>{word}</span>;
})}
```

**Counter/number animation:**

```tsx
const count = Math.round(interpolate(frame, [0, 60], [0, targetNumber]));
```

## OffthreadVideo vs Video

| Aspect | OffthreadVideo | Video (@remotion/media) |
|--------|---------------|------------------------|
| Engine | Rust frame extractor → `<Img>` | WebCodecs → `<canvas>` |
| Speed | Fast | Fastest |
| Frame accuracy | Perfect | Perfect |
| ProRes/AC3/AV1 | Yes | No (falls back) |
| Loop | No | Yes |
| CORS required | No | Yes |

Default to `<OffthreadVideo>` for rendering, `<Video>` for Player/preview.
Hybrid: check `useRemotionEnvironment().isRendering`.

## Transitions (@remotion/transitions)

Use `<TransitionSeries>` for scene-to-scene animation:

```tsx
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";

<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={40}>
    <SceneA />
  </TransitionSeries.Sequence>
  <TransitionSeries.Transition
    presentation={slide()}
    timing={linearTiming({ durationInFrames: 20 })}
  />
  <TransitionSeries.Sequence durationInFrames={60}>
    <SceneB />
  </TransitionSeries.Sequence>
</TransitionSeries>
```

**Built-in presentations:** `fade`, `slide`, `wipe`, `flip`, `clockWipe`.

**Key rules:**
- Transitions shorten total duration: `total = seq1 + seq2 - transition`
- 15-25 frames is usually right; longer feels sluggish
- Stick to 1-2 transition styles per video for consistency
- Use `<TransitionSeries.Overlay>` for effects (light leaks, flashes) that
  don't shorten the timeline
- Use `AbsoluteFill` for custom crossfades so scenes overlap

## Audio & Sync

**Use Remotion's `<Audio>` and `<OffthreadAudio>`** — never native `<audio>`.

**Timing with Sequence:**

```tsx
<Sequence from={startFrame}>
  <Audio src={staticFile("feature/narr_01.wav")} />
</Sequence>
```

**Volume control:**

```tsx
<Audio src={src} volume={(f) => interpolate(f, [0, 10], [0, 1], { extrapolateRight: "clamp" })} />
```

**Audio sync checklist:**
- If audio is 44.1kHz and video > 5 minutes, re-encode audio to 48kHz CBR
- Always do a 10-second test render and check sync at start, middle, and end
- Acceptable sync error: < 30ms
- Subtitles should display for 3-7 seconds each
- Volume > 1 doesn't work on CORS-disabled assets unless `crossOrigin="anonymous"` is set

**Word-level sync** (TTS with timestamps):

```tsx
const currentTime = frame / fps;
const activeWord = words.find(w => currentTime >= w.start && currentTime <= w.end);
```

### @remotion/captions — TikTok-style word highlighting

```tsx
import { createTikTokStyleCaptions } from "@remotion/captions";
const { pages } = createTikTokStyleCaptions({
  captions, combineTokensWithinMilliseconds: 1200,
});
```

Renders pages as Sequences with per-token active-word highlighting.
Load captions data with `delayRender()` + `continueRender()` pattern.

## Assets & Fonts

**Always use `staticFile()`** for public/ assets:

```tsx
<OffthreadVideo src={staticFile("feature/source.mp4")} />
<Img src={staticFile("logo.png")} />
```

**Use Remotion media components** (`<Img>`, `<Video>`, `<Audio>`) instead of
native HTML elements — they guarantee assets are loaded before each frame capture.

**Font loading** — call at module top level, never inside render:

```tsx
import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

const { fontFamily } = loadFont({
  family: "MyFont",
  url: staticFile("fonts/MyFont.woff2"),
  weight: "400",
});
```

Google Fonts: use `@remotion/google-fonts` — auto-integrates with render pipeline.

**staticFile() handles special characters** — filenames with `#`, `?`, or `&`
are auto-encoded.

## Reusable Component Patterns

**Lower Third** — name/title overlay with spring slide-in.
**Progress Bar** — video timeline indicator at bottom.
**AnimatedCounter** — interpolated number display.
**Dynamic text sizing** — `@remotion/layout-utils` `fillTextBox()`.

See `~/.claude/skills/video-promo/SKILL.md` for full implementations.

## Performance Optimization

### delayRender / continueRender

```tsx
const { delayRender, continueRender, cancelRender } = useDelayRender();
const [handle] = useState(() => delayRender("Loading font"));
useEffect(() => {
  loadFont().then(() => continueRender(handle)).catch(cancelRender);
}, [handle]);
```

### Prefetching

```tsx
const { waitUntilDone } = prefetch("https://example.com/video.mp4");
await waitUntilDone();
```

Use `preloadVideo()` / `preloadAudio()` from `@remotion/preload` for Player.

### Rendering speed

- **Benchmark concurrency:** `npx remotion benchmark` — find the sweet spot;
  too high or too low both hurt.
- **Use JPEG over PNG** unless you need transparency.
- **Avoid GPU-heavy CSS in cloud renders:** `box-shadow`, `text-shadow`,
  `filter: blur()`, gradients — replace with precomputed images if rendering
  on CPU-only instances.
- **Use `freeze()`** on components that stop animating after a certain frame.
- **Memoize** expensive computations with `useMemo()` and `useCallback()`.
- **Reduce resolution** for previews with `--scale=0.5`.
- **Log slow frames:** render with `--log=verbose`.
- **Minimize data fetching** — cache in localStorage if needed.

### Codec selection for speed vs quality

| Codec | Speed | File Size | Browser | Use Case |
|-------|-------|-----------|---------|----------|
| H.264 | Very fast | Medium | Very good | Default for web/social |
| H.265 | Fast | Medium | Poor | Local playback, archive |
| VP8 | Slow | Small | OK | WebM fallback |
| VP9 | Very slow | Very small | OK | Size-critical WebM |
| AV1 | Very slow | Very small | Growing | Future-proof small files |
| ProRes | Fast | Large | None | Professional editing |

### CRF (quality) guidelines

| Codec | Range | Default | Web | High Quality | Archive |
|-------|-------|---------|-----|--------------|---------|
| H.264 | 1-51 | 18 | 21-24 | 15-17 | 15 |
| H.265 | 0-51 | 23 | 24-28 | 18-20 | 15 |
| VP8 | 4-63 | 9 | 12-15 | 7-9 | 4 |
| VP9 | 0-63 | 28 | 30-35 | 20-25 | 15 |
| AV1 | 0-63 | 30 | 32-38 | 22-28 | 15 |

Lower number = better quality, larger file.

**ProRes profiles** (no CRF, use profiles):
`proxy` (45 Mbps) → `light` (102) → `standard` (147) → `hq` (220) → `4444` (330, alpha) → `4444-xq` (500, alpha)

**Hardware acceleration** (v4.0.228+): incompatible with CRF; use `--video-bitrate` instead.

**Quality tips:**
- Use `bt709` color space for accurate colors (default in v5.0+)
- For Retina displays, render at 2x with `--scale=2` or use 4K resolution
- JPEG quality default is 80; increase for stills with `--jpeg-quality`
- GIFs are limited to 256 colors — avoid for quality-sensitive output

## Common Pitfalls

### Flickering
Caused by animations not driven by `useCurrentFrame()`. CSS transitions,
`setTimeout`, `requestAnimationFrame`, and Tailwind animation classes all
produce flickering. Every animated value must derive from `frame`.

### Timeout (delayRender)
Every `delayRender()` must be paired with `continueRender()`. Add descriptive
labels for debugging:

```tsx
const handle = delayRender("Loading font from CDN");
// ... after load:
continueRender(handle);
```

Default timeout is 30 seconds. Increase with `--timeout` for large assets.

### Concurrency too high
High `--concurrency` can prevent `<Html5Video>` from loading. Use
`npx remotion benchmark` to find the right value.

### Large video downloads
`<OffthreadVideo>` downloads the full file before processing. For large source
videos, increase `--timeout` or consider trimming.

### Component isolation debugging
If a render fails, remove components until the video is empty to find the
culprit. Use `--log=verbose` and `--concurrency=1` for clear logs.

### WebM is slow
VP8/VP9 encoding is significantly slower than H.264. Don't use WebM unless
you specifically need it.

## Composition Patterns

### Sequence-based layout

```tsx
<AbsoluteFill>
  <Sequence from={0} durationInFrames={videoFrames}>
    <OffthreadVideo src={staticFile("feature/source.mp4")} />
    <SubtitleBar time={frame / fps} subtitles={SUBTITLES} />
  </Sequence>
  <Sequence from={videoFrames}>
    <LogoCard startFrame={videoFrames} />
  </Sequence>
</AbsoluteFill>
```

### Crossfade between scenes

```tsx
const fadeProgress = interpolate(frame, [transitionStart, transitionEnd], [0, 1], {
  extrapolateLeft: "clamp", extrapolateRight: "clamp",
});
<AbsoluteFill style={{ opacity: 1 - fadeProgress }}><SceneA /></AbsoluteFill>
<AbsoluteFill style={{ opacity: fadeProgress }}><SceneB /></AbsoluteFill>
```

### Dynamic metadata with calculateMetadata

```tsx
<Composition
  id="MyComp"
  component={MyComp}
  calculateMetadata={async () => ({
    durationInFrames: await computeDuration(),
    fps: 60,
    width: 1920,
    height: 1080,
  })}
/>
```

## Video Style Recipes

### Dark SaaS / AI Product Style
Black background + purple/blue glow + kinetic typography + gradient CTA +
floating UI mockups. Use radial gradient glow (`#7c3aed`), word-by-word
spring reveal, subtle parallax on screenshots, gradient border CTA card.

### Black & White Text Opener
Black background + white typewriter text + typing sound sync. String slice
at 2 chars/frame, monospace font, `<Audio>` with `startFrom` matching text
start. Hard cut to next scene (no transition).

### QC — Frame-by-Frame Comparison
Extract frames at 2fps from reference and output, compare with PSNR/SSIM:
`ffmpeg -i out.mp4 -i ref.mp4 -filter_complex "[0][1]ssim" -f null -`

## Data-Driven & Parameterized Videos

### Parameterized rendering via CLI

```bash
remotion render MyComp out.mp4 --props='{"title":"Hello","items":["a","b"]}'
```

### Dynamic composition from data

```tsx
<Composition
  id="DataVideo"
  component={DataVideo}
  calculateMetadata={async ({ props }) => {
    const data = await fetch(props.dataUrl).then(r => r.json());
    return {
      durationInFrames: data.items.length * 90,
      props: { ...props, items: data.items },
    };
  }}
/>
```

### Lambda / cloud rendering

AWS Lambda-based serverless rendering: `deployFunction()` → `deploySite()` →
`renderMediaOnLambda()`. Limits: ~80 min at Full HD, ~5GB output.

## Remotion Resources

### Official

- Docs: https://www.remotion.dev/docs
- API reference: https://www.remotion.dev/docs/api
- Performance tips: https://www.remotion.dev/docs/performance
- Encoding guide: https://www.remotion.dev/docs/encoding
- Quality guide: https://www.remotion.dev/docs/quality
- Transitions: https://www.remotion.dev/docs/transitioning
- Resources list: https://www.remotion.dev/docs/resources
- Showcase: https://www.remotion.dev/showcase
- Blog: https://www.remotion.dev/learn
- Timing editor: https://www.remotion.dev/timing-editor

### Templates

- Hello World: https://github.com/remotion-dev/template-helloworld
- Prompt-to-Video: https://github.com/remotion-dev/template-prompt-to-video
- Prompt-to-Motion-Graphics SaaS: https://github.com/remotion-dev/template-prompt-to-motion-graphics-saas
- Music Visualization: https://github.com/remotion-dev/template-music-visualization
- Three.js: https://github.com/remotion-dev/template-three
- TTS (Azure): https://github.com/FelippeChemello/Remotion-TTS-Example
- TTS (Google): https://github.com/thecmdrunner/remotion-gtts-template
- Audiogram: https://github.com/remotion-dev/template-audiogram
- Docker Build & Render: https://github.com/scotthavird/remotion-docker-template
- React Router 7 SaaS: https://github.com/remotion-dev/template-react-router
- Next.js SaaS: https://github.com/remotion-dev/template-next
- Monorepo: https://github.com/Takamasa045/remotion-studio-monorepo

### Component Libraries

- Onda: https://onda.video/ — 70 components, 18 transitions
- RemotionUI: https://remotionui.com — production-ready motion components
- Remocn: https://remocn.dev — adjustable components
- Remotion Bits: https://remotion-bits.dev/ — animation utilities
- ClippKit: https://www.clippkit.com/ — free components

### Animation Helpers

- Remotion Animated: https://www.remotion-animated.dev/
- remotion-time: https://github.com/fwextensions/remotion-time (use seconds as time unit)
- remotion-animate-text: https://github.com/pskd73/remotion-animate-text
- remotion-subtitle: https://github.com/ahgsql/remotion-subtitles

### Notable Projects (study for patterns)

- GitHub Unwrapped: https://github.com/remotion-dev/github-unwrapped — data-driven personalized video at scale
- Podcast Maker: https://github.com/FelippeChemello/podcast-maker — audio-to-video
- Stargazer: https://github.com/pomber/stargazer — repo star history animation
- Mockoops: https://github.com/Just-Moh-it/Mockoops — device mockup video
- Bar Race Chart: https://github.com/hylarucoder/remotion-bar-race-chart — animated data viz
- Light Leak Transition: https://github.com/remotion-dev/light-leak-example
- Text Morphing: https://github.com/remotion-dev/morph-text
- Text Warping: https://github.com/remotion-dev/text-warping
- Typewriter: https://github.com/remotion-dev/typewriter
- Wavy TikTok Effect: https://github.com/JonnyBurger/wavy-meme
- SwiftClip: https://github.com/zz41354899/SwiftClip — 30 production-ready templates
- DataVids: https://github.com/apsquared/datavids_public — data-driven video generation
- 3D Text: https://github.com/remotion-dev/3d-text
- Glitch Effect: https://github.com/storybynumbers/remotion-glitch-effect
- OpenGL Transitions: https://github.com/remotion-dev/remotion-gl-transitions — GPU-based
- Three.js Particles: https://github.com/JonnyBurger/three-particles

### Web Component & Animation Libraries (usable in Remotion)

Since Remotion renders React in a browser, any web React/CSS library works
inside compositions:

**Kinetics** — https://kinetics.colorion.co/ (GitHub: ckissi/kinetics)
99 spring-physics animations in 3 categories (33 each): Interaction & Input
(Card Resize, Magnetic Button, Drag to Dismiss, etc.), Feedback & State
(Scramble Reveal, Stagger Entrance, Typewriter, etc.), Surface & Motion
(Error Shake, Confetti Burst, Parallax Tilt, etc.). Ships as CSS + React +
AI prompt. Copy-paste, no npm install. Best for: natural UI micro-interactions.

**Transitions.dev** — https://transitions.dev/
20+ copy-paste UI transition effects (CSS + React): state changes (card resize,
number pop-in, icon swap), UI components (modal, panel, tabs, accordion),
interactive (tooltip, badge, 3D tilt), content (skeleton reveal, shimmer text).
Best for: polished state transitions in product demos.

**Bklit** — https://bklit.com/
16 animated chart types with spring physics (Visx + Motion): Area, Bar,
Candlestick, Choropleth, Funnel, Gauge, Heatmap, Line, Pie, Radar, Ring,
Sankey, Scatter + utilities. Composable API. Best for: data-driven videos.

**Motion** — https://motion.dev/ (formerly Framer Motion)
Production-grade React animation library. Key APIs:
- `<motion.div>` — prefix any HTML/SVG tag to unlock animation props
- `animate`, `initial`, `exit` — declarative animation targets
- `whileHover`, `whileTap`, `whileInView` — gesture/scroll-triggered
- `<AnimatePresence>` — animate elements entering/leaving DOM
- `layout` / `layoutId` — animate between layout changes
- `useMotionValue`, `useSpring`, `useTransform` — imperative control
- `useScroll` — scroll-linked animations with hardware acceleration
- Spring physics (default for x/y/scale), tween easing (for opacity)
- Variants + stagger for orchestrated group animations
- Independent transforms (x, y, rotate, scale without wrappers)

Best for: complex UI animations, gesture interactions, layout transitions,
enter/exit animations. Bklit's chart animations are built on Motion.
Note: Motion animations are time-based; in Remotion, drive them with
`useCurrentFrame()` via `useMotionValue` for frame-accurate rendering.

**Termcn** — https://www.termcn.dev/
Terminal UI components (Ink + OpenTUI, shadcn/ui patterns). Best for:
terminal-aesthetic scenes — coding demos, CLI walkthrough animations.

### AI + Remotion Skills

- Official Remotion Skill (for AI agents): https://github.com/remotion-dev/skills
- Resemble AI Remotion Skill: https://github.com/resemble-ai/remotion-resemble-skill
- Remotion Transitions Skill: https://github.com/Ashad001/remotion-transitions
- Video Production Skills: https://github.com/Pluviobyte/video-production-skills — reference-video QC (PSNR/SSIM), dark SaaS style, text opener

### Video Tutorials

- Fireship (quick overview): https://www.youtube.com/watch?v=deg8bOoziaE
- Spotify Wrapped recreation: https://www.youtube.com/watch?v=I-y_5H9-3gk
- Formula 1 Graphics: https://www.youtube.com/watch?v=sA-X0Bw_7Gg
- Timing animations: https://www.youtube.com/watch?v=WigIALCnEvw

### Products Built with Remotion (inspiration)

- Typeframes: https://www.typeframes.com — product demo videos
- ClipPulse: https://www.clippulse.com/ — automated video content
- Frameloop AI: https://www.frameloop.ai/ — AI video generation
- LaunchCut: https://www.launchcut.io — product launch videos
