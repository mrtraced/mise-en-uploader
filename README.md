# Mise en Uploader 🎬

A local web app that helps your AP upload the same podcast video clip to multiple platforms — without the copy-paste chaos.

## What it does

**Collect once. Publish everywhere.**

Instead of remembering each platform's limits and reformatting your content every time, Mise en Uploader lets you enter everything once, then switches into a read-only "publish mode" for each platform — with click-to-copy fields and a direct link to that platform's uploader.

## Platforms supported

| Platform | Max Duration | Max Size | Aspect Ratio |
|---|---|---|---|
| Instagram Reels | 3 min | 4 GB | 9:16 |
| YouTube Shorts | 60 sec | 256 GB | 9:16 |
| TikTok | 10 min (best < 60s) | 4 GB | 9:16 |
| Spotify for Podcasters | 90 sec | 1 GB | 9:16 or 16:9 |
| Facebook Reels | 60–90 sec | 4 GB | 9:16 |

## How to use it

There are two ways to run Mise en Uploader: as a **desktop app** (recommended) or in a browser.

---

### Desktop app (recommended)

The desktop app unlocks features the browser can't provide:
- **Full file paths** — the app can read the actual path of any file you drop in, which is required for the Whisper transcription and for "Reveal in Finder"
- **Whisper AI transcription** — generates SRT captions locally, no account needed
- **No browser security restrictions** — drag & drop works with any file on your disk

#### Prerequisites

- [Node.js](https://nodejs.org) 18 or later

#### Run in development mode

```bash
npm install
npm run electron:dev
```

This starts the Vite dev server and opens the app in an Electron window. Hot-reload works as normal.

#### Build a distributable app

```bash
npm install
npm run electron:build
```

Output is written to `dist-electron/`:

| Platform | Output |
|---|---|
| macOS (Apple Silicon) | `Mise En Uploader-<version>-arm64.dmg` |
| macOS (Intel) | `Mise En Uploader-<version>.dmg` |
| Windows | `Mise En Uploader Setup <version>.exe` |

Open the `.dmg` (Mac) or run the `.exe` installer (Windows), then launch **Mise En Uploader** from your Applications folder or Start menu.

> **macOS note:** On first launch macOS may show a security warning because the app isn't notarized. Right-click (or Control-click) the app and choose **Open** to bypass it once.

---

### Browser (limited)

```bash
npm install
npm run dev
```
Then open [http://localhost:5173](http://localhost:5173) in your browser.

> The browser version cannot read full file paths and Whisper transcription is unavailable.

### 2. Collect mode (📝)
Fill in your video's:
- **Title** — used across all platforms
- **Description / Caption** — will be adapted per platform
- **Hashtags** — type a tag and press Enter or comma to add (no # needed)
- **Video file** — drag & drop or click to upload (preview shown)
- **Thumbnail / Key art** — same

### 3. Publish mode (🚀)
Click **Publish** in the top nav. Pick a platform.

Each platform shows:
- Platform-specific limits (duration, file size, aspect ratio)
- **Click-to-copy fields** — click any field to copy it to your clipboard. Fields are formatted for that platform (e.g. hashtags are `#tag #tag` on Instagram but comma-separated on YouTube)
- **Tips** specific to that platform
- **Open [Platform] Uploader** button — opens the upload page in a new tab

Then paste into the platform's form. Done.

## Notes

- All data stays in your browser — nothing is sent anywhere
- Phase II (direct API uploads) is a future goal
- The hashtag count warning appears when you exceed a platform's recommended max
