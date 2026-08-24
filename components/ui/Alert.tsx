"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Variant = "success" | "error" | "warning" | "info";

const styles: Record<Variant, string> = {
  success: "border-success bg-success/10 text-success",
  error: "border-danger bg-danger/10 text-danger",
  warning: "border-warning bg-warning/10 text-warning",
  info: "border-primary bg-primary/10 text-primary"
};

const PARAMS: Variant[] = ["error", "success", "warning", "info"];
const DISMISS_MS = 10_000;

export default function Alert() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const paramVariant = PARAMS.find((p) => searchParams.get(p));
  const paramMessage = paramVariant ? searchParams.get(paramVariant) : null;

  const [alert, setAlert] = useState<{
    variant: Variant;
    message: string;
  } | null>(null);
  const [leaving, setLeaving] = useState(false);

  // Adjust state during render (allowed by React) rather than in an effect
  if (paramVariant && paramMessage && paramMessage !== alert?.message) {
    setAlert({ variant: paramVariant, message: paramMessage });
    setLeaving(false);
  }

  // Effect now only cleans the URL — no setState
  useEffect(() => {
    if (!paramVariant) return;
    const params = new URLSearchParams(searchParams);
    PARAMS.forEach((p) => params.delete(p));
    router.replace(params.size ? `${pathname}?${params}` : pathname, {
      scroll: false
    });
  }, [paramVariant, searchParams, pathname, router]);

  useEffect(() => {
    if (!alert || leaving) return;
    const timer = setTimeout(() => setLeaving(true), DISMISS_MS);
    return () => clearTimeout(timer);
  }, [alert, leaving]);

  useEffect(() => {
    if (!leaving) return;
    const timer = setTimeout(() => setAlert(null), 300);
    return () => clearTimeout(timer);
  }, [leaving]);

  if (!alert) return null;

  return (
    <div
      className={`animate-alert-in fixed left-1/2 top-4 z-50 -translate-x-1/2 transition-all duration-300 ${
        leaving ? "-translate-y-24 opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      <div
        className={`flex items-center bg-background gap-3 rounded border border-border px-4 py-2 text-sm shadow-lg ${styles[alert.variant]}`}
      >
        <span>{alert.message}</span>
        <button
          onClick={() => setLeaving(true)}
          aria-label="Dismiss"
          className="text-lg leading-none opacity-60 hover:opacity-100"
        >
          ×
        </button>
      </div>
    </div>
  );
}
