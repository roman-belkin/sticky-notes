import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import { DRAG_THRESHOLD_PX } from "../constants";
import type { DragResult } from "../types";

interface DragHandlers {
  onDragStart: () => void;
  onDragMove: (element: HTMLElement) => void;
  onDragEnd: (result: DragResult, element: HTMLElement) => void;
}

interface DragGesture {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  originX: number;
  originY: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function isTextArea(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest("textarea") !== null;
}

function isResizeHandle(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest("[data-resize-handle]") !== null;
}

function isColorSwatch(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest("[data-color-swatch]") !== null;
}

export function useDraggable<T extends HTMLElement>(
  ref: RefObject<T | null>,
  handlers: DragHandlers,
): void {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const gestureRef = useRef<DragGesture | null>(null);
  const liveRef = useRef({ x: 0, y: 0 });
  const activeRef = useRef(false);

  // A z-index bump re-renders the card mid-gesture. Put the live box back before paint.
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node || !activeRef.current) return;
    node.style.left = `${liveRef.current.x}px`;
    node.style.top = `${liveRef.current.y}px`;
  });

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const endGesture = (event: PointerEvent): void => {
      const gesture = gestureRef.current;
      if (!gesture || event.pointerId !== gesture.pointerId) return;

      const moved =
        Math.abs(event.clientX - gesture.startClientX) >= DRAG_THRESHOLD_PX ||
        Math.abs(event.clientY - gesture.startClientY) >= DRAG_THRESHOLD_PX;
      const originX = gesture.originX;
      const originY = gesture.originY;

      gestureRef.current = null;
      activeRef.current = false;
      if (node.hasPointerCapture(event.pointerId)) {
        node.releasePointerCapture(event.pointerId);
      }

      if (!moved) {
        liveRef.current = { x: originX, y: originY };
        node.style.left = `${originX}px`;
        node.style.top = `${originY}px`;
      }

      handlersRef.current.onDragEnd(
        { x: liveRef.current.x, y: liveRef.current.y, moved },
        node,
      );
    };

    const onPointerDown = (event: PointerEvent): void => {
      if (!event.isPrimary || event.button !== 0) return;
      if (gestureRef.current) return;

      if (isTextArea(event.target) || isColorSwatch(event.target)) {
        event.stopPropagation();
        handlersRef.current.onDragStart();
        return;
      }
      if (isResizeHandle(event.target)) return;

      event.preventDefault();
      event.stopPropagation();

      const originX = node.offsetLeft;
      const originY = node.offsetTop;
      gestureRef.current = {
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        originX,
        originY,
      };
      liveRef.current = { x: originX, y: originY };
      activeRef.current = true;
      node.setPointerCapture(event.pointerId);
      handlersRef.current.onDragStart();
    };

    const onPointerMove = (event: PointerEvent): void => {
      const gesture = gestureRef.current;
      if (!gesture || event.pointerId !== gesture.pointerId) return;

      let x = Math.round(gesture.originX + event.clientX - gesture.startClientX);
      let y = Math.round(gesture.originY + event.clientY - gesture.startClientY);
      const parent = node.offsetParent;
      if (parent instanceof HTMLElement) {
        const maxX = Math.max(0, parent.clientWidth - node.offsetWidth);
        const maxY = Math.max(0, parent.clientHeight - node.offsetHeight);
        x = clamp(x, 0, maxX);
        y = clamp(y, 0, maxY);
      }

      liveRef.current = { x, y };
      // Direct DOM writes. setState here would re-render every note on each move.
      node.style.left = `${x}px`;
      node.style.top = `${y}px`;
      handlersRef.current.onDragMove(node);
    };

    node.addEventListener("pointerdown", onPointerDown);
    node.addEventListener("pointermove", onPointerMove);
    node.addEventListener("pointerup", endGesture);
    node.addEventListener("pointercancel", endGesture);
    node.addEventListener("lostpointercapture", endGesture);

    return () => {
      node.removeEventListener("pointerdown", onPointerDown);
      node.removeEventListener("pointermove", onPointerMove);
      node.removeEventListener("pointerup", endGesture);
      node.removeEventListener("pointercancel", endGesture);
      node.removeEventListener("lostpointercapture", endGesture);
    };
  }, [ref]);
}
