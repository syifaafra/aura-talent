"use client";

import { useEffect, useId, type ReactNode } from "react";

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  footer,
  width = "max-w-[52rem]",
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}) {
  const titleId = useId();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/55 p-4 sm:items-center"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`my-6 w-full ${width} rounded-2xl bg-white shadow-xl`}
      >
        <div className="flex items-start justify-between gap-4 px-8 pt-7">
          <div>
            <h2 id={titleId} className="text-[1.6rem] font-semibold text-ink">
              {title}
            </h2>
            {subtitle ? <p className="mt-1 text-base text-muted">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line text-lg font-semibold text-brand hover:bg-brand-soft"
          >
            ×
          </button>
        </div>
        <div className="px-8 py-5">{children}</div>
        {footer ? (
          <div className="flex justify-end gap-3 rounded-b-2xl bg-canvas/60 px-8 py-5">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
