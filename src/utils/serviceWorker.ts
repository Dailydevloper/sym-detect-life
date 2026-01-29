// Service Worker Registration Utility
// Handles registration, updates, and offline detection

export interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onOffline?: () => void;
  onOnline?: () => void;
}

export function registerServiceWorker(config?: ServiceWorkerConfig) {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      const swUrl = "/service-worker.js";

      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          console.log("✅ Service Worker registered:", registration);

          // Check for updates
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker == null) {
              return;
            }

            installingWorker.onstatechange = () => {
              if (installingWorker.state === "installed") {
                if (navigator.serviceWorker.controller) {
                  // New update available
                  console.log("🔄 New content available, please refresh.");
                  if (config?.onUpdate) {
                    config.onUpdate(registration);
                  } else {
                    // Show default update notification
                    showUpdateNotification();
                  }
                } else {
                  // Content cached for offline use
                  console.log("✅ Content cached for offline use.");
                  if (config?.onSuccess) {
                    config.onSuccess(registration);
                  }
                }
              }
            };
          };
        })
        .catch((error) => {
          console.error("❌ Service Worker registration failed:", error);
        });
    });

    // Handle offline/online events
    window.addEventListener("offline", () => {
      console.log("📡 App is offline");
      if (config?.onOffline) {
        config.onOffline();
      } else {
        showOfflineNotification();
      }
    });

    window.addEventListener("online", () => {
      console.log("📡 App is online");
      if (config?.onOnline) {
        config.onOnline();
      } else {
        hideOfflineNotification();
      }
    });
  } else {
    console.warn("⚠️ Service Worker not supported in this browser");
  }
}

export function unregisterServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
        console.log("🗑️ Service Worker unregistered");
      })
      .catch((error) => {
        console.error("❌ Service Worker unregistration failed:", error);
      });
  }
}

export async function checkForUpdates() {
  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.ready;
    registration.update();
  }
}

// Show update notification with Sonner
function showUpdateNotification() {
  // This will be imported from the toast system
  const event = new CustomEvent("sw-update", {
    detail: { message: "New version available!" },
  });
  window.dispatchEvent(event);
}

// Show offline notification
function showOfflineNotification() {
  const event = new CustomEvent("app-offline", {
    detail: { message: "You are currently offline" },
  });
  window.dispatchEvent(event);
}

// Hide offline notification
function hideOfflineNotification() {
  const event = new CustomEvent("app-online", {
    detail: { message: "You are back online" },
  });
  window.dispatchEvent(event);
}

// Request notification permission
export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    console.warn("⚠️ This browser does not support notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}

// Show notification
export async function showNotification(
  title: string,
  options?: NotificationOptions,
) {
  const hasPermission = await requestNotificationPermission();

  if (hasPermission && "serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.ready;
    registration.showNotification(title, {
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
      ...options,
    });
  }
}

// Get install prompt
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

window.addEventListener("beforeinstallprompt", (e: Event) => {
  e.preventDefault();
  deferredPrompt = e as BeforeInstallPromptEvent;
  console.log("💾 Install prompt ready");

  // Dispatch custom event
  const event = new CustomEvent("pwa-installable");
  window.dispatchEvent(event);
});

export async function promptInstall() {
  if (!deferredPrompt) {
    console.log("⚠️ Install prompt not available");
    return false;
  }

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;

  console.log(`User response to install prompt: ${outcome}`);
  deferredPrompt = null;

  return outcome === "accepted";
}

export function isPWAInstalled() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator &&
      (window.navigator as { standalone?: boolean }).standalone === true)
  );
}

// Track install event
window.addEventListener("appinstalled", () => {
  console.log("✅ PWA installed successfully");
  deferredPrompt = null;

  const event = new CustomEvent("pwa-installed");
  window.dispatchEvent(event);
});
