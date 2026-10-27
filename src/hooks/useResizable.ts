import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import { MIN_NOTE_HEIGHT, MIN_NOTE_WIDTH } from "../constants";
import type { Size } from "../types";

interface ResizeHandlers {
  onResizeStart: () => void;
  onResizeEnd: (size: Size) => void;
}

interface ResizeGesture {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  originX: number;
  originY: number;
  originWidth: number;
  originHeight: number;
}

export function useResizable<T extends HTMLElement, H extends HTMLElement>(
  noteRef: RefObject<T | null>,
  handleRef: RefObject<H | null>,
  handlers: ResizeHandlers,
): void {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const gestureRef = useRef<ResizeGesture | null>(null);
  const liveRef = useRef<Size>({ width: 0, height: 0 });
  const activeRef = useRef(false);

  useLayoutEffect(() => {
    const note = noteRef.current;
    if (!note || !activeRef.current) return;
    note.style.width = `${liveRef.current.width}px`;
    note.style.height = `${liveRef.current.height}px`;
  });

  useEffect(() => {
    const note = noteRef.current;
    const handle = handleRef.current;
    if (!note || !handle) return;

    const endGesture = (event: PointerEvent): void => {
      const gesture = gestureRef.current;
      if (!gesture || event.pointerId !== gesture.pointerId) return;
      gestureRef.current = null;
      activeRef.current = false;
      if (handle.hasPointerCapture(event.pointerId)) {
        handle.releasePointerCapture(event.pointerId);
      }
      handlersRef.current.onResizeEnd(liveRef.current);
    };

    const onPointerDown = (event: PointerEvent): void => {
      if (!event.isPrimary || event.button !== 0 || gestureRef.current) return;
      event.preventDefault();
      event.stopPropagation();

      const originWidth = note.offsetWidth;
      const originHeight = note.offsetHeight;
      gestureRef.current = {
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        originX: note.offsetLeft,
        originY: note.offsetTop,
        originWidth,
        originHeight,
      };
      liveRef.current = { width: originWidth, height: originHeight };
      activeRef.current = true;
      handle.setPointerCapture(event.pointerId);
      handlersRef.current.onResizeStart();
    };

    const onPointerMove = (event: PointerEvent): void => {
      const gesture = gestureRef.current;
      if (!gesture || event.pointerId !== gesture.pointerId) return;

      let width = Math.round(gesture.originWidth + event.clientX - gesture.startClientX);
      let height = Math.round(gesture.originHeight + event.clientY - gesture.startClientY);
      width = Math.max(MIN_NOTE_WIDTH, width);
      height = Math.max(MIN_NOTE_HEIGHT, height);

      const parent = note.offsetParent;
      if (parent instanceof HTMLElement) {
        const maxWidth = parent.clientWidth - gesture.originX;
        const maxHeight = parent.clientHeight - gesture.originY;
        if (maxWidth >= MIN_NOTE_WIDTH) width = Math.min(width, maxWidth);
        if (maxHeight >= MIN_NOTE_HEIGHT) height = Math.min(height, maxHeight);
      }

      liveRef.current = { width, height };
      note.style.width = `${width}px`;
      note.style.height = `${height}px`;
    };

    handle.addEventListener("pointerdown", onPointerDown);
    handle.addEventListener("pointermove", onPointerMove);
    handle.addEventListener("pointerup", endGesture);
    handle.addEventListener("pointercancel", endGesture);
    handle.addEventListener("lostpointercapture", endGesture);

    return () => {
      handle.removeEventListener("pointerdown", onPointerDown);
      handle.removeEventListener("pointermove", onPointerMove);
      handle.removeEventListener("pointerup", endGesture);
      handle.removeEventListener("pointercancel", endGesture);
      handle.removeEventListener("lostpointercapture", endGesture);
    };
  }, [handleRef, noteRef]);
}
