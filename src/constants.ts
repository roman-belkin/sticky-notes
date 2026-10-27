import type { NoteColor } from "./types";

export const STORAGE_KEY = "sticky-notes";

export const NOTE_COLORS = ["yellow", "pink", "blue", "green", "purple"] as const satisfies readonly NoteColor[];

export const DEFAULT_NOTE_COLOR: NoteColor = "yellow";

export const NOTE_COLOR_LABELS: Record<NoteColor, string> = {
  yellow: "Yellow",
  pink: "Pink",
  blue: "Blue",
  green: "Green",
  purple: "Purple",
};

export const MIN_NOTE_WIDTH = 160;
export const MIN_NOTE_HEIGHT = 120;

export const DEFAULT_NOTE_WIDTH = 240;
export const DEFAULT_NOTE_HEIGHT = 180;

export const DEFAULT_ORIGIN_X = 48;
export const DEFAULT_ORIGIN_Y = 40;
export const SPAWN_OFFSET = 28;
export const SPAWN_SLOTS = 12;

export const TEXT_SAVE_DELAY_MS = 300;

/** Ignore clicks and tiny jitters so a note resting on the trash is not deleted. */
export const DRAG_THRESHOLD_PX = 4;

export const WELCOME_NOTE_ID = "welcome";
export const WELCOME_NOTE_TEXT =
  "Drag on empty space to draw a note. Drag the top bar to move, the corner to resize, and drop a note on the trash to delete it.";
