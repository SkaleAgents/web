import Link from "next/link";
import type { ComponentProps } from "react";

const variants = {
  primary:
    "bg-accent text-accent-fg hover:brightness-110 border-transparent",
  secondary:
    "bg-transparent text-ink border-line hover:bg-accent-soft",
  ghost: "bg-transparent text-ink-muted border-transparent hover:text-ink",
} as const;

type Variant = keyof typeof variants;

type ButtonProps = ComponentProps<"button"> & {
  variant?: Variant;
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      data-ui="button" data-variant={variant}
      className={`inline-flex items-center justify-center rounded-[10px] border px-3 py-2 text-sm font-semibold disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

type LinkButtonProps = ComponentProps<typeof Link> & {
  variant?: Variant;
};

export function LinkButton({
  variant = "primary",
  className = "",
  ...props
}: LinkButtonProps) {
  return (
    <Link
      data-ui="button" data-variant={variant}
      className={`inline-flex items-center justify-center rounded-[10px] border px-3 py-2 text-sm font-semibold ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

export function FieldLabel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={`block text-sm text-ink-muted ${className}`}>
      {children}
    </span>
  );
}

export function TextInput(props: ComponentProps<"input">) {
  const { className = "", ...rest } = props;
  return (
    <input
      className={`w-full rounded-[10px] border border-line bg-canvas-elevated px-3 py-2 text-ink ${className}`}
      {...rest}
    />
  );
}

export function TextArea(props: ComponentProps<"textarea">) {
  const { className = "", ...rest } = props;
  return (
    <textarea
      className={`w-full rounded-[10px] border border-line bg-canvas-elevated px-3 py-2 font-mono text-sm text-ink ${className}`}
      {...rest}
    />
  );
}

export function Select(props: ComponentProps<"select">) {
  const { className = "", ...rest } = props;
  return (
    <select
      className={`w-full rounded-[10px] border border-line bg-canvas-elevated px-3 py-2 text-ink ${className}`}
      {...rest}
    />
  );
}
