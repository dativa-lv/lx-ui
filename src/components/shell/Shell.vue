<script setup>
import {
  computed,
  shallowRef,
  onMounted,
  watch,
  ref,
  nextTick,
  provide,
  defineAsyncComponent,
} from 'vue';
import {
  useColorMode,
  usePreferredReducedMotion,
  usePreferredReducedTransparency,
  useMutationObserver,
  useMediaQuery,
  useWindowSize,
} from '@vueuse/core';

import useLx from '@/hooks/useLx';
import LxModal from '@/components/Modal.vue';
import { lxDevUtils } from '@/utils';
import { getDisplayTexts } from '@/utils/generalUtils';
import { generateUUID } from '@/utils/stringUtils';
import { shellContextKey } from '@/components/shell/shellContext';
import { shellModeLoaders } from '@/components/shell/shellModeLoaders';

function getGlobals() {
  return /** @type {any} */ (useLx().getGlobals());
}

function getSystemId() {
  return getGlobals()?.systemId || 'lx';
}

function getItemId(item) {
  return /** @type {any} */ (item)?.id;
}

function getSpotlightElementId(item) {
  return /** @type {any} */ (item)?.elementId;
}

const LxShellModeCover = defineAsyncComponent(shellModeLoaders.cover);
const LxShellModePublic = defineAsyncComponent(shellModeLoaders.public);
const LxShellModeLatvijaLv = defineAsyncComponent(shellModeLoaders.latvijalv);
const LxShellModeDigives = defineAsyncComponent(shellModeLoaders.digives);
const LxShellModeDigivesLite = defineAsyncComponent(shellModeLoaders['digives-lite']);
const LxShellModeDigimaks = defineAsyncComponent(shellModeLoaders.digimaks);
const LxShellModeDigimaksLite = defineAsyncComponent(shellModeLoaders['digimaks-lite']);
const LxShellModeFullScreen = defineAsyncComponent(shellModeLoaders['full-screen']);
const LxShellModeDefault = defineAsyncComponent(shellModeLoaders.default);

const LxSpotlight = defineAsyncComponent(() => import('@/components/Spotlight.vue'));
const LxDialog = defineAsyncComponent(() => import('@/components/Dialog.vue'));
const LxNotification = defineAsyncComponent(() => import('@/components/Notification.vue'));
const LxAccessibilitySettings = defineAsyncComponent(() =>
  import('@/components/AccessibilitySettings.vue')
);

const themeModel = useColorMode({
  selector: '.lx',
  attribute: 'class',
  emitAuto: true,
  storageKey: `${getSystemId()}-theme`,
  modes: {
    light: 'lx-theme-light',
    dark: 'lx-theme-dark',
    auto: 'lx-theme-auto',
    contrast: 'lx-theme-contrast',
    none: '',
  },
});
provide('theme', themeModel);

const { width } = useWindowSize();

const emits = defineEmits([
  'update:notifications',
  'update:selected-language',
  'update:selected-context-person',
  'update:selected-alternative-profile',
  'update:hasReducedAnimations',
  'update:hasReducedTransparency',
  'update:hasDeviceFonts',
  'update:isTouchSensitive',
  'update:nav-bar-switch',
  'update:selectedMegaMenuItem',
  'update:customButtonOpened',
  'update:customButtonBlink',
  'update:spotlightItemCurrent',
  'goBack',
  'goHome',
  'logOut',
  'languageChange',
  'alertItemClick',
  'logInClick',
  'alertsClick',
  'helpClick',
  'contextPersonChange',
  'alternativeProfileChange',
  'megaMenuShowAllClick',
  'idleModalPrimary',
  'idleModalSecondary',
  'confirmModalClose',
  'navClick',
  'customButtonClick',
  'spotlightShowMore',
  'settingsClick',
]);

