<script setup>
import {
  computed,
  watch,
  ref,
  onMounted,
  onBeforeUnmount,
  inject,
  defineAsyncComponent,
} from 'vue';
import LxButton from '@/components/Button.vue';
import LxIcon from '@/components/Icon.vue';
import LxDropDownMenu from '@/components/DropDownMenu.vue';
import LxBadge from '@/components/Badge.vue';
import { shortenUserName } from '@/utils/stringUtils';
import {
  getDisplayTexts,
  sessionEndsInText,
  secondsToMinutesAndSeconds,
  remToPx,
} from '@/utils/generalUtils';
import { useWindowSize, useElementSize } from '@vueuse/core';

const LxMegaMenu = defineAsyncComponent(() => import('@/components/shell/MegaMenu.vue'));
const LxEmptyState = defineAsyncComponent(() => import('@/components/EmptyState.vue'));
const LxInfoBox = defineAsyncComponent(() => import('@/components/InfoBox.vue'));
const LxAvatar = defineAsyncComponent(() => import('@/components/Avatar.vue'));

const props = defineProps({
  mode: { type: String, default: 'default' },
  userInfo: { type: Object, default: null }, // firstName, lastName, description, role, institution
  hasAvatar: { type: Boolean, default: false },
  avatarKind: { type: String, default: null }, // default, initials
  alternativeProfilesInfo: { type: Array, default: null },
  contextPersonsInfo: { type: Array, default: () => [] },
  selectedContextPerson: { type: Object, default: null },
  navItems: { type: Array, default: null },
  hasLanguagePicker: { type: Boolean, default: false },
  languages: { type: Array, default: () => [] },
  selectedLanguage: { type: Object, default: null },
  hasThemePicker: { type: Boolean, default: false },
  availableThemes: { type: Array, default: () => ['auto', 'light', 'dark'] },
  theme: { type: String, default: 'auto' },
  hasReducedAnimations: { type: Boolean, default: false },
  hasReducedTransparency: { type: Boolean, default: false },
  isTouchSensitive: { type: Boolean, default: false },
  hasAlerts: { type: Boolean, default: false },
  alertsKind: { type: String, default: 'menu' },
  clickSafeAlerts: { type: Boolean, default: false },
  alerts: { type: Array, default: () => [] },
  alertCount: { type: Number, default: null },
  alertLevel: { type: String, default: null },
  hasHelp: { type: Boolean, default: false },
  headerNavDisable: { type: Boolean, default: false },
  hasNavBar: { type: Boolean, default: false },
  hasLoginButton: { type: Boolean, default: false },

  hasMegaMenu: { type: Boolean, default: false },
  megaMenuItems: { type: Array, default: () => [] },
  megaMenuHasShowAll: { type: Boolean, default: false },
  megaMenuShowAllHref: { type: Object, default: null },
  showPrimaryMegaMenuItems: { type: Boolean, default: true },
  megaMenuGroupDefinitions: { type: Array, default: null },
  selectedMegaMenuItem: { type: String, default: null },

  hasCustomButton: { type: Boolean, default: false },
  customButtonIcon: { type: String, default: null },
  customButtonBadge: { type: String, default: null },
  customButtonBadgeType: { type: String, default: 'default' },
  customButtonBadgeIcon: { type: String, default: null },
  customButtonOpened: { type: Boolean, default: false },
  customButtonBlink: { type: Boolean, default: false },
  customButtonKind: { type: String, default: 'dropdown' }, // 'button' or 'dropdown'

  hasSpotlight: { type: Boolean, default: false },
  spotlightHasBadge: { type: Boolean, default: true },

  showIdleBadge: { type: Boolean, default: false },
  secondsToLive: { type: Number, default: null },

  headerButtonsVisibility: { type: Object, default: () => ({}) },
  headerActionsVisibility: { type: Object, default: () => ({}) },

  // When false, skip width-based collapsing and keep all eligible buttons visible (e.g. custom
  // mode, where there's no nav bar to offload overflow to and the header width can't be measured).
  enableResponsivity: { type: Boolean, default: true },

  texts: {
    type: Object,
    required: false,
    default: () => ({}),
  },
});

const textsDefault = {
  logOut: 'Iziet',
  openAlerts: 'Atvērt sarakstu',
  noAlerts: 'Nav paziņojumu',
  helpTitle: 'Palīdzība',
  alertsTitle: 'Paziņojumi',
  languagesTitle: 'Valodu izvēlne',
  contextPersonsButtonLabel: 'Konteksta personas',
  alternativeProfilesButtonLabel: 'Alternatīvie profili',
  themeLabel: 'Piekļūstamības izvēlne',
  themeTitle: 'Piekļūstamības un noformējuma izvēlne',
  themeAuto: 'Automātisks',
  themeLight: 'Gaišs',
  themeDark: 'Tumšs',
  themeContrast: 'Kontrastains',
  animations: 'Animācijas',
  transparency: 'Caurspīdīgums',
  touchMode: 'Skārienvadība',
  customizeSettings: 'Pielāgot iestatījumus',
  accessibilityTools: 'Piekļūstamības rīki',
  reduceMotionOff: 'Nē',
  reduceMotionOn: 'Jā',
  reduceTransparencyOff: 'Nē',
  reduceTransparencyOn: 'Jā',
  touchModeOff: 'Nē',
  touchModeOn: 'Jā',
  showAllLabel: 'Vairāk',
  megaMenuTitle: 'Lietotnes',
  userMenuTitle: 'Lietotāja izvēlne',
  customButton: 'Pielāgojamā poga',
  loginButtonLabel: 'Autorizēties',
  loginButtonTitle: 'Pieslēgties sistēmai',
  collapse: 'Sakļaut',
  expand: 'Izvērst',
  badgeTypes: {
    default: 'informatīvs paziņojums',
    info: 'informatīvs paziņojums',
    warning: 'brīdinājums',
    success: 'sekmīgs paziņojums',
    error: 'svarīgs paziņojums',
  },
  spotlight: {
    label: 'Lietotnes ceļvedis',
  },
  idleBadge: {
    minutesSingular: 'minūtes',
    minutes11: 'minūtes',
    minutesPluralEndsWith1: 'minūtes',
    minutesPlural: 'minūtēm',
    secondsSingular: 'sekundes',
    seconds11: 'sekundēm',
    secondsPluralEndsWith1: 'sekundes',
    secondsPlural: 'sekundēm',
    sessionEndingIn: 'Sesija beigsies pēc',
    and: 'un',
    timeCountdown: 'Laika atskaite',
  },
};

