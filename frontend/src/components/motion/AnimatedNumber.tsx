import { useEffect, useRef } from 'react';
import { useMotionValue, useSpring, useTransform, motion } from 'framer-motion';

export interface AnimatedNumberProps {
  value: number;
  className?: string;
  springOptions?: {
    bounce?: number;
    duration?: number;
  };
}

export function AnimatedNumber({
  value,
  className = '',
  springOptions = {
    bounce: 0,
    duration: 1000,
  },
}: AnimatedNumberProps) {
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, springOptions);
  const display = useTransform(spring, (latest) => Math.round(latest).toLocaleString());

  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    motionVal.set(value);
  }, [motionVal, value]);

  return <motion.span ref={ref} className={className}>{display}</motion.span>;
}
