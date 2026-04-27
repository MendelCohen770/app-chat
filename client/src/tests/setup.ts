import '@testing-library/jest-dom/vitest';

if (!window.requestAnimationFrame) {
  window.requestAnimationFrame = (cb: FrameRequestCallback): number =>
    window.setTimeout(() => cb(performance.now()), 0);
}
