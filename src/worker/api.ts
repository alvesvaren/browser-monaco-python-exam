import { createContext, use, useCallback, useEffect, useState } from "react";
import { ActionMapResult, FromAction, FromMessage, ToAction, ToMessage } from "../promise";
import PyodideWorker from "./worker?worker";

let id = 0;
let defaultWorker = new PyodideWorker();

export const WorkerContext = createContext(defaultWorker);

export function usePostMessage<T extends ToAction>(action: T) {
  const worker = use(WorkerContext);
  return (data: Omit<ToMessage & { action: T }, "action" | "id">) => {
    id = (id + 1) % Number.MAX_SAFE_INTEGER;
    const myId = id;

    const responsePromise = new Promise<ActionMapResult<T>>(success => {
      const callback = (ev: MessageEvent<ActionMapResult<T>>) => {
        if (ev.data.id === myId) {
          success(ev.data);
          worker.removeEventListener("message", callback);
        }
      };
      worker.addEventListener("message", callback);
    });

    worker.postMessage({ id, action, ...data });

    return responsePromise;
  };
}

export function useListenToMessage<T extends FromAction, MSG = FromMessage & { action: T }>(action: T, callback: (data: MSG) => void) {
  const worker = use(WorkerContext);
  useEffect(() => {
    const _callback = (ev: MessageEvent<FromMessage>) => {
      if (ev.data.action === action) {
        callback(ev.data as MSG);
      }
    };

    worker.addEventListener("message", _callback);
    return () => worker.removeEventListener("message", _callback);
  }, [worker]);
}

export function useWorker() {
  const [worker, setWorker] = useState(defaultWorker);

  const restartWorker = useCallback(() => {
    console.log("Restarting worker");
    worker.terminate();
    setWorker(new PyodideWorker());
  }, [worker]);

  return {
    worker,
    restartWorker,
  };
}
