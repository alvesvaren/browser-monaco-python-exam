import pyodidePromise, { DoneMessage, PrintMessage, ToMessage } from "../promise";

console.log("Spawned a worker");
self.addEventListener("message", async (e: MessageEvent<ToMessage>) => {
  const pyodide = await pyodidePromise;

  const {
    data: { id, ...data },
  } = e;

  switch (data.action) {
    case "start":
      try {
        pyodide.setStdout({
          batched(content) {
            self.postMessage({
              action: "stdout",
              content,
              id: "stdout",
            } satisfies PrintMessage);
          },
        });
        let returns = await pyodide.runPythonAsync(data.code);
        self.postMessage({ action: "done", returns, id } satisfies DoneMessage);
      } catch (error: unknown) {
        if (error instanceof Error) {
          self.postMessage({ action: "done", id, error: error.message, returns: undefined } satisfies DoneMessage);
        }
      }
      break;
    case "setBuffer":
      pyodide.setInterruptBuffer(data.buffer);
      break;
  }
});

await pyodidePromise;
self.postMessage({ action: "loaded", id: "loaded" });