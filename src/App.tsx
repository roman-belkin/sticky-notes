import { useState } from "react";
import styles from "./App.module.css";
import { Board } from "./components/Board";
import { useNotes, type SaveStatus } from "./hooks/useNotes";
import type { CreateNotePayload } from "./types";

const SAVE_STATUS_TEXT: Record<Exclude<SaveStatus, "idle">, string> = {
  saving: "Saving…",
  saved: "Saved",
  error: "Couldn’t save",
};

export default function App() {
  const {
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
  } = useNotes();
  const [focusId, setFocusId] = useState<string | null>(null);

  const handleCreate = (payload: CreateNotePayload): string => {
    const id = createNote(payload);
    setFocusId(id);
    return id;
  };

  const handleAdd = () => {
    setFocusId(addDefaultNote());
  };

  return (
    <main className={styles.app}>
      <header className={styles.header}>
        <div className={styles.titles}>
          <h1 className={styles.title}>Sticky Notes</h1>
          <p className={styles.hint}>Drag on empty space to draw a note.</p>
        </div>
        <p
          className={saveStatus === "error" ? `${styles.status} ${styles.statusError}` : styles.status}
          role="status"
        >
          {saveStatus === "idle" ? "" : SAVE_STATUS_TEXT[saveStatus]}
        </p>
        <button type="button" className={styles.addButton} onClick={handleAdd} disabled={!ready}>
          Add note
        </button>
      </header>
      {ready ? (
        <Board
          notes={notes}
          focusId={focusId}
          onCreate={handleCreate}
          onTextChange={updateText}
          onTextBlur={flushText}
          onCommitPosition={commitPosition}
          onCommitSize={commitSize}
          onRaise={raiseNote}
          onColorChange={setNoteColor}
          onDelete={deleteNote}
        />
      ) : (
        <p className={styles.loading}>Loading notes…</p>
      )}
    </main>
  );
}
