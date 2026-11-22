# Story design foundation

Branch: story-design-system (based on story-engine-foundation).

## Local preview on Windows 11
Open this updated checkout in VS Code, choose Terminal > New Terminal:

```powershell
cd frontend
npm.cmd ci
npm.cmd run dev
```

Open the Local URL printed by Vite (normally http://localhost:5173).
Keep the terminal open. Stop with Ctrl+C. No Vercel or GitHub connection is needed.
If frontend is already the terminal's current directory, omit cd frontend.
These steps require the updated files from this workspace, not an older local checkout.

## Artwork
- nikita-keys-scene-desktop.webp: user-supplied temporary candidate. Kitchen matches the scenario; daytime-looking lighting requires revision for 22:14. Mobile keeps the entire desktop frame so both faces remain visible. The separately generated mobile candidate is not used.
- paper-sheet-clean.webp: user-supplied decorative paper with HTML text above it.
- No DRAFT or reference screenshots are copied into public/. Vite copies everything in public/ to dist/.

## Components and data
Story scenes, materials and map use a full-window .story-shell with data-story-theme (nikita, liza, ilya). The header and footer share that theme. Quiz, statistics and pilot completion retain their previous presentation; the story conclusion shares the light story theme. Composition width is capped at 1200px with narrower long-form reading. Future stories use presentation.theme and presentation.sceneModes; mixed scenes group adjacent messages without changing source fragment indices. No new scenarios are registered.

SceneArtwork accepts optional mobileSrc. LiveDialogue renders one speaker and text; MonologuePanel handles thoughts; SceneNavigation provides the single Back/Next pair for fragments and stage boundaries; a small shortcut is available when rereading a previously completed scene. MaterialViewer is an inline reader, not a modal; the disclosure is its only close button, and Escape returns focus to it. Material headings are not repeated. Existing material-open gates remain in effect.

State v3 adds currentFragments alongside monotonic revealedFragments. v1/v2 migrate using the last reached position; v3 retains the current position. The storage key and approved contentVersion stay unchanged. Scene ids, source text/order, opened materials, map answers and statistics state remain intact. Complete chats reveal their source fragments together. Browser tab sessionStorage is the only persistence; answers are not transmitted.

## Review
Walk through the full pilot. At Keys, advance, go back and reload: only one dialogue reply should be visible and reached progress should persist. Open and close all three materials, then complete the map/statistics. Review on a physical phone, at 200% zoom, and in Windows browsers. Final lighting/artwork approval remains pending.


## Clean composition update
The outer story card, nested viewer frames and shadows were removed. Long monologues use 20–22px type, a narrow accent and no full-paragraph italics. Production preview is not automatically updated: these local changes need an explicitly authorized push followed by a new Vercel CLI deployment with --target=preview from the previously linked deployment directory. Never use --prod or Promote to Production.

Verified: 16 unit/baseline tests, exact source content checks and 12 Playwright browser tests. Browser coverage includes 360/390/430/1280/1920px, 200% CSS zoom, full-height themes, v1/v2/v3 progress, stage navigation, material close, and removal of the light shell in quiz and statistics. Physical devices and browser-native zoom still require manual review.


Final visual polish: the additional chat has a paper-colored phone-like container, with thoughts outside it. The map completion note uses the same light surface. Story conclusion factors and the final emphasis use the warm story palette. Text, progress state and navigation mechanics are unchanged.