const displayTexts = computed(() => getDisplayTexts(props.texts, textsDefault));

const emits = defineEmits([
  'log-out',
  'languageChange',
  'alert-item-click',
  'alerts-click',
  'logInClick',
  'help-click',
  'megaMenuShowAllClick',
  'openAlternativeProfilesModal',
  'openContextPersonModal',
  'update:selected-context-person',
  'update:selected-language',
  'update:theme',
  'update:hasReducedAnimations',
  'update:hasReducedTransparency',
  'update:isTouchSensitive',
  'update:selectedMegaMenuItem',
  'update:customButtonOpened',
  'customButtonClick',
  'toggleSpotlight',
  'settingsClick',
  'update:headerButtonsVisibility',
  'update:headerActionsVisibility',
]);

const windowSize = useWindowSize();
const windowWidth = computed(() => windowSize.width.value);

const lxElement = computed(() => document.querySelector('.lx'));

const themeIcon = ref('accessibility');
const themeMenu = ref(null);
const languageMenu = ref(null);
const alertMenu = ref(null);
const dropDownMenu = ref(null);
const customButton = ref(null);

const closeSignal = inject('closeSignal');

const menus = [themeMenu, languageMenu, alertMenu, dropDownMenu, customButton];

watch(closeSignal, () => {
  menus.forEach((menu) => menu?.value?.closeMenu());
});

const PUBLIC_MODE_WIDTH_BREAKPOINT = 900;

const spotlightButtonRef = ref(null);
const helpButtonRef = ref(null);
const customButtonRef = ref(null);
const themeButtonRef = ref(null);
const alertButtonRef = ref(null);
const languageButtonRef = ref(null);
const megaMenuButtonRef = ref(null);
const loginButtonRef = ref(null);
const userButtonRef = ref(null);
const headerRef = inject('headerRef', ref(null));
const navToggleRef = inject('navToggleRef', ref(null));
const mainButtonRef = inject('mainButtonRef', ref(null));
const additionalNavMenuRef = inject('additionalNavMenuRef', ref(null));
const scrollUpButtonRef = inject('scrollUpButtonRef', ref(null));

function useBorderBoxElementWidth(element) {
  return useElementSize(element, undefined, { box: 'border-box' }).width;
}

const spotlightButtonWidth = useBorderBoxElementWidth(() => spotlightButtonRef.value);
const helpButtonWidth = useBorderBoxElementWidth(() => helpButtonRef.value);
const customButtonWidth = useBorderBoxElementWidth(() => customButtonRef.value);
const themeButtonWidth = useBorderBoxElementWidth(() => themeButtonRef.value);
const alertButtonWidth = useBorderBoxElementWidth(() => alertButtonRef.value);
const languageButtonWidth = useBorderBoxElementWidth(() => languageButtonRef.value);
const megaMenuButtonWidth = useBorderBoxElementWidth(() => megaMenuButtonRef.value);
const loginButtonWidth = useBorderBoxElementWidth(() => loginButtonRef.value);
const userButtonWidth = useBorderBoxElementWidth(() => userButtonRef.value);
const headerWidth = useBorderBoxElementWidth(() => headerRef.value);
const navToggleWidth = useBorderBoxElementWidth(() => navToggleRef.value?.getElement?.() ?? null);
const additionalNavMenuWidth = useBorderBoxElementWidth(() => additionalNavMenuRef.value);
const scrollUpButtonWidth = useBorderBoxElementWidth(() => scrollUpButtonRef.value);

const areAllOptionalButtonsHidden = ref(false);
const isLoginButtonCollapsed = ref(false);
const isUserButtonCollapsed = ref(false);
const loginButtonVariant = computed(() => (isLoginButtonCollapsed.value ? 'icon-only' : 'default'));

const showGoBackButtonComputed = computed(() => {
  const additionalNavMenuWidthMinRem = 6;
  const additionalNavMenuWidthMinPx = remToPx(additionalNavMenuWidthMinRem);

  return (
    additionalNavMenuWidth.value >= additionalNavMenuWidthMinPx &&
    !areAllOptionalButtonsHidden.value &&
    !isLoginButtonCollapsed.value &&
    !isUserButtonCollapsed.value
  );
});
const showScrollUpButtonComputed = computed(() => {
  const scrollUpButtonWidthMinRem = 10;
  const scrollUpButtonWidthMinPx = remToPx(scrollUpButtonWidthMinRem);

  return (
    scrollUpButtonWidth.value >= scrollUpButtonWidthMinPx &&
    !areAllOptionalButtonsHidden.value &&
    !isLoginButtonCollapsed.value &&
    !isUserButtonCollapsed.value
  );
});

function updateHeaderActionsVisibility(showGoBackButton, showScrollUpButton) {
  if (
    props.headerActionsVisibility?.showGoBackButton === showGoBackButton &&
    props.headerActionsVisibility?.showScrollUpButton === showScrollUpButton
  ) {
    return;
  }

  emits('update:headerActionsVisibility', {
    showGoBackButton,
    showScrollUpButton,
  });
}

