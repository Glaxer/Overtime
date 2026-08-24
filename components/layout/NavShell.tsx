"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function NavShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer whenever the route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile top bar — hidden from md up */}
      <div className="flex items-center justify-between border-b p-4 md:hidden">
        <span className="text-lg font-bold">Overtime</span>
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="rounded border px-3 py-1 text-sm"
        >
          ☰
        </button>
      </div>

      {/*
        Mobile: full-screen drawer that slides in from the left.
        Desktop (md+): sticky, viewport-tall 224px column, always visible.
      */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-full transform bg-background transition-transform duration-200 md:sticky md:top-0 md:z-auto md:h-screen md:w-56 md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Close button — mobile only */}
        <button
          onClick={() => setOpen(false)}
          aria-label="Close menu"
          className="absolute right-4 top-4 text-2xl leading-none md:hidden"
        >
          ×
        </button>

        {children}
      </div>
    </>
  );
}
