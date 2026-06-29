# Enconvo Local API — Video Production Capabilities

Enconvo exposes TTS, transcription, and image generation via a local HTTP API
on **port 54535**. These endpoints power the video-maker pipeline: generate
narration audio, transcribe footage for subtitles, create thumbnails and
on-screen graphics, and analyze video with Gemini.

Base URL: `http://localhost:54535`

---

## 1  Text-to-Speech (TTS)

### Quick Start — Generate a narration file

```bash
curl -X POST http://localhost:54535/tts/tts \
  -H "Content-Type: application/json" \
  -d '{
    "input_text": "Welcome to Enconvo — your AI productivity companion.",
    "speed": "1.0",
    "output_dir": "/tmp/tts-output",
    "audio_file_name": "narration_01"
  }'
# → { "path": "/tmp/tts-output/narration_01.wav" }
```

### Core Endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /tts/tts` | Convert text → audio file (returns `{ path }`) |
| `POST /tts/play` | Play text aloud with playback control |
| `POST /tts/stream` | Stream TTS for real-time LLM output |
| `POST /tts/list_providers` | List available TTS providers |

### `/tts/tts` Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `input_text` | string | **required** | Text to synthesize |
| `speed` | string | `"1.2"` | Speech speed (`"0.25"` – `"4"`) |
| `output_dir` | string | — | Output directory (absolute path) |
| `audio_file_name` | string | auto | Output filename (no extension) |
| `voice` | string | provider default | Voice name/ID |
| `model` | string | provider default | TTS model |

### `/tts/play` — Playback Control

```bash
# Start playback (blocks until done)
curl -X POST http://localhost:54535/tts/play \
  -d '{"text": "Hello world", "action": "play", "waitForCompletion": true}'

# Pause / Resume / Stop
curl -X POST http://localhost:54535/tts/play -d '{"action": "pause"}'
curl -X POST http://localhost:54535/tts/play -d '{"action": "resume"}'
curl -X POST http://localhost:54535/tts/play -d '{"action": "stop"}'
```

### Provider-Specific Synthesis

Direct access to a specific provider's engine:

```
POST /tts/features/<provider>/create
```

Providers: `edge`, `open_ai`, `gemini`, `elevenlabs`, `microsoft`, `minimax`,
`xai`, `speechify`, `mlx_kokoro`, `mlx_qwen3`, `system`, `straico`, `xiaomi_mimo`

### Edge TTS (Free, No API Key, 300+ Voices)

Best for batch narration — no cost, neural quality.

```bash
# Generate audio
curl -X POST http://localhost:54535/tts/edge_tts/generate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Professional narration for your video.",
    "voice": "en-US-AvaMultilingualNeural",
    "rate": "+0%",
    "output_dir": "/tmp/tts",
    "file_name": "scene_01"
  }'

# List voices (300+ neural voices)
curl -X POST http://localhost:54535/tts/edge_tts/voices -d '{}'

# List languages
curl -X POST http://localhost:54535/tts/edge_tts/languages -d '{}'

# List output formats
curl -X POST http://localhost:54535/tts/edge_tts/formats -d '{}'
```

### Gemini TTS (Multi-Speaker Dialogue)

Supports up to 2 speakers with 30 voice options — ideal for dialogue scripts.

```bash
# Single speaker
curl -X POST http://localhost:54535/tts/gemini_tts/generate \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello from Gemini", "voice": "Zephyr", "model": "gemini-3.1-flash-tts-preview"}'

# Multi-speaker dialogue
curl -X POST http://localhost:54535/tts/gemini_tts/generate_multi_speaker \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Host: Welcome! Guest: Thanks for having me.",
    "speakers": [
      {"speaker": "Host", "voice": "Zephyr"},
      {"speaker": "Guest", "voice": "Puck"}
    ],
    "model": "gemini-3.1-flash-tts-preview"
  }'

# Structured prompt with scene direction
curl -X POST http://localhost:54535/tts/gemini_tts/generate_structured \
  -d '{"text": "...", "voice": "Zephyr"}'
```

### Local Models (Free, Offline, Apple Silicon)

| Provider | Model | Notes |
|----------|-------|-------|
| `mlx_kokoro` | Kokoro 82M | Lightweight, fast |
| `mlx_qwen3` | Qwen3-TTS | Multi-language |

### Provider Summary

| Provider | Cost | Best For |
|----------|------|----------|
| Edge | Free | Batch narration, 300+ voices |
| Gemini | API key / Enconvo plan | Multi-speaker dialogue |
| OpenAI | API key / Enconvo plan | High-quality narration |
| ElevenLabs | API key / Enconvo plan | Voice cloning, emotional range |
| Kokoro (local) | Free | Offline, fast turnaround |
| System (`say`) | Free | Quick preview |

---

## 2  Transcription (Speech-to-Text)

### Quick Start — Transcribe a video

```bash
curl -X POST http://localhost:54535/transcribe/transcribe \
  -H "Content-Type: application/json" \
  -d '{
    "filePaths": ["/path/to/video.mp4"],
    "segment_timestamps": true,
    "word_timestamps": true
  }'
```

