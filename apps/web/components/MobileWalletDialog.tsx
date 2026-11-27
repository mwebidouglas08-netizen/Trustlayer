"use client";
import { useEffect, useRef } from "react";
import { walletBrowserLinks } from "@/lib/mobile-wallet";

export function MobileWalletDialog({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    element?.showModal();
    return () => {
      element?.close();
      previous?.focus();
    };
  }, []);
  const links = walletBrowserLinks(window.location.href);
  return (
    <dialog
      ref={dialog}
      className="mobile-wallet-dialog"
      onCancel={onClose}
      aria-labelledby="mobile-wallet-title"
    >
      <h2 id="mobile-wallet-title">Open in your wallet</h2>
      <p>
        Your browser cannot list installed wallet apps. Choose your wallet to
        open this page in its secure browser, then tap Connect wallet and
        approve the request.
      </p>
      <div className="action-stack">
        <a className="btn primary" href={links.phantom}>
          Open Phantom
        </a>
        <a className="btn primary" href={links.solflare}>
          Open Solflare
        </a>
        <button className="btn" onClick={onClose}>
          Cancel
        </button>
      </div>
      <p>
        Use Devnet for testing. No funds move when connecting. If the app does
        not open, install it from its official site or paste this page’s URL
        into its browser.
      </p>
      <small>
        Continue signing in inside the wallet browser; your regular browser
        session is separate. Never enter a seed phrase on this site.
      </small>
    </dialog>
  );
}
