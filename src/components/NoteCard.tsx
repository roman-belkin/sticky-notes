import { memo, useRef } from "react";
import { NOTE_COLORS, NOTE_COLOR_LABELS } from "../constants";
import { useDraggable } from "../hooks/useDraggable";
import { useResizable } from "../hooks/useResizable";
import type { DragEndPayload, Note, NoteColor, SizeCommit } from "../types";
import styles from "./NoteCard.module.css";

interface NoteCardProps {
  note: Note;
  isFront: boolean;
  autoFocus: boolean;
  onRaise: (id: string) => void;
  onTextChange: (id: string, text: string) => void;
  onTextBlur: (id: string) => void;
  onColorChange: (id: string, color: NoteColor) => void;
  onDragMove: (element: HTMLElement) => void;
  onDragEnd: (payload: DragEndPayload) => void;
  onCommitSize: (payload: SizeCommit) => void;
}

export const NoteCard = memo(function NoteCard({
  note,
  isFront,
  autoFocus,
  onRaise,
  onTextChange,
  onTextBlur,
  onColorChange,
  onDragMove,
  onDragEnd,
  onCommitSize,
}: NoteCardProps) {
  const noteRef = useRef<HTMLElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  useDraggable(noteRef, {
    onDragStart: () => {
      onRaise(note.id);
    },
    onDragMove,
    onDragEnd: (result, element) => {
      onDragEnd({
        id: note.id,
        x: result.x,
        y: result.y,
        moved: result.moved,
        element,
      });
    },
  });

  useResizable(noteRef, handleRef, {
    onResizeStart: () => {
      onRaise(note.id);
    },
    onResizeEnd: (size) => {
      onCommitSize({ id: note.id, width: size.width, height: size.height });
    },
  });

  const className = isFront ? `${styles.note} ${styles.front}` : styles.note;

  return (
    <article
      ref={noteRef}
      className={className}
      data-note
      data-color={note.color}
      style={{
        left: note.x,
        top: note.y,
        width: note.width,
        height: note.height,
        zIndex: note.zIndex,
      }}
    >
      <div className={styles.bar}>
        <span className={styles.grip} aria-hidden="true" />
        <div className={styles.swatches} role="group" aria-label="Note color">
          {NOTE_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={styles.swatch}
              data-color-swatch={color}
              aria-label={NOTE_COLOR_LABELS[color]}
              aria-pressed={note.color === color}
              onClick={() => {
                onColorChange(note.id, color);
              }}
            />
          ))}
        </div>
      </div>
      <textarea
        className={styles.text}
        value={note.text}
        placeholder="Write a note…"
        aria-label="Note text"
        autoFocus={autoFocus}
        onChange={(event) => {
          onTextChange(note.id, event.target.value);
        }}
        onBlur={() => {
          onTextBlur(note.id);
        }}
      />
      <div
        ref={handleRef}
        className={styles.handle}
        data-resize-handle
        aria-hidden="true"
      />
    </article>
  );
});
