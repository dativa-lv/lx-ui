import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { defineComponent, h, onMounted, ref } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';

import LxShell from '@/components/shell/Shell.vue';

const mockedScreenWidth = ref(1024);

vi.mock('@vueuse/core', () => ({
  useColorMode: () => ref('light'),
  usePreferredReducedMotion: () => ref('no-preference'),
  usePreferredReducedTransparency: () => ref('no-preference'),
  useMutationObserver: () => ({ stop: vi.fn() }),
  useResizeObserver: () => ({ stop: vi.fn() }),
  useScroll: () => ({ y: ref(0) }),
  useDebounceFn: (fn) => fn,
  useMediaQuery: () => ref(false),
  useWindowSize: () => ({ width: mockedScreenWidth }),
}));

vi.mock('@/hooks/useLx', () => ({
  default: () => ({
    getGlobals: () => ({ systemId: 'shell-test', environment: 'test' }),
    getComponentTexts: () => undefined,
  }),
}));

const createStub = (name, template = `<div data-stub="${name}"><slot /></div>`) =>
  defineComponent({
    name,
    template,
  });

const HeaderButtonsNavTestStub = defineComponent({
  name: 'LxHeaderButtons',
  emits: ['update:headerButtonsVisibility', 'update:headerActionsVisibility'],
  setup(_, { emit }) {
    onMounted(() => {
      emit('update:headerButtonsVisibility', { nav: false });
      emit('update:headerActionsVisibility', {
        showGoBackButton: false,
        showScrollUpButton: false,
      });
    });
  },
  template: '<div data-stub="LxHeaderButtons"><slot /></div>',
});

const NotificationStub = defineComponent({
  name: 'Notification',
  props: {
    modelValue: { type: Array, default: () => [] },
  },
  template: '<div data-testid="notification">{{ modelValue.length }}</div>',
});

const DialogStub = defineComponent({
  name: 'LxDialog',
  methods: {
    open() {},
    close() {},
  },
  template: '<div data-testid="dialog"><slot /></div>',
});

const SpotlightStub = defineComponent({
  name: 'LxSpotlight',
  methods: {
    setSpotlightItem() {},
    spotlightEnd() {},
  },
  template: '<div data-testid="spotlight" />',
});

const ModalStub = defineComponent({
  name: 'LxModal',
  methods: {
    open() {},
  },
  template: '<div data-testid="modal"><slot /></div>',
});

const globalStubs = {
  LxSkipLink: createStub('LxSkipLink'),
  LxMainHeader: createStub('LxMainHeader'),
  LxNavBar: createStub('LxNavBar'),
  LxPageHeader: createStub('LxPageHeader'),
  LxLoader: createStub('LxLoader'),
  LxIcon: createStub('LxIcon'),
  LxDialog: DialogStub,
  LxSpotlight: SpotlightStub,
  LxModal: ModalStub,
  Notification: NotificationStub,
  LxAccessibilitySettings: createStub('LxAccessibilitySettings'),
};

const baseProps = {
  systemNameShort: 'LX',
  systemName: 'LX UI',
};

let wrapper;

function setScreenWidth(width) {
  mockedScreenWidth.value = width;
  Object.defineProperty(globalThis, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  });
}

function createStorage() {
  const store = new Map();

  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
}

function mountShell(props = {}) {
  return mount(LxShell, {
    props: {
      ...baseProps,
      ...props,
    },
    global: {
      stubs: globalStubs,
    },
  });
}

