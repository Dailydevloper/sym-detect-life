import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker } from "./utils/serviceWorker";

createRoot(document.getElementById("root")!).render(<App />);

// Register service worker for PWA functionality
registerServiceWorker({
  onSuccess: (registration) => {
    console.log("✅ Service Worker registered successfully");
  },
  onUpdate: (registration) => {
    console.log("🔄 New version available");
  },
});
