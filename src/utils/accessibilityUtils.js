function safeMatchMedia(query) {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return null;
  }
  return window.matchMedia(query);
}

function getPreferences() {
  const motionQuery = safeMatchMedia('(prefers-reduced-motion: reduce)');
  const animations = motionQuery?.matches !== true;

  const transparencyQuery = safeMatchMedia('(prefers-reduced-transparency: reduce)');
  const transparency = transparencyQuery?.matches !== true;

  const touchQuery = safeMatchMedia('(pointer: coarse), (pointer: none)');
  const touchMode = touchQuery?.matches === true;

  return {
    animations,
    transparency,
    fonts: false,
    touchMode,
    theme: 'auto',
  };
}

export function getInitialProps() {
  return getPreferences();
}
