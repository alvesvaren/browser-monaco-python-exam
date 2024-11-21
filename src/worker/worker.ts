import pyodidePromise, { DoneMessage, PrintMessage, ToMessage } from "../promise";

console.log("Worker: Spawned");
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
        };
        pyodide.setStderr(options);
        pyodide.setStdout(options);
        let returns = await pyodide.runPythonAsync(data.code);
        self.postMessage({ action: "done", returns, id } satisfies DoneMessage);
      } catch (error: unknown) {
        if (error instanceof Error) {
          self.postMessage({ action: "done", id, error: error.message, returns: undefined } satisfies DoneMessage);
        }
      }
      break;
  }
});
(async () => {
  await pyodidePromise;
  console.log("Worker: Loaded")
  self.postMessage({ action: "loaded", id: "loaded" });
})();
