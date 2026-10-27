export type NoteColor = "yellow" | "pink" | "blue" | "green" | "purple";

export interface Note {
  id: string;
  text: string;
  color: NoteColor;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface NoteBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CreateNotePayload {
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
}

export interface PositionCommit {
  id: string;
  x: number;
  y: number;
}

export interface SizeCommit {
  id: string;
  width: number;
  height: number;
}

export interface DragResult {
  x: number;
  y: number;
  moved: boolean;
}

export interface DragEndPayload {
  id: string;
  x: number;
  y: number;
  moved: boolean;
  element: HTMLElement;
}
