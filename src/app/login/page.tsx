"use client";

// Sign in. sourceRef: docs/hackathon/API_CONTRACT.md (endpoint 2).

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button, Card, Eyebrow, Notice, TextField } from "@/components/ui/primitives";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    const result = await login(email, password);
    setBusy(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    router.push("/dashboard");
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-6 py-20">
      <Eyebrow>Welcome back</Eyebrow>
      <h1 className="mb-8 mt-2 font-display text-3xl font-semibold text-ink">Sign in to Atelier</h1>
      <Card>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <TextField
            label="Email"
            name="email"
            type="email"
            value={email}
            onValueChange={setEmail}
            autoComplete="email"
            testId="login-email"
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            value={password}
            onValueChange={setPassword}
            autoComplete="current-password"
            testId="login-password"
          />
          {error ? <Notice testId="login-error">{error}</Notice> : null}
          <Button type="submit" loading={busy} testId="login-submit" className="mt-2 w-full">
            Sign in
          </Button>
        </form>
      </Card>
      <p className="mt-6 text-sm text-muted">
        No account?{" "}
        <Link href="/register" className="text-accent underline-offset-2 hover:underline" data-testid="to-register">
          Create one
        </Link>
      </p>
    </div>
  );
}
