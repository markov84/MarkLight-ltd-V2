import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { registerSW } from 'virtual:pwa-register';
import "./index.css";
import { HelmetProvider } from "./components/Helmet";
import ErrorBoundary from "./components/ErrorBoundary";

registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HelmetProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </HelmetProvider>
  </React.StrictMode>
);

