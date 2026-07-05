"use client";

// Create an account. sourceRef: docs/hackathon/API_CONTRACT.md (endpoint 1).

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button, Card, Eyebrow, Notice, TextField } from "@/components/ui/primitives";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    const result = await register(email, password, name);
    setBusy(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    router.push("/dashboard");
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-6 py-20">
      <Eyebrow>Join Atelier</Eyebrow>
      <h1 className="mb-8 mt-2 font-display text-3xl font-semibold text-ink">Create your account</h1>
      <Card>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <TextField label="Name" name="name" value={name} onValueChange={setName} testId="register-name" />
          <TextField
            label="Email"
            name="email"
            type="email"
            value={email}
            onValueChange={setEmail}
            autoComplete="email"
            testId="register-email"
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            value={password}
            onValueChange={setPassword}
            autoComplete="new-password"
            testId="register-password"
          />
          {error ? <Notice testId="register-error">{error}</Notice> : null}
          <Button type="submit" loading={busy} testId="register-submit" className="mt-2 w-full">
            Create account
          </Button>
        </form>
      </Card>
      <p className="mt-6 text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-accent underline-offset-2 hover:underline" data-testid="to-login">
          Sign in
        </Link>
      </p>
    </div>
  );
}