function mountShellForNavTests(props = {}, options = {}) {
  const { controlled = false } = options;

  if (controlled) {
    const ControlledHost = defineComponent({
      name: 'ControlledHost',
      setup() {
        const navBarSwitch = ref(props.navBarSwitch ?? true);
        return { navBarSwitch };
      },
      render() {
        return h(LxShell, {
          ...baseProps,
          ...props,
          navBarSwitch: this.navBarSwitch,
          'onUpdate:nav-bar-switch': (value) => {
            this.navBarSwitch = value;
          },
        });
      },
    });

    return mount(ControlledHost, {
      global: {
        stubs: {
          ...globalStubs,
          LxMainHeader: false,
          LxMainHeaderDigives: false,
          LxMainHeaderDigivesLite: false,
          LxMainHeaderDigimaks: false,
          LxMainHeaderDigimaksLite: false,
          LxHeaderButtons: HeaderButtonsNavTestStub,
          LxDropDownMenu: createStub('LxDropDownMenu'),
          LxList: createStub('LxList'),
          LxContextMenu: createStub('LxContextMenu'),
          LxToolbar: createStub('LxToolbar'),
          RouterLink: createStub('RouterLink'),
          'router-link': createStub('router-link'),
          LxNavBarDigives: createStub('LxNavBarDigives'),
          LxNavBarDigivesLite: createStub('LxNavBarDigivesLite'),
        },
      },
    });
  }

  return mount(LxShell, {
    props: {
      ...baseProps,
      ...props,
    },
    global: {
      stubs: {
        ...globalStubs,
        LxMainHeader: false,
        LxMainHeaderDigives: false,
        LxMainHeaderDigivesLite: false,
        LxMainHeaderDigimaks: false,
        LxMainHeaderDigimaksLite: false,
        LxHeaderButtons: HeaderButtonsNavTestStub,
        LxDropDownMenu: createStub('LxDropDownMenu'),
        LxList: createStub('LxList'),
        LxContextMenu: createStub('LxContextMenu'),
        LxToolbar: createStub('LxToolbar'),
        RouterLink: createStub('RouterLink'),
        'router-link': createStub('router-link'),
        LxNavBarDigives: createStub('LxNavBarDigives'),
        LxNavBarDigivesLite: createStub('LxNavBarDigivesLite'),
      },
    },
  });
}

async function settleShell() {
  await flushPromises();
  if (typeof vi.dynamicImportSettled === 'function') {
    await vi.dynamicImportSettled();
  }
  await flushPromises();
}

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    writable: true,
    value: createStorage(),
  });
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    writable: true,
    value: createStorage(),
  });
});

afterEach(() => {
  if (wrapper) {
    wrapper.unmount();
    wrapper = null;
  }
});

test('renders the public mode layout when requested', async () => {
  wrapper = mountShell({ mode: 'public' });

  await settleShell();

  expect(wrapper.find('.lx-layout-public').exists()).toBe(true);
  expect(wrapper.find('.lx-layout-default').exists()).toBe(false);
});

test('falls back to the default layout for unknown modes', async () => {
  wrapper = mountShell({ mode: 'unknown-mode' });

  await settleShell();

  expect(wrapper.find('.lx-layout-default').exists()).toBe(true);
  expect(wrapper.find('.lx-layout-public').exists()).toBe(false);
});

test('mounts notification UI only when notifications appear', async () => {
  wrapper = mountShell({ notifications: [] });

  await settleShell();

  expect(wrapper.find('[data-testid="notification"]').exists()).toBe(false);

  await wrapper.setProps({
    notifications: [{ id: 'note-1', name: 'Test notification' }],
  });
  await settleShell();

  expect(wrapper.find('[data-testid="notification"]').exists()).toBe(true);
});

test('mounts spotlight only on first use', async () => {
  wrapper = mountShell({ spotlightItems: [{ id: 'spot-1', elementId: null }] });

  await settleShell();

  expect(wrapper.find('[data-testid="spotlight"]').exists()).toBe(false);

  await wrapper.vm.spotlightStart();
  await settleShell();

  expect(wrapper.find('[data-testid="spotlight"]').exists()).toBe(true);
});

test('mounts dialog wrappers only when opened', async () => {
  wrapper = mountShell({
    showIdleModal: false,
    confirmDialogData: {
      $state: {
        isOpen: false,
        confirmDialogState: {},
      },
    },
  });

  await settleShell();

  expect(wrapper.findAll('[data-testid="dialog"]')).toHaveLength(0);

  await wrapper.setProps({ showIdleModal: true });
  await settleShell();

  expect(wrapper.findAll('[data-testid="dialog"]')).toHaveLength(1);

  await wrapper.setProps({
    confirmDialogData: {
      $state: {
        isOpen: true,
        confirmDialogState: {},
      },
    },
  });
  await settleShell();

  expect(wrapper.findAll('[data-testid="dialog"]')).toHaveLength(2);
});

