# Run the list — Quick Start (for clinicians)

This feature helps you round through patients, capture concise pre/post-round updates, and generate a unified note per patient.

Basics
- Open Run the list from the main navigation.
- If it’s your first time today, choose how to carry forward content from yesterday:
  - None, Selected, or All. You can set defaults and edit them later in Settings.
- Add patients with the + button (use PHI-safe aliases only).

Working through patients
- Select a patient on the left. The note editor appears on the right.
- Dictate per patient using AI (recommended):
  - Click the AI mic button to start/stop recording. The note updates as results arrive.
- Status: Use the dropdown (Draft / Pre / Post / Done) to track progress.
- Generate Full SOAP anytime with the Full button.

Carry-forward
- Global defaults are in Settings; you can also set per-patient overrides (CF) in each patient header. These apply to the next day’s cloning (and are copied forward day-to-day).

Reordering & navigation
- Drag-and-drop patients in the left list.
- Keyboard: Use arrow keys and shortcuts where available to navigate and reorder.

Copying
- Copy the current patient’s note or use Copy all to copy the whole list for handoff or documentation.

Privacy & retention
- Use PHI-safe aliases; avoid full names or MRN-like strings. You’ll see warnings when an alias looks risky.
- Notes are retained for a limited period and may be auto-deleted per your retention policy.

Tips
- Keep dictations short — do one patient at a time.
- Use Full SOAP after post-rounds to consolidate into a final note.

Live dictation (Run the list)
- Start: Click into a patient’s note (textarea) to focus it, then hold Alt to dictate. Or click the Live button to focus and start.
- Overlay: A small mic bubble appears near the caret while listening; it shows audio level and Processing… briefly at the end.
- Progressive typing: Text appears at the caret as you speak. You can move the caret during dictation; new words insert at the new position.
- Finalization: Release Alt to finalize. If nothing was captured, a small toast appears. The note is saved immediately.
- Switching patients: Clicking into a different patient finalizes and saves the previous note, then continues dictation in the new one.
- Collapse/Archive: If you collapse or archive while dictating in that patient, the note finalizes and saves first.
- Saving: Notes save on-the-fly (debounced) and on finalization/switch (immediate), with conflict protection.
- AI separation: Alt/Live does transcription only. To generate AI-formatted notes, click the AI button.

