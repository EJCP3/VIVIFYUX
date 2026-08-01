import { bind, play, setVolume } from 'cuelume';

export function setupSounds() {
  const pressSounds = ['tick', 'press', 'droplet'];

  // Add random sounds to all interactive elements that don't already have them
  document.querySelectorAll('a, button').forEach((el) => {
    if (!el.hasAttribute('data-cuelume-press')) {
      el.setAttribute(
        'data-cuelume-press',
        pressSounds[Math.floor(Math.random() * pressSounds.length)]
      );
    }
  });

  bind(); // wires every data-cuelume-* attribute
  setVolume(0.3); // keep global volume low

  // Expose play function to window for nested intervals if needed
  if (typeof window !== 'undefined') {
    (window as any).cuelumePlay = play;
  }
}