### Core Endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /transcribe/transcribe` | Transcribe audio/video files |
| `POST /transcribe/list_providers` | List available STT providers |
| `POST /transcribe/get_default_stt_provider` | Get current default provider |

### `/transcribe/transcribe` Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `filePaths` | string[] | **required** | Audio/video file paths |
| `language` | string | `"auto"` | Language code (e.g. `"en"`, `"zh"`) |
| `word_timestamps` | boolean | `false` | Include per-word timing |
| `segment_timestamps` | boolean | `false` | Include per-segment timing |
| `include_raw` | boolean | `false` | Include raw provider response |

### Response

```json
{
  "provider": "groq-enconvo",
  "providerTitle": "Groq (Enconvo Cloud)",
  "model": "whisper-large-v3-turbo",
  "content": "full transcribed text...",
  "results": [
    {
      "path": "/path/to/file",
      "text": "transcribed text",
      "language": "en",
      "duration": 120.5,
      "confidence": 0.95,
      "segments": [
        { "start": 0.0, "end": 3.2, "text": "Welcome to..." }
      ],
      "words": [
        { "start": 0.0, "end": 0.4, "word": "Welcome" }
      ]
    }
  ]
}
```

### Supported Input Formats

- **Audio**: mp3, wav, ogg, flac, aac, m4a, wma, opus, webm
- **Video**: mp4, avi, mov, wmv, flv, mkv, webm, m4v, ts, mts

Video files automatically have audio extracted before transcription.

### Provider Summary (20 providers)

**Cloud (Enconvo Plan — no API key):**

| Provider | Default Model | Strength |
|----------|---------------|----------|
| Groq | whisper-large-v3-turbo | Fast, accurate |
| OpenAI | gpt-4o-mini-transcribe | High quality |
| Gemini | gemini-3.1-flash-lite | Up to 9.5h audio |
| Soniox | stt-rt-v5 | Real-time |
| ElevenLabs | scribe_v2 | Speaker labels |
| AssemblyAI | — | Summarization |
| Azure | — | Enterprise |
| Volcengine | — | Chinese optimized |

**Local (Apple Silicon, free):**

| Provider | Model | Languages |
|----------|-------|-----------|
| whisper-mlx | Whisper | 99 languages |
| parakeet-mlx | Parakeet TDT 0.6B | 25 European |
| qwen-mlx | Qwen3-ASR | 30 + 22 Chinese dialects |

### Video Production Workflow

```bash
# 1. Transcribe footage for subtitles
curl -X POST http://localhost:54535/transcribe/transcribe \
  -d '{"filePaths":["/project/raw/interview.mp4"],"segment_timestamps":true,"word_timestamps":true}'

# 2. Use segments for SRT/ASS subtitle generation
# 3. Use word timestamps for karaoke-style word highlighting
```

---

## 3  Image Generation

### Quick Start — Generate an image

```bash
curl -X POST http://localhost:54535/image_create/features/open_ai/create \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A futuristic city at sunset, cinematic lighting",
    "size": "1920x1080",
    "quality": "high"
  }'
# → { "paths": ["/path/to/generated.png"], "urls": [...] }
```

### Core Endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /image_create/features/<provider>/create` | Generate or edit images |
| `POST /image_create/list_providers` | List available providers |
| `POST /image_create/models/list` | List all models |
| `POST /image_create/models/<provider>` | List one provider's models |

### Providers

| Provider | Route | Default Model | Cost |
|----------|-------|---------------|------|
| OpenAI (Enconvo) | `open_ai/create` | gpt-image-2 | Enconvo plan |
| Gemini (Enconvo) | `gemini/create` | gemini-3-pro-image | Enconvo plan |
| OpenAI | `open_ai/create` | gpt-image-2 | API key |
| Gemini | `gemini/create` | gemini-3-pro-image | API key |
| xAI | `x_ai/create` | grok-imagine | API key |
| Azure | `azure/create` | FLUX-1.1-pro | API key |
| Together | `together/create` | FLUX.1-schnell-Free | API key (free tier) |

### Common Parameters (all providers)

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `prompt` | string | **required** | Generation prompt |
| `mode` | string | auto | `"generation"` or `"edit"` |
| `reference_images` | string[] | — | File paths/URLs for edit mode |
| `n` | number | `1` | Number of images |
| `output_dir` | string | auto | Output directory |
| `file_name` | string | auto | Output filename |
| `download` | boolean | `true` | Save images locally |

### OpenAI-Specific Parameters

| Param | Values |
|-------|--------|
| `size` | `"1024x1024"`, `"1536x1024"`, `"1024x1536"`, `"1920x1080"`, `"3840x2160"` |
| `quality` | `"auto"`, `"low"`, `"medium"`, `"high"` |
| `background` | `"auto"`, `"transparent"`, `"opaque"` |
| `output_format` | `"png"`, `"jpeg"`, `"webp"` |
| `style` | `"vivid"`, `"natural"` |

### Gemini-Specific Parameters

| Param | Values |
|-------|--------|
| `aspectRatio` | `"1:1"`, `"16:9"`, `"9:16"` |
| `imageSize` | `"1K"`, `"2K"`, `"4K"` |

