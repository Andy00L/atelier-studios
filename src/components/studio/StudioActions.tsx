"use client";

// Studio detail micro-actions: save (favourite) and share. Client-side, in-memory
// (no persistence, per the project standards). Adds testable interactions.

import { useRef, useState } from "react";

export function StudioActions({ name }: { name: string }) {
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flashToast = (message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  };

  const toggleSave = () => {
    setSaved((prev) => !prev);
    flashToast(saved ? `Removed ${name} from saved` : `Saved ${name}`);
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      flashToast("Link copied to clipboard");
    } catch {
      flashToast("Copy the address bar to share");
    }
  };

  return (
    <div className="mt-6 flex items-center gap-2">
      <button
        type="button"
        onClick={toggleSave}
        aria-pressed={saved}
        data-testid="save-studio"
        className="atl-btn atl-btn-ghost h-10 px-4"
        style={saved ? { borderColor: "var(--accent)", color: "var(--accent)" } : undefined}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill={saved ? "var(--accent)" : "none"} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20.8 6.6a5 5 0 0 0-7.1 0L12 8.3l-1.7-1.7a5 5 0 1 0-7.1 7.1L12 22l8.8-8.3a5 5 0 0 0 0-7.1Z" />
        </svg>
        {saved ? "Saved" : "Save"}
      </button>
      <button type="button" onClick={share} data-testid="share-studio" className="atl-btn atl-btn-ghost h-10 px-4">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
          <path d="M16 6l-4-4-4 4" />
          <path d="M12 2v14" />
        </svg>
        Share
      </button>

      {toast ? (
        <span
          role="status"
          data-testid="share-toast"
          className="ml-1 rounded-full border border-line-strong px-3 py-1.5 text-[12.5px] text-ink"
          style={{ background: "var(--surface-raised)", animation: "atl-fade .2s var(--ease-enter) both" }}
        >
          {toast}
        </span>
      ) : null}
    </div>
  );
}
