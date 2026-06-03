export const otherSelectRules = [
  { displayType: 'stack', types: ['object'], component: 'stack' },
  { displayType: 'autoComplete', types: ['string', 'array', 'object'], component: 'autoComplete' },
  { displayType: 'button', types: ['string', 'object'], component: 'button' },
  { displayType: 'camera', types: ['string'], component: 'camera' },
  { displayType: 'fileViewer', types: ['string'], component: 'fileViewer' },
  { displayType: 'flag', types: ['string', 'object'], component: 'flag' },
  { displayType: 'icon', types: ['string', 'object'], component: 'icon' },
  { displayType: 'illustration', types: ['string', 'object'], component: 'illustration' },
  { displayType: 'link', types: ['string', 'object'], component: 'link' },
  { displayType: 'contentSwitcher', types: ['string'], component: 'contentSwitcher' },
  { displayType: 'markdown', types: ['string'], component: 'markdownTextArea' },
  {
    displayType: 'personDisplay',
    types: ['string', 'object', 'array'],
    component: 'personDisplay',
  },
  { displayType: 'qr', types: ['string', 'object'], component: 'qr' },
  { displayType: 'qrScanner', types: ['object'], component: 'qrScanner' },
  { displayType: 'richTextDisplay', types: ['string', 'object'], component: 'richTextDisplay' },
  { displayType: 'stateDisplay', types: ['string', 'object'], component: 'stateDisplay' },
  { displayType: 'steps', types: ['string'], component: 'steps' },
  { displayType: 'visualPicker', types: ['string', 'array'], component: 'visualPicker' },
  { displayType: 'dayInput', types: ['integer', 'object'], component: 'dayInput' },
  { displayType: 'drawPad', types: ['string'], component: 'drawPad' },
  { displayType: 'logoDisplay', types: ['string', 'object'], component: 'logoDisplay' },
  { displayType: 'dropDownMenu', types: ['string', 'object'], component: 'dropDownMenu' },
  { displayType: 'numberSlider', types: ['integer'], component: 'numberSlider' },
  { displayType: 'rating', types: ['integer', 'number'], component: 'rating' },
  { displayType: 'checkbox', types: ['boolean'], component: 'checkbox' },
  {
    displayType: 'dataVisualizer',
    types: ['array', 'object'],
    component: 'dataVisualizer',
  },
  { displayType: 'file', types: ['array'], component: 'file' },
  { displayType: 'text', types: ['string'], component: 'text' },
  { displayType: 'dateTimeRange', types: ['object'], component: 'dateTimeRange' },
];

function matchesRowType(row, supportedTypes) {
  return supportedTypes.includes(row?.type);
}

export function getOtherSelectComponent(row, options = {}) {
  const displayType = row?.lx?.displayType;
  if (!displayType) return null;

  const excludedDisplayTypes = options?.excludedDisplayTypes || [];
  if (excludedDisplayTypes.includes(displayType)) return null;

  const rule = otherSelectRules.find((item) => item.displayType === displayType);
  if (rule && matchesRowType(row, rule.types)) {
    return rule.component;
  }

  return null;
}
