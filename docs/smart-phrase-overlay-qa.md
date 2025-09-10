# Unified Smart Phrase Overlay — Beta QA Checklist

Use this list to validate the new overlay end-to-end. Keep VITE_UNIFIED_SMART_OVERLAY=1 (or enable in Settings → Unified Smart Phrase Overlay) for testing.

Scopes
- Overlay rendering and navigation
- Auto-complete and insertion
- Header chips re-trigger and inline clear
- Nested flows and date selection
- Cancel flows and resilience to text edits

Checklist

1) Triggering and placement
- Type "/<trigger>" to insert an interactive smart phrase
- Overlay anchors near the textarea caret and shows the whole phrase with chips
- Overlay opens with initial focus on the first chip (keyboard ready)

2) Single-select chips
- Navigate with Arrow keys and Tab/Shift+Tab
- Use number hotkeys 1–9 to select quickly
- Enter triggers select from menus; Escape closes menus

3) Date chip
- Open calendar; pick date → inserts YYYY-MM-DD
- Quick picks: Today/Yesterday work and match local timezone

4) Nested options
- Selecting parent reveals child options within the same popover
- ArrowLeft returns to previous level
- Number hotkeys 1–9 select child options
- Selecting a leaf closes the menu and updates the chip

5) Auto-completion and insertion
- When all chips are selected or cleared, overlay auto-closes
- Final text is inserted replacing the template region
- Undo/redo works with the host editor

6) Header integration
- When caret is inside a phrase, the header shows Smart options + chips
- Clicking a chip reopens overlay with previous selections
- Clicking the (x) on a chip clears that slot and updates the note immediately

7) Cancel flows
- Clicking outside the overlay cancels the insertion (no text inserted)
- Pressing Escape closes the overlay and leaves note unchanged
- Reopen overlay to continue and confirm behaviors are consistent

8) Resilience to manual edits
- Edit text inside the inserted region; linkage is removed if irreconcilable
- Edits before/after the region shift offsets but keep linkage
- Reopen only works while the region remains intact

9) i18n and dark mode
- Switch language (en/fr); overlay labels and buttons are localized
- Dark mode styles remain legible and consistent

10) Performance
- Long phrases (20+ chips): typing and opening the overlay remains responsive
- No noticeable frame drops while navigating chips

Reporting
- Collect issues with minimal reproduction steps
- Include phrase trigger, selections, and section context
- Note browser, OS, language, and dark/light mode

