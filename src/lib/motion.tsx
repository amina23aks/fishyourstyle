"use client";

import React, {
  ComponentPropsWithoutRef,
  CSSProperties,
  ElementType,
  PropsWithChildren,
  forwardRef,
  useEffect,
  useMemo,
  useState,
} from "react";

type TransitionConfig = {
  duration?: number;
  easing?: string;
  delayChildren?: number;
  staggerChildren?: number;
  staggerDirection?: 1 | -1;
  when?: "beforeChildren" | "afterChildren";
  [key: string]: unknown;
};

type Variant = Omit<CSSProperties, "transition"> & {
  transition?: TransitionConfig;
};
type Variants = Record<string, Variant>;

type AnimationProps = {
  initial?: Variant | keyof Variants;
  animate?: Variant | keyof Variants;
  exit?: Variant | keyof Variants;
  whileHover?: Variant | keyof Variants;
  whileTap?: Variant | keyof Variants;
  variants?: Variants;
  transition?: TransitionConfig;
};

type MotionProps<T extends ElementType> = PropsWithChildren<
  ComponentPropsWithoutRef<T> &
    AnimationProps & {
      onAnimationComplete?: () => void;
    }
>;

const defaultTransition: Required<AnimationProps>["transition"] = {
  duration: 0.25,
  easing: "ease",
};

const resolveVariant = (
  variants: Variants | undefined,
  value: Variant | keyof Variants | undefined,
): CSSProperties | undefined => {
  if (!value) return undefined;
  const resolved = typeof value === "string" ? variants?.[value] : value;
  if (!resolved) return undefined;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { transition: _ignoredTransition, ...rest } = resolved;
  return rest;
};

const mergeStyles = (
  base: CSSProperties | undefined,
  addition: CSSProperties | undefined,
): CSSProperties | undefined => {
  if (!base) return addition;
  if (!addition) return base;
  return { ...base, ...addition };
};

function createMotionComponent<T extends ElementType>(
  Component: T,
) {
  const Wrapped = forwardRef<HTMLElement, MotionProps<T>>(
    (
      {
        children,
        className,
        style,
        initial,
        animate,
        whileHover,
        whileTap,
        transition,
        variants,
        onMouseEnter,
        onMouseLeave,
        onMouseDown,
        onMouseUp,
        onTransitionEnd,
        onAnimationComplete,
        ...rest
      },
      ref,
    ) => {
      const [currentStyle, setCurrentStyle] = useState<CSSProperties | undefined>(
        mergeStyles(style, resolveVariant(variants, initial)),
      );

      const transitionStyle = useMemo(() => {
        const resolved = transition ?? defaultTransition;
        return {
          transitionProperty: "all",
          transitionDuration: `${resolved.duration ?? defaultTransition.duration}s`,
          transitionTimingFunction: resolved.easing ?? defaultTransition.easing,
        } satisfies CSSProperties;
      }, [transition]);

      const targetStyle = useMemo(
        () => mergeStyles(style, resolveVariant(variants, animate)),
        [animate, style, variants],
      );

      useEffect(() => {
        setCurrentStyle((prev) => mergeStyles(prev, targetStyle));
      }, [targetStyle]);

      const handleHoverStart = (event: React.MouseEvent<HTMLElement>) => {
        const hoverStyle = resolveVariant(variants, whileHover);
        if (hoverStyle) {
          setCurrentStyle((prev) => mergeStyles(prev, hoverStyle));
        }
        onMouseEnter?.(event as never);
      };

      const handleHoverEnd = (event: React.MouseEvent<HTMLElement>) => {
        setCurrentStyle(targetStyle);
        onMouseLeave?.(event as never);
      };

      const handleMouseDown = (event: React.MouseEvent<HTMLElement>) => {
        const tapStyle = resolveVariant(variants, whileTap);
        if (tapStyle) {
          setCurrentStyle((prev) => mergeStyles(prev, tapStyle));
        }
        onMouseDown?.(event as never);
      };

      const handleMouseUp = (event: React.MouseEvent<HTMLElement>) => {
        setCurrentStyle(targetStyle);
        onMouseUp?.(event as never);
      };

      const handleTransitionEnd = (
        event: React.TransitionEvent<HTMLElement>,
      ) => {
        onTransitionEnd?.(event as never);
        if (event.target === event.currentTarget) {
          onAnimationComplete?.();
        }
      };

      return React.createElement(
        Component as ElementType,
        {
          ref,
          className,
          style: mergeStyles(currentStyle, transitionStyle),
          onMouseEnter: handleHoverStart,
          onMouseLeave: handleHoverEnd,
          onMouseDown: handleMouseDown,
          onMouseUp: handleMouseUp,
          onTransitionEnd: handleTransitionEnd,
          ...rest,
        },
        children,
      );
    },
  );

  Wrapped.displayName = `Motion${
    typeof Component === "string" ? `.${Component}` : "Component"
  }`;

  return Wrapped;
}

export const motion = {
  div: createMotionComponent("div"),
  section: createMotionComponent("section"),
  article: createMotionComponent("article"),
  nav: createMotionComponent("nav"),
  button: createMotionComponent("button"),
  span: createMotionComponent("span"),
  ul: createMotionComponent("ul"),
  li: createMotionComponent("li"),
  figure: createMotionComponent("figure"),
};

type AnimatePresenceProps = PropsWithChildren<{
  mode?: "sync" | "wait" | "popLayout";
}>;

export const AnimatePresence: React.FC<AnimatePresenceProps> = ({ children }) => (
  <>{children}</>
);

export type { MotionProps };
