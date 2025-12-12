import React, { useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "bootstrap-icons/font/bootstrap-icons.css";
import "react-toastify/dist/ReactToastify.css";
import "./index.scss";
import { VaultApp } from "./component/VaultApp";

const container = document.getElementById("app");
const root = createRoot(container!);

root.render(
  <>
    <ToastContainer
      position="bottom-right"
      style={{ fontSize: "16px", width: "auto", minWidth: "10rem" }}
    />
    <BrowserRouter>
      <VaultApp />
    </BrowserRouter>
  </>
);
