/** Desktop wheel navigation; native scrolling remains the fallback. */
export function prepareChapterScroll(chapters: HTMLElement[]) {
  const root = document.documentElement;
  const preference = matchMedia(
    '(min-width: 768px) and (min-height: 701px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)',
  );
  let frame = 0;
  let busy = false;
  let lastWheel = -Infinity;
  let releaseAt = 0;
  let lastMagnitude = 0;
  let direction = 0;
  const cancel = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    busy = false;
    releaseAt = 0;
    lastMagnitude = 0;
    direction = 0;
    lastWheel = -Infinity;
  };
  const refresh = () => {
    cancel();
    root.classList.toggle('chapter-scroll-ready', preference.matches);
  };
  const move = (target: number) => {
    const from = scrollY;
    const start = performance.now();
    // The inertia guard has a deadline; incoming events cannot extend it.
    releaseAt = start + 970;
    busy = true;
    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / 850);
      // Ease in and out keeps each arrival calm without an abrupt first frame.
      const eased =
        progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
      scrollTo({ top: from + (target - from) * eased, behavior: 'instant' });
      if (progress < 1) frame = requestAnimationFrame(step);
      else {
        frame = 0;
        busy = false;
      }
    };
    frame = requestAnimationFrame(step);
  };
  window.addEventListener(
    'wheel',
    (event) => {
      if (
        !preference.matches ||
        event.defaultPrevented ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey ||
        Math.abs(event.deltaX) >= Math.abs(event.deltaY) ||
        root.classList.contains('menu-open')
      )
        return;
      // Preserve nested scrolling, inputs and any future dialogs.
      if (
        event.target instanceof Element &&
        event.target.closest(
          'dialog, input, textarea, select, [contenteditable], [data-native-scroll]',
        )
      )
        return;
      for (
        let element = event.target instanceof Element ? event.target : null;
        element && element !== document.body;
        element = element.parentElement
      ) {
        if (
          element.scrollHeight > element.clientHeight + 1 &&
          /auto|scroll/.test(getComputedStyle(element).overflowY)
        )
          return;
      }
      if (!event.cancelable) return;
      const delta =
        event.deltaY *
        (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
      const nextDirection = Math.sign(delta);
      if (!nextDirection) return;
      const now = performance.now();
      const quiet = now - lastWheel > 160;
      const magnitude = Math.abs(delta);
      const impulse = magnitude >= 12 && magnitude > lastMagnitude * 1.8;
      const reversed = direction !== 0 && nextDirection !== direction;
      if (reversed) cancel();
      lastWheel = now;
      lastMagnitude = magnitude;
      const positions = chapters.map((chapter) => {
        const rect = chapter.getBoundingClientRect();
        return { top: rect.top + scrollY, height: rect.height };
      });
      let index = positions.findLastIndex(({ top }) => top <= scrollY + 2);
      if (index < 0) index = 0;
      const current = positions[index];
      const last = index === positions.length - 1;
      // Novedades and the footer are freely readable. Tall chapters keep their
      // native interior scrolling, including at browser zoom and enlarged text.
      if (
        (last && (nextDirection > 0 || scrollY > current.top + 2)) ||
        (current.height > innerHeight + 2 &&
          (nextDirection > 0
            ? scrollY < current.top + current.height - innerHeight - 2
            : scrollY > current.top + 2)) ||
        (index === 0 && nextDirection < 0 && scrollY <= current.top + 2)
      ) {
        cancel();
        return;
      }
      // Reversals are immediate. Same-direction inertia is absorbed only for
      // the transition and a bounded 120ms arrival window. A fresh impulse or
      // pause releases that arrival window early, while continuous input always
      // resumes after the deadline instead of requiring silence indefinitely.
      if (busy || (now < releaseAt && !quiet && !impulse)) {
        event.preventDefault();
        return;
      }
      const target =
        nextDirection > 0
          ? positions[index + 1]?.top
          : scrollY > current.top + 2
            ? current.top
            : positions[index - 1]?.top;
      if (target === undefined) return;
      event.preventDefault();
      direction = nextDirection;
      move(Math.min(target, root.scrollHeight - innerHeight));
    },
    { passive: false },
  );
  // Keyboard, links, touch, scrollbar dragging and preference changes interrupt
  // the transition immediately; focus is never moved by wheel navigation.
  window.addEventListener('keydown', cancel);
  window.addEventListener('pointerdown', cancel);
  window.addEventListener('touchstart', cancel, { passive: true });
  window.addEventListener('resize', refresh);
  window.addEventListener('hashchange', cancel);
  preference.addEventListener('change', refresh);
  refresh();
}
