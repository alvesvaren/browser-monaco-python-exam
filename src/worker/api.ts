import { ActionMapResult, FromAction, FromMessage, messageActionMap, ToAction, ToMessage } from "../promise";
import PyodideWorker from "./worker?worker";

let buffer = new Uint8Array(new SharedArrayBuffer(1));
let id = 0;
const pyodideWorker = new PyodideWorker();

function postTypedMessage<T extends ToAction>(action: T, data: Omit<ToMessage & { action: T }, "action" | "id">) {
  id = (id + 1) % Number.MAX_SAFE_INTEGER;
  const myId = id;
  pyodideWorker.postMessage({ id, action, ...data });
  if (messageActionMap[action]) {
    return new Promise<ActionMapResult<T>>(success => {
      const callback = (ev: MessageEvent<ActionMapResult<T>>) => {
        if (ev.data.id === myId) {
          success(ev.data);
          pyodideWorker.removeEventListener("message", callback);
        }
      };
      pyodideWorker.addEventListener("message", callback);
    });
  }
}

export function listenToMessagesOfActionType<T extends FromAction, MSG = FromMessage & { action: T }>(action: T, callback: (data: MSG) => void) {
  const _callback = (ev: MessageEvent<FromMessage>) => {
    if (ev.data.action === action) {
      callback(ev.data as MSG);
    }
  };
  pyodideWorker.addEventListener("message", _callback);
  return () => pyodideWorker.removeEventListener("message", _callback);
}


export async function asyncRun(code: string, context = {}) {
  buffer[0] = 0;
  postTypedMessage("setBuffer", { buffer });
  const resultPromise = postTypedMessage("start", { code, context });
  return await resultPromise;
}

export async function stopCode() {
  console.log("Stopping")
  buffer[0] = 2;
}