watch(
  [showGoBackButtonComputed, showScrollUpButtonComputed],
  ([showGoBackButton, showScrollUpButton]) => {
    updateHeaderActionsVisibility(showGoBackButton, showScrollUpButton);
  },
  { immediate: true }
);

watch(
  isUserButtonCollapsed,
  (isUserButtonCollapsedNew) => {
    userButtonRef.value?.classList.toggle('lx-user-button-collapsed', isUserButtonCollapsedNew);
    mainButtonRef.value?.classList.toggle('lx-main-button-static', isUserButtonCollapsedNew);
  },
  { immediate: true }
);

watch(
  isLoginButtonCollapsed,
  (isLoginButtonCollapsedNew) => {
    mainButtonRef.value?.classList.toggle('lx-main-button-static', isLoginButtonCollapsedNew);
  },
  { immediate: true }
);

const buttonWidthRefs = {
  spotlight: spotlightButtonWidth,
  help: helpButtonWidth,
  custom: customButtonWidth,
  theme: themeButtonWidth,
  alert: alertButtonWidth,
  language: languageButtonWidth,
  megaMenu: megaMenuButtonWidth,
  login: loginButtonWidth,
  user: userButtonWidth,
};
const buttonWidthKeys = Object.keys(buttonWidthRefs);
const buttonWidthEntries = Object.entries(buttonWidthRefs);
const buttonWidthSources = Object.values(buttonWidthRefs);

const buttonNaturalWidths = {
  spotlight: 0,
  help: 0,
  custom: 0,
  theme: 0,
  alert: 0,
  language: 0,
  megaMenu: 0,
  login: 0,
  user: 0,
};

function updateButtonNaturalWidths() {
  buttonWidthEntries.forEach(([key, widthRef]) => {
    if (widthRef.value > 0) {
      buttonNaturalWidths[key] = widthRef.value;
    }
  });
}

const buttonsEligibility = computed(() => ({
  spotlight: props.hasSpotlight,
  help: props.hasHelp,
  custom: props.hasCustomButton,
  theme: props.hasThemePicker,
  alert: props.hasAlerts,
  language: props.hasLanguagePicker,
  megaMenu: props.hasMegaMenu,
  login: props.hasLoginButton && !props.userInfo,
  user: !!props.userInfo,
}));
const buttonsEligibilitySources = buttonWidthKeys.map((key) => () => buttonsEligibility.value[key]);

function getButtonWidth(key) {
  if (!buttonsEligibility.value[key]) {
    return 0;
  }
  return buttonNaturalWidths[key] || buttonWidthRefs[key]?.value || 0;
}

// Lower number = higher priority to keep visible.
const buttonsPriority = {
  spotlight: 5,
  theme: 3,
  language: 4,
  megaMenu: 2,
  login: 1,
};

const ALWAYS_VISIBLE_BUTTON_KEYS = ['help', 'custom', 'alert', 'user'];
const OPTIONAL_BUTTON_KEYS = ['spotlight', 'theme', 'language', 'megaMenu', 'login'];
const LOGIN_ICON_ONLY_ALLOWED_MODES = new Set(['default', 'public', 'latvijalv', 'full-screen']);

/** @type {{ spotlight: boolean, theme: boolean, language: boolean, megaMenu: boolean, login: boolean }} */
const DEFAULT_BUTTONS_VISIBILITY = {
  spotlight: true,
  theme: true,
  language: true,
  megaMenu: true,
  login: true,
};

const buttonsVisibility = ref({ ...DEFAULT_BUTTONS_VISIBILITY });

const buttonVisibilitySources = OPTIONAL_BUTTON_KEYS.map(
  (key) => () => (props.hasNavBar ? props.headerButtonsVisibility : buttonsVisibility.value)?.[key]
);

watch(
  [() => props.hasNavBar, ...buttonVisibilitySources, ...buttonsEligibilitySources],
  () => {
    if (!props.hasNavBar) {
      const visibleEligibleButtons = Object.fromEntries(
        Object.entries(buttonsVisibility.value ?? {}).filter(
          ([key]) => buttonsEligibility.value[key]
        )
      );
      emits('update:headerButtonsVisibility', visibleEligibleButtons);
    }
  },
  { immediate: true }
);

watch(
  [() => props.hasNavBar, ...buttonVisibilitySources],
  () => {
    if (!props.hasNavBar) {
      return;
    }

    const next = {
      ...buttonsVisibility.value,
      ...props.headerButtonsVisibility,
    };
    const changed = Object.keys(next).some((k) => buttonsVisibility.value[k] !== next[k]);
    if (changed) {
      buttonsVisibility.value = next;
    }
  },
  { immediate: true }
);

function resetButtonsVisibility() {
  buttonsVisibility.value = { ...DEFAULT_BUTTONS_VISIBILITY };
  areAllOptionalButtonsHidden.value = false;
  isLoginButtonCollapsed.value = false;
  isUserButtonCollapsed.value = false;
  mainButtonRef.value?.classList.remove('lx-main-button-collapsed');
}

let buttonsVisibilityFrame = null;

function handlePublicModeVisibility() {
  const shouldCollapse =
    windowWidth.value > PUBLIC_MODE_WIDTH_BREAKPOINT && windowWidth.value < 1000;

  isLoginButtonCollapsed.value = shouldCollapse;
  isUserButtonCollapsed.value = shouldCollapse;
}

function handleCoverModeVisibility(availableWidth) {
  const buttonsGroup = headerRef.value?.querySelector('.lx-group:last-of-type');

  if (buttonsGroup === null) return;

  if (windowWidth.value >= 500) {
    buttonsGroup.style.gap = '';
    return;
  }

  const marginPx = remToPx(
    Number.parseFloat(getComputedStyle(lxElement.value).getPropertyValue('--space-1000').trim())
  );

  const eligibleButtonKeys = buttonWidthKeys.filter((key) => buttonsEligibility.value[key]);

  const totalButtonsWidth = Math.max(
    0,
    eligibleButtonKeys.reduce((total, key) => total + getButtonWidth(key) + marginPx, 0) - marginPx
  );

  buttonsGroup.style.gap = totalButtonsWidth > availableWidth - 2 * marginPx ? 0 : '';
}

