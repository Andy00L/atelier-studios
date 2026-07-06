// Reusable UI primitives. Every value reads from the token sheet
// (docs/UI_DESIGN_SYSTEM.md) through the .atl-* classes in globals.css.

import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "ghost" | "destructive";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "atl-btn atl-btn-primary",
  ghost: "atl-btn atl-btn-ghost",
  destructive: "atl-btn atl-btn-destructive",
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
      className={`${BUTTON_VARIANTS[variant]} ${className}`}
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
    <div>
      <label htmlFor={name} className="atl-label">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(event) => onValueChange(event.target.value)}
        data-testid={testId}
        className="atl-input"
      />
      {error ? (
        <span
          className="mt-2 block text-xs text-destructive"
          data-testid={testId ? `${testId}-error` : undefined}
        >
          {error}
        </span>
      ) : null}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`atl-card p-6 ${className}`}>{children}</div>;
}

export function Placard({
  label,
  children,
  mono = false,
}: {
  label: string;
  children: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="atl-placard">
      <span className="atl-eyebrow">{label}</span>
      <span className={mono ? "atl-val-mono" : "atl-val"}>{children}</span>
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <span className="atl-eyebrow">{children}</span>;
}

// A panel's eyebrow-over-title heading, reused across the booking flow views.
export function PanelHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="atl-eyebrow">{eyebrow}</p>
      <h2 className="mt-[7px] font-display text-[1.6rem] font-semibold tracking-tight text-ink">{title}</h2>
    </div>
  );
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

// A shimmering skeleton block that mirrors final layout (no spinner farms).
export function Skeleton({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return <div aria-hidden="true" className={`atl-skel ${className}`} style={style} />;
}
