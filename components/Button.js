import Link from "next/link";

import Spinner from "components/Spinner.js";

const VARIANTS = {
  primary:
    "bg-primary text-white hover:bg-primary-hover focus-visible:outline-primary",
  secondary:
    "border border-border bg-surface text-text hover:bg-slate-50 focus-visible:outline-primary",
  danger:
    "bg-danger text-white hover:bg-danger-hover focus-visible:outline-danger",
  ghost: "text-primary hover:bg-slate-100 focus-visible:outline-primary",
  "ghost-danger":
    "text-danger hover:bg-danger-soft focus-visible:outline-danger",
};

function Button({
  variant = "primary",
  type = "button",
  href,
  loading = false,
  disabled = false,
  full = false,
  onClick,
  children,
}) {
  const classes = [
    "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors",
    "focus-visible:outline-2 focus-visible:outline-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50",
    VARIANTS[variant],
    full ? "w-full" : "",
  ].join(" ");

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export default Button;
