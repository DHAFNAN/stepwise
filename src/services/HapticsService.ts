export interface HapticsService {
  tick(enabled: boolean): void;
  success(enabled: boolean, soundEnabled: boolean): void;
}

class WebHapticsService implements HapticsService {
  tick(enabled: boolean): void {
    if (!enabled) return;
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(10);
      } catch {
        // Ignore on unsupported browsers
      }
    }
  }

  success(enabled: boolean, soundEnabled: boolean): void {
    if (enabled && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate([12, 30, 18]);
      } catch {
        // Ignore
      }
    }

    if (soundEnabled && typeof window !== 'undefined') {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } catch {
        // Ignore audio policy block
      }
    }
  }
}

export const hapticsService: HapticsService = new WebHapticsService();