const props = defineProps({
  mode: { type: String, default: 'default' },
  systemNameShort: { type: String, required: true },
  systemName: { type: String, required: true },
  systemSubheader: { type: String, default: null },
  systemNameFormatted: { type: String, default: null },
  navItems: { type: Array, default: null },
  navItemsSelected: { type: Object, default: null },
  hideNavBar: { type: Boolean, default: false },
  userInfo: { type: Object, default: null },
  hasAvatar: { type: Boolean, default: false },
  avatarKind: { type: String, default: null },
  alternativeProfilesInfo: { type: Array, default: null },
  selectedAlternativeProfile: { type: Object, default: null },
  contextPersonsInfo: { type: Array, default: null },
  selectedContextPerson: { type: Object, default: null },
  pageLabel: { type: String, default: null },
  pageDescription: { type: String, default: null },
  pageBackLabel: { type: String, default: null },
  pageIndexPath: {
    type: [Object, String],
    default: () => {
      'home';
    },
  },
  hasLoginButton: { type: Boolean, default: false },
  pageBackPath: { type: [Object, String], default: null },
  pageBackButtonVisible: { type: Boolean, default: true },
  pageHeaderVisible: { type: Boolean, default: true },
  pageBreadcrumbs: { type: Array, default: null },
  notifications: { type: Array, default: () => [] },

  hasThemePicker: { type: Boolean, default: false },
  availableThemes: { type: Array, default: () => ['auto', 'light', 'contrast', 'dark'] },
  hasReducedAnimations: { type: Boolean, default: null },
  hasReducedTransparency: { type: Boolean, default: null },
  hasDeviceFonts: { type: Boolean, default: null },
  isTouchSensitive: { type: Boolean, default: null },

  hasLanguagePicker: { type: Boolean, default: false },
  languages: { type: Array, default: () => [] },
  selectedLanguage: { type: Object, default: null },

  hasAlerts: { type: Boolean, default: false },
  alertsKind: { type: String, default: 'menu' },
  clickSafeAlerts: { type: Boolean, default: false },
  alerts: { type: Array, default: () => [] },
  alertCount: { type: Number, default: null },
  alertLevel: { type: String, default: null },

  hasHelp: { type: Boolean, default: false },

  systemIcon: { type: String, default: null },
  coverImage: { type: String, default: '/imgs/cover-full.jpg' },
  coverImageDark: { type: String, default: '/imgs/cover-full-dark.jpg' },
  coverLogo: { type: String, default: '/imgs/logo-mid.png' },
  hasCoverLogo: { type: Boolean, default: true },
  environment: { type: Object, default: () => {} },
  headerNavDisable: { type: Boolean, default: false },
  headerNavReadOnly: { type: Boolean, default: false },
  navigating: { type: Boolean, default: false },
  hideHeaderText: { type: Boolean, default: false },

  showIdleModal: { type: Boolean, default: false },
  showIdleBadge: { type: Boolean, default: false },
  secondsToLive: { type: Number, default: null },

  confirmDialogData: { type: Object, default: () => {} },
  confirmPrimaryButtonBusy: { type: Boolean, default: false },
  confirmSecondaryButtonBusy: { type: Boolean, default: false },
  confirmPrimaryButtonDestructive: { type: Boolean, default: false },
  confirmClosesOnPrimary: { type: Boolean, default: true },
  confirmClosesOnSecondary: { type: Boolean, default: true },

  navBarSwitch: { type: Boolean, default: true },

  hasMegaMenu: { type: Boolean, default: false },
  megaMenuItems: { type: Array, default: () => [] },
  megaMenuHasShowAll: { type: Boolean, default: false },
  megaMenuShowAllHref: { type: Object, default: null },
  showPrimaryMegaMenuItems: { type: Boolean, default: true },
  megaMenuGroupDefinitions: { type: Array, default: null },
  selectedMegaMenuItem: { type: String, default: null },

  hasSkipLink: { type: Boolean, default: true },

  hasCustomButton: { type: Boolean, default: false },
  customButtonIcon: { type: String, default: null },
  customButtonBadge: { type: String, default: null },
  customButtonBadgeType: { type: String, default: 'default' },
  customButtonBadgeIcon: { type: String, default: null },
  customButtonOpened: { type: Boolean, default: false },
  customButtonBlink: { type: Boolean, default: false },
  customButtonKind: { type: String, default: 'dropdown' },

  routeName: { type: String, default: null },
  overrideDefaultStyles: { type: Boolean, default: true },

  spotlightItems: { type: Array, default: () => [] },
  spotlightItemCurrent: { type: String, default: undefined },
  spotlightHasCounter: { type: Boolean, default: true },
  spotlightHasShowMore: { type: Boolean, default: false },
  spotlightHasBadge: { type: Boolean, default: true },

  texts: { type: Object, default: () => {} },
});

const shellModeComponents = {
  cover: LxShellModeCover,
  'cover-digives-lite': LxShellModeCover,
  public: LxShellModePublic,
  latvijalv: LxShellModeLatvijaLv,
  digives: LxShellModeDigives,
  'digives-lite': LxShellModeDigivesLite,
  digimaks: LxShellModeDigimaks,
  'digimaks-lite': LxShellModeDigimaksLite,
  'full-screen': LxShellModeFullScreen,
  default: LxShellModeDefault,
};

const resolvedMode = computed(() => (shellModeComponents[props.mode] ? props.mode : 'default'));
const currentModeComponent = computed(() => shellModeComponents[resolvedMode.value]);

