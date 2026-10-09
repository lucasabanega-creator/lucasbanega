/** Accessible chapter links, with one active mark at the viewport's center. */
export function prepareChapterRail(chapters: HTMLElement[]) {
  const rail = document.querySelector<HTMLElement>('.chapter-rail');
  if (!rail) return;
  const links = [...rail.querySelectorAll<HTMLAnchorElement>('a')];
  let frame = 0;
  const update = () => {
    frame = 0;
    let active = 0;
    for (let index = 0; index < chapters.length; index++) {
      if (chapters[index].getBoundingClientRect().top <= innerHeight / 2) {
        active = index;
      }
    }
    links.forEach((link, index) => {
      if (index === active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    rail.classList.toggle('chapter-rail--cover', active === 0);
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  links.forEach((link, index) =>
    link.addEventListener('click', (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)
        return;
      event.preventDefault();
      const chapter = chapters[index];
      const target = chapter.getBoundingClientRect().top + scrollY;
      history.pushState(null, '', link.hash);
      scrollTo({
        top: target,
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'instant'
          : 'smooth',
      });
      chapter.setAttribute('tabindex', '-1');
      chapter.focus({ preventScroll: true });
    }),
  );
  update();
}
