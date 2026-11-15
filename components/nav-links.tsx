"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/nav";
import { cn } from "./ui";

export function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  // The first item is the section home and must only match exactly.
  const home = items[0]?.href;
  return (
    <ul className="space-y-1.5">
      {items.map((item) => {
        const active =
          item.href === home
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "block rounded-xl px-4 py-3.5 text-[1.3rem] leading-snug",
                active
                  ? "bg-brand-soft font-semibold text-brand"
                  : "font-medium text-ink hover:bg-canvas",
              )}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
