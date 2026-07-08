const logos = import.meta.glob('@/assets/logos/**/*.{png,jpg,jpeg,svg}');

const logoAltTexts = {
  zzdats: 'ZZ Dats logo',
  wntr: 'WNTR TECH logo',
  swedbank: 'Swedbank bankas logo',
  seb: 'SEB bankas logo',
  citadele: 'Citadele bankas logo',
  bluor: 'BlueOr bankas logo',
  industra: 'Industra bankas logo',
  eparaksts: 'eParaksts.lv logo',
  'eparaksts-mobile': 'eParaksts mobile logo',
  eid: 'eID logo',
  'eid-scan': 'eID Scan logo',
  'smart-id': 'Smart ID logo',
  'latvija-lv': 'Latvija.lv logo',
  digimaks: 'Digimaks logo',
  dorvis: 'Dōrvis logo',
  dativa: 'Dativa logo',
};

const logoMap = {};

Object.entries(logos).forEach(([path, loader]) => {
  const squareMatch = /\/([^/]+)-square-logo(-dark)?(@\d+x)?\.png$/.exec(path);
  const defaultMatch = /\/([^/]+)-logo(-dark)?(@\d+x)?\.png$/.exec(path);

  let baseName;
  let kind = 'default';
  let theme = 'light';
  let sizeSuffix;

  // Match square logos with optional dark theme and size
  if (squareMatch) {
    [, baseName, theme, sizeSuffix] = squareMatch;
    kind = 'square';
  }
  // Match default logos with optional dark theme and size
  else if (defaultMatch) {
    [, baseName, theme, sizeSuffix] = defaultMatch;
  }

  // If baseName is undefined, skip this iteration (the file doesn't match expected patterns)
  if (!baseName) return;

  // If theme is undefined (i.e., no -dark suffix), treat it as 'light'
  if (theme === undefined) {
    theme = 'light';
  }

  // Handle size suffix (2x or 3x)
  let size;
  switch (true) {
    case sizeSuffix === '@2x':
      size = 'm';
      break;
    case sizeSuffix === '@3x':
      size = 'l';
      break;
    default:
      size = 's';
  }

  // If theme is 'dark', set theme accordingly
  if (theme === '-dark') {
    theme = 'dark';
  }

  // Initialize logoMap entry for this baseName if it doesn't exist
  if (!logoMap[baseName]) {
    logoMap[baseName] = {
      default: { light: {}, dark: {} },
      square: { light: {}, dark: {} },
      altText: logoAltTexts[baseName] || '',
    };
  }

  // store the lazy loader; the image is fetched on demand via getLogo.
  logoMap[baseName][kind][theme][size] = loader;
});

/**
 * Resolves the URL for a logo, loading it on demand.
 *
 * Logos are loaded lazily, so this is asynchronous. Returns an empty string
 * if the requested logo does not exist.
 *
 * @param {string} name - Logo base name, e.g. `'dativa'`, `'swedbank'` (see {@link getAvailableLogos}).
 * @param {string} kind - `'default'` (16:9) or `'square'` (1:1).
 * @param {string} size - Resolution variant: `'s'` (1x), `'m'` (2x), `'l'` (3x).
 * @param {string} [theme='light'] - Theme variant: `'light'` or `'dark'`.
 * @returns {Promise<string>} The resolved image URL, or `''` if the requested logo does not exist.
 */
export async function getLogo(name, kind, size, theme = 'light') {
  const loader = logoMap?.[name]?.[kind]?.[theme]?.[size];
  if (!loader) return '';
  return (await loader()).default;
}

/**
 * Returns the accessible alt text for a logo.
 *
 * @param {string} name - Logo base name, e.g. `'dativa'`, `'swedbank'`.
 * @returns {string} The alt text, or `''` if the logo has none.
 */
export function getAltText(name) {
  return logoMap?.[name]?.altText || '';
}

/**
 * Returns the list of available logo base names.
 *
 * @returns {string[]} Logo names usable as the `name` argument of {@link getLogo}.
 */
export function getAvailableLogos() {
  const logoNames = new Set();

  Object.keys(logoMap).forEach((baseName) => {
    logoNames.add(baseName);
  });

  return Array.from(logoNames);
}
