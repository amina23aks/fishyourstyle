export function runAfterNextPaint(callback: () => void): void {
  if (typeof window === "undefined") return;

  window.requestAnimationFrame(() => {
    window.setTimeout(callback, 0);
  });
}
