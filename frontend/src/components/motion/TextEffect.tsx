import { motion, type Variants } from 'framer-motion';

export interface TextEffectProps {
  children: string;
  className?: string;
  delay?: number;
  per?: 'word' | 'char';
}

export function TextEffect({
  children,
  className = '',
  delay = 0,
  per = 'word',
}: TextEffectProps) {
  const segments = per === 'word' ? children.split(' ') : children.split('');

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: per === 'word' ? 0.08 : 0.03,
        delayChildren: delay,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 12,
      filter: 'blur(4px)',
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.4,
        ease: [0.2, 0.65, 0.3, 0.9],
      },
    },
  };

  return (
    <motion.span
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ display: 'inline-block' }}
    >
      {segments.map((segment, index) => (
        <motion.span
          key={index}
          variants={itemVariants}
          style={{ display: 'inline-block', marginRight: per === 'word' ? '0.28em' : 0 }}
        >
          {segment}
        </motion.span>
      ))}
    </motion.span>
  );
}
