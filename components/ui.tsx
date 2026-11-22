import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export type Tone = "brand" | "ok" | "warn" | "danger" | "neutral";

const TEXT: Record<Tone, string> = {
  brand: "text-brand",
  ok: "text-ok",
  warn: "text-warn",
  danger: "text-danger",
  neutral: "text-muted",
};

const SOFT: Record<Tone, string> = {
  brand: "bg-brand-soft text-brand",
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  danger: "bg-danger-soft text-danger",
  neutral: "bg-canvas text-muted",
};

export function PageHeader({
  title,
  subtitle,
  back,
  action,
}: {
  title: string;
  subtitle?: ReactNode;
  back?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {back ? <div className="mb-1 text-sm font-medium text-brand">{back}</div> : null}
        <h1 className="text-[2.15rem] font-semibold leading-tight text-ink">{title}</h1>
        {subtitle ? <p className="mt-2 text-[1.2rem] text-muted">{subtitle}</p> : null}
      </div>
      {action}
    </header>
  );
}

export function Card({
  children,
  className,
  tone,
}: {
  children: ReactNode;
  className?: string;
  tone?: "soft" | "warn" | "danger";
}) {
  return (
    <section
      className={cn(
        "rounded-xl p-6",
        tone === "soft"
          ? "bg-brand-soft"
          : tone === "warn"
            ? "bg-warn-soft"
            : tone === "danger"
              ? "bg-danger-soft"
              : "bg-white",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cn("mb-3 text-[1.45rem] font-semibold text-ink", className)}>{children}</h2>;
}

export function Stat({
  value,
  label,
  note,
  tone = "brand",
  danger,
  href,
}: {
  value: ReactNode;
  label: string;
  note?: ReactNode;
  tone?: Tone;
  danger?: boolean;
  href?: string;
}) {
  return (
    <Card tone={danger ? "danger" : undefined} className="min-w-0">
      <p className="text-[1.2rem] text-muted">{label}</p>
      <p className={cn("mt-2 text-[2.6rem] font-semibold leading-none", danger ? "text-danger" : TEXT[tone])}>
        {value}
      </p>
      {note ? <p className="mt-3 text-[1.05rem] text-muted">{note}</p> : null}
      {href ? (
        <Link href={href} className="mt-3 inline-block text-base font-medium text-brand hover:underline">
          Buka →
        </Link>
      ) : null}
    </Card>
  );
}

export function Pill({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={cn("inline-block rounded-md px-3 py-1 text-base font-semibold", SOFT[tone])}>
      {children}
    </span>
  );
}

export function Notice({
  tone = "brand",
  title,
  children,
  className,
}: {
  tone?: Tone;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const bg =
    tone === "warn"
      ? "bg-warn-soft text-warn"
      : tone === "danger"
        ? "bg-danger-soft text-danger"
        : tone === "ok"
          ? "bg-ok-soft text-ok"
          : "bg-brand-soft text-brand";
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("rounded-xl px-6 py-4", bg, className)}>
      {title ? <p className="text-[1.3rem] font-semibold">{title}</p> : null}
      {children ? <div className={cn("text-[1.1rem]", title ? "mt-1" : "")}>{children}</div> : null}
    </div>
  );
}

export function TextLink({ children, className, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link {...props} className={cn("font-semibold text-brand hover:underline", className)}>
      {children}
    </Link>
  );
}

const BUTTON_BASE =
  "inline-flex items-center justify-center rounded-lg px-6 py-3 text-[1.15rem] font-semibold transition-colors";

const BUTTON_VARIANT = {
  primary: "bg-brand text-white hover:bg-brand-dark",
  secondary: "border border-brand bg-white text-brand hover:bg-brand-soft",
  soft: "bg-brand-soft text-brand hover:bg-[#d3e7f7]",
  danger: "text-danger hover:underline",
  disabled: "cursor-not-allowed bg-[#dde1e8] text-[#6b7785]",
} as const;

export function buttonClass(variant: keyof typeof BUTTON_VARIANT = "primary", extra?: string) {
  return cn(BUTTON_BASE, BUTTON_VARIANT[variant], extra);
}

export function ButtonLink({
  variant = "primary",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: keyof typeof BUTTON_VARIANT }) {
  return <Link {...props} className={buttonClass(variant, className)} />;
}

export function DisabledButton({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      disabled
      className={cn(BUTTON_BASE, "cursor-not-allowed bg-[#dde1e8] text-[#6b7785]", className)}
    >
      {children}
    </button>
  );
}

export function Tabs({
  items,
}: {
  items: Array<{ label: string; href: string; active: boolean }>;
}) {
  return (
    <nav aria-label="Tab" className="mb-6 flex gap-8 border-b border-line">
      {items.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={t.active ? "page" : undefined}
          className={cn(
            "-mb-px border-b-[3px] px-1 pb-3 text-[1.2rem] font-semibold",
            t.active
              ? "border-brand text-brand"
              : "border-transparent text-muted hover:text-ink",
          )}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full border-collapse text-left text-[1.15rem]">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <th scope="col" className={cn("px-4 py-3 text-base font-semibold text-muted", className)}>
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
  colSpan,
}: {
  children?: ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td colSpan={colSpan} className={cn("border-t border-line px-4 py-4 align-top text-ink", className)}>
      {children}
    </td>
  );
}

export const inputClass =
  "w-full rounded-lg border border-line bg-white px-4 py-3 text-[1.1rem] text-ink placeholder:text-muted focus:border-brand";

export function Label({
  children,
  htmlFor,
  required,
}: {
  children: ReactNode;
  htmlFor?: string;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-base font-medium text-muted">
      {children}
      {required ? " *" : null}
    </label>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <Card>
      <p className="text-[1.35rem] font-semibold text-ink">{title}</p>
      {children ? <div className="mt-2 text-[1.1rem] text-muted">{children}</div> : null}
    </Card>
  );
}
