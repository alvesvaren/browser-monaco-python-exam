import { Editor } from "@monaco-editor/react";
import { ReactNode, useState } from "react";
import Button from "./components/Button";
import { useListenToMessage, usePostMessage, useWorker, WorkerContext } from "./worker/api";

const getInitialCode = () =>
  localStorage.getItem("editorContent") ??
  `# In browser python editor
print("Hello world")
`;

function App({ restartWorker }: { restartWorker: () => void }) {
  const [code, setCode] = useState(getInitialCode());
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [outputContent, setOutputContent] = useState<string[]>([]);
  const asyncRun = usePostMessage("start");

  const handleEditorChange = (value: string = "") => {
    localStorage.setItem("editorContent", value);
    setCode(value);
  };

  useListenToMessage("stdout", ({ content }) => setOutputContent(old => [...old, content]));
  useListenToMessage("loaded", () => setLoading(false));

  const runPythonScript = async (code: string) => {
    setRunning(true);
    setOutputContent([]);

    // pyodide.setStdin({ stdin: () => prompt() });
    try {
      const output = await asyncRun({ code, context: {} });

      if (output.error) {
        throw new Error(output.error);
      }

      console.info(`Ran with output: ${JSON.stringify(output.returns)}`);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setOutputContent(old => [...old, e.toString()]);
      }
    }

    setRunning(false);
  };

  function stopCode() {
    setRunning(false);
    setLoading(true);
    restartWorker();
  }

  return (
    <div className='w-full h-full flex flex-col'>
      <div className='flex items-stretch flex-1 max-h-full'>
        <div className='resize-x overflow-auto w-full max-w-[80%] overflow-y-hidden'>
          <div className='flex gap-2'>
            <Button onClick={() => (running ? stopCode() : runPythonScript(code))} intent={running ? "destructive" : "primary"}>
              {running ? "Stop" : "Run code"}
            </Button>
            <Button
              onClick={() => {
                if (confirm("Are you sure you want to reset the editor?")) {
                  localStorage.removeItem("editorContent");
                  setCode(getInitialCode());
                }
              }}
            >
              Reset editor
            </Button>
            {loading && <div>Loading python</div>}
          </div>
          <Editor options={{ automaticLayout: true }} defaultLanguage='python' height='100%' theme='vs-dark' value={code} onChange={handleEditorChange} />
        </div>
        <div className='flex-1 overflow-y-auto max-h-full'>
          {outputContent.map((e, i) => (
            <p className='whitespace-pre font-mono' key={i}>
              {(e.split("\n") as ReactNode[]).flatMap(x => [<br />, x]).slice(1)}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

function AppWrapper() {
  const { worker, restartWorker } = useWorker();

  return (
    <WorkerContext value={worker}>
      <App restartWorker={restartWorker} />
    </WorkerContext>
  );
}

export default AppWrapper;
