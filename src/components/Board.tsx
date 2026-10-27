import { useCallback, useRef, useState } from "react";
import { rectsOverlap } from "../collision";
import { useCreateByDraw } from "../hooks/useCreateByDraw";
import type {
  CreateNotePayload,
  DragEndPayload,
  Note,
  NoteColor,
  PositionCommit,
  SizeCommit,
} from "../types";
import styles from "./Board.module.css";
import { NoteCard } from "./NoteCard";
import { TrashZone } from "./TrashZone";

interface BoardProps {
  notes: Note[];
  focusId: string | null;
  onCreate: (payload: CreateNotePayload) => string;
  onTextChange: (id: string, text: string) => void;
  onTextBlur: (id: string) => void;
  onCommitPosition: (payload: PositionCommit) => void;
  onCommitSize: (payload: SizeCommit) => void;
  onRaise: (id: string) => void;
  onColorChange: (id: string, color: NoteColor) => void;
  onDelete: (id: string) => void;
}

export function Board({
  notes,
  focusId,
  onCreate,
  onTextChange,
  onTextBlur,
  onCommitPosition,
  onCommitSize,
  onRaise,
  onColorChange,
  onDelete,
}: BoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const draftRef = useRef<HTMLDivElement>(null);
  const trashRef = useRef<HTMLDivElement>(null);
  const trashActiveRef = useRef(false);
  const [trashActive, setTrashActive] = useState(false);

  useCreateByDraw({
    boardRef,
    draftRef,
    onCreate,
  });

  const updateTrashOverlap = useCallback((element: HTMLElement) => {
    const trash = trashRef.current;
    if (!trash) return;
    const overlaps = rectsOverlap(
      element.getBoundingClientRect(),
      trash.getBoundingClientRect(),
    );
    if (overlaps === trashActiveRef.current) return;
    trashActiveRef.current = overlaps;
    setTrashActive(overlaps);
  }, []);

  const handleDragEnd = useCallback(
    (payload: DragEndPayload) => {
      const trash = trashRef.current;
      const overlaps =
        payload.moved &&
        trash !== null &&
        rectsOverlap(payload.element.getBoundingClientRect(), trash.getBoundingClientRect());

      if (trashActiveRef.current) {
        trashActiveRef.current = false;
        setTrashActive(false);
      }

      if (overlaps) {
        onDelete(payload.id);
        return;
      }
      if (payload.moved) {
        onCommitPosition({ id: payload.id, x: payload.x, y: payload.y });
      }
    },
    [onCommitPosition, onDelete],
  );

  const frontZ = notes.reduce((max, note) => Math.max(max, note.zIndex), 0);

  return (
    <div ref={boardRef} className={styles.board} role="region" aria-label="Notes board">
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          isFront={note.zIndex === frontZ && frontZ > 0}
          autoFocus={note.id === focusId}
          onRaise={onRaise}
          onTextChange={onTextChange}
          onTextBlur={onTextBlur}
          onDragMove={updateTrashOverlap}
          onDragEnd={handleDragEnd}
          onCommitSize={onCommitSize}
          onColorChange={onColorChange}
        />
      ))}
      <div ref={draftRef} className={styles.draft} aria-hidden="true" />
      <TrashZone active={trashActive} zoneRef={trashRef} />
    </div>
  );
}
