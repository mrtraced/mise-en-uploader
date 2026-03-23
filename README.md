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

### 1. Install & run
```bash
npm install
npm run dev
```
Then open [http://localhost:5173](http://localhost:5173) in your browser.

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
