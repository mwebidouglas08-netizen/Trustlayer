"use client";
import { useEffect, useState } from "react";
type InstallEvent = Event & {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
export function InstallApp() {
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    setInstalled(window.matchMedia("(display-mode: standalone)").matches);
    const available = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallEvent);
    };
    const done = () => {
      setInstalled(true);
      setPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", available);
    window.addEventListener("appinstalled", done);
    if ("serviceWorker" in navigator && window.isSecureContext)
      void navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch(() =>
          setMessage(
            "Installation is unavailable in this browser. You can still use the website.",
          ),
        );
    return () => {
      window.removeEventListener("beforeinstallprompt", available);
      window.removeEventListener("appinstalled", done);
    };
  }, []);
  if (installed) return null;
  return (
    <aside className="install-app" aria-label="Install Trustlayer">
      {prompt ? (
        <button
          className="btn"
          onClick={async () => {
            try {
              await prompt.prompt();
              await prompt.userChoice;
              setPrompt(null);
            } catch {
              setMessage(
                "Use your browser menu to install or add to home screen.",
              );
            }
          }}
        >
          Install Trustlayer
        </button>
      ) : (
        <details>
          <summary>Install Trustlayer on your phone</summary>
          <p>
            In Safari, use Share → Add to Home Screen. In Chrome, use the menu →
            Install app or Add to Home screen. Wallet browsers may not support
            installation. Connecting still requires wallet approval; sessions
            are not transferred between browsers.
          </p>
        </details>
      )}
      {message && <p role="status">{message}</p>}
    </aside>
  );
}