function handleDefaultModeVisibility(availableWidth) {
  if (buttonsEligibility.value.login) {
    const loginButtonWidthMinPx = remToPx(10);

    const otherButtonsWidth = buttonWidthKeys
      .filter((key) => key !== 'login')
      .reduce((total, key) => total + getButtonWidth(key), 0);

    if (
      LOGIN_ICON_ONLY_ALLOWED_MODES.has(props.mode) &&
      availableWidth - otherButtonsWidth < loginButtonWidthMinPx
    ) {
      isLoginButtonCollapsed.value = true;
    } else {
      return;
    }
  }

  if (buttonsEligibility.value.user) {
    const userButtonWidthMinPx = remToPx(8);

    const otherButtonsWidth = buttonWidthKeys
      .filter((key) => key !== 'user')
      .reduce((total, key) => total + getButtonWidth(key), 0);

    if (availableWidth - otherButtonsWidth < userButtonWidthMinPx) {
      isUserButtonCollapsed.value = true;
    } else {
      return;
    }
  }

  const requiredBaseWidth = ALWAYS_VISIBLE_BUTTON_KEYS.reduce(
    (sum, key) => (buttonsEligibility.value[key] ? sum + getButtonWidth(key) : sum),
    0
  );

  let usedWidth = requiredBaseWidth;

  const optionalEligibleKeys = OPTIONAL_BUTTON_KEYS.filter(
    (key) => buttonsEligibility.value[key]
  ).sort((a, b) => (buttonsPriority[a] ?? 0) - (buttonsPriority[b] ?? 0));

  const nextVisibility = { ...DEFAULT_BUTTONS_VISIBILITY };

  optionalEligibleKeys.forEach((key) => {
    const buttonWidth = getButtonWidth(key);
    if (usedWidth + buttonWidth <= availableWidth) {
      usedWidth += buttonWidth;
    } else {
      nextVisibility[key] = false;
    }
  });

  const isChanged = Object.keys(nextVisibility).some(
    (key) => buttonsVisibility.value[key] !== nextVisibility[key]
  );

  if (isChanged) {
    buttonsVisibility.value = nextVisibility;
  }

  areAllOptionalButtonsHidden.value = availableWidth < requiredBaseWidth;

  mainButtonRef.value?.classList.toggle(
    'lx-main-button-collapsed',
    areAllOptionalButtonsHidden.value
  );
}

function recalculateButtonsVisibility() {
  if (buttonsVisibilityFrame) {
    cancelAnimationFrame(buttonsVisibilityFrame);
  }

  buttonsVisibilityFrame = requestAnimationFrame(() => {
    if (props.hasNavBar || !props.enableResponsivity) return;

    resetButtonsVisibility();

    if (
      (props.mode === 'public' || props.mode === 'latvijalv') &&
      windowWidth.value > PUBLIC_MODE_WIDTH_BREAKPOINT
    ) {
      handlePublicModeVisibility();
      return;
    }

    const asideSizePx = remToPx(
      Number.parseFloat(getComputedStyle(lxElement.value).getPropertyValue('--aside-size').trim())
    );
    const rowSizePx = remToPx(
      Number.parseFloat(getComputedStyle(lxElement.value).getPropertyValue('--row-size').trim())
    );
    const availableWidth = Math.max(
      0,
      headerWidth.value - (asideSizePx - rowSizePx) - navToggleWidth.value
    );

    if (props.mode === 'cover') {
      handleCoverModeVisibility(availableWidth);
      return;
    }

    handleDefaultModeVisibility(availableWidth);
  });
}

watch(
  [
    () => props.hasNavBar,
    () => props.mode,
    windowWidth,
    headerWidth,
    navToggleWidth,
    ...buttonsEligibilitySources,
    ...buttonWidthSources,
  ],
  () => {
    updateButtonNaturalWidths();
    recalculateButtonsVisibility();
  },
  { immediate: true }
);

onMounted(() => {
  if (props.mode === 'cover-digives-lite') {
    themeIcon.value = 'theme-alternative';
  } else {
    themeIcon.value = 'accessibility';
  }
});

onBeforeUnmount(() => {
  if (buttonsVisibilityFrame) {
    cancelAnimationFrame(buttonsVisibilityFrame);
    buttonsVisibilityFrame = null;
  }
});

function openAlternativeProfilesModal() {
  emits('openAlternativeProfilesModal');
}

function openContextPersonModal() {
  emits('openContextPersonModal');
}

watch(
  () => props.selectedLanguage,
  (newValue) => {
    emits('languageChange', newValue);
  }
);

const selectedContextPersonModel = computed({
  get() {
    return props.selectedContextPerson;
  },
  set(value) {
    emits('update:selected-context-person', value);
  },
});

const selectedLanguageModel = computed({
  get() {
    if (!props.selectedLanguage) {
      return props.languages[0];
    }
    return props.selectedLanguage;
  },
  set(value) {
    emits('update:selected-language', value);
  },
});

const selectedMegaMenuItemModel = computed({
  get() {
    return props.selectedMegaMenuItem;
  },
  set(value) {
    emits('update:selectedMegaMenuItem', value);
  },
});

const helpLabel = computed(() => {
  if (props.mode === 'cover' || props.mode === 'cover-digives-lite') {
    return displayTexts.value.helpTitle;
  }
  return '';
});

function logOut() {
  emits('log-out');
}

