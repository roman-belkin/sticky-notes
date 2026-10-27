import { useCallback, useEffect, useRef, useState } from "react";
import { notesApi } from "../api/notesApi";
import {
  DEFAULT_NOTE_COLOR,
  DEFAULT_NOTE_HEIGHT,
  DEFAULT_NOTE_WIDTH,
  DEFAULT_ORIGIN_X,
  DEFAULT_ORIGIN_Y,
  SPAWN_OFFSET,
  SPAWN_SLOTS,
  TEXT_SAVE_DELAY_MS,
} from "../constants";
import { createWelcomeNote } from "../storage";
import type { CreateNotePayload, Note, NoteColor, PositionCommit, SizeCommit } from "../types";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [ready, setReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const notesRef = useRef(notes);
  notesRef.current = notes;

  const textTimers = useRef(new Map<string, number>());
  const spawnRef = useRef(0);
  const saveGeneration = useRef(0);

  const persist = useCallback((next: readonly Note[]) => {
    const generation = saveGeneration.current + 1;
    saveGeneration.current = generation;
    setSaveStatus("saving");
    // A slower save must not overwrite the status of one that started later.
    void notesApi.save(next).then(
      () => {
        if (generation !== saveGeneration.current) return;
        setSaveStatus("saved");
      },
      () => {
        if (generation !== saveGeneration.current) return;
        setSaveStatus("error");
      },
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    notesApi.load().then(
      (loaded) => {
        if (cancelled) return;
        notesRef.current = loaded;
        setNotes(loaded);
        setReady(true);
      },
      () => {
        if (cancelled) return;
        const fallback = [createWelcomeNote()];
        notesRef.current = fallback;
        setNotes(fallback);
        setReady(true);
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const flushPending = () => {
      if (textTimers.current.size === 0) return;
      for (const handle of textTimers.current.values()) {
        window.clearTimeout(handle);
      }
      textTimers.current.clear();
      persist(notesRef.current);
    };
    window.addEventListener("beforeunload", flushPending);
    return () => {
      window.removeEventListener("beforeunload", flushPending);
      flushPending();
    };
  }, [persist]);

  const createNote = useCallback(
    (payload: CreateNotePayload): string => {
      const current = notesRef.current;
      const maxZ = current.reduce((max, note) => Math.max(max, note.zIndex), 0);
      const note: Note = {
        id: crypto.randomUUID(),
        text: payload.text ?? "",
        color: DEFAULT_NOTE_COLOR,
        x: payload.x,
        y: payload.y,
        width: payload.width,
        height: payload.height,
        zIndex: maxZ + 1,
      };
      const next = [...current, note];
      notesRef.current = next;
      setNotes(next);
      persist(next);
      return note.id;
    },
    [persist],
  );

  const addDefaultNote = useCallback((): string => {
    const slot = spawnRef.current % SPAWN_SLOTS;
    spawnRef.current += 1;
    return createNote({
      x: DEFAULT_ORIGIN_X + slot * SPAWN_OFFSET,
      y: DEFAULT_ORIGIN_Y + slot * SPAWN_OFFSET,
      width: DEFAULT_NOTE_WIDTH,
      height: DEFAULT_NOTE_HEIGHT,
    });
  }, [createNote]);

  const updateText = useCallback(
    (id: string, text: string) => {
      const next = notesRef.current.map((note) => (note.id === id ? { ...note, text } : note));
      notesRef.current = next;
      setNotes(next);

      const existing = textTimers.current.get(id);
      if (existing !== undefined) window.clearTimeout(existing);
      const handle = window.setTimeout(() => {
        textTimers.current.delete(id);
        if (!notesRef.current.some((note) => note.id === id)) return;
        persist(notesRef.current);
      }, TEXT_SAVE_DELAY_MS);
      textTimers.current.set(id, handle);
    },
    [persist],
  );

  const flushText = useCallback(
    (id: string) => {
      const handle = textTimers.current.get(id);
      if (handle !== undefined) {
        window.clearTimeout(handle);
        textTimers.current.delete(id);
      }
      if (!notesRef.current.some((note) => note.id === id)) return;
      persist(notesRef.current);
    },
    [persist],
  );

  const commitPosition = useCallback(
    (payload: PositionCommit) => {
      const current = notesRef.current;
      const target = current.find((note) => note.id === payload.id);
      if (!target || (target.x === payload.x && target.y === payload.y)) return;
      const next = current.map((note) =>
        note.id === payload.id ? { ...note, x: payload.x, y: payload.y } : note,
      );
      notesRef.current = next;
      setNotes(next);
      persist(next);
    },
    [persist],
  );

  const commitSize = useCallback(
    (payload: SizeCommit) => {
      const current = notesRef.current;
      const target = current.find((note) => note.id === payload.id);
      if (!target || (target.width === payload.width && target.height === payload.height)) return;
      const next = current.map((note) =>
        note.id === payload.id
          ? { ...note, width: payload.width, height: payload.height }
          : note,
      );
      notesRef.current = next;
      setNotes(next);
      persist(next);
    },
    [persist],
  );

  const setNoteColor = useCallback(
    (id: string, color: NoteColor) => {
      const current = notesRef.current;
      const target = current.find((note) => note.id === id);
      if (!target || target.color === color) return;
      const next = current.map((note) => (note.id === id ? { ...note, color } : note));
      notesRef.current = next;
      setNotes(next);
      persist(next);
    },
    [persist],
  );

  const raiseNote = useCallback(
    (id: string) => {
      const current = notesRef.current;
      const target = current.find((note) => note.id === id);
      if (!target) return;
      const maxZ = current.reduce((max, note) => Math.max(max, note.zIndex), 0);
      const alreadyFront =
        target.zIndex === maxZ && current.every((note) => note.id === id || note.zIndex < maxZ);
      if (alreadyFront) return;
      const next = current.map((note) => (note.id === id ? { ...note, zIndex: maxZ + 1 } : note));
      notesRef.current = next;
      setNotes(next);
      persist(next);
    },
    [persist],
  );

  const deleteNote = useCallback(
    (id: string) => {
      const handle = textTimers.current.get(id);
      if (handle !== undefined) {
        window.clearTimeout(handle);
        textTimers.current.delete(id);
      }
      const next = notesRef.current.filter((note) => note.id !== id);
      notesRef.current = next;
      setNotes(next);
      persist(next);
    },
    [persist],
  );

  return {
    notes,
    ready,
    saveStatus,
    createNote,
    addDefaultNote,
    updateText,
    flushText,
    setNoteColor,
    commitPosition,
    commitSize,
    raiseNote,
    deleteNote,
  };
}
