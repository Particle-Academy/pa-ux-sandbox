import { useEffect, useRef, type RefObject } from "react";

export function useResizeObserver(
  ref: RefObject<HTMLElement | null>,
  callback: () => void
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver(() => {
      callbackRef.current();
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref]);
}