function languageChange(_id, action) {
  const language = props.languages.find((lang) => lang?.id === action);
  selectedLanguageModel.value = language;
}

function alertItemClicked(alert) {
  if (alert.clickable) {
    setTimeout(() => {
      emits('alert-item-click', alert);
    }, 50);
  }
}

function alertsClicked() {
  emits('alerts-click');
}
function loginClicked() {
  emits('logInClick');
}

function helpClicked() {
  emits('help-click');
}

const themeIcons = {
  auto: 'theme-auto',
  light: 'theme-light',
  dark: 'theme-dark',
  contrast: 'theme-contrast',
};

const themeNames = computed(() => ({
  auto: displayTexts.value.themeAuto,
  light: displayTexts.value.themeLight,
  dark: displayTexts.value.themeDark,
  contrast: displayTexts.value.themeContrast,
}));

function themeChange(theme) {
  themeIcon.value = themeIcons[theme];
  setTimeout(() => {
    if (props.mode === 'cover-digives-lite') {
      themeIcon.value = 'theme-alternative';
    } else {
      themeIcon.value = 'accessibility';
    }
  }, 1000);
  emits('update:theme', theme);
}

const fullName = computed(() => {
  if (props.userInfo && props.userInfo.firstName && props.userInfo.lastName) {
    if (props.userInfo.firstName.length + props.userInfo.lastName.length > 20)
      return shortenUserName(props.userInfo.firstName, props.userInfo.lastName);
    return `${props.userInfo.firstName} ${props.userInfo.lastName}`;
  }
  return '';
});

const navItemsUserMenu = computed(() =>
  props.navItems?.filter((item) => item.type === 'user-menu')
);

const badgeLevelMap = {
  success: 'success',
  warning: 'warning',
  error: 'error',
  info: 'info',
};

function pickBadgeLevel(level) {
  return badgeLevelMap[level] || badgeLevelMap.info;
}

const alertLevelToBadgeType = computed(() => {
  if (!props.alertLevel) {
    const tmp = {};
    tmp.value = props.alerts?.find((alert) => alert?.level === 'error');
    if (tmp.value) {
      return 'error';
    }
    tmp.value = props.alerts?.find((alert) => alert?.level === 'warning');
    if (tmp.value) {
      return 'warning';
    }
    tmp.value = props.alerts?.find((alert) => alert?.level === 'success');
    if (tmp.value) {
      return 'success';
    }
    tmp.value = props.alerts?.find((alert) => alert?.level === 'info');
    if (tmp.value) {
      return 'info';
    }
  }
  return pickBadgeLevel(props.alertLevel);
});

const alertsCount = computed(() => {
  if (!props.alertCount || props.alertCount === null) {
    return props.alerts?.length ? String(props.alerts.length) : '';
  }
  return String(props.alertCount);
});

const contextPersonFullName = computed(() => {
  if (
    props.selectedContextPerson &&
    props.selectedContextPerson.firstName &&
    props.selectedContextPerson.lastName
  ) {
    if (
      props.selectedContextPerson.firstName.length + props.selectedContextPerson.lastName.length >
      20
    ) {
      return shortenUserName(
        props.selectedContextPerson.firstName,
        props.selectedContextPerson.lastName
      );
    }

    return `${props.selectedContextPerson.firstName} ${props.selectedContextPerson.value.lastName}`;
  }

  return '';
});

const animationsModel = computed({
  get() {
    return !props.hasReducedAnimations;
  },
  set(value) {
    emits('update:hasReducedAnimations', !value);
  },
});

const touchModeModel = computed({
  get() {
    return props.isTouchSensitive;
  },
  set(value) {
    emits('update:isTouchSensitive', value);
  },
});

const transparencyModel = computed({
  get() {
    return !props.hasReducedTransparency;
  },
  set(value) {
    emits('update:hasReducedTransparency', !value);
  },
});

function triggerShowAllClick() {
  emits('megaMenuShowAllClick');
}

const themeDisplayItems = computed(() => {
  const res = [];
  if (props.availableThemes?.length > 0) {
    props.availableThemes.forEach((item) => {
      res.push({
        id: item,
        groupId: 'theme',
        selected: item === props.theme,
        name: themeNames.value[item],
        description: themeNames.value[item],
        icon: themeIcons[item],
        iconSet: 'cds',
      });
    });
  }

  res.push(
    {
      id: 'animations',
      kind: 'toggle',
      name: displayTexts.value.animations,
      texts: {
        valueYes: displayTexts.value.reduceMotionOn,
        valueNo: displayTexts.value.reduceMotionOff,
      },
      groupId: 'animations-touch',
      value: animationsModel.value,
      size: props.isTouchSensitive ? 'm' : 's',
    },
    {
      id: 'transparency',
      kind: 'toggle',
      name: displayTexts.value.transparency,
      texts: {
        valueYes: displayTexts.value.reduceTransparencyOn,
        valueNo: displayTexts.value.reduceTransparencyOff,
      },
      groupId: 'animations-touch',
      value: transparencyModel.value,
      size: props.isTouchSensitive ? 'm' : 's',
    },
    {
      id: 'touchMode',
      kind: 'toggle',
      name: displayTexts.value.touchMode,
      texts: {
        valueYes: displayTexts.value.touchModeOn,
        valueNo: displayTexts.value.touchModeOff,
      },
      groupId: 'animations-touch',
      value: touchModeModel.value,
      size: props.isTouchSensitive ? 'm' : 's',
    },
    {
      id: 'customizeSettings',
      name: displayTexts.value.customizeSettings,
      icon: 'open',
      groupId: 'customizeSettings',
    }
  );
  return res;
});

const accessibilityDisplayGroups = computed(() => [
  {
    id: 'theme',
    kind: 'tags',
  },
  {
    id: 'language',
    kind: 'tags',
  },
  {
    id: 'animations-touch',
    label: displayTexts.value.accessibilityTools,
  },
]);

