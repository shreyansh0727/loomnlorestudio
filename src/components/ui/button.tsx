import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "clay"
  | "inverse"
  | "danger";

type ButtonSize = "sm" | "md" | "lg" | "icon";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-ink text-cream hover:bg-clay-deep active:bg-ink disabled:hover:bg-ink",
  secondary:
    "border border-ink/25 bg-transparent text-ink hover:border-ink hover:bg-ink hover:text-cream",
  ghost: "bg-transparent text-ink hover:bg-ink/5",
  clay: "bg-clay text-cream hover:bg-clay-deep",
  inverse:
    "border border-cream/35 bg-cream/10 text-cream backdrop-blur-sm hover:bg-cream hover:text-ink",
  danger: "bg-danger-solid text-white hover:bg-danger-solid-hover",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-[0.63rem] tracking-[0.15em]",
  md: "h-11 px-6 text-[0.66rem] tracking-[0.16em]",
  lg: "h-13 px-8 text-[0.68rem] tracking-[0.17em]",
  icon: "size-10 p-0",
};

export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(
    "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold uppercase transition-[color,background-color,border-color,transform] duration-300 active:translate-y-px disabled:pointer-events-none disabled:opacity-45",
    variants[variant],
    sizes[size],
    className,
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonStyles({ variant, size, className })}
      {...props}
    />
  );
}
