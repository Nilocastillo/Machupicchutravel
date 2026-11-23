// @ts-check
for (const aside of document.querySelectorAll('[data-recommendation-videos]')) {
  const dialog = aside.querySelector('dialog');
  const frame = aside.querySelector('[data-player-frame]');
  const title = aside.querySelector('[data-player-title]');
  const youtubeLink = aside.querySelector('[data-player-link]');
  if (!dialog || typeof dialog.showModal !== 'function' || !frame || !title || !(youtubeLink instanceof HTMLAnchorElement)) continue;

  /** @type {NodeListOf<HTMLButtonElement>} */
  const buttons = aside.querySelectorAll('button[data-video-id]');
  for (const button of buttons) {
    button.hidden = false;
    button.parentElement?.setAttribute('data-player-ready', '');
  }

  aside.addEventListener('click', (event) => {
    if (!(event instanceof MouseEvent) || event.defaultPrevented ||
      event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey ||
      !(event.target instanceof Element)) return;

    const button = event.target.closest('button[data-video-id]');
    if (!(button instanceof HTMLButtonElement)) return;
    const link = button.parentElement?.querySelector('a[data-video-link]');
    const id = button.dataset.videoId;
    if (!(link instanceof HTMLAnchorElement) || !id || !/^[\w-]{11}$/.test(id)) return;

    const videoTitle = link.querySelector('[data-video-title]')?.textContent?.trim() || 'YouTube';
    const autoplay = matchMedia('(prefers-reduced-motion: reduce)').matches ? '0' : '1';
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=${autoplay}&playsinline=1&rel=0`;
    iframe.title = videoTitle;
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';

    title.textContent = videoTitle;
    youtubeLink.href = link.href;
    dialog.showModal();
    frame.replaceChildren(iframe);
    event.preventDefault();
  });

  dialog.addEventListener('close', () => frame.replaceChildren());
}
