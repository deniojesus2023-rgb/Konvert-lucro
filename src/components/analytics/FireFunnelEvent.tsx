"use client";

import { useEffect, useRef } from "react";
import { sendFunnelEvent, type SendEventBody } from "@/lib/client/api";

/**
 * Fires one funnel event on mount, guarded against React Strict Mode's
 * double-invoke of effects in development (and any accidental remount) so
 * a single page view never gets recorded twice.
 */
export function FireFunnelEvent({ event }: { event: SendEventBody }) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    sendFunnelEvent(event);
    // Fired exactly once per mount, regardless of what `event` becomes later.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
