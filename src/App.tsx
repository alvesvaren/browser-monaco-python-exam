import { Editor } from "@monaco-editor/react";
import clsx from "clsx";
import { HTMLAttributes, ReactNode, use, useState } from "react";
import { twMerge } from "tailwind-merge";
import pyodidePromise from "./promise";

const getInitialCode = () =>
  localStorage.getItem("editorContent") ??
  `# In browser python editor
print("Hello world")
`;

const Button = (props: HTMLAttributes<HTMLButtonElement>) => (
  <button className={twMerge(clsx("px-5 py-1.5 bg-teal-900 text-white hover:bg-teal-950 transition-colors", props.className))} {...props} />
);

function App() {
  const [code, setCode] = useState(getInitialCode());
  const [outputContent, setOutputContent] = useState<string[]>([]);
  const pyodide = use(pyodidePromise);

  const handleEditorChange = (value: string = "") => {
    localStorage.setItem("editorContent", value);
    setCode(value);
  };

  const runPythonScript = async (code: string) => {
    setOutputContent([]);
    pyodide.setStdout({
      batched(output) {
        setOutputContent(old => [...old, output]);
      },
    });
    try {
      const output = await pyodide.runPythonAsync(code);

      console.info(`Ran with output: ${JSON.stringify(output)}`);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setOutputContent(old => [...old, e.toString()]);
      }
    }
  };

  return (
    <div className='w-full h-full flex flex-col'>
      <div className='flex items-stretch flex-1 max-h-full'>
        <div className="resize-x overflow-auto w-full max-w-[80%] overflow-y-hidden">
          <div className='flex gap-2'>
            <Button onClick={() => runPythonScript(code)}>Run code</Button>
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
          <Editor
            options={{ automaticLayout: true }}
            defaultLanguage='python'
            height="100%"
            theme='vs-dark'
            value={code}
            onChange={handleEditorChange}
          />
        </div>
        <div className='flex-1 overflow-y-scroll max-h-full'>
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

export default App;