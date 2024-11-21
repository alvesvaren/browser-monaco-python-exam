import { Editor } from "@monaco-editor/react";
import { cx } from "class-variance-authority";
import { useRef, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { twMerge } from "tailwind-merge";
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
  const outputContent = useRef<string[]>([]);
  const outputAreaRef = useRef<HTMLDivElement>(null);
  const asyncRun = usePostMessage("start");

  const handleEditorChange = (value: string = "") => {
    localStorage.setItem("editorContent", value);
    setCode(value);
  };

  function updateContent() {
    const div = outputAreaRef.current;
    if (!div) {
      throw new Error("No area");
    }
    let output = "";
    const outputLines = outputContent.current;
    const truncatedLines = outputLines.slice(-1000);
    if (truncatedLines.length !== outputLines.length) {
      output += `<...${outputLines.length - truncatedLines.length} lines truncated...>\n`;
    }

    output += truncatedLines.join("\n");
    div.textContent = output;
  }

  useListenToMessage("stdout", ({ content }) => {
    outputContent.current.push(content);
    updateContent();
  });
  useListenToMessage("loaded", () => setLoading(false));

  const runPythonScript = async (code: string) => {
    setRunning(true);
    outputContent.current = [];
    updateContent();

    // pyodide.setStdin({ stdin: () => prompt() });
    try {
      const output = await asyncRun({ code, context: {} });

      if (output.error) {
        throw new Error(output.error);
      }

      console.info(`Ran with output: ${JSON.stringify(output.returns)}`);
    } catch (e: unknown) {
      if (e instanceof Error) {
        outputContent.current.push(e.toString());
        updateContent();
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
        <PanelGroup autoSaveId='main' direction='horizontal'>
          <Panel minSize={30} defaultSize={70}>
            <div className='overflow-auto w-full h-full overflow-y-hidden'>
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
              </div>
              <Editor options={{ automaticLayout: true }} defaultLanguage='python' height='100%' theme='vs-dark' value={code} onChange={handleEditorChange} />
            </div>
          </Panel>
          <PanelResizeHandle className='border-r border-spacing-2 border-neutral-700' />
          <Panel minSize={20}>
            <div className='whitespace-pre-wrap font-mono flex-1 max-h-full flex flex-col'>
              <div className='flex justify-between'>
                <div
                  className={twMerge(cx("transition-colors duration-500 animate-pulse pl-2 text-transparent select-none", loading && running && "text-white"))}
                >
                  Loading python...
                </div>
                <Button
                  onClick={() => {
                    outputContent.current = [];
                    updateContent();
                  }}
                >
                  Clear
                </Button>
              </div>
              <div className='overflow-y-scroll max-h-full px-2 flex-1' ref={outputAreaRef} />
            </div>
          </Panel>
        </PanelGroup>
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