const textsDefault = {
  defaultBack: 'Atpakaļ',
  defaultBackTooltip: 'Atgriezties uz',
  logOut: 'Iziet',
  openAlerts: 'Atvērt sarakstu',
  noAlerts: 'Nav paziņojumu',
  openNavbar: 'Atvērt izvēlni',
  helpTitle: 'Palīdzība',
  alertsTitle: 'Paziņojumi',
  languagesTitle: 'Valodu izvēlne',
  contextPersonTitle: 'Saistīto personu dati',
  close: 'Aizvērt',
  contextPersonsLabel: 'Izvēlēties personu',
  contextPersonsInfoLabel: 'Pacients',
  contextPersonsInfoTitle: 'Konteksta persona',
  contextPersonsOwnData: 'Skatīt manus datus',
  alternativeProfilesLabel: 'Izvēlieties alternatīvu profilu',
  contextPersonsButtonLabel: 'Konteksta personas',
  alternativeProfilesButtonLabel: 'Alternatīvie profili',
  idleModalLabel: 'Tuvojas sesijas beigas',
  idleModalPrimaryLabel: 'Turpināt darbu',
  idleModalSecondaryLabel: 'Beigt darbu',
  descriptionMinutes: 'Līdz sesijas beigām ir palikušas {count} minūtes',
  descriptionMinutesSmall: 'un {count} sekundes',
  idleDescription: 'Līdz sesijas beigām ir palikušas {count} sekundes',
  themeLabel: 'Piekļūstamības izvēlne',
  themeTitle: 'Piekļūstamības un noformējuma izvēlne',
  themeAuto: 'Automātisks',
  themeLight: 'Gaišs',
  themeDark: 'Tumšs',
  themeContrast: 'Kontrastains',
  animations: 'Animācijas',
  transparency: 'Caurspīdīgums',
  fonts: 'Iekārtas fonti',
  touchMode: 'Skārienvadība',
  customizeSettings: 'Pielāgot iestatījumus',
  accessibilityTools: 'Piekļūstamības rīki',
  reduceMotionOff: 'Nē',
  reduceMotionOn: 'Jā',
  reduceTransparencyOff: 'Nē',
  reduceTransparencyOn: 'Jā',
  systemFontsOff: 'Nē',
  systemFontsOn: 'Jā',
  touchModeOff: 'Nē',
  touchModeOn: 'Jā',
  confirmModalSecondaryDefaultLabel: 'Nē',
  confirmModalPrimaryDefaultLabel: 'Jā',
  previousAlertTitle: 'Iepriekšējais paziņojums',
  nextAlertTitle: 'Nākamais paziņojums',
  userTitle: 'Lietotājs',
  menu: 'Izvēlne',
  showAllLabel: 'Vairāk',
  megaMenuTitle: 'Lietotnes',
  userMenuTitle: 'Lietotāja izvēlne',
  successSvgTitle: 'Veiksmīgs paziņojums',
  warningSvgTitle: 'Brīdinājums',
  errorSvgTitle: 'Kļūda',
  infoSvgTitle: 'Informācija',
  svgTitle: 'Paziņojums',
  skipLinkLabel: 'Pāriet uz lapas saturu',
  skipLinkTitle: 'Pāriet uz lapas saturu',
  customButton: 'Pielāgojamā poga',
  overflowNavItems: 'Atvērt papildu izvēlni',
  scrollUp: 'Atgriezties uz augšu',
  contextPersonsBirthDate: 'Dzimšanas datums',
  settings: 'Iestatījumi',
  contextPersonsTooltipLabel: 'Konteksta persona',
  contextPersonsTooltipDescription: 'Konteksta personas apraksts',
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
    close: 'Aizvērt',
    next: 'Tālāk',
    back: 'Atpakaļ',
    showMore: 'Uzzināt vairāk',
    of: 'no',
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
  accessibilitySettings: {
    title: 'Piekļūstamības iestatījumi',
    appearance: 'Vizuālais izskats',
    animations: 'Kustība un animācijas',
    fonts: 'Teksts un fonti',
    interactions: 'Mijiedarbība',
    reset: 'Atiestatīt iestatījumus',
    themeTitle: 'Noformējuma izvēle',
    transparencyTitle: 'Caurspīdīgums',
    animationsTitle: 'Animācijas',
    fontsTitle: 'Iekārtas fonti',
    touchModeTitle: 'Skārienvadība',
    transparencyDescription:
      'Caurspīdīgums ir vizuāls efekts, kas ļauj redzēt daļu no fona zem aktīviem logiem vai paneļiem. Šis iestatījums ļauj samazināt vai izslēgt caurspīdīgumu, lai fons būtu vienkrāsains, tā uzlabojot satura un fona atšķirību, padarot saturu vieglāk uztveramu. Piemērots lietotājiem ar redzes traucējumiem, koncentrēšanās grūtībām vai krāsu uztveres problēmām.',
    animationsDescription:
      'Animācijas ir vizuāli kustīgi efekti, kas parādās pārejās, klikšķos un citu elementu mijiedarbībā, piemēram, kad tiek atvērti logi vai pārslēgti izvēlnes elementi. Šis iestatījums ļauj samazināt vai izslēgt animācijas, lai saskarne būtu mierīgāka un mazāk traucējoša. Svarīgi lietotājiem ar vestibulāriem traucējumiem vai paaugstinātu jutību pret kustību.',
    fontsDescription:
      'Iekārtas fonti ir ierīces vai operētājsistēmas noklusējuma fonti. To izmantošana uzlabo teksta salasāmību un atpazīstamību, nodrošinot konsekventu un lietotājam pazīstamu teksta attēlojumu.',
    touchModeDescription:
      'Ieslēdzot skārienjutīgu režīmu, lietotne tiek pielāgota lietošanai ar pirkstu uz skārienekrāna. Tiek palielināti nospiežamie elementi (pogas, izvēlnes u.c. ), lai uzlabotu lietošanas ērtumu.',
    themeAuto: 'Automātisks',
    themeLight: 'Gaišs',
    themeDark: 'Tumšs',
    themeContrast: 'Kontrastains',
    themeAutoDescription: 'Automātiskais noformējums ņem vērā ierīces vai sistēmas iestatījumus.',
    themeLightDescription: 'Gaišs noformējums ar tumšu tekstu uz gaiša fona.',
    themeDarkDescription: 'Tumšs noformējums ar gaišu tekstu uz tumša fona.',
    themeContrastDescription:
      'Noformējums ar paaugstinātu krāsu kontrastu, kas uzlabo satura salasāmību. Īpaši piemērots lietotājiem ar redzes traucējumiem.',
    transparencyLinkLabel: 'Piekļūstamības standarti (WCAG Contrast (Minimum))',
    animationsLinkLabel: 'Piekļūstamības standarti (WCAG Animation from Interactions)',
    reduceTransparencyOn: 'Jā',
    reduceTransparencyOff: 'Nē',
    reduceMotionOn: 'Jā',
    reduceMotionOff: 'Nē',
    systemFontsOn: 'Jā',
    systemFontsOff: 'Nē',
    touchModeOn: 'Jā',
    touchModeOff: 'Nē',
  },
};

const displayTexts = computed(() => getDisplayTexts(props.texts, textsDefault));

provide(
  'availableThemes',
  computed(() => props.availableThemes)
);

const notificationModel = computed({
  get: () => props.notifications,
  set: (value) => emits('update:notifications', value),
});

const notificationMounted = ref(props.notifications?.length > 0);

watch(
  () => props.notifications?.length,
  (count) => {
    if (count > 0) {
      notificationMounted.value = true;
    }
  }
);

