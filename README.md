# Browser monaco python exam

This is a POC for having a simple python editor in the browser, using pyodide for python interpretation and the VSCode editor (monaco editor) for code editing

## Structure:

The app is built using vite with react. It runs the python code in a worker to allow the ui to be responsive while running code and to allow the user to stop the python process if you're stuck in an infinite loop.

## To use:

1. Install dependencies with `pnpm i`
1. Run dev-server: `pnpm dev`
