# Media Loading Performance Design

## Context

The prototype currently delivers about 3.45 MB on a cold first visit to the
GitHub Pages deployment. The initial meditation video and room background each
account for about 1.4 MB. The five production videos total 7.26 MB, and the
10-second completion video is the largest at 2.69 MB and about 2.14 Mbps.

The deployed server supports byte-range requests and the MP4 files already use
H.264, AAC, 720 x 1280, 24 fps, and fast-start metadata. The media format is
therefore sound. The remaining problems are asset weight and the fact that each
next scene starts loading only when that scene becomes active.

## Goal

Reduce cold-start transfer to 2.0-2.3 MB and remove visible waiting between
media scenes while preserving the current 720p appearance, sound, state flow,
loop behavior, and interaction timing.

## Non-Goals

- Do not redesign the interface or change copy.
- Do not change the state-machine sequence or demonstration timers.
- Do not replace the character, room, reward, or meal artwork.
- Do not introduce a build pipeline, media CDN, service worker, or third-party
  runtime dependency.
- Do not preload every video on first visit.

## Asset Strategy

### Room Background

Convert `assets/room.png` to `assets/room.webp` at its current 762 x 1311
dimensions. Preserve the current crop and color appearance. The WebP must be no
larger than 550 KB. Update the CSS background reference only after a visual
comparison confirms that gradients, edges, and the character area remain
clean.

### Videos

Keep all videos at 720 x 1280, 24 fps, H.264 High profile, `yuv420p`, AAC audio,
and fast-start MP4 layout. Re-encode with a quality-based H.264 setting and
96 kbps AAC audio. Tune CRF per asset instead of forcing one bitrate when a
video needs more detail.

The output budgets are:

| Asset | Current | Maximum output |
| --- | ---: | ---: |
| `video-meditation.mp4` | 1.43 MB | 1.25 MB |
| `video-meditation-complete.mp4` | 2.69 MB | 2.10 MB |
| `video-greeting.mp4` | 0.56 MB | 0.50 MB |
| `video-meal-prep.mp4` | 1.24 MB | 1.10 MB |
| `video-meal-cook.mp4` | 1.33 MB | 1.10 MB |

The five videos must total no more than 6.05 MB. A file that meets its budget
but shows visible banding, blocking, softened character edges, or degraded text
must be re-encoded at higher quality; another asset may compensate so long as
the total remains at or below 6.05 MB.

### Deferred Reward Images

The repeated `reward-bed.png` elements currently cause the 323 KB reward asset
to download on the first screen. Replace eager `src` values with a single
deferred source contract and assign the real source when the `completion`
screen starts. This gives all existing reward image instances the full
completion-video interval to become ready before the reward entrance animation.
Failure to load the image must leave the existing layout stable rather than
blocking the state transition.

The streak image remains eager because the welcome treatment can use it on the
first visit.

## Staged Video Preloading

Keep the visible `#sceneVideo` element and its current `preload="auto"` behavior.
Add one hidden, muted, inline `#scenePreloader` video element dedicated to the
next scene. It must never be visible, audible, focusable, or announced to
assistive technology.

Expose the next-media relationship from `src/media-scene.js` through a small
function that returns the next unique source for a screen:

| Current screen | Background preload |
| --- | --- |
| `recommendation` | none |
| `active` | `video-meditation-complete.mp4` |
| `completion` | `video-greeting.mp4` |
| `reward` | `video-meal-prep.mp4` |
| `reward-settled` | `video-meal-prep.mp4` |
| `meal-prep` | `video-meal-cook.mp4` |
| `demo-time-shift` | `video-meal-cook.mp4` |
| `meal-time` | none |

Start the preload only after the current screen has entered. Do not reload the
preloader when consecutive states point to the same source. Clear its source
when there is no next media. The main player remains the source of truth for
playback and must continue to request and play the canonical asset URL; the
browser cache supplies bytes already warmed by the preloader.

This ordering gives the completion video the full active meditation interval
to load and gives each later video several seconds to load during the preceding
scene without adding those bytes to the initial visit.

## Runtime Behavior

`playCurrentScene` keeps its existing responsibilities: select the current
scene, set mute state, reset playback when required, play after metadata is
available, and retain the current failure class. A separate preload helper owns
only the hidden preloader source and load call.

The render sequence for a screen change is:

1. Render and schedule the new screen.
2. Start or continue the visible scene.
3. Resolve the next unique media source.
4. Warm that source in the hidden preloader without awaiting it.

Preloading must never delay rendering, current playback, timers, reward
animations, or user input.

## Failure Handling

- A preloader error is non-blocking and does not add `media-failed` to the app.
- If the warmed response is unavailable, the visible player falls back to its
  existing normal request when the next screen starts.
- A visible-player error continues to use the existing `media-failed` behavior.
- Missing deferred reward artwork does not prevent reward state transitions.
- Object URLs, Cache Storage, and persistent application caches are not used,
  so there is no new cleanup or versioning lifecycle.

## Testing

### Automated Contracts

- Add next-media mapping tests for every screen, including screens with no
  preload and consecutive screens that share a source.
- Add an HTML contract test for the hidden muted inline preloader.
- Add a runtime contract test that verifies identical next sources are not
  loaded twice and that a missing next source clears the preloader.
- Add an asset-budget test that checks the room image and every production
  video against the individual and total byte limits.
- Preserve all existing state-machine, media-scene, and visual-contract tests.

### Manual Verification

- Compare the room and all re-encoded videos at 375 x 812 and 402 x 874.
- Exercise the complete recommendation-to-meal flow with a cold cache.
- Confirm the Network panel shows only the meditation video on the initial
  screen and requests each later video during its preceding state.
- Confirm no media file is requested more than once in a single flow.
- Confirm sound, looping, countdown, completion handoff, reward animation, and
  meal transition behavior remain unchanged.
- Record a new online HAR after deployment and verify 2.0-2.3 MB cold-start
  transfer. Treat 2.3 MB as the release ceiling.
- Verify online LCP remains below 2.5 seconds on the same test machine and
  connection used for the 2.07-second baseline.

## Acceptance Criteria

- Cold first-screen transfer is at most 2.3 MB on the deployed page.
- Production videos total at most 6.05 MB.
- The completion video is at most 2.10 MB.
- The room background is at most 550 KB.
- No visible blank frame or loading pause occurs in the normal complete flow on
  a stable 4G-class connection.
- Initial load does not request completion, greeting, or meal videos.
- Each next video begins loading only after its preceding screen starts.
- Existing visual presentation, audio behavior, and state transitions remain
  unchanged.
- The full automated test suite passes.
