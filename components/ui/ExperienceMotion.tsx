'use client';

import { useRef } from 'react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion';

export const MOTION_EASE = [0.22, 1, 0.36, 1] as const;

type HeadlineElement = 'div' | 'h1' | 'h2' | 'p';

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  distance?: number;
  amount?: number;
  duration?: number;
  once?: boolean;
}

interface StaggerGroupProps {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  delayChildren?: number;
  amount?: number;
  once?: boolean;
}

interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
  distance?: number;
  duration?: number;
}

interface SplitHeadlineProps {
  lines: string[];
  className?: string;
  delay?: number;
  as?: HeadlineElement;
}

interface ParallaxMediaProps {
  children: React.ReactNode;
  className?: string;
  mediaClassName?: string;
  speed?: number;
  scaleFrom?: number;
  scaleTo?: number;
}

const headlineMap = {
  div: motion.div,
  h1: motion.h1,
  h2: motion.h2,
  p: motion.p,
} as const;

export function Reveal({
  children,
  className,
  delay = 0,
  distance = 32,
  amount = 0.22,
  duration = 0.8,
  once = true,
}: RevealProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={
        shouldReduceMotion
          ? { opacity: 0 }
          : { opacity: 0, y: distance, filter: 'blur(12px)' }
      }
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once, amount }}
      transition={{
        duration: shouldReduceMotion ? 0.24 : duration,
        delay,
        ease: MOTION_EASE,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerGroup({
  children,
  className,
  stagger = 0.1,
  delayChildren = 0,
  amount = 0.18,
  once = true,
}: StaggerGroupProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: shouldReduceMotion ? 0 : stagger,
            delayChildren,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  distance = 30,
  duration = 0.72,
}: StaggerItemProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      variants={{
        hidden: shouldReduceMotion
          ? { opacity: 0 }
          : { opacity: 0, y: distance, filter: 'blur(10px)' },
        visible: {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          transition: {
            duration: shouldReduceMotion ? 0.24 : duration,
            ease: MOTION_EASE,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function SplitHeadline({
  lines,
  className,
  delay = 0,
  as = 'h1',
}: SplitHeadlineProps) {
  const shouldReduceMotion = useReducedMotion();
  const Headline = headlineMap[as];

  return (
    <Headline
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: shouldReduceMotion ? 0 : 0.065,
            delayChildren: delay,
          },
        },
      }}
      className={className}
    >
      {lines.map((line, lineIndex) => (
        <span key={`${line}-${lineIndex}`} className="block overflow-hidden">
          {line.split(' ').map((word, wordIndex) => (
            <motion.span
              key={`${word}-${wordIndex}`}
              variants={{
                hidden: shouldReduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: 46, filter: 'blur(8px)' },
                visible: {
                  opacity: 1,
                  y: 0,
                  filter: 'blur(0px)',
                  transition: {
                    duration: shouldReduceMotion ? 0.24 : 0.78,
                    ease: MOTION_EASE,
                  },
                },
              }}
              className="inline-block pr-[0.22em] will-change-transform"
            >
              {word}
            </motion.span>
          ))}
        </span>
      ))}
    </Headline>
  );
}

export function ParallaxMedia({
  children,
  className,
  mediaClassName,
  speed = 40,
  scaleFrom = 1.08,
  scaleTo = 1,
}: ParallaxMediaProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(
    scrollYProgress,
    [0, 1],
    shouldReduceMotion ? [0, 0] : [-speed, speed],
  );
  const scale = useTransform(
    scrollYProgress,
    [0, 1],
    shouldReduceMotion ? [1, 1] : [scaleFrom, scaleTo],
  );

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y, scale }} className={mediaClassName}>
        {children}
      </motion.div>
    </div>
  );
}
