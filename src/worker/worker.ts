import pyodidePromise, { DoneMessage, PrintMessage, ToMessage } from "../promise";

if (!crossOriginIsolated) {
  console.error("Cross origin isolation broken! (worker)");
}

console.log("Spawned a worker");
self.addEventListener("message", async (e: MessageEvent<ToMessage>) => {
  const pyodide = await pyodidePromise;

  const {
    data: { id, ...data },
  } = e;

  switch (data.action) {
    case "start":
      try {
        const options = {
                    batched(content: string) {
            self.postMessage({
              action: "stdout",
              content,
              id: "stdout",
            } satisfies PrintMessage);
          },
        }
        pyodide.setStderr(options)
        pyodide.setStdout(options);
        let returns = await pyodide.runPythonAsync(data.code);
        self.postMessage({ action: "done", returns, id } satisfies DoneMessage);
      } catch (error: unknown) {
        if (error instanceof Error) {
          self.postMessage({ action: "done", id, error: error.message, returns: undefined } satisfies DoneMessage);
        }
      }
      break;
    case "setBuffer":
      console.log("Set buffer");
      pyodide.setInterruptBuffer(data.buffer);
      break;
  }
});
(async () => {
  await pyodidePromise;
  self.postMessage({ action: "loaded", id: "loaded" });
})();
