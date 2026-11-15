'use client';

import { useEffect, useState } from 'react';

/**
 * The senpai window floats over every page, including the office, where the
 * keyboard walks the character. The office listens for this event and pauses
 * walking while the window is open, so typing "w" asks a question instead of
 * stepping forward.
 */
const EVENT = 'xpass:senpai';

export function announceSenpaiOpen(open: boolean) {
  window.dispatchEvent(new CustomEvent<boolean>(EVENT, { detail: open }));
}

export function useSenpaiOpen(): boolean {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onChange = (event: Event) => setOpen((event as CustomEvent<boolean>).detail);
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, []);
  return open;
}
