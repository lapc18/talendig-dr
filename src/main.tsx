/**
 * Browser entry point.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import "./styles/index.css";

const rootElement = document.getElementById("root");

if (rootElement === null) {
  throw new Error('index.html is missing the <div id="root"> mount point.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
