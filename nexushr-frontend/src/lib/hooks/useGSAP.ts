'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';

/**
 * Custom hook for GSAP animations in React components.
 * Provides utilities for common animation patterns.
 */
export function useAnimateIn(options?: { delay?: number; stagger?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const children = containerRef.current.children;
    if (children.length === 0) return;

    gsap.fromTo(
      Array.from(children),
      { opacity: 0, y: 20, scale: 0.97 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.5,
        ease: 'power3.out',
        stagger: options?.stagger ?? 0.08,
        delay: options?.delay ?? 0.1,
      }
    );

    return () => {
      gsap.killTweensOf(Array.from(children));
    };
  }, [options?.delay, options?.stagger]);

  return containerRef;
}

/**
 * Animate a number counting up from 0 to the target value.
 */
export function useCountUp(target: number | string, duration = 1.2) {
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!ref.current || hasAnimated.current) return;

    const numTarget = typeof target === 'string' ? parseFloat(target) : target;
    if (isNaN(numTarget)) {
      ref.current.textContent = String(target);
      return;
    }

    hasAnimated.current = true;
    const obj = { value: 0 };

    gsap.to(obj, {
      value: numTarget,
      duration,
      ease: 'power2.out',
      delay: 0.3,
      onUpdate: () => {
        if (ref.current) {
          ref.current.textContent = numTarget % 1 !== 0
            ? obj.value.toFixed(1)
            : Math.round(obj.value).toLocaleString();
        }
      },
    });

    return () => {
      gsap.killTweensOf(obj);
    };
  }, [target, duration]);

  return ref;
}

/**
 * GSAP spring animation for mount/unmount (e.g., modals, popovers).
 */
export function useSpringIn() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    gsap.fromTo(
      ref.current,
      { opacity: 0, scale: 0.9, y: 20 },
      { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: 'back.out(1.7)' }
    );

    return () => {
      if (ref.current) gsap.killTweensOf(ref.current);
    };
  }, []);

  return ref;
}

/**
 * Stagger cards animation — perfect for bento grids.
 */
export function useStaggerCards() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const cards = containerRef.current.querySelectorAll('[data-animate]');
    if (cards.length === 0) return;

    gsap.fromTo(
      Array.from(cards),
      { opacity: 0, y: 24, scale: 0.96 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.55,
        ease: 'power3.out',
        stagger: 0.06,
        delay: 0.15,
      }
    );

    return () => {
      gsap.killTweensOf(Array.from(cards));
    };
  }, []);

  return containerRef;
}

/**
 * Page entrance animation — slides in from left.
 */
export function usePageEntrance() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    gsap.fromTo(
      ref.current,
      { opacity: 0, x: -12 },
      { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out' }
    );

    return () => {
      if (ref.current) gsap.killTweensOf(ref.current);
    };
  }, []);

  return ref;
}
