"use client";

import React, { useEffect, useRef, useState } from "react";

interface LazyCardProps {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  threshold?: number;
  skeleton?: React.ReactNode;
  loading?: boolean;
}

export default function LazyCard({
  children,
  className = "",
  delayMs = 0,
  threshold = 0.08,
  skeleton,
  loading = false,
}: LazyCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    // If IntersectionObserver is unavailable, default to visible
    if (!("IntersectionObserver" in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      {
        threshold,
        rootMargin: "80px 0px 80px 0px", // pre-fetch slightly before coming into view
      }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [threshold]);

  return (
    <div
      ref={cardRef}
      style={{
        animationDelay: `${delayMs}ms`,
        animationFillMode: "both",
      }}
      className={`transition-all duration-300 ${
        isVisible ? "animate-card-enter opacity-100" : "opacity-0 translate-y-4"
      } ${className}`}
    >
      {loading && skeleton ? skeleton : isVisible ? children : skeleton || null}
    </div>
  );
}
