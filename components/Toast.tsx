'use client';

import { useEffect, useState } from 'react';

export default function Toast({
  message,
  visible,
  onDone,
}: {
  message: string;
  visible: boolean;
  onDone: () => void;
}) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setLeaving(false);
    const t = setTimeout(() => {
      setLeaving(true);
      setTimeout(onDone, 150);
    }, 2800);
    return () => clearTimeout(t);
  }, [visible, onDone]);

  if (!visible && !leaving) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <div
        className={`px-5 py-3 rounded-2xl bg-bg-card border border-border text-sm font-medium text-text shadow-lg shadow-black/40 ${
          leaving ? 'anim-toast-out' : 'anim-toast-in'
        }`}
      >
        {message}
      </div>
    </div>
  );
}
