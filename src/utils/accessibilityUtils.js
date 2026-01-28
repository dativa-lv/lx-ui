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

  const themeQuery = safeMatchMedia('(prefers-color-scheme: dark)');
  let theme = 'auto';
  if (themeQuery?.matches === true) {
    theme = 'dark';
  } else if (themeQuery?.matches === false) {
    theme = 'light';
  }

  return {
    animations,
    transparency,
    fonts: false,
    touchMode,
    theme,
  };
}

export function getInitialProps() {
  return getPreferences();
}
