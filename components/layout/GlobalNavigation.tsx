"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

export function GlobalNavigation() {
  const pathname = usePathname();
  const { data: session } = useSession();

  if (!session || pathname === "/dashboard") {
    return null;
  }

  return (
    <div className="fixed left-4 top-4 z-50">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-slate-900/90 px-3 py-2 text-sm font-semibold text-cyan-200 shadow-lg transition hover:border-cyan-400 hover:bg-slate-800"
      >
        <span aria-hidden="true">🏠</span>
        Dashboard
      </Link>
    </div>
  );
}