test('renders the custom mode layout when requested', async () => {
  wrapper = mountShell({ mode: 'custom' });

  await settleShell();

  expect(wrapper.find('.lx-layout-custom').exists()).toBe(true);
  expect(wrapper.find('.lx-layout-default').exists()).toBe(false);
  // The default LX header/navbar are not auto-rendered in custom mode.
  expect(wrapper.find('[data-stub="LxMainHeader"]').exists()).toBe(false);
  // Standard shell scaffolding is still present.
  expect(wrapper.find('.lx-main').exists()).toBe(true);
  expect(wrapper.find('#modals').exists()).toBe(true);
  expect(wrapper.find('#poppers').exists()).toBe(true);
});

test('renders custom mode header/aside/footer slots only when provided, each with its class', async () => {
  wrapper = mountShell({ mode: 'custom' });
  await settleShell();

  // No slot content -> regions are not rendered.
  expect(wrapper.find('.lx-layout-custom-header').exists()).toBe(false);
  expect(wrapper.find('.lx-layout-custom-aside-left').exists()).toBe(false);
  expect(wrapper.find('.lx-layout-custom-aside-right').exists()).toBe(false);
  expect(wrapper.find('.lx-layout-custom-footer').exists()).toBe(false);

  wrapper.unmount();

  wrapper = mount(LxShell, {
    props: { ...baseProps, mode: 'custom' },
    slots: {
      header: '<div class="my-header">H</div>',
      'aside-left': '<div class="my-left">L</div>',
      'aside-right': '<div class="my-right">R</div>',
      default: '<div class="my-content">C</div>',
      footer: '<div class="my-footer">F</div>',
    },
    global: { stubs: globalStubs },
  });
  await settleShell();

  const header = wrapper.find('.lx-layout-custom-header');
  const asideLeft = wrapper.find('.lx-layout-custom-aside-left');
  const asideRight = wrapper.find('.lx-layout-custom-aside-right');
  const footer = wrapper.find('.lx-layout-custom-footer');

  expect(header.exists()).toBe(true);
  expect(header.find('.my-header').exists()).toBe(true);
  expect(asideLeft.exists()).toBe(true);
  expect(asideLeft.find('.my-left').exists()).toBe(true);
  expect(asideRight.exists()).toBe(true);
  expect(asideRight.find('.my-right').exists()).toBe(true);
  expect(footer.exists()).toBe(true);
  expect(footer.find('.my-footer').exists()).toBe(true);
  expect(wrapper.find('.lx-main .my-content').exists()).toBe(true);
});

test('renders the page-header slot inside main, outside the route transition', async () => {
  wrapper = mountShell({ mode: 'custom' });
  await settleShell();
  expect(wrapper.find('.lx-layout-custom-page-header').exists()).toBe(false);

  wrapper.unmount();

  wrapper = mount(LxShell, {
    props: { ...baseProps, mode: 'custom' },
    slots: {
      'page-header': '<h1 class="my-title">Title</h1>',
      default: '<div class="my-content">C</div>',
    },
    global: { stubs: globalStubs },
  });
  await settleShell();

  const pageHeader = wrapper.find('.lx-main > .lx-layout-custom-page-header');
  expect(pageHeader.exists()).toBe(true);
  expect(pageHeader.find('.my-title').exists()).toBe(true);
});

test('keeps notifications working in custom mode', async () => {
  wrapper = mountShell({ mode: 'custom', notifications: [] });
  await settleShell();

  expect(wrapper.find('[data-testid="notification"]').exists()).toBe(false);

  await wrapper.setProps({
    notifications: [{ id: 'note-1', name: 'Test notification' }],
  });
  await settleShell();

  expect(wrapper.find('[data-testid="notification"]').exists()).toBe(true);
});

// navBarSwitch tests

