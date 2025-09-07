# Run List Dictation V2 — Release Notes

Date: 2025-09-07

Summary
- Live dictation in Run the list now mirrors the smooth behavior of standard notes:
  - Progressive interim insertion at caret
  - Finalization replaces only the interim segment
  - Caret preserved, leading-space safeguards
  - Immediate save on finalization (Alt release) and on patient switch
  - Finalize-before collapse/archive, and on window blur
  - Visual mic overlay near caret (listening/processing states)

Usage
- Enable flag (default on in development): `VITE_RUNLIST_DICTATION_V2=1`
- Optional debug logs: `VITE_RUNLIST_DICTATION_DEBUG=1`

Key behaviors
- Alt press to start dictation in the currently focused textarea; release to finalize and save.
- Clicking Live focuses the patient’s note and starts dictation.
- Switching focus to another patient finalizes and saves the previous note, then continues in the new one.
- Debounced saves during interim; immediate saves on finalization/switch.
- Overlay near caret shows audio level and status.

Edge cases handled
- Collapse/archive while dictating: finalize and save first.
- Window blur/tab hidden: finalize and save.
- Optimistic locking for saves; on conflict, toast + refetch.

QA checklist
- Dictation targets only the focused run-list textarea (no bleed).
- Interim progressive typing at caret; final replaces interim.
- Caret can move mid-dictation; new words follow the caret.
- Finalization and immediate save on Alt release and on patient switch.
- Collapse/archive and window blur finalize and save.

Rollback
- Set `VITE_RUNLIST_DICTATION_V2=0` to restore the previous behavior.

