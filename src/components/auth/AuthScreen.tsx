"use client";

// The split authentication screen: the ivory pass resting in soft light on the
// left, the form on the right. Shared by /login and /register (mode switches the
// copy, fields, and the toggle link). sourceRef: the Sign in export.

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { PassTicket } from "@/components/ui/PassTicket";
import { Spinner } from "@/components/ui/primitives";

type Mode = "signin" | "register";

function EyeIcon({ off }: { off: boolean }) {
  if (off) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 3l18 18" /><path d="M10.6 5.1A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.7 6.7A17 17 0 0 0 2 12s3.5 7 10 7a10.6 10.6 0 0 0 4.3-.9" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
  );
}

function InfoIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--destructive)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }} aria-hidden="true"><circle cx="12" cy="12" r="9" /><line x1="12" y1="8" x2="12" y2="13" /><circle cx="12" cy="16.3" r="0.5" fill="var(--destructive)" stroke="none" /></svg>
  );
}

export function AuthScreen({ mode }: { mode: Mode }) {
  const { login, register } = useAuth();
  const router = useRouter();
  const isRegister = mode === "register";
  const idPrefix = isRegister ? "register" : "login";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    const result = isRegister ? await register(email, password, name) : await login(email, password);
    setBusy(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* LEFT: the pass */}
      <aside
        aria-label="Atelier"
        className="relative hidden w-[44%] flex-none flex-col overflow-hidden border-r border-line md:flex"
        style={{ padding: "clamp(2.5rem,4vw,3.5rem)" }}
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(70% 80% at 26% 18%, rgba(255,255,255,.08), transparent 60%)" }} />
        <p className="atl-eyebrow relative" style={{ letterSpacing: "0.2em" }}>Atelier {"·"} Studio access</p>
        <div className="relative flex flex-1 items-center justify-center py-6" style={{ perspective: "900px" }}>
          <div aria-hidden="true" className="pointer-events-none absolute" style={{ width: 340, maxWidth: "80%", height: 260, background: "radial-gradient(closest-side, rgba(255,255,255,.07), transparent 72%)", filter: "blur(16px)" }} />
          <PassTicket title="Atelier" footNote="By the hour" width={280} restTiltDeg={-1.5} />
        </div>
        <p className="relative m-0 max-w-[20ch] font-display text-[clamp(1.5rem,2.2vw,1.9rem)] font-semibold leading-[1.15] tracking-tight text-ink text-balance">
          The room is ready when you are.
        </p>
      </aside>

      {/* RIGHT: the form */}
      <main className="flex flex-1 items-center justify-center" style={{ padding: "clamp(2.5rem,5vw,4rem) clamp(1.25rem,5vw,3rem)" }}>
        <div className="w-full max-w-[30rem]">
          <p className="atl-eyebrow" style={{ letterSpacing: "0.18em" }}>{isRegister ? "Get started" : "Welcome back"}</p>
          <h1 className="mt-3 font-display text-[clamp(1.9rem,4vw,2.5rem)] font-semibold leading-tight tracking-tight text-ink">
            {isRegister ? "Create your account" : "Sign in to Atelier"}
          </h1>

          <div className="atl-card mt-6" style={{ padding: "clamp(22px,3vw,30px)" }}>
            <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
              {isRegister ? (
                <div style={{ animation: "atl-panelIn .35s var(--ease-enter) both" }}>
                  <label htmlFor="name" className="atl-label">Name</label>
                  <input id="name" name="name" type="text" autoComplete="name" placeholder="Your name" value={name} onChange={(event) => setName(event.target.value)} className="atl-input" data-testid="register-name" />
                </div>
              ) : null}

              <div>
                <label htmlFor="email" className="atl-label">Email</label>
                <input id="email" name="email" type="email" inputMode="email" autoComplete="email" spellCheck={false} placeholder="you@studio.com" value={email} onChange={(event) => setEmail(event.target.value)} className="atl-input" data-testid={`${idPrefix}-email`} />
              </div>

              <div>
                <label htmlFor="password" className="atl-label">Password</label>
                <div className="relative">
                  <input id="password" name="password" type={showPw ? "text" : "password"} autoComplete={isRegister ? "new-password" : "current-password"} placeholder="Your password" value={password} onChange={(event) => setPassword(event.target.value)} className="atl-input pr-12" data-testid={`${idPrefix}-password`} />
                  <button type="button" onClick={() => setShowPw((prev) => !prev)} aria-label={showPw ? "Hide password" : "Show password"} className="absolute right-1.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-[9px] text-faint transition-colors hover:text-muted">
                    <EyeIcon off={showPw} />
                  </button>
                </div>
              </div>

              {error ? (
                <div role="alert" className="flex items-center gap-2 text-[13px] text-destructive" data-testid={`${idPrefix}-error`} style={{ animation: "atl-fade .25s var(--ease-enter) both" }}>
                  <InfoIcon />
                  <span>{error}</span>
                </div>
              ) : null}

              <button type="submit" disabled={busy} className="atl-btn atl-btn-primary mt-1 w-full" style={{ height: 50 }} data-testid={`${idPrefix}-submit`}>
                {busy ? <Spinner /> : null}
                {busy ? (isRegister ? "Creating account..." : "Signing in...") : isRegister ? "Create account" : "Sign in"}
              </button>
            </form>

            <p className="mt-[18px] text-center text-[13.5px] text-muted">
              {isRegister ? "Already have an account? " : "No account? "}
              {isRegister ? (
                <Link href="/login" className="font-medium text-accent transition-colors hover:text-ivory" data-testid="to-login">Sign in</Link>
              ) : (
                <Link href="/register" className="font-medium text-accent transition-colors hover:text-ivory" data-testid="to-register">Create one</Link>
              )}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
