import { useEffect, useRef, type RefObject } from "react";
import { MIN_NOTE_HEIGHT, MIN_NOTE_WIDTH } from "../constants";
import type { CreateNotePayload, NoteBox, Point } from "../types";

interface UseCreateByDrawOptions {
  boardRef: RefObject<HTMLElement | null>;
  draftRef: RefObject<HTMLElement | null>;
  onCreate: (payload: CreateNotePayload) => void;
}

interface DrawGesture {
  pointerId: number;
  startX: number;
  startY: number;
}

const BLOCKED_SELECTOR = "[data-note], textarea, [data-resize-handle], [data-trash], button";

function isBlockedTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(BLOCKED_SELECTOR) !== null;
}

function pointInBoard(board: HTMLElement, clientX: number, clientY: number): Point {
  const bounds = board.getBoundingClientRect();
  const x = Math.min(Math.max(clientX, bounds.left), bounds.right) - bounds.left;
  const y = Math.min(Math.max(clientY, bounds.top), bounds.bottom) - bounds.top;
  return { x, y };
}

function boxFromPoints(start: Point, end: Point): NoteBox {
  return {
    x: Math.round(Math.min(start.x, end.x)),
    y: Math.round(Math.min(start.y, end.y)),
    width: Math.round(Math.abs(end.x - start.x)),
    height: Math.round(Math.abs(end.y - start.y)),
  };
}

function paintDraft(draft: HTMLElement, box: NoteBox): void {
  draft.style.display = "block";
  draft.style.left = `${box.x}px`;
  draft.style.top = `${box.y}px`;
  draft.style.width = `${box.width}px`;
  draft.style.height = `${box.height}px`;
}

function hideDraft(draft: HTMLElement): void {
  draft.style.display = "none";
}

export function useCreateByDraw({
  boardRef,
  draftRef,
  onCreate,
}: UseCreateByDrawOptions): void {
  const onCreateRef = useRef(onCreate);
  onCreateRef.current = onCreate;

  const gestureRef = useRef<DrawGesture | null>(null);
  const liveRef = useRef<NoteBox>({ x: 0, y: 0, width: 0, height: 0 });

  useEffect(() => {
    const board = boardRef.current;
    const draft = draftRef.current;
    if (!board || !draft) return;

    const endGesture = (event: PointerEvent, commit: boolean): void => {
      const gesture = gestureRef.current;
      if (!gesture || event.pointerId !== gesture.pointerId) return;
      gestureRef.current = null;
      if (board.hasPointerCapture(event.pointerId)) {
        board.releasePointerCapture(event.pointerId);
      }
      const box = liveRef.current;
      hideDraft(draft);
      if (!commit) return;
      if (box.width < MIN_NOTE_WIDTH || box.height < MIN_NOTE_HEIGHT) return;
      onCreateRef.current({
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
      });
    };

    const onPointerDown = (event: PointerEvent): void => {
      if (!event.isPrimary || event.button !== 0 || gestureRef.current) return;
      if (isBlockedTarget(event.target)) return;
      event.preventDefault();

      const start = pointInBoard(board, event.clientX, event.clientY);
      gestureRef.current = {
        pointerId: event.pointerId,
        startX: start.x,
        startY: start.y,
      };
      liveRef.current = { x: start.x, y: start.y, width: 0, height: 0 };
      board.setPointerCapture(event.pointerId);
      paintDraft(draft, liveRef.current);
    };

    const onPointerMove = (event: PointerEvent): void => {
      const gesture = gestureRef.current;
      if (!gesture || event.pointerId !== gesture.pointerId) return;
      const end = pointInBoard(board, event.clientX, event.clientY);
      const box = boxFromPoints({ x: gesture.startX, y: gesture.startY }, end);
      liveRef.current = box;
      // The draft is one element, outside the notes list, so cards do not re-render.
      paintDraft(draft, box);
    };

    const onPointerUp = (event: PointerEvent): void => {
      endGesture(event, true);
    };
    const onPointerCancel = (event: PointerEvent): void => {
      endGesture(event, false);
    };

    board.addEventListener("pointerdown", onPointerDown);
    board.addEventListener("pointermove", onPointerMove);
    board.addEventListener("pointerup", onPointerUp);
    board.addEventListener("pointercancel", onPointerCancel);
    board.addEventListener("lostpointercapture", onPointerUp);

    return () => {
      board.removeEventListener("pointerdown", onPointerDown);
      board.removeEventListener("pointermove", onPointerMove);
      board.removeEventListener("pointerup", onPointerUp);
      board.removeEventListener("pointercancel", onPointerCancel);
      board.removeEventListener("lostpointercapture", onPointerUp);
    };
  }, [boardRef, draftRef]);
}
