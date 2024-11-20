import { loadPyodide } from "pyodide";
import type { TypedArray } from "pyodide/ffi";

export interface StartExecMessage {
  id: number;
  action: "start";
  context: any;
  code: string;
}

export interface SetBufferMessage {
  id: number;
  buffer: TypedArray;
  action: "setBuffer";
}

export type ToMessage = StartExecMessage | SetBufferMessage;

export interface PrintMessage {
  id: "stdout";
  action: "stdout";
  content: string;
}

export interface DoneMessage {
  id: number;
  action: "done";
  returns: unknown;
  error?: string;
}

export interface LoadedMessage {
  id: "loaded";
  action: "loaded";
}

export type FromMessage = PrintMessage | DoneMessage | LoadedMessage;

export type ToAction = ToMessage["action"];
export type FromAction = FromMessage["action"];

export const messageActionMap = {
  setBuffer: null,
  start: "done",
} satisfies Record<ToAction, FromAction | null>;

export type ActionMapResult<T extends ToAction> = FromMessage & { action: (typeof messageActionMap)[T] };

const pyodidePromise = loadPyodide({
  indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/",
  packages: ["networkx"],
});

export default pyodidePromise;
