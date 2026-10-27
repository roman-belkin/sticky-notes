# Sticky Notes

A desktop sticky-note board built with Vite, React, and TypeScript. You draw a note, drag it, resize it from the corner, recolor it, and drop it on a trash zone. Note text, color, stacking order, and geometry are stored in `localStorage` through a small async mock. The layout targets 1024×768 and up in current Chrome, Firefox, and Edge.

## Setup and run

```bash
npm install
npm run dev
npm run build
```

`npm run dev` starts the Vite dev server. `npm run build` typechecks with `tsc -b` and writes a production bundle to `dist/`.

## How to use

1. **Create.** Drag on empty board space. On release, a note is created when both width and height reach the minimum (160×120). A shorter drag is discarded. **Add note** creates one note at the default size (240×180), shifted by a small offset on each click so the notes do not share the same origin.
2. **Move.** Drag a note by its top bar. The note follows the pointer and stays on the board.
3. **Resize.** Drag the handle at the bottom-right corner. Width and height stop at the minimum.
4. **Delete.** Drag a note until its box overlaps the trash zone at the bottom, then release. The zone highlights only while the boxes overlap. Releasing outside the trash keeps the note.

Click the text area to edit. The swatches in the note header set that note’s color. The note you press comes to the front. The header shows Saving…, then Saved, while the change is written. Refresh the page and the board reloads from `localStorage`.

## Architecture

Sticky Notes is one React tree: a board, note cards, a draft rectangle, and a trash zone. `useNotes` owns the list in component state and passes callbacks down, with no state library and no context. A note is one interface — id, text, color, x, y, width, height, and zIndex — so create, move, resize, recolor, delete, and bring-to-front all write that same shape. Color is a closed union of five palette ids, yellow by default. Each card renders native swatch buttons with `aria-pressed` on the active one, and CSS Modules map the id to the paper and header colors. Gesture code lives in `useCreateByDraw`, `useDraggable`, and `useResizable`. Drawing on empty space commits a yellow note on pointer up when both width and height meet the minimum; a short drag is discarded. Add note is a shortcut that inserts a default-size yellow note on a staggered offset. The draw hook ignores a pointer down that starts on a note, the textarea, a swatch, the resize handle, the trash, or a button.

React state updates when the model changes. During a drag or resize, pointer move writes left and top, or width and height, directly on the note node, which keeps the board off the render path until pointer up commits that geometry once. Z-index increments once on pointer down; when the note is already the single front-most card, the list stays as it is. Trash highlighting is its own boolean. `collision.ts` runs a pure axis-aligned test on the note and trash `getBoundingClientRect()` boxes, and the highlight updates only when that boolean flips. Text stays in a controlled textarea and is saved on a 300ms debounce and again on blur. Create, color, delete, move end, resize end, and bring-to-front save immediately.

Persistence goes through the `NotesApi` mock in `src/api/notesApi.ts`, not a live server. `load` and `save` wait a few hundred milliseconds, then call the existing localStorage helpers, so the stored notes stay real browser storage behind an async boundary. `useNotes` loads on mount and shows “Loading notes…” until the promise resolves; a rejection falls back to the welcome note. Each save carries a monotonic token, and a response from an older save is ignored once a newer one has started. A failed save leaves the in-memory list in place and shows “Couldn’t save” beside the header; a successful one shows “Saved”. On load, every record is checked field by field. A missing or unknown color becomes yellow, and an empty or invalid payload is replaced by one welcome note. Each gesture hook calls `setPointerCapture` on pointer down, listens for move, up, cancel, and `lostpointercapture`, and removes those listeners on unmount. A layout effect writes the live box back if a card renders mid-gesture. Identifiers come from `crypto.randomUUID()`.