### Image Editing (any provider)

```bash
# Edit an existing image
curl -X POST http://localhost:54535/image_create/features/open_ai/create \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Add dramatic clouds to the sky",
    "reference_images": ["/path/to/original.png"],
    "mode": "edit"
  }'
```

### Response Format

```json
{
  "paths": ["/local/path/to/image.png"],
  "urls": ["https://..."],
  "usage": { ... }
}
```

### Video Production Use Cases

```bash
# Generate a thumbnail
curl -X POST http://localhost:54535/image_create/features/open_ai/create \
  -d '{"prompt":"YouTube thumbnail: excited person, bold text AMAZING, bright colors","size":"1920x1080","quality":"high"}'

# Generate background for title card
curl -X POST http://localhost:54535/image_create/features/gemini/create \
  -d '{"prompt":"Abstract gradient background, purple to blue, subtle particles","aspectRatio":"16:9"}'

# Generate overlay graphic
curl -X POST http://localhost:54535/image_create/features/open_ai/create \
  -d '{"prompt":"Subscribe button icon, flat design, red","size":"1024x1024","background":"transparent","output_format":"png"}'
```

---

## 4  Gemini Video Analysis

The video-maker project includes a built-in Gemini video analysis tool at
`src/tools/analyze-video.ts`. It uses `@google/genai` with inline or
File API upload.

### CLI Usage

```bash
# Full analysis
npx tsx src/tools/analyze-video.ts demo.mp4

# Custom prompt
npx tsx src/tools/analyze-video.ts demo.mp4 "Count all scene transitions and describe each"

# Specific model
npx tsx src/tools/analyze-video.ts demo.mp4 "Analyze pacing" gemini-2.5-pro
```

### Programmatic Usage

```typescript
import { analyzeVideo } from "./tools/analyze-video.ts";

const result = await analyzeVideo({
  videoPath: "demo.mp4",
  prompt: "Describe the visual style and color grading",
  model: "gemini-2.5-flash",
});
```

### Generic Gemini Multimodal

```typescript
import { gemini } from "./tools/gemini.ts";

// Analyze video
const analysis = await gemini({
  files: ["footage.mp4"],
  prompt: "List all scenes with timestamps",
});

// Compare two images
const comparison = await gemini({
  files: ["before.png", "after.png"],
  prompt: "What changed between these two frames?",
});

// Text-only
const script = await gemini({
  prompt: "Write a 30-second narration script for a product demo",
});
```

Files under 20 MB use inline base64; larger files auto-upload via File API.

### Default Analysis Prompt

When no prompt is given, the analyzer produces:
1. Overview — topic, duration, resolution
2. Scene Breakdown — timestamps and descriptions
3. Visual Style — color palette, lighting, camera, transitions
4. Audio — music, voiceover, sound effects
5. Text/Graphics — on-screen text, titles, watermarks
6. Pacing & Editing — cut frequency, rhythm
7. Production Quality — professional assessment
8. Suggestions — specific improvements

---

## 5  Combined Pipeline Examples

### Narration Pipeline: Script → TTS → Video

```bash
# 1. Generate narration audio
curl -X POST http://localhost:54535/tts/tts \
  -d '{"input_text":"Enconvo transforms your workflow with AI.","output_dir":"/project/audio","audio_file_name":"intro"}'

# 2. Get audio duration, compose with Remotion
# The returned .wav can be used directly with Remotion's <Audio> component
```

### Subtitle Pipeline: Video → Transcribe → SRT

```bash
# 1. Transcribe with word timestamps
RESULT=$(curl -s -X POST http://localhost:54535/transcribe/transcribe \
  -d '{"filePaths":["/project/raw/footage.mp4"],"word_timestamps":true,"segment_timestamps":true}')

# 2. Extract segments for subtitle generation
echo "$RESULT" | jq '.results[0].segments'
```

### Thumbnail Pipeline: Analyze → Generate

```bash
# 1. Analyze video to understand content
npx tsx src/tools/analyze-video.ts footage.mp4 "Describe the main subject and mood"

# 2. Generate matching thumbnail
curl -X POST http://localhost:54535/image_create/features/open_ai/create \
  -d '{"prompt":"<based on analysis>","size":"1920x1080","quality":"high"}'
```

### Full Production Pipeline

```bash
# 1. Analyze source footage
npx tsx src/tools/analyze-video.ts raw/interview.mp4

# 2. Transcribe for subtitles
curl -X POST http://localhost:54535/transcribe/transcribe \
  -d '{"filePaths":["raw/interview.mp4"],"segment_timestamps":true,"word_timestamps":true}'

# 3. Generate title card background
curl -X POST http://localhost:54535/image_create/features/open_ai/create \
  -d '{"prompt":"Professional title card background","size":"1920x1080","output_dir":"assets/images"}'

# 4. Generate narration for intro/outro
curl -X POST http://localhost:54535/tts/tts \
  -d '{"input_text":"Welcome to our latest feature walkthrough.","output_dir":"assets/audio","audio_file_name":"intro_narration"}'

# 5. Compose everything with Remotion
npm run studio
```