const selectedLanguageModel = computed({
  get() {
    if (
      !props.selectedLanguage ||
      !props.languages.some((item) => getItemId(item) === getItemId(props.selectedLanguage))
    ) {
      return props.languages[0];
    }
    return props.selectedLanguage;
  },
  set(value) {
    if (!props.selectedLanguage) {
      emits('languageChange', value);
    }
    if (props.languages.some((item) => getItemId(item) === getItemId(value))) {
      emits('update:selected-language', value);
    } else {
      lxDevUtils.log(
        'Language does not exist in the language array',
        useLx().getGlobals()?.environment,
        'info'
      );
    }
  },
});

const lxElement = /** @type {HTMLElement | null} */ (document.querySelector('.lx'));
const fontToggle = ref(false);

const deviceFontsStorageKey = ref(`${getSystemId()}-device-fonts`);

function applyDeviceFonts(isEnabled) {
  if (lxElement) {
    if (isEnabled) {
      lxElement.style.setProperty('--font-family', 'initial');
      lxElement.style.setProperty('--font-family-mono', 'initial');
    } else {
      lxElement.style.removeProperty('--font-family');
      lxElement.style.removeProperty('--font-family-mono');
    }
  }
}

const deviceFontsModel = computed({
  get() {
    if (props.hasDeviceFonts !== null) {
      return props.hasDeviceFonts;
    }
    return fontToggle.value;
  },
  set(value) {
    emits('update:hasDeviceFonts', value);
    localStorage.setItem(deviceFontsStorageKey.value, JSON.stringify(value));
    fontToggle.value = value;
    applyDeviceFonts(value);
  },
});

provide('hasDeviceFonts', deviceFontsModel);

watch(
  () => deviceFontsModel.value,
  (newValue) => {
    applyDeviceFonts(newValue);
  }
);

const animationsStorageKey = ref(`${getSystemId()}-reduced-animations`);

const defaultReducedAnimations = ref(false);

const animationsModel = computed({
  get() {
    if (props.hasReducedAnimations === null) {
      return defaultReducedAnimations.value;
    }
    return props.hasReducedAnimations;
  },
  set(value) {
    if (props.hasThemePicker) {
      emits('update:hasReducedAnimations', value);
    }
    defaultReducedAnimations.value = value;
  },
});

provide('hasReducedAnimations', animationsModel);

function animationModeChange(newValue, providedStorageKey) {
  const element = document.querySelector('.lx');

  const storageKey = providedStorageKey || animationsStorageKey.value;

  if (newValue) {
    if (element) {
      element.classList.add('lx-no-animations');
    }
  } else if (element) {
    element.classList.remove('lx-no-animations');
  }

  localStorage.setItem(storageKey, JSON.stringify(newValue));
  defaultReducedAnimations.value = newValue;
}

watch(
  () => animationsModel.value,
  (newValue) => {
    animationModeChange(newValue);
  }
);

const transparencyStorageKey = ref(`${getSystemId()}-reduced-transparency`);

const transparencyToggle = ref(false);

const transparencyModel = computed({
  get() {
    if (props.hasReducedTransparency === null) {
      return transparencyToggle.value;
    }
    return props.hasReducedTransparency;
  },
  set(value) {
    if (props.hasThemePicker) {
      emits('update:hasReducedTransparency', value);
    }
    localStorage.setItem(transparencyStorageKey.value, JSON.stringify(value));
    transparencyToggle.value = value;
  },
});

provide('hasReducedTransparency', transparencyModel);

function transparencyModeChange(newValue, providedStorageKey) {
  const element = document.querySelector('.lx');

  const storageKey = providedStorageKey || transparencyStorageKey.value;

  if (newValue) {
    if (element) {
      element.classList.add('lx-no-transparency');
    }
  } else if (element) {
    element.classList.remove('lx-no-transparency');
  }

  localStorage.setItem(storageKey, JSON.stringify(newValue));
}

watch(
  () => transparencyModel.value,
  (newValue) => {
    transparencyModeChange(newValue);
  }
);

const isTouchMode = useMediaQuery('(pointer: coarse), (pointer: none)');
const touchModeToggle = ref(false);

const touchModeStorageKey = ref(`${getSystemId()}-touch-mode`);

const touchModeModel = computed({
  get() {
    if (props.isTouchSensitive !== touchModeToggle.value) {
      return touchModeToggle.value;
    }
    return props.isTouchSensitive;
  },
  set(value) {
    if (props.hasThemePicker) {
      emits('update:isTouchSensitive', value);
    }
    touchModeToggle.value = value;
  },
});

provide('isTouchMode', touchModeToggle);

function touchModeChange(value) {
  if (lxElement) {
    lxElement.style.setProperty(
      '--row-size-dynamic',
      value ? getComputedStyle(lxElement).getPropertyValue('--row-size') : '2rem'
    );
    lxElement.classList.toggle('lx-touch-mode', value);
  }

  localStorage.setItem(touchModeStorageKey.value, JSON.stringify(value));
  touchModeToggle.value = value;
}

watch(
  () => props.isTouchSensitive,
  (value) => {
    if (value !== null && value !== touchModeToggle.value) {
      touchModeToggle.value = value;
    }
  }
);

watch(
  () => touchModeToggle.value,
  (value) => {
    touchModeChange(value);
  }
);

