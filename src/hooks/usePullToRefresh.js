import { useEffect, useRef, useState } from "react";

export function usePullToRefresh(onRefresh) {
  const containerRef = useRef(null);
  const startYRef = useRef(0);
  const [isPulling, setIsPulling] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e) => {
      startYRef.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      const currentY = e.touches[0].clientY;
      const diff = currentY - startYRef.current;

      if (container.scrollTop === 0 && diff > 0) {
        setIsPulling(true);
        if (diff > 100) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = async (e) => {
      const currentY = e.changedTouches[0].clientY;
      const diff = currentY - startYRef.current;

      if (container.scrollTop === 0 && diff > 80) {
        setIsPulling(false);
        await onRefresh();
      } else {
        setIsPulling(false);
      }
    };

    container.addEventListener("touchstart", handleTouchStart);
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [onRefresh]);

  return { containerRef, isPulling };
}