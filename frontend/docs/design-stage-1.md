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
Story scenes/materials are scoped under .story-design and data-story-theme (nikita, liza, ilya). Future stories use presentation.theme and presentation.sceneModes; mixed scenes group adjacent messages without changing source fragment indices. No new scenarios are registered.

SceneArtwork accepts optional mobileSrc. LiveDialogue renders one speaker and text; MonologuePanel handles thoughts; SceneNavigation moves between source fragments. MaterialViewer is an inline reader, not a modal; close/Escape return focus to its disclosure button. Existing material-open gates remain in effect.

State v3 adds currentFragments alongside monotonic revealedFragments. v1/v2 migrate using the last reached position; v3 retains the current position. The storage key and approved contentVersion stay unchanged. Scene ids, source text/order, opened materials, map answers and statistics state remain intact. Complete chats reveal their source fragments together. Browser tab sessionStorage is the only persistence; answers are not transmitted.

## Review
Walk through the full pilot. At Keys, advance, go back and reload: only one dialogue reply should be visible and reached progress should persist. Open and close all three materials, then complete the map/statistics. Review on a physical phone, at 200% zoom, and in Windows browsers. Final lighting/artwork approval remains pending.
