'use client';

import { ReactNode, useRef, useEffect } from 'react';
import gsap from 'gsap';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const els = ref.current.children;
    gsap.fromTo(
      Array.from(els),
      { opacity: 0, y: 10, x: -8 },
      { opacity: 1, y: 0, x: 0, duration: 0.4, ease: 'power2.out', stagger: 0.06, delay: 0.05 }
    );
  }, []);

  return (
    <div ref={ref} className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold text-primary-dark tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
