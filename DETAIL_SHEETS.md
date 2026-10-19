# BERKK weight sheet

## Current flow and files

Home opens the editable weight sheet directly. There is no intermediate detail view or second input modal.

- `src/components/berkk/detail-sheet.tsx`: modal lifecycle, full-height presentation, shared entrance/exit/drag progress and background blur.
- `src/components/berkk/weight-editor.tsx`: toolbar, draft, large picker, optional keyboard input and history section.
- `src/components/berkk/weight-wheel.tsx`: virtualized native scrolling, interval snapping, faded neighbors and accessibility adjustments.
- `src/components/berkk/weight-picker-state.ts`: draft conversion and the 82.4 kg development fallback.
- `src/components/berkk/weight-chart.tsx` and `weight-chart-data.ts`: chart animation and geometry from saved entries only.
- `src/store/body-weight.ts` and `body-weight-state.ts`: Zustand state and AsyncStorage persistence.

The Home card uses the saved current value, otherwise 82.4 kg for development. This fallback is never persisted automatically and never becomes a history point. Draft state is initialized after hydration so an existing user value takes priority.

## Layout and interaction

The full sheet is 94% of the window at most, bounded by the top safe area. It uses a near-black surface, rounded top corners, a drag handle, a down arrow at top left and a light Save button at top right. The original half-height presentation remains available for other details.

The title and today's label sit above two large wheels. The decimal wheel renders the comma as part of each number. The selected row stays centered and fully visible; its neighbors are clipped and fade at the top and bottom. Smaller windows use smaller row heights. History scrolls independently beneath the picker.

Only the toolbar starts a sheet drag in the full presentation. Wheel gestures and history scrolling cannot start dismissal, even at their boundaries. The wheels additionally use native gesture handlers to prevent interruption. Tapping the selected number mounts and focuses a decimal TextInput; there is no TextInput or autofocus when opening the sheet. Valid keyboard input and the wheels share one draft in tenths of kg. Save is disabled while a wheel is moving, for invalid input or while writing to storage.

Close, backdrop, Android Back and drag dismissal discard unsaved changes. Only Save writes. The new editor accepts 0.1–999.9 kg in one-decimal steps. Older history values retain their original precision; an older current value with two decimal places is rounded only in the editor draft.

## Persistence

AsyncStorage key: `berkk-body-weight`.

Envelope: `{ version: 1, state: { currentWeight, entries } }`.

Each entry is `{ date: 'YYYY-MM-DD', weight: number }`. Save builds the day from the device's local year/month/day, replaces any entry for that day and preserves other dates. Both Home and the editor use the same store. Writes update the visible state only after storage succeeds; failures leave the prior data intact. Loading failures block editing and offer a retry. No historical day is assigned to an undated weight.

## Chart and motion

Only persisted entries are plotted. No entries produces a compact empty state. One entry produces one point with its date and weight, without a line. Multiple entries are sorted chronologically and joined with a thin light line. Horizontal spacing follows elapsed calendar days, including gaps. Three subtle grid lines and endpoint dates provide orientation; there is no colored area or card frame.

The existing 340 ms entrance, 240 ms close, projected spring settling and drag-coupled background blur remain. Chart content fades in and rises 10 px with the sheet reveal. A separate shared progress draws the line over 620 ms after a 300 ms delay. Closing cancels that animation; every presentation resets it. Reduced Motion shows the final chart immediately and retains direct finger tracking.

## Checks for this revision

- `npx tsc --noEmit`: pass.
- `npm run test:weight`: 12 tests pass, including local-day replacement, timezone/DST boundaries, data preservation, failures, development fallback, empty/single charts, date spacing and constant weights.
- iOS and Android bundle exports: pass.
- Changed-code lint: clean. Full `npm run lint` still reports the existing `src/hooks/use-color-scheme.web.ts:11` set-state-in-effect error.
- Playwright browser inspection at 390×844 and 320×568, using isolated storage contexts and emulated touch input: direct opening, centered/unclipped numbers, reachable Save, no automatic input focus, keyboard/wheel synchronization, draft cancellation, real saved value precedence, first save, same-day correction and unchanged older entries passed.
- Confirmed the multi-entry line's dash offset decreases to zero, while a single entry has no line. Test chart datasets were seeded only in isolated browser contexts.
- Confirmed a wheel touch drag changes its row while the sheet position remains unchanged. Toolbar dragging moves the sheet and reduces the background blur; a short held drag springs open and a larger drag dismisses.
- Native iPhone/Android keyboard appearance, safe-area rendering and native gesture performance still require a device smoke test. Browser emulation and successful native bundling do not prove these.

## Manual device checks

1. Open Home with no saved weight: 82.4 kg is shown. Open and close the sheet; history and storage remain empty.
2. Scroll both wheels, then close. Reopen: the saved value (or development fallback) is restored.
3. Tap the selected number, type a comma or point value, return to the wheels and verify synchronization. Confirm Save stays reachable above the keyboard.
4. Save the first weight; reopen to see one dated point. Correct it today: exactly one entry remains. Save on another local calendar day: a second point appears.
5. Drag a wheel down at its first value: the sheet must remain still. Drag the toolbar: sheet position and background blur follow the finger.
6. On a small iPhone, verify the entire selected number and Save button are visible, and scroll the history independently. Check Reduce Motion, VoiceOver/TalkBack and Android Back.
