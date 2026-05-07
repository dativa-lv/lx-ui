/**
 * Bundle configuration file
 *
 * commonStyles: CSS files included in ALL bundles
 * Add shared component styles here once, not in every bundle
 *
 * bundles: Bundle-specific styles on top of commonStyles
 * Only add files specific to each bundle (themes, fonts, shell-grids, etc.)
 */

// Styles included in ALL bundles
export const commonStyles = [
  'lx-reset',
  'lx-fonts-carbon',
  'lx-pt-carbon',
  'lx-ut-carbon-light',
  'lx-ut-carbon-dark',
  'lx-ut-carbon-contrast',
  'lx-buttons',
  'lx-data-grid',
  'lx-inputs',
  'lx-steps',
  'lx-forms',
  'lx-notifications',
  'lx-modal',
  'lx-loaders',
  'lx-lists',
  'lx-expanders',
  'lx-tabs',
  'lx-animations',
  'lx-master-detail',
  'lx-ratings',
  'lx-treelist',
  'lx-map',
  'lx-data-visualizer',
  'lx-shell-grid',
  'lx-forms-grid',
  'lx-date-pickers',
  'lx-stack',
  'lx-transparency',
  'lx-cards',
  'lx-toggles',
  'lx-content-switchers',
  // add new style file names here (without .css extension)
];

// Bundle-specific styles (combined with commonStyles)
export const bundles = {
  'lx-bt-demo': ['lx-shell-grid-public'],
  'lx-bt-digives': ['lx-fonts-digives', 'lx-pt-digives', 'lx-shell-grid-digives'],
  'lx-bt-digives-lite': [
    'lx-fonts-digives-lite',
    'lx-pt-digives-lite',
    'lx-shell-grid-digives-lite',
  ],
  'lx-bt-eikis': ['lx-pt-eikis', 'lx-shell-grid-public'],
  'lx-bt-visvaris-social': ['lx-pt-visvaris-social'],
  'lx-bt-visvaris-misc': ['lx-pt-visvaris-misc'],
  'lx-bt-visvaris-client': ['lx-pt-visvaris-client'],
  'lx-bt-visvaris-data': ['lx-pt-visvaris-data'],
  'lx-bt-visvaris-filing': ['lx-pt-visvaris-filing'],
  'lx-bt-visvaris-finance': ['lx-pt-visvaris-finance'],
  'lx-bt-visvaris-personnel': ['lx-pt-visvaris-personnel'],
  'lx-bt-visvaris-property': ['lx-pt-visvaris-property'],
  'lx-bt-visvaris-education': ['lx-pt-visvaris-education'],
  'lx-bt-lvas': ['lx-pt-lvas'],
  'lx-bt-oots': ['lx-fonts-latvijalv', 'lx-pt-oots', 'lx-shell-grid-public', 'lx-pt-latvijalv'],
  'lx-bt-digimaks': ['lx-pt-digimaks', 'lx-shell-grid-digimaks-lite'],
  'lx-bt-nobid': ['lx-pt-nobid', 'lx-shell-grid-digimaks'],
  'lx-bt-droni': ['lx-pt-droni'],
  'lx-bt-shell-widget': ['lx-shell-widget', 'lx-pt-carbon', 'lx-ut-carbon-light'],
  'lx-bt-riga': ['lx-pt-riga'],
  'lx-bt-skudra': ['lx-pt-skudra'],
  'lx-bt-pro-is': ['lx-pt-pro-is', 'lx-shell-grid-public'],
  'lx-bt-dorvis': ['lx-pt-dorvis', 'lx-shell-grid-public'],
  'lx-bt-avis': ['lx-pt-avis'],
  'lx-bt-bvkb-insurance': ['lx-pt-bvkb-insurance'],
  'lx-bt-lasis': ['lx-pt-lasis'],
  'lx-bt-viddis': ['lx-pt-viddis'],
  // add new bundles here (without .css extension)
};

// Bundles that should NOT include commonStyles
export const bundlesWithoutCommonStyles = [
  'lx-bt-shell-widget',
  // add bundle names here (without .css extension)
];
