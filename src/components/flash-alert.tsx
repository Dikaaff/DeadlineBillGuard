"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Shows a one-off confirmation from a redirect (`?saved=1`), announces it to screen readers,
 * and then removes it from the URL so a refresh does not replay a stale success message.
 */
export function FlashAlert({ children, delay = 6000 }: { children: React.ReactNode; delay?: number }) {
  const [visible, setVisible] = React.useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const dismiss = React.useCallback(() => {
    setVisible(false);
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  React.useEffect(() => {
    const timer = setTimeout(dismiss, delay);
    return () => clearTimeout(timer);
  }, [dismiss, delay]);

  if (!visible) return null;

  return (
    <div role="status" aria-live="polite">
      {children}
    </div>
  );
}
