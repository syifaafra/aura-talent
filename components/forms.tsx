"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { FormState } from "@/lib/form";
import { buttonClass, cn, Notice } from "./ui";

export function SubmitButton({
  children,
  pendingText = "Memproses…",
  variant = "primary",
  className,
  disabled,
  name,
  value,
}: {
  children: ReactNode;
  pendingText?: string;
  variant?: "primary" | "secondary" | "soft" | "danger";
  className?: string;
  disabled?: boolean;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  const off = pending || disabled;
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={off}
      aria-disabled={off}
      className={cn(
        buttonClass(variant, className),
        off && variant === "primary" && "cursor-not-allowed bg-[#dde1e8] text-[#6b7785] hover:bg-[#dde1e8]",
        off && variant !== "primary" && "cursor-not-allowed opacity-60",
      )}
    >
      {pending ? pendingText : children}
    </button>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.error || state.ok) ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [state]);
  if (!state.error && !state.ok) return null;
  return (
    <div ref={ref}>
      <Notice tone={state.error ? "danger" : "ok"} className="py-3">
        {state.error ?? state.ok}
      </Notice>
    </div>
  );
}

/** Client wrapper that lets a Server Component render a form around a Server Action. */
export function ActionForm({
  action,
  children,
  className,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  children: ReactNode;
  className?: string;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(action, {});
  return (
    <form action={formAction} className={className}>
      {children}
      <div className="mt-4 empty:hidden">
        <FormMessage state={state} />
      </div>
    </form>
  );
}
