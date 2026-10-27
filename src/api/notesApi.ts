import { loadNotes, saveNotes } from "../storage";
import type { Note } from "../types";

export interface NotesApi {
  load(): Promise<Note[]>;
  save(notes: readonly Note[]): Promise<void>;
}

const API_DELAY_MS = 350;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

// Writes run in order so an older snapshot cannot land after a newer one.
let saveQueue: Promise<void> = Promise.resolve();

/** In-process stand-in for a REST client. The delay is the network; storage is still localStorage. */
export const notesApi: NotesApi = {
  async load() {
    await wait(API_DELAY_MS);
    return loadNotes();
  },
  save(notes) {
    const run = saveQueue.then(async () => {
      await wait(API_DELAY_MS);
      if (!saveNotes(notes)) {
        throw new Error("Could not save notes");
      }
    });
    saveQueue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  },
};
