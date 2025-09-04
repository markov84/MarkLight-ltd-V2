import React from "react";
import ReactDOM from "react-dom/client";
import { io } from "socket.io-client";

import App from "./App";
import "./index.css";
import { HelmetProvider } from "./components/Helmet";

const socket = io(import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || window.location.origin, { transports: ["websocket"], withCredentials: true });

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>
);