function themeDropdownClicked(id, value) {
  if (id === 'animations') {
    animationsModel.value = value;
  } else if (id === 'touchMode') {
    touchModeModel.value = value;
  } else if (id === 'transparency') {
    transparencyModel.value = value;
  } else if (id === 'customizeSettings') {
    emits('settingsClick');
  } else {
    themeChange(value);
  }
}

const languagesDisplayItems = computed(() => {
  const res = [];
  if (props.languages?.length > 0) {
    props.languages.forEach((item) => {
      res.push({
        id: item?.id,
        groupId: 'language',
        selected: selectedLanguageModel.value?.id === item?.id,
        name: item?.name,
        title: item?.name,
      });
    });
  }
  return res;
});

const labelText = computed(() => displayTexts.value.alertsTitle);

const ariaLabel = computed(() => {
  const baseLabel = labelText.value;
  let label = baseLabel;

  if (alertsCount.value) {
    const badgeTypeText =
      displayTexts.value.badgeTypes[alertLevelToBadgeType.value] ||
      displayTexts.value.badgeTypes.default;

    if (alertsCount.value && alertsCount.value.trim() !== '') {
      if (alertLevelToBadgeType.value === 'default') {
        label = `${label} (${alertsCount.value})`;
      } else {
        label = `${label} (${badgeTypeText}: ${alertsCount.value})`;
      }
    } else {
      label = `${label} (${badgeTypeText})`;
    }
  }

  return label;
});

const customButtonOpenedModal = computed({
  get() {
    return props.customButtonOpened;
  },
  set(value) {
    emits('update:customButtonOpened', value);
  },
});

watch(
  () => props.customButtonOpened,
  (newValue, oldValue) => {
    if (customButton.value && newValue !== oldValue) {
      customButton.value.menuOpen = newValue;
    }
  },
  { immediate: true }
);

watch(
  () => customButton.value?.menuOpen,
  (newValue, oldValue) => {
    if (newValue !== oldValue) {
      customButtonOpenedModal.value = newValue;
    }
  }
);

function toggleSpotlight() {
  emits('toggleSpotlight');
}

