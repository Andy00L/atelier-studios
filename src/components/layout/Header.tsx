"use client";

// Global header: brand, primary nav, and auth state. Neutral near-black system.
// sourceRef: docs/UI_DESIGN_SYSTEM.md.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await logout();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-field/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="font-display text-xl font-semibold tracking-tight text-ink"
          data-testid="brand-home"
        >
          Atelier
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/"
            className="rounded-md px-3 py-2 text-muted transition-colors hover:text-ink"
            data-testid="nav-studios"
          >
            Studios
          </Link>
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-md px-3 py-2 text-muted transition-colors hover:text-ink"
                data-testid="nav-dashboard"
              >
                Dashboard
              </Link>
              {user.role === "admin" ? (
                <Link
                  href="/admin"
                  className="rounded-md px-3 py-2 text-muted transition-colors hover:text-ink"
                  data-testid="nav-admin"
                >
                  Admin
                </Link>
              ) : null}
              <span className="ml-2 hidden text-muted sm:inline" data-testid="current-user">
                {user.name}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                className="ml-1 rounded-md px-3 py-2 text-muted transition-colors hover:text-ink"
                data-testid="sign-out"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link href="/login" className="atl-btn atl-btn-primary ml-1 h-10 px-5" data-testid="nav-login">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
