import { motion, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';

export interface InViewProps {
  children: ReactNode;
  variants?: Variants;
  delay?: number;
  className?: string;
  margin?: string;
}

const defaultVariants: Variants = {
  hidden: { opacity: 0, y: 16, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1.0],
    },
  },
};

export function InView({
  children,
  variants = defaultVariants,
  delay = 0,
  className = '',
}: InViewProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay }}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
}