const navBarModes = [
  {
    mode: 'default',
    layoutSelector: '.lx-layout-default',
    stateKind: 'layout-collapsed',
    togglesWhenUndefined: true,
    toggleSelector: '#nav-toggle',
  },
  {
    mode: 'public',
    layoutSelector: '.lx-layout-public',
    stateKind: 'layout-collapsed',
    togglesWhenUndefined: true,
    toggleSelector: '#nav-toggle',
  },
  {
    mode: 'latvijalv',
    layoutSelector: '.lx-layout-latvijalv',
    stateKind: 'layout-collapsed',
    togglesWhenUndefined: true,
    toggleSelector: '#nav-toggle',
  },
  {
    mode: 'full-screen',
    layoutSelector: '.lx-layout-full-screen',
    stateKind: 'layout-collapsed',
    togglesWhenUndefined: true,
    toggleSelector: '#nav-toggle',
  },
  {
    mode: 'digives',
    layoutSelector: '.lx-layout-digives',
    stateKind: 'layout-collapsed',
    togglesWhenUndefined: false,
    toggleSelector: '#lx-shell-nav-toggle-button',
  },
  {
    mode: 'digives-lite',
    layoutSelector: '.lx-layout-digives-lite',
    stateKind: 'layout-collapsed',
    togglesWhenUndefined: false,
    toggleSelector: '#lx_nav-toggle',
  },
  {
    mode: 'digimaks',
    layoutSelector: '.lx-layout-digimaks',
    stateKind: 'header-expanded',
    togglesWhenUndefined: false,
    toggleSelector: '.nav-toggle',
  },
  {
    mode: 'digimaks-lite',
    layoutSelector: '.lx-layout-digimaks',
    stateKind: 'header-expanded',
    togglesWhenUndefined: false,
    toggleSelector: '.nav-toggle',
  },
];

function readNavState(layout, stateKind) {
  if (stateKind === 'layout-collapsed') {
    return layout.classes().includes('lx-collapsed');
  }
  return wrapper.find('.lx-header').classes().includes('lx-nav-panel-expanded');
}

async function clickToggle(navToggleButton) {
  await navToggleButton.trigger('click');
  await settleShell();
}

test.each(navBarModes)(
  'navBarSwitch undefined mode=$mode navbar collapse/expand',
  async ({ mode, layoutSelector, stateKind, togglesWhenUndefined, toggleSelector }) => {
    setScreenWidth(400);

    wrapper = mountShellForNavTests({ mode });
    await settleShell();

    const layout = wrapper.find(layoutSelector);
    expect(layout.exists()).toBe(true);

    const navToggleButton = wrapper.find(toggleSelector);
    expect(navToggleButton.exists()).toBe(true);

    const initialState = readNavState(layout, stateKind);

    await clickToggle(navToggleButton);
    const stateAfterFirstClick = readNavState(layout, stateKind);

    await clickToggle(navToggleButton);
    const stateAfterSecondClick = readNavState(layout, stateKind);

    if (togglesWhenUndefined) {
      expect(stateAfterFirstClick).not.toBe(initialState);
      expect(stateAfterSecondClick).toBe(initialState);
    } else {
      expect(stateAfterFirstClick).toBe(initialState);
      expect(stateAfterSecondClick).toBe(initialState);
    }
  }
);

test.each(navBarModes)(
  'navBarSwitch defined mode=$mode navbar collapse/expand',
  async ({ mode, layoutSelector, stateKind, toggleSelector }) => {
    setScreenWidth(400);

    wrapper = mountShellForNavTests({ mode, navBarSwitch: true }, { controlled: true });
    await settleShell();

    const layout = wrapper.find(layoutSelector);
    expect(layout.exists()).toBe(true);

    const navToggleButton = wrapper.find(toggleSelector);
    expect(navToggleButton.exists()).toBe(true);

    const initialState = readNavState(layout, stateKind);

    await clickToggle(navToggleButton);
    const stateAfterFirstClick = readNavState(layout, stateKind);

    await clickToggle(navToggleButton);
    const stateAfterSecondClick = readNavState(layout, stateKind);

    expect(stateAfterFirstClick).not.toBe(initialState);
    expect(stateAfterSecondClick).toBe(initialState);
  }
);

test('collapsed navbar is inert on narrow screens without waiting for a toggle', async () => {
  setScreenWidth(700);

  wrapper = mountShellForNavTests();
  await settleShell();

  const nav = wrapper.find('nav');
  expect(nav.exists()).toBe(true);
  expect(nav.element.inert).toBe(true);
  expect(wrapper.find('main').element.inert).toBe(false);

  wrapper.vm.navToggle(false);
  await settleShell();

  expect(nav.element.inert).toBe(false);
});

test('navbar is not inert on wide screens', async () => {
  setScreenWidth(1024);

  wrapper = mountShellForNavTests();
  await settleShell();

  expect(wrapper.find('nav').element.inert).toBe(false);
  expect(wrapper.find('main').element.inert).toBe(false);
});
