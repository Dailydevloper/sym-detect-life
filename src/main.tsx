import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import {
  registerServiceWorker,
  unregisterServiceWorker,
} from "./utils/serviceWorker";

createRoot(document.getElementById("root")!).render(<App />);

// Register service worker only in production to avoid stale dev caches
if (import.meta.env.PROD) {
  registerServiceWorker({
    onSuccess: (registration) => {
      console.log("✅ Service Worker registered successfully");
    },
    onUpdate: (registration) => {
      console.log("🔄 New version available");
    },
  });
} else {
  unregisterServiceWorker();
}
