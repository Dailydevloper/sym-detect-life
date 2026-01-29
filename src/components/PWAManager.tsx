import React, { useEffect, useState } from "react";
import { Bell, Download, Wifi, WifiOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { promptInstall, isPWAInstalled } from "@/utils/serviceWorker";

export const PWAManager: React.FC = () => {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isInstalled] = useState(isPWAInstalled());

  useEffect(() => {
    // Listen for PWA installable event
    const handleInstallable = () => {
      if (!isInstalled) {
        setShowInstallPrompt(true);
      }
    };

    // Listen for PWA installed event
    const handleInstalled = () => {
      setShowInstallPrompt(false);
    };

    // Listen for service worker update
    const handleUpdate = () => {
      setShowUpdatePrompt(true);
    };

    // Listen for offline/online events
    const handleOffline = () => {
      setIsOffline(true);
    };

    const handleOnline = () => {
      setIsOffline(false);
    };

    window.addEventListener("pwa-installable", handleInstallable);
    window.addEventListener("pwa-installed", handleInstalled);
    window.addEventListener("sw-update", handleUpdate);
    window.addEventListener("app-offline", handleOffline);
    window.addEventListener("app-online", handleOnline);

    return () => {
      window.removeEventListener("pwa-installable", handleInstallable);
      window.removeEventListener("pwa-installed", handleInstalled);
      window.removeEventListener("sw-update", handleUpdate);
      window.removeEventListener("app-offline", handleOffline);
      window.removeEventListener("app-online", handleOnline);
    };
  }, [isInstalled]);

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (accepted) {
      setShowInstallPrompt(false);
    }
  };

  const handleUpdate = () => {
    window.location.reload();
  };

  return (
    <>
      {/* Offline Indicator */}
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white px-4 py-2 text-center text-sm flex items-center justify-center gap-2">
          <WifiOff className="h-4 w-4" />
          <span>You are currently offline. Some features may be limited.</span>
        </div>
      )}

      {/* Online Indicator (temporary) */}
      {!isOffline && isOffline !== null && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-green-500 text-white px-4 py-2 text-center text-sm flex items-center justify-center gap-2 animate-in slide-in-from-top duration-300">
          <Wifi className="h-4 w-4" />
          <span>You are back online!</span>
        </div>
      )}

      {/* Install Prompt */}
      {showInstallPrompt && !isInstalled && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-in slide-in-from-bottom duration-300">
          <Alert className="bg-white shadow-lg border-primary">
            <Download className="h-4 w-4" />
            <AlertDescription className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="font-semibold mb-1">Install SymDetect Life</p>
                <p className="text-sm text-muted-foreground">
                  Install our app for quick access, offline support, and a
                  better experience!
                </p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" onClick={handleInstall}>
                    Install
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowInstallPrompt(false)}
                  >
                    Not Now
                  </Button>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 shrink-0"
                onClick={() => setShowInstallPrompt(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Update Prompt */}
      {showUpdatePrompt && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-in slide-in-from-bottom duration-300">
          <Alert className="bg-white shadow-lg border-blue-500">
            <Bell className="h-4 w-4 text-blue-500" />
            <AlertDescription className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="font-semibold mb-1">Update Available</p>
                <p className="text-sm text-muted-foreground">
                  A new version of SymDetect Life is available. Refresh to
                  update.
                </p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" onClick={handleUpdate}>
                    Update Now
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowUpdatePrompt(false)}
                  >
                    Later
                  </Button>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 shrink-0"
                onClick={() => setShowUpdatePrompt(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}
    </>
  );
};