watch(
  () => isTouchMode.value,
  (value) => {
    touchModeChange(value);
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

const selectedAlternativeProfileModel = computed({
  get() {
    if (!props.alternativeProfilesInfo) {
      return null;
    }
    if (
      !props.selectedAlternativeProfile ||
      !props.alternativeProfilesInfo.some(
        (item) => getItemId(item) === getItemId(props.selectedAlternativeProfile)
      )
    ) {
      return props.alternativeProfilesInfo[0];
    }
    return props.selectedAlternativeProfile;
  },
  set(value) {
    if (!props.selectedAlternativeProfile) {
      emits('alternativeProfileChange', value);
    }
    if (props.alternativeProfilesInfo.some((item) => getItemId(item) === getItemId(value))) {
      emits('update:selected-alternative-profile', value);
    } else {
      lxDevUtils.log(
        'Alternative Profiles does not exist',
        useLx().getGlobals()?.environment,
        'info'
      );
    }
  },
});

const pageTitle = computed(() => {
  if (props.pageLabel) {
    return props.pageLabel;
  }
  return document.title;
});

function triggerShowAllClick() {
  emits('megaMenuShowAllClick');
}

const idleModalRef = ref();
const idleModalMounted = ref(false);
const idleModalPendingOpen = ref(false);

function ensureIdleModal(open = false) {
  if (open) {
    idleModalPendingOpen.value = true;
  }

  if (!idleModalMounted.value) {
    idleModalMounted.value = true;
    return;
  }

  if (open && idleModalRef.value) {
    idleModalRef.value.open();
    idleModalPendingOpen.value = false;
  }
}

function openAlternativeProfilesModal() {
  ensureIdleModal(true);
}

const confirmModal = ref();
const confirmModalMounted = ref(false);
const confirmModalPendingOpen = ref(false);

function ensureConfirmModal(open = false) {
  if (open) {
    confirmModalPendingOpen.value = true;
  }

  if (!confirmModalMounted.value) {
    confirmModalMounted.value = true;
    return;
  }

  if (open && confirmModal.value) {
    confirmModal.value.open();
    confirmModalPendingOpen.value = false;
  }
}

function openConfirmModal() {
  ensureConfirmModal(true);
}

watch(idleModalRef, (modal) => {
  if (modal && idleModalPendingOpen.value) {
    modal.open();
    idleModalPendingOpen.value = false;
  }
});

watch(confirmModal, (modal) => {
  if (modal && confirmModalPendingOpen.value) {
    modal.open();
    confirmModalPendingOpen.value = false;
  }
});

watch(
  () => props.confirmDialogData?.$state.isOpen,
  (newValue) => {
    if (newValue === true) {
      openConfirmModal();
    } else if (confirmModal.value) {
      confirmModalPendingOpen.value = false;
      confirmModal.value.close();
    }
  },
  { immediate: true }
);

watch(
  () => props.showIdleModal,
  (newValue) => {
    if (newValue === true) {
      openAlternativeProfilesModal();
    } else if (idleModalRef.value) {
      idleModalPendingOpen.value = false;
      idleModalRef.value.close();
    }
  },
  { immediate: true }
);

const navBarSwitchModel = computed({
  get() {
    return props.navBarSwitch;
  },
  set(value) {
    emits('update:nav-bar-switch', value);
  },
});

const navBarSwitchBasic = shallowRef(true);

function navToggle(value) {
  if (props.mode === 'digives-lite' && globalThis.innerWidth < 1000) {
    navBarSwitchModel.value = value;
    return;
  }
  if (props.mode === 'digives' || props.mode === 'digimaks' || props.mode === 'digimaks-lite') {
    navBarSwitchModel.value = value;
  } else {
    navBarSwitchBasic.value = value;
  }
}

const semiResponsiveView = computed(() => globalThis.innerWidth < 1900);

function navToggleButton() {
  if (props.mode === 'digives') {
    if (navBarSwitchModel.value === null) navBarSwitchModel.value = false;
    else navBarSwitchModel.value = !navBarSwitchModel.value;
  } else navBarSwitchBasic.value = !navBarSwitchBasic.value;
}

function goBack(route) {
  emits('goBack', route);
}

function goHome(route) {
  emits('goHome', route);
}

function logOut() {
  emits('logOut');
}

function languageChange(locale) {
  emits('languageChange', locale);
}

function contextPersonChange(contextPerson) {
  emits('contextPersonChange', contextPerson);
}

function alternativeProfileChange(alternativeProfile) {
  emits('alternativeProfileChange', alternativeProfile);
}

function alertItemClicked(alert) {
  if (alert.clickable) emits('alertItemClick', alert);
}

function alertsClicked() {
  emits('alertsClick');
}

function loginClicked() {
  emits('logInClick');
}

function helpClicked() {
  emits('helpClick');
}

function idleModalPrimaryClicked() {
  emits('idleModalPrimary');
}

function idleModalSecondaryClicked() {
  emits('idleModalSecondary');
}

async function onClosedConfirmModal() {
  const state = props.confirmDialogData?.$state?.confirmDialogState;
  const cb = state?.closeCallback;

  if (cb) {
    try {
      if (
        props.confirmClosesOnSecondary &&
        typeof props.confirmDialogData?.confirm === 'function'
      ) {
        await props.confirmDialogData.confirm(cb);
      } else if (typeof cb === 'function') {
        await cb();
      } else {
        lxDevUtils.logError('closeCallback is not a function', useLx().getGlobals()?.environment);
      }
    } catch (e) {
      lxDevUtils.logError(
        `Error while processing closeCallback: ${String(e)}`,
        useLx().getGlobals()?.environment
      );
    }
  }
  try {
    emits?.('confirmModalClose');
  } catch (e) {
    lxDevUtils.logError(
      `Failed to emit confirmModalClose: ${String(e)}`,
      useLx().getGlobals()?.environment
    );
  }
}

const computedBackgrounds = computed(() => ({
  lightImage: props.coverImage,
  darkImage: props.coverImageDark,
}));

const shell = ref();

function defineVars() {
  if (shell.value) {
    shell.value.style.setProperty(
      '--lx-cover-image-light',
      props.coverImage ? `url(${props.coverImage})` : 'none'
    );
    shell.value.style.setProperty(
      '--lx-cover-image-dark',
      props.coverImageDark ? `url(${props.coverImageDark})` : 'none'
    );
    shell.value.style.setProperty('--lx-cover-image-contrast', 'none');
  }
}

watch(
  () => computedBackgrounds,
  () => {
    defineVars();
  }
);

watch(
  () => props.mode,
  (newValue) => {
    nextTick(() => {
      if (newValue === 'cover' || newValue === 'cover-digives-lite') defineVars();
    });
  }
);

const modals = ref(null);
const poppers = ref(null);
const header = ref(null);
const main = ref(null);
const nav = ref(null);
const footer = ref(null);

function initializeTheme() {
  if (!props.hasThemePicker && props.mode !== 'digimaks-lite') {
    themeModel.value = 'none';
  }
}

function initializeAnimations() {
  const storageKey = `${getSystemId()}-reduced-animations`;

  const storedAnimations = JSON.parse(localStorage.getItem(storageKey));
  if (storedAnimations === null) {
    defaultReducedAnimations.value = usePreferredReducedMotion().value !== 'no-preference';
  } else if (props.hasReducedAnimations === null) {
    animationsModel.value = storedAnimations;
  }
  animationModeChange(animationsModel.value, storageKey);
}

function initializeTransparency() {
  const transparencyKey = `${getSystemId()}-reduced-transparency`;

  const storedTransparency = JSON.parse(localStorage.getItem(transparencyKey));
  if (storedTransparency === null) {
    transparencyToggle.value = usePreferredReducedTransparency().value !== 'no-preference';
  } else if (props.hasReducedTransparency === null) {
    transparencyModel.value = storedTransparency;
  }
  transparencyModeChange(transparencyModel.value, transparencyKey);
}

function initializeDeviceFonts() {
  const storedValue = localStorage.getItem(deviceFontsStorageKey.value);
  fontToggle.value = storedValue ? JSON.parse(storedValue) : false;
  applyDeviceFonts(deviceFontsModel.value);
}

function initializeTouchMode() {
  if (props.isTouchSensitive === null) {
    const stored = localStorage.getItem(touchModeStorageKey.value);
    touchModeToggle.value = stored === null ? isTouchMode.value : JSON.parse(stored);
  } else {
    touchModeToggle.value = props.isTouchSensitive;
  }
  touchModeChange(touchModeToggle.value);
}

function observeModals() {
  useMutationObserver(
    modals,
    () => {
      if (modals.value) {
        const hasModalChildren = modals.value.hasChildNodes();
        [header.value, main.value, nav.value, footer.value].forEach((element) => {
          if (element) {
            element.setAttribute('aria-hidden', hasModalChildren ? 'true' : 'false');
          }
        });
      }
    },
    { childList: true }
  );
}

onMounted(() => {
  initializeTheme();
  initializeAnimations();
  initializeTransparency();
  initializeDeviceFonts();
  initializeTouchMode();
  defineVars();
  observeModals();
});

function navClick(id = null) {
  emits('navClick', id);
}

const selectedMegaMenuItemModel = computed({
  get() {
    return props.selectedMegaMenuItem;
  },
  set(value) {
    emits('update:selectedMegaMenuItem', value);
  },
});

const iconMapLatvijalv = {
  success: 'check',
  warning: 'notification-warning',
  error: 'notification-warning',
  info: 'notification-info',
};

const iconMapDigives = {
  success: 'notification-success',
  warning: 'notification-warning',
  error: 'notification-error',
  info: 'notification-info',
};

function pickIcon(level, layoutMode) {
  if (layoutMode === 'latvijalv') {
    return iconMapLatvijalv[level] || iconMapLatvijalv.info;
  }
  return iconMapDigives[level] || iconMapDigives.info;
}

function pickSvgTitle(level) {
  return displayTexts.value[`${level}SvgTitle`] || displayTexts.value.svgTitle;
}

const closedAlertsKey = ref(`${getSystemId()}-closed-alerts`);

const closedAlerts = ref(JSON.parse(sessionStorage.getItem(closedAlertsKey.value) || '[]'));

function closeAlert(alert) {
  if (alert && alert.id) {
    if (!closedAlerts.value.includes(alert.id)) {
      closedAlerts.value.push(alert.id);
      sessionStorage.setItem(closedAlertsKey.value, JSON.stringify(closedAlerts.value));
    }
  }
}

const visibleAlerts = computed(() =>
  props.alerts.filter((alert) => alert && !closedAlerts.value.includes(getItemId(alert)))
);

function lvAlertItemClicked(event, alert) {
  if (event.target && event.target.closest('.lx-button')) {
    closeAlert(alert);
    return;
  }
  if (alert && alert.clickable) {
    emits('alertItemClick', alert);
  }
}

function focusFirstMainFocusableElement() {
  const mainElement = main.value;

  const focusableSelectors = [
    'a:not([disabled])',
    'button:not([disabled])',
    'input:not([disabled])',
    '[tabindex="0"]',
  ];

  if (mainElement) {
    const focusableElements = Array.from(
      mainElement.querySelectorAll(focusableSelectors.join(', '))
    );
    const firstVisibleElement = focusableElements.find((element) => element.offsetParent !== null);

    if (firstVisibleElement) {
      firstVisibleElement.focus();
    }
  }
}

const customButtonOpenedModal = computed({
  get() {
    return props.customButtonOpened;
  },
  set(value) {
    emits('update:customButtonOpened', value);
  },
});

let blinkTimeout = null;

function removeBlink() {
  const button = document.getElementById('lx-shell-custom-button');
  if (!button) return;

  if (blinkTimeout) {
    clearTimeout(blinkTimeout);
    blinkTimeout = null;
  }
  button.classList.remove('custom-button-blink', 'custom-button-after-blink');
}

function blink() {
  const button = document.getElementById('lx-shell-custom-button');
  if (!button) return;
  removeBlink();

  button.classList.add('custom-button-blink');

  blinkTimeout = setTimeout(() => {
    button.classList.remove('custom-button-blink');
    button.classList.add('custom-button-after-blink');
    blinkTimeout = null;
  }, 5000);
}

watch(
  () => props.customButtonBlink,
  (newValue) => {
    if (newValue) {
      blink();
    } else {
      removeBlink();
    }
  }
);

const confirmModalActions = computed(() => {
  const primary = {
    id: 'primary',
    kind: 'primary',
    name:
      props.confirmDialogData?.$state.confirmDialogState.primaryLabel ||
      displayTexts.value.confirmModalPrimaryDefaultLabel,
    busy:
      props.confirmDialogData?.$state.confirmDialogState.primaryBusy !== null
        ? props.confirmDialogData?.$state.confirmDialogState.primaryBusy
        : props.confirmPrimaryButtonBusy,
    destructive: props.confirmPrimaryButtonDestructive,
  };
  const secondary = {
    id: 'secondary',
    kind: 'secondary',
    name:
      props.confirmDialogData?.$state.confirmDialogState.secondaryLabel ||
      displayTexts.value.confirmModalSecondaryDefaultLabel,
    busy:
      props.confirmDialogData?.$state.confirmDialogState.secondaryBusy !== null
        ? props.confirmDialogData?.$state.confirmDialogState.secondaryBusy
        : props.confirmSecondaryButtonBusy,
  };
  return [primary, secondary];
});

function confirmModalClicked(item) {
  if (item === 'primary') {
    if (props.confirmClosesOnPrimary)
      props.confirmDialogData?.confirm(
        props.confirmDialogData?.$state.confirmDialogState.primaryCallback
      );
    else props.confirmDialogData?.$state.confirmDialogState.primaryCallback();
  } else if (props.confirmClosesOnSecondary)
    props.confirmDialogData?.confirm(
      props.confirmDialogData?.$state.confirmDialogState.secondaryCallback
    );
  else props.confirmDialogData?.$state.confirmDialogState.secondaryCallback();
}

const idleModalActions = computed(() => {
  const primary = {
    id: 'primary',
    kind: 'primary',
    name: displayTexts.value.idleModalPrimaryLabel,
  };
  const secondary = {
    id: 'secondary',
    kind: 'secondary',
    name: displayTexts.value.idleModalSecondaryLabel,
  };
  return [primary, secondary];
});

function idleModalClicked(item) {
  if (item === 'primary') {
    idleModalPrimaryClicked();
  } else {
    idleModalSecondaryClicked();
  }
}

const idleModalDescription = computed(() => {
  if (props.secondsToLive >= 60) {
    const minutes = Math.floor(props.secondsToLive / 60);
    const seconds = props.secondsToLive % 60;
    let description = displayTexts.value.descriptionMinutes.replace('{count}', minutes);
    if (seconds > 0) {
      description += ` ${displayTexts.value.descriptionMinutesSmall.replace('{count}', seconds)}`;
    }
    return description;
  }
  return displayTexts.value.idleDescription.replace('{count}', props.secondsToLive);
});

const spotlight = ref();
const spotlightVisible = ref(false);
const spotlightMounted = ref(false);
const spotlightPendingStart = ref(false);

const spotlightFallback = ref(null);

const spotlightItemCurrentModel = computed({
  get() {
    if (props.spotlightItemCurrent === undefined) {
      return spotlightFallback.value;
    }
    return props.spotlightItemCurrent;
  },
  set(value) {
    spotlightFallback.value = value;
    emits('update:spotlightItemCurrent', value);
  },
});

function spotlightStart() {
  spotlightPendingStart.value = true;

  if (!spotlightMounted.value) {
    spotlightMounted.value = true;
    return;
  }

  if (spotlight.value) {
    spotlight.value.setSpotlightItem(true);
    spotlightPendingStart.value = false;
  }
}

function spotlightEnd() {
  spotlightPendingStart.value = false;
  if (spotlight.value) {
    spotlight.value.spotlightEnd();
  }
}

watch(spotlight, (spotlightInstance) => {
  if (spotlightInstance && spotlightPendingStart.value) {
    spotlightInstance.setSpotlightItem(true);
    spotlightPendingStart.value = false;
  }
});

function toggleSpotlight() {
  if (spotlightVisible.value) spotlightEnd();
  else spotlightStart();
}

const domRefreshTrigger = ref(0);

const viewSpotlightItems = computed(() => {
  const refreshTick = domRefreshTrigger.value;
  return props.spotlightItems?.filter((item) => {
    const elementId = getSpotlightElementId(item);
    return refreshTick >= 0 && (elementId === null || document.getElementById(elementId) != null);
  });
});

let mutationTimeout = null;
let mutationObserver = null;

function startObserver() {
  if (!mutationObserver && props.spotlightItems?.length > 0) {
    useMutationObserver(
      document.body,
      () => {
        if (mutationTimeout) clearTimeout(mutationTimeout);
        mutationTimeout = setTimeout(() => {
          domRefreshTrigger.value += 1;
          mutationTimeout = null;
        }, 100);
      },
      {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['id'],
      }
    );
  }
}

function stopObserver() {
  if (mutationObserver) {
    mutationObserver.stop();
    mutationObserver = null;
  }
}

watch(
  () => props.spotlightItems?.length,
  (newLength) => {
    if (newLength > 0) {
      startObserver();
    } else {
      stopObserver();
    }
  },
  { immediate: true }
);

const closeSignal = ref(false);
provide('closeSignal', closeSignal);

function closeEverything() {
  if (navBarSwitchModel.value !== true) {
    navBarSwitchModel.value = true;
  }
  if (navBarSwitchBasic.value !== true) {
    navBarSwitchBasic.value = true;
  }

  closeSignal.value = !closeSignal.value;
}

const settingsModal = ref();
const settingsModalMounted = ref(false);

function handleSettingsClick() {
  if (props.mode === 'full-screen') {
    settingsModalMounted.value = true;
    nextTick(() => {
      settingsModal.value?.open();
    });
    return;
  }
  emits('settingsClick');
  closeEverything();
}

provide(shellContextKey, {
  props,
  width,
  shell,
  header,
  main,
  nav,
  footer,
  modals,
  poppers,
  displayTexts,
  themeModel,
  notificationModel,
  selectedLanguageModel,
  deviceFontsModel,
  animationsModel,
  transparencyModel,
  touchModeModel,
  selectedContextPersonModel,
  selectedAlternativeProfileModel,
  pageTitle,
  navBarSwitchModel,
  navBarSwitchBasic,
  semiResponsiveView,
  selectedMegaMenuItemModel,
  visibleAlerts,
  customButtonOpenedModal,
  idleModalDescription,
  spotlight,
  spotlightVisible,
  spotlightItemCurrentModel,
  viewSpotlightItems,
  triggerShowAllClick,
  navToggle,
  navToggleButton,
  goBack,
  goHome,
  logOut,
  languageChange,
  contextPersonChange,
  alternativeProfileChange,
  alertItemClicked,
  alertsClicked,
  loginClicked,
  helpClicked,
  onClosedConfirmModal,
  navClick,
  pickIcon,
  pickSvgTitle,
  closeAlert,
  lvAlertItemClicked,
  focusFirstMainFocusableElement,
  removeBlink,
  blink,
  confirmModalClicked,
  idleModalClicked,
  spotlightStart,
  spotlightEnd,
  toggleSpotlight,
  closeEverything,
  handleSettingsClick,
  emits,
});

defineExpose({ spotlightStart, spotlightEnd, closeEverything });
</script>

<template>
  <transition name="shell-switch">
    <component :is="currentModeComponent" :key="resolvedMode">
      <template #logoSmall>
        <slot name="logoSmall" />
      </template>
      <template #logo>
        <slot name="logo" />
      </template>
      <template #customButtonPanel>
        <slot name="customButtonPanel" />
      </template>
      <template #customButtonSafePanel>
        <slot name="customButtonSafePanel" />
      </template>
      <template #backdrop>
        <slot name="backdrop" />
      </template>
      <template #coverArea>
        <slot name="coverArea" />
      </template>
      <template #footer>
        <slot name="footer" />
      </template>
      <slot />
    </component>
  </transition>

  <LxDialog
    v-if="idleModalMounted"
    ref="idleModalRef"
    id="idle-modal"
    kind="warning"
    :label="displayTexts.idleModalLabel"
    :description="idleModalDescription"
    :buttonSecondaryIsCancel="false"
    :disableClosing="true"
    :actionDefinitions="idleModalActions"
    :texts="displayTexts"
    @actionClick="idleModalClicked"
  />

  <LxDialog
    v-if="confirmModalMounted"
    ref="confirmModal"
    :id="props.confirmDialogData?.$state.confirmDialogState?.id ?? generateUUID()"
    :kind="props.confirmDialogData?.$state.confirmDialogState.kind ?? 'question'"
    :label="props.confirmDialogData?.$state.confirmDialogState.title"
    :description="props.confirmDialogData?.$state.confirmDialogState.message"
    :buttonSecondaryIsCancel="false"
    :disableClosing="props.confirmDialogData?.$state.confirmDialogState?.disableClosing ?? false"
    :escEnabled="props.confirmDialogData?.$state.confirmDialogState.escEnabled"
    :actionDefinitions="confirmModalActions"
    :texts="displayTexts"
    @actionClick="confirmModalClicked"
    @close="onClosedConfirmModal"
  />

  <LxSpotlight
    v-if="spotlightMounted"
    ref="spotlight"
    :items="viewSpotlightItems"
    :hasItemCounter="props.spotlightHasCounter"
    :hasShowMore="props.spotlightHasShowMore"
    :shellMode="props.mode"
    :shellNavItems="props.navItems"
    :texts="displayTexts.spotlight"
    v-model="spotlightItemCurrentModel"
    v-model:visible="spotlightVisible"
    @showMore="emits('spotlightShowMore', spotlightItemCurrentModel)"
  />

  <LxNotification v-if="notificationMounted" v-model="notificationModel" />

  <LxModal
    ref="settingsModal"
    :label="displayTexts.accessibilitySettings.title"
    size="l"
    :action-definitions="[
      {
        id: 'close',
        name: displayTexts.close,
        kind: 'secondary',
        destructive: false,
      },
    ]"
  >
    <LxAccessibilitySettings
      v-if="settingsModalMounted"
      :texts="displayTexts.accessibilitySettings"
    />
  </LxModal>
</template>
