import pyodidePromise, { FromAction, FromMessage, ToMessage } from "../promise";

function sendTypedMessage<T extends FromAction>(action: T, data: Omit<FromMessage & { action: T }, "action">) {
  self.postMessage({ action, ...data });
}

console.log("Worker: Created");

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
            sendTypedMessage("stdout", {
              content,
              id: "stdout",
            });
          },
        };
        pyodide.setStderr(options);
        pyodide.setStdout(options);
        let returns = await pyodide.runPythonAsync(data.code);
        sendTypedMessage("done", { returns, id });
      } catch (error: unknown) {
        if (error instanceof Error) {
          sendTypedMessage("done", { id, error: error.message, returns: undefined });
        }
      }
      break;
  }
});
(async () => {
  await pyodidePromise;
  console.log("Worker: Loaded");
  sendTypedMessage("loaded", { id: "loaded" });
})();
