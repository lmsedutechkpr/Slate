'use client';

import {useEffect, useRef, useState} from 'react';
import {motion, useInView} from 'framer-motion';

export default function StatsCounter({value}: {value: number}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, {once: true, margin: '-80px'});
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const target = Math.max(0, value);
    const duration = 900;
    const start = performance.now();

    let raf = 0;
    const step = (time: number) => {
      const progress = Math.min((time - start) / duration, 1);
      setDisplay(Math.floor(target * progress));
      if (progress < 1) raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return (
    <motion.span ref={ref} className="text-[40px] font-extrabold text-[var(--text)]">
      {display.toLocaleString()}+
    </motion.span>
  );
}
