import { loadPyodide } from "pyodide";

const pyodidePromise = loadPyodide({
  indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/",
  packages: ["matplotlib", "requests"],
});

export default pyodidePromise;
