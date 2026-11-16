import confetti from 'canvas-confetti';

export function triggerSubtleConfetti(colors: string[] = ['#0F766E', '#F26B5B', '#3FA66B', '#E9A23B']): void {
  if (typeof window === 'undefined') return;
  const prefersReduced =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  try {
    confetti({
      particleCount: 28,
      spread: 58,
      startVelocity: 24,
      decay: 0.91,
      scalar: 0.78,
      ticks: 90,
      origin: { y: 0.72 },
      colors,
      disableForReducedMotion: true,
    });
  } catch {
    // Ignore canvas/confetti failures in headless/restricted contexts
  }
}
