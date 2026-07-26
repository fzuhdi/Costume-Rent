"use client";

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export function MobileActionBar({
  children,
  className,
  context,
  helper,
  visible = true,
  label = 'Tindakan utama',
}) {
  const [footerVisible, setFooterVisible] = useState(false);

  useEffect(() => {
    const footer = document.querySelector('footer');
    if (!footer) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => setFooterVisible(entry.isIntersecting),
      { threshold: 0.02 },
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  if (!visible || footerVisible) return null;

  return (
    <div
      className={cn(
        'marketplace-mobile-action fixed inset-x-0 bottom-0 z-30 border-t border-[var(--mk-line)] bg-[color-mix(in_srgb,var(--mk-surface)_96%,transparent)] px-4 pt-3 backdrop-blur-xl md:hidden',
        className,
      )}
      role="region"
      aria-label={label}
    >
      <div className="mx-auto flex max-w-lg items-center gap-3">
        {context ? <div className="min-w-0 flex-1">{context}</div> : null}
        <div className={context ? 'shrink-0' : 'w-full'}>{children}</div>
      </div>
      {helper ? <div className="mx-auto mt-2 max-w-lg text-xs leading-5 text-[var(--mk-muted)]">{helper}</div> : null}
    </div>
  );
}
