import { useEffect, useRef, useState } from "react";

/**
 * Fades its children up once they scroll into view. Content stays visible
 * when IntersectionObserver is missing or reduced motion is on (CSS handles
 * the latter).
 */
export default function Reveal({ as: Tag = "div", delay = 0, className = "", children, ...rest }) {
  const ref = useRef(null);
  const [isIn, setIsIn] = useState(() => typeof IntersectionObserver === "undefined");

  useEffect(() => {
    const el = ref.current;
    if (!el || isIn) return undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIn(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [isIn]);

  return (
    <Tag
      ref={ref}
      className={`reveal${isIn ? " is-in" : ""}${className ? ` ${className}` : ""}`}
      style={delay ? { "--delay": `${delay}ms` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
}
