import React from "react";
import { createRoot } from "react-dom/client";
import App from "./WebtoonGallery";

const app = document.getElementById("app");
const app_root = createRoot(app!); // createRoot(container!) if you use TypeScript

app_root.render(
  <>
    <App />
  </>
);
