"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ToolMeta } from "@/lib/toolkit/tools";

export const fieldCls =
  "w-full h-10 rounded-xl border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 disabled:opacity-50 transition-colors";

export function Field({
  label, hint, children, className,
}: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

/** Text input for numbers that keeps what the user is typing ("2.", "2,5") while storing a number. */
export function NumInput({
  value, onChange, placeholder, className, invalid, ...rest
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  placeholder?: string;
  className?: string;
  invalid?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type">) {
  const parse = (t: string): number | null => {
    const s = t.trim().replace(",", ".");
    if (s === "") return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };
  const [text, setText] = React.useState(value === null ? "" : String(value));

  // Re-sync only when the outside value genuinely differs from what's typed.
  React.useEffect(() => {
    setText((t) => (parse(t) === value ? t : value === null ? "" : String(value)));
  }, [value]);

  return (
    <input
      {...rest}
      inputMode="decimal"
      autoComplete="off"
      value={text}
      placeholder={placeholder}
      aria-invalid={invalid || undefined}
      onChange={(e) => {
        setText(e.target.value);
        onChange(parse(e.target.value));
      }}
      className={cn(fieldCls, invalid && "border-red-500/60 focus:ring-red-500/30 focus:border-red-500/60", className)}
    />
  );
}

export function Segmented<T extends string>({
  value, onChange, options, className, size = "md", label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode }[];
  className?: string;
  size?: "sm" | "md";
  label?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("inline-flex rounded-xl bg-muted p-1 gap-0.5", className)}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex-1 rounded-lg font-medium transition-all whitespace-nowrap",
              size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm",
              active
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function ToolHeader({
  tool, actions,
}: { tool: Pick<ToolMeta, "title" | "blurb" | "icon" | "gradient">; actions?: React.ReactNode }) {
  const Icon = tool.icon;
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3.5">
        <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg", tool.gradient)}>
          <Icon size={22} />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-[28px]">{tool.title}</h1>
          <p className="mt-0.5 max-w-xl text-sm text-muted-foreground">{tool.blurb}</p>
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function EmptyState({
  icon: Icon, title, text, action, className,
}: { icon: LucideIcon; title: string; text?: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-dashed border-border bg-card/50 px-6 py-12 text-center", className)}>
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Icon size={22} />
      </div>
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {text ? <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{text}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return <section className={cn("rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5", className)}>{children}</section>;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-muted", className)} />;
}

export function Notice({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-24 z-[120] flex justify-center px-4 md:bottom-8 pointer-events-none"
    >
      <div className="animate-slide-up rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background shadow-xl">
        {text}
      </div>
    </div>
  );
}

/** Auto-clearing toast message. */
export function useNotice() {
  const [text, setText] = React.useState<string | null>(null);
  const timer = React.useRef<number | undefined>(undefined);
  const show = React.useCallback((t: string) => {
    setText(t);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setText(null), 2200);
  }, []);
  React.useEffect(() => () => window.clearTimeout(timer.current), []);
  return [text, show] as const;
}

export function FormError({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400">
      {text}
    </p>
  );
}

export function ConfirmButton({
  onConfirm, children, confirmLabel = "Ha, o'chirish", className,
}: { onConfirm: () => void; children: React.ReactNode; confirmLabel?: string; className?: string }) {
  const [armed, setArmed] = React.useState(false);
  React.useEffect(() => {
    if (!armed) return;
    const id = window.setTimeout(() => setArmed(false), 3000);
    return () => window.clearTimeout(id);
  }, [armed]);
  return (
    <button
      type="button"
      onClick={() => (armed ? onConfirm() : setArmed(true))}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border px-4 text-sm font-medium transition-colors",
        armed
          ? "border-red-500 bg-red-500 text-white"
          : "border-red-500/25 bg-red-500/10 text-red-600 hover:bg-red-500/15 dark:text-red-400",
        className,
      )}
    >
      {armed ? confirmLabel : children}
    </button>
  );
}