const timeoutIn = computed(() => {
  const { minutes, seconds } = secondsToMinutesAndSeconds(props.secondsToLive);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

const sessionTimeoutLabel = computed(() =>
  sessionEndsInText(props.secondsToLive, displayTexts.value?.idleBadge)
);

const hasSessionTimeoutBadge = computed(
  () => props.showIdleBadge && props.secondsToLive && props.secondsToLive < 3600
);

const userInfoWrapper = ref();

watch(
  () => dropDownMenu.value?.menuOpen,
  (newValue) => {
    if (newValue) userInfoWrapper.value?.handleClose();
  }
);

const loginButtonKind = computed(() => {
  if (props.mode === 'default' || props.mode === 'latvijalv' || props.mode === 'full-screen') {
    return 'ghost';
  }
  return 'tertiary';
});
</script>

<template>
  <div v-if="!hasNavBar" class="lx-group">
    <div
      v-if="buttonsEligibility.spotlight && buttonsVisibility.spotlight"
      ref="spotlightButtonRef"
      class="lx-spotlight-button"
    >
      <LxButton
        id="lx-shell-spotlight-button"
        customClass="lx-header-button"
        kind="ghost"
        icon="information"
        :label="displayTexts.spotlight.label"
        :variant="'icon-only'"
        :disabled="headerNavDisable"
        :badge="spotlightHasBadge ? ' ' : null"
        @click="toggleSpotlight"
      />
    </div>
    <div v-if="buttonsEligibility.help" ref="helpButtonRef" class="lx-help-button">
      <LxButton
        id="lx-shell-help-button"
        customClass="lx-header-button"
        kind="ghost"
        icon="help"
        :label="helpLabel || displayTexts.helpTitle"
        :variant="mode === 'cover' || mode === 'cover-digives-lite' ? 'default' : 'icon-only'"
        :disabled="headerNavDisable"
        @click="helpClicked"
      />
    </div>
    <div
      v-if="buttonsEligibility.custom"
      ref="customButtonRef"
      class="lx-shell-custom-button"
      :class="[{ 'lx-shell-custom-button-opened': customButton?.menuOpen }]"
    >
      <LxButton
        v-if="customButtonKind === 'button'"
        id="lx-shell-custom-button"
        kind="ghost"
        variant="icon-only"
        :label="displayTexts.customButton"
        :icon="customButtonIcon"
        :badge="customButtonBadge"
        :badgeType="customButtonBadgeType"
        :badgeIcon="customButtonBadgeIcon"
        customClass="lx-header-button"
        :disabled="headerNavDisable"
        @click="emits('customButtonClick')"
      />
      <LxDropDownMenu v-else ref="customButton" :disabled="headerNavDisable">
        <LxButton
          id="lx-shell-custom-button"
          kind="ghost"
          variant="icon-only"
          tabindex="-1"
          :label="displayTexts.customButton"
          :icon="customButtonIcon"
          :badge="customButtonBadge"
          :badgeType="customButtonBadgeType"
          :badgeIcon="customButtonBadgeIcon"
          :disabled="headerNavDisable"
          customClass="lx-header-button"
        />
        <template #panel v-if="$slots.customButtonPanel">
          <slot name="customButtonPanel" />
        </template>
        <template #clickSafePanel v-if="$slots.customButtonSafePanel && !$slots.customButtonPanel">
          <slot name="customButtonSafePanel" />
        </template>
      </LxDropDownMenu>
    </div>

    <div
      v-if="buttonsEligibility.theme && buttonsVisibility.theme"
      ref="themeButtonRef"
      class="lx-theme-menu"
    >
      <LxDropDownMenu
        ref="themeMenu"
        :actionDefinitions="themeDisplayItems"
        :groupDefinitions="accessibilityDisplayGroups"
        :disabled="headerNavDisable"
        @actionClick="themeDropdownClicked"
      >
        <div class="lx-toolbar">
          <LxButton
            id="lx-shell-theme-button"
            customClass="lx-header-button"
            variant="icon-only"
            kind="ghost"
            :icon="themeIcon"
            :disabled="headerNavDisable"
            :label="displayTexts.themeLabel"
            :title="displayTexts.themeTitle"
            :tabindex="-1"
          />
        </div>
      </LxDropDownMenu>
    </div>

    <div v-if="buttonsEligibility.alert" ref="alertButtonRef" class="lx-alert-menu">
      <LxDropDownMenu
        v-if="alertsKind === 'menu' || alertsKind === 'combo'"
        ref="alertMenu"
        :disabled="headerNavDisable"
      >
        <LxButton
          id="lx-shell-alerts-button"
          customClass="lx-header-button"
          variant="icon-only"
          kind="ghost"
          icon="notifications"
          :label="displayTexts.alertsTitle"
          :badge="alertsCount"
          :badge-type="alertLevelToBadgeType"
          :badge-title="displayTexts.alertsTitle"
          :ariaLabel="ariaLabel"
          :disabled="headerNavDisable"
          :tabindex="-1"
        />

        <template v-if="clickSafeAlerts" v-slot:clickSafePanel>
          <div class="lx-button-set" role="toolbar">
            <LxButton
              v-if="alertsKind === 'combo'"
              kind="ghost"
              :label="displayTexts.openAlerts"
              :disabled="headerNavDisable"
              icon="open"
              @click="alertsClicked"
            />
          </div>
          <ol v-if="alerts?.length > 0" class="lx-alert-menu-list" role="group" aria-live="polite">
            <li
              v-for="item in alerts"
              :aria-labelledby="`alert-${item?.id}-name`"
              :aria-describedby="`alert-${item?.id}-desc`"
              :key="item?.id"
              @click="alertItemClicked(item)"
              @keyup.enter.prevent="alertItemClicked(item)"
              @keyup.space.prevent="alertItemClicked(item)"
            >
              <LxInfoBox
                :variant="item?.level"
                :label="item?.name"
                :description="item?.description"
                :id="item?.id"
                :kind="item?.clickable ? 'clickable' : 'default'"
              />
            </li>
          </ol>
          <LxEmptyState v-else :label="displayTexts.noAlerts"></LxEmptyState>
        </template>

        <template v-else v-slot:panel>
          <div class="lx-button-set" role="toolbar">
            <LxButton
              v-if="alertsKind === 'combo'"
              kind="ghost"
              :label="displayTexts.openAlerts"
              :disabled="headerNavDisable"
              icon="open"
              @click="alertsClicked"
            />
          </div>
          <ol v-if="alerts?.length > 0" class="lx-alert-menu-list" role="group" aria-live="polite">
            <li
              v-for="item in alerts"
              :aria-labelledby="`alert-${item?.id}-name`"
              :aria-describedby="`alert-${item?.id}-desc`"
              :key="item?.id"
              @click="alertItemClicked(item)"
              @keyup.enter.prevent="alertItemClicked(item)"
              @keyup.space.prevent="alertItemClicked(item)"
            >
              <LxInfoBox
                :variant="item?.level"
                :label="item?.name"
                :description="item?.description"
                :id="item?.id"
                :kind="item?.clickable ? 'clickable' : 'default'"
              />
            </li>
          </ol>
          <LxEmptyState v-else :label="displayTexts.noAlerts" />
        </template>
      </LxDropDownMenu>

      <LxButton
        v-if="alertsKind === 'button'"
        id="lx-shell-alerts-button"
        customClass="lx-header-button"
        variant="icon-only"
        kind="ghost"
        icon="notifications"
        :disabled="headerNavDisable"
        :label="displayTexts.alertsTitle"
        :badge="alertsCount"
        :badgeType="alertLevelToBadgeType"
        :badge-title="displayTexts.alertsTitle"
        :ariaLabel="ariaLabel"
        @click="alertsClicked"
      />
    </div>

    <div
      v-if="buttonsEligibility.language && buttonsVisibility.language"
      ref="languageButtonRef"
      class="lx-language-menu"
    >
      <LxDropDownMenu
        ref="languageMenu"
        :actionDefinitions="languagesDisplayItems"
        :groupDefinitions="accessibilityDisplayGroups"
        :disabled="headerNavDisable"
        @actionClick="languageChange"
      >
        <LxButton
          id="lx-shell-language-button"
          customClass="lx-header-button"
          variant="icon-only"
          kind="ghost"
          icon="language"
          :label="displayTexts.languagesTitle"
          :tabindex="-1"
          :disabled="headerNavDisable"
        />
      </LxDropDownMenu>
    </div>

    <div
      v-if="buttonsEligibility.megaMenu && buttonsVisibility.megaMenu"
      ref="megaMenuButtonRef"
      class="lx-mega-menu"
    >
      <LxMegaMenu
        id="lx-shell-mega-menu"
        :items="megaMenuItems"
        :groupDefinitions="megaMenuGroupDefinitions"
        :hasShowAll="megaMenuHasShowAll"
        :showAllHref="megaMenuShowAllHref"
        :showPrimaryMegaMenuItems="showPrimaryMegaMenuItems"
        :disabled="headerNavDisable"
        :texts="displayTexts"
        @mega-menu-show-all-click="triggerShowAllClick"
        v-model:selectedMegaMenuItem="selectedMegaMenuItemModel"
      />
    </div>
    <div
      v-if="buttonsEligibility.login && buttonsVisibility.login"
      ref="loginButtonRef"
      class="lx-login-button"
    >
      <LxButton
        id="lx-shell-login-button"
        customClass="lx-header-button"
        :kind="loginButtonKind"
        :icon="mode === 'latvijalv' ? 'user' : 'login'"
        :label="displayTexts.loginButtonLabel"
        :title="displayTexts.loginButtonTitle"
        :variant="loginButtonVariant"
        :disabled="headerNavDisable"
        @click="loginClicked"
      />
    </div>
    <div v-if="buttonsEligibility.user" ref="userButtonRef" class="lx-user-menu">
      <LxDropDownMenu ref="dropDownMenu" :disabled="headerNavDisable">
        <div
          id="lx-shell-user-button"
          :aria-label="displayTexts.userMenuTitle"
          class="lx-user-button"
          role="button"
          tabindex="-1"
        >
          <div v-if="!hasAvatar" class="lx-avatar">
            <LxIcon
              :value="!selectedContextPersonModel ? 'user' : 'context-person'"
              customClass="lx-icon"
            />
          </div>

          <LxAvatar
            v-if="hasAvatar"
            :value="fullName"
            :initialsValue="fullName"
            :kind="avatarKind"
          />

          <div class="lx-user-info">
            <div class="lx-primary">
              <template v-if="!selectedContextPersonModel">{{ fullName }}</template>
              <template v-else>{{ contextPersonFullName }}</template>
            </div>
            <div class="lx-secondary">
              <template v-if="!selectedContextPersonModel">{{ userInfo?.description }}</template>
              <template v-else>{{ selectedContextPersonModel?.description }}</template>
            </div>
          </div>

          <LxBadge v-if="hasSessionTimeoutBadge" :value="timeoutIn" class="lx-timeout-badge" />
        </div>
        <template #panel>
          <div class="user-menu-panel" :class="[{ 'has-timeout': hasSessionTimeoutBadge }]">
            <div class="lx-region user-menu-context">
              <LxAvatar size="xl" :value="fullName" :initialsValue="fullName" :kind="avatarKind" />
              <div class="lx-data">{{ fullName }}</div>
              <div class="lx-description" v-if="userInfo?.description">
                {{ userInfo?.description }}
              </div>
              <div class="lx-description" v-if="userInfo?.role">{{ userInfo?.role }}</div>
              <div class="lx-description" v-if="userInfo?.institution">
                {{ userInfo?.institution }}
              </div>
            </div>
            <div class="session-timeout-wrapper" v-if="hasSessionTimeoutBadge">
              <LxInfoBox variant="warning" :label="sessionTimeoutLabel" />
            </div>

            <LxButton
              v-if="alternativeProfilesInfo"
              kind="ghost"
              :label="displayTexts.alternativeProfilesButtonLabel"
              icon="switch"
              @click="openAlternativeProfilesModal"
            />

            <LxButton
              v-if="contextPersonsInfo"
              kind="ghost"
              :label="displayTexts.contextPersonsButtonLabel"
              icon="context-person"
              @click="openContextPersonModal"
            />

            <ul v-if="navItemsUserMenu?.length" class="lx-button-set" role="group">
              <li v-for="item in navItemsUserMenu" :key="item.label">
                <LxButton
                  kind="ghost"
                  :label="item.label"
                  :href="item.to"
                  :icon="item.icon"
                  :disabled="headerNavDisable"
                />
              </li>
            </ul>

            <ul class="lx-button-set lx-logout-button-wrapper" role="group">
              <li>
                <LxButton
                  kind="ghost"
                  icon="logout"
                  :label="displayTexts.logOut"
                  :destructive="true"
                  @click="logOut"
                />
              </li>
            </ul>
          </div>
        </template>
      </LxDropDownMenu>
    </div>
  </div>

  <template v-if="hasNavBar">
    <ul class="header-items">
      <li
        v-if="buttonsEligibility.language && !buttonsVisibility.language"
        class="lx-language-picker"
      >
        <div class="lx-language-menu">
          <LxDropDownMenu
            ref="languageMenu"
            :actionDefinitions="languagesDisplayItems"
            :groupDefinitions="accessibilityDisplayGroups"
            :disabled="headerNavDisable"
            @actionClick="languageChange"
          >
            <div class="lx-toolbar">
              <LxButton
                id="lx-shell-language-button"
                customClass="lx-header-button"
                kind="ghost"
                icon="language"
                tabindex="-1"
                :label="displayTexts.languagesTitle"
                :disabled="headerNavDisable"
              />
            </div>
          </LxDropDownMenu>
        </div>
      </li>
      <li v-if="buttonsEligibility.theme && !buttonsVisibility.theme" class="lx-theme-picker">
        <div class="lx-theme-menu">
          <LxDropDownMenu
            ref="themeMenu"
            :actionDefinitions="themeDisplayItems"
            :groupDefinitions="accessibilityDisplayGroups"
            :disabled="headerNavDisable"
            @actionClick="themeDropdownClicked"
          >
            <div class="lx-toolbar">
              <LxButton
                id="lx-shell-theme-button"
                customClass="lx-header-button"
                kind="ghost"
                :icon="themeIcon"
                :disabled="headerNavDisable"
                :label="displayTexts.themeLabel"
                :title="displayTexts.themeTitle"
                :tabindex="-1"
              />
            </div>
          </LxDropDownMenu>
        </div>
      </li>
      <li
        v-if="buttonsEligibility.spotlight && !buttonsVisibility.spotlight"
        class="lx-spotlight-button"
      >
        <div>
          <LxButton
            id="lx-shell-spotlight-button"
            customClass="lx-header-button"
            kind="ghost"
            icon="information"
            :label="displayTexts.spotlight.label"
            :disabled="headerNavDisable"
            :badge="spotlightHasBadge ? ' ' : null"
            @click="toggleSpotlight"
          />
        </div>
      </li>
    </ul>
  </template>
</template>
