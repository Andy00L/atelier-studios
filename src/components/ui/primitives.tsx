// Reusable UI primitives. Every value reads from the token sheet
// (docs/UI_DESIGN_SYSTEM.md). Presentational, so usable from server or client.

import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "ghost" | "destructive";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-accent text-field hover:brightness-110 active:scale-[0.98]",
  ghost: "border border-hairline text-ink hover:bg-surface-raised active:scale-[0.98]",
  destructive: "text-destructive border border-hairline hover:bg-surface-raised active:scale-[0.98]",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
  testId?: string;
};

export function Button({
  variant = "primary",
  loading = false,
  testId,
  disabled,
  children,
  className = "",
  ...rest
}: ButtonProps) {
  return (
    <button
      data-testid={testId}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${BUTTON_VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}

export function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70"
    />
  );
}

type TextFieldProps = {
  label: string;
  name: string;
  type?: string;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  testId?: string;
  autoComplete?: string;
};

export function TextField({
  label,
  name,
  type = "text",
  value,
  onValueChange,
  placeholder,
  error,
  testId,
  autoComplete,
}: TextFieldProps) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-muted">{label}</span>
      <input
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(event) => onValueChange(event.target.value)}
        data-testid={testId}
        className="rounded-md border border-hairline bg-field px-3 py-2.5 text-ink outline-none transition-colors placeholder:text-faint focus:border-accent"
      />
      {error ? (
        <span className="text-xs text-destructive" data-testid={testId ? `${testId}-error` : undefined}>
          {error}
        </span>
      ) : null}
    </label>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`card p-6 ${className}`}>{children}</div>;
}

export function Placard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="placard">
      <span className="eyebrow">{label}</span>
      <span className="font-mono text-sm text-ink">{children}</span>
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <span className="eyebrow">{children}</span>;
}

// Inline message block, visually distinct for errors versus notices.
export function Notice({
  tone = "error",
  children,
  testId,
}: {
  tone?: "error" | "info";
  children: ReactNode;
  testId?: string;
}) {
  const toneClass = tone === "error" ? "text-destructive" : "text-muted";
  return (
    <p className={`text-sm ${toneClass}`} role={tone === "error" ? "alert" : undefined} data-testid={testId}>
      {children}
    </p>
  );
}
