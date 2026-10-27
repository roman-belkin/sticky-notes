import {
  DEFAULT_NOTE_COLOR,
  MIN_NOTE_HEIGHT,
  MIN_NOTE_WIDTH,
  STORAGE_KEY,
  WELCOME_NOTE_ID,
  WELCOME_NOTE_TEXT,
} from "./constants";
import type { Note, NoteColor } from "./types";

function isNoteColor(value: unknown): value is NoteColor {
  return (
    value === "yellow" ||
    value === "pink" ||
    value === "blue" ||
    value === "green" ||
    value === "purple"
  );
}

function colorOf(value: unknown): NoteColor {
  return isNoteColor(value) ? value : DEFAULT_NOTE_COLOR;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function createWelcomeNote(): Note {
  return {
    id: WELCOME_NOTE_ID,
    text: WELCOME_NOTE_TEXT,
    x: 620,
    y: 88,
    width: 280,
    height: 180,
    zIndex: 1,
    color: DEFAULT_NOTE_COLOR,
  };
}

function parseNote(value: unknown): Note | null {
  if (!isRecord(value)) return null;
  const { id, text, x, y, width, height, zIndex } = value;
  if (typeof id !== "string" || id.length === 0) return null;
  if (typeof text !== "string") return null;
  if (!isFiniteNumber(x) || !isFiniteNumber(y)) return null;
  if (!isFiniteNumber(width) || width < MIN_NOTE_WIDTH) return null;
  if (!isFiniteNumber(height) || height < MIN_NOTE_HEIGHT) return null;
  if (!isFiniteNumber(zIndex)) return null;
  return { id, text, x, y, width, height, zIndex, color: colorOf(value.color) };
}

export function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null || raw.trim() === "") return [createWelcomeNote()];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return [createWelcomeNote()];

    const notes: Note[] = [];
    const ids = new Set<string>();
    for (const item of parsed) {
      const note = parseNote(item);
      if (note === null || ids.has(note.id)) return [createWelcomeNote()];
      ids.add(note.id);
      notes.push(note);
    }
    return notes;
  } catch {
    return [createWelcomeNote()];
  }
}

export function saveNotes(notes: readonly Note[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    return true;
  } catch {
    return false;
  }
}
