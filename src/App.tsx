import { Editor } from "@monaco-editor/react";
import clsx from "clsx";
import { HTMLAttributes, ReactNode, use, useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { asyncRun, listenToMessagesOfActionType, stopCode } from "./worker/api";

const getInitialCode = () =>
  localStorage.getItem("editorContent") ??
  `# In browser python editor
print("Hello world")
`;

const Button = (props: HTMLAttributes<HTMLButtonElement>) => <button className={twMerge(clsx("btn", props.className))} {...props} />;

function App() {
  const [code, setCode] = useState(getInitialCode());
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [outputContent, setOutputContent] = useState<string[]>([]);
  const matplotLibTargetRef = useRef<HTMLDivElement>(null);

  const handleEditorChange = (value: string = "") => {
    localStorage.setItem("editorContent", value);
    setCode(value);
  };

  useEffect(() => {
    return listenToMessagesOfActionType("stdout", ({ content }) => {
      setOutputContent(old => [...old, content]);
    });
  }, []);

  useEffect(() => {
    return listenToMessagesOfActionType("loaded", () => setLoading(false));
  }, []);

  const runPythonScript = async (code: string) => {
    setRunning(true);
    setOutputContent([]);
    if (matplotLibTargetRef.current) {
      (document as any).pyodideMplTarget = matplotLibTargetRef.current;
      matplotLibTargetRef.current.innerHTML = "";
    }

    // pyodide.setStdin({ stdin: () => prompt() });
    try {
      const output = await asyncRun(code);

      console.info(`Ran with output: ${JSON.stringify(output?.returns)}`);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setOutputContent(old => [...old, e.toString()]);
      }
    }

    setRunning(false);
  };

  return (
    <div className='w-full h-full flex flex-col'>
      <div className='flex items-stretch flex-1 max-h-full'>
        <div className='resize-x overflow-auto w-full max-w-[80%] overflow-y-hidden'>
          <div className='flex gap-2'>
            <Button onClick={() => (running ? stopCode() : runPythonScript(code))}>{running ? "Running..." : "Run code"}</Button>
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
        <div className='flex-1 overflow-y-scroll max-h-full'>
          {outputContent.map((e, i) => (
            <p className='whitespace-pre font-mono' key={i}>
              {(e.split("\n") as ReactNode[]).flatMap(x => [<br />, x]).slice(1)}
            </p>
          ))}
          <div ref={matplotLibTargetRef} id='matplot-target' />
        </div>
      </div>
    </div>
  );
}

export default App;
