import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./shared/i18n.ts";
import posthog from "posthog-js";

import { GoogleOAuthProvider } from "@react-oauth/google";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "SUA_CLIENT_ID_AQUI.apps.googleusercontent.com";

if (import.meta.env.VITE_POSTHOG_KEY) {
  posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com",
    autocapture: true,
    capture_pageview: true,
    capture_performance: true,
    session_recording: {},
    debug: !!import.meta.env.DEV,
  });
}

createRoot(document.getElementById("root")!).render(
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <App />
  </GoogleOAuthProvider>
);
