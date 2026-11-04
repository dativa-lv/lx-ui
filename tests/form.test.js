import { test, expect, afterEach } from 'vitest';
import { reactive, defineComponent } from 'vue';
import LxForm from '@/components/forms/Form.vue';
import LxSection from '@/components/forms/Section.vue';
import LxRow from '@/components/forms/Row.vue';
import LxDropDownMenu from '@/components/DropDownMenu.vue';
import { mount, flushPromises } from '@vue/test-utils';
import LxWizard from '@/components/Wizard.vue';
import LxSteps from '@/components/Steps.vue';

let wrapper;

afterEach(() => {
  if (wrapper) {
    wrapper.unmount();
  }
});

/* Header and Footer tests */
test('LxForm with no header', () => {
  expect(LxForm).toBeTruthy();

  wrapper = mount(LxForm, {
    props: {
      showHeader: false,
    },
  });
  // process.stdout.write(`${wrapper.html()}\n`);
  expect(wrapper.html()).not.toContain('<header');
});

test('LxForm with no footer', () => {
  expect(LxForm).toBeTruthy();
  wrapper = mount(LxForm, {
    props: {
      showFooter: false,
    },
  });
  expect(wrapper.html()).not.toContain('<footer');
});

test('LxForm not sticky header', () => {
  expect(LxForm).toBeTruthy();
  wrapper = mount(LxForm, {
    props: {
      stickyHeader: false,
    },
  });
  const header = wrapper.find('header');
  expect(header.classes()).not.toContain('lx-form-grid-header-sticky');
});

test('LxForm not sticky footer', () => {
  expect(LxForm).toBeTruthy();
  wrapper = mount(LxForm, {
    props: {
      stickyFooter: false,
    },
  });
  const header = wrapper.find('footer');
  expect(header.classes()).not.toContain('lx-form-grid-footer-sticky');
});

test('LxForm compact kind', () => {
  expect(LxForm).toBeTruthy();
  wrapper = mount(LxForm, {
    props: {
      kind: 'compact',
    },
  });
  const main = wrapper.find('.lx-main');
  expect(main.classes()).toContain('lx-compact-sections');
});

test('LxForm stripped kind', () => {
  expect(LxForm).toBeTruthy();

  wrapper = mount(LxForm, {
    props: {
      kind: 'stripped',
    },
  });

  const main = wrapper.find('.lx-main');
  expect(main.classes()).toContain('lx-compact-sections');
  expect(wrapper.classes()).toContain('lx-form-grid-stripped');
});

test('LxForm columnCount 2 test', () => {
  expect(LxForm).toBeTruthy();

  wrapper = mount(LxForm, {
    props: {
      columnCount: 2,
    },
  });

  const main = wrapper.find('.lx-main').find('.lx-form-section');
  expect(main.classes()).toContain('lx-form-section-2');
});

test('LxForm columnCount 3 test', () => {
  expect(LxForm).toBeTruthy();

  wrapper = mount(LxForm, {
    props: {
      columnCount: 3,
    },
  });

  const main = wrapper.find('.lx-main').find('.lx-form-section');
  expect(main.classes()).toContain('lx-form-section-3');
});

test('LxForm columnCount 4 test', () => {
  expect(LxForm).toBeTruthy();

  wrapper = mount(LxForm, {
    props: {
      columnCount: 4,
    },
  });

  const main = wrapper.find('.lx-main').find('.lx-form-section');
  expect(main.classes()).toContain('lx-form-section-4');
});

/* Button tests */
test('LxForm buttons test', () => {
  expect(LxForm).toBeTruthy();

  wrapper = mount(LxForm, {
    props: {
      actionDefinitions: [
        { id: 'one', name: 'one', kind: 'primary' },
        { id: 'two', name: 'two', kind: 'secondary' },
      ],
    },
    global: {
      stubs: ['router-link'],
    },
  });
  expect(wrapper.html()).toContain('button');
});

test('LxForm with 2 buttons test', () => {
  expect(LxForm).toBeTruthy();

  wrapper = mount(LxForm, {
    props: {
      actionDefinitions: [
        { id: 'one', name: 'one', kind: 'primary' },
        { id: 'two', name: 'two', kind: 'secondary' },
      ],
    },
    global: {
      stubs: ['router-link'],
    },
  });

  const lxButtons = wrapper.findAll('.lx-button');
  expect(lxButtons.length).toBe(2);
});

test('LxForm button click emit', () => {
  expect(LxForm).toBeTruthy();

  wrapper = mount(LxForm, {
    props: {
      actionDefinitions: [{ id: 'one', name: 'one', kind: 'primary' }],
    },
    global: {
      stubs: ['router-link'],
    },
  });
  wrapper.find('button').trigger('click');
  expect(wrapper.emitted()).toHaveProperty('actionClick');
});

test('LxForm button click emit 3 times', () => {
  expect(LxForm).toBeTruthy();

  wrapper = mount(LxForm, {
    props: {
      actionDefinitions: [
        { id: 'one', name: 'one', kind: 'primary' },
        { id: 'two', name: 'two', kind: 'secondary' },
      ],
    },
    global: {
      stubs: ['router-link'],
    },
  });
  wrapper.findAll('button')[0].trigger('click');
  wrapper.findAll('button')[1].trigger('click');
  wrapper.findAll('button')[0].trigger('click');
  const emits = wrapper.emitted('actionClick');
  expect(emits).toHaveLength(3);
  expect(emits[0]).toEqual(['one']);
  expect(emits[1]).toEqual(['two']);
  expect(emits[2]).toEqual(['one']);
});

test('LxForm button destructive', () => {
  expect(LxForm).toBeTruthy();

  wrapper = mount(LxForm, {
    props: {
      actionDefinitions: [{ id: 'one', name: 'one', kind: 'secondary', destructive: true }],
    },
    global: {
      stubs: ['router-link'],
    },
  });
  const button = wrapper.find('button');
  expect(button.classes()).toContain('lx-destructive');
});

test('LxForm button disabled', () => {
  expect(LxForm).toBeTruthy();

  wrapper = mount(LxForm, {
    props: {
      actionDefinitions: [
        { id: 'two', name: 'two', kind: 'primary' },
        { id: 'one', name: 'one', kind: 'secondary', disabled: true },
      ],
    },
    global: {
      stubs: ['router-link'],
    },
  });
  const button = wrapper.findAll('button');
  expect(button[0].attributes('disabled')).toEqual(undefined);
  expect(button[1].attributes('disabled')).toBe('');
});

test('LxForm button label', () => {
  expect(LxForm).toBeTruthy();

  wrapper = mount(LxForm, {
    props: {
      actionDefinitions: [
        { id: 'one', name: 'one', kind: 'primary' },
        { id: 'two', name: 'two', kind: 'secondary' },
      ],
    },
    global: {
      stubs: ['router-link'],
    },
  });
  const button = wrapper.findAll('button');
  expect(button[0].text()).toBe('one');
  expect(button[1].text()).toBe('two');
});

test('LxForm actionDefinitions is []', () => {
  expect(LxForm).toBeTruthy();
  wrapper = mount(LxForm, {
    props: {
      actionDefinitions: [],
    },
    global: {
      stubs: ['router-link'],
    },
  });

  expect(wrapper.findAll('button').length).toBe(0);
});

test('LxForm actionDefinitions is null', () => {
  expect(LxForm).toBeTruthy();
  wrapper = mount(LxForm, {
    props: {
      actionDefinitions: null,
    },
    global: {
      stubs: ['router-link'],
    },
  });

  expect(wrapper.findAll('button').length).toBe(0);
});

/* Slot tests */
test('LxForm header slot', () => {
  expect(LxForm).toBeTruthy();

  wrapper = mount(LxForm, {
    props: {},
    slots: {
      header: '<h1>Header</h1>',
    },
  });
  const headerSlot = wrapper.find('header').find('.lx-primary');
  expect(headerSlot.text()).toBe('Header');
});

test('LxForm header text has heading semantics', () => {
  expect(LxForm).toBeTruthy();

  wrapper = mount(LxForm, {
    props: {
      id: 'form',
    },
    slots: {
      header: 'Header',
    },
  });

  const headerText = wrapper.find('#form-header');
  expect(headerText.attributes('role')).toBe('heading');
  expect(headerText.attributes('aria-level')).toBe('2');
});

test('LxForm default slot test', () => {
  expect(LxForm).toBeTruthy();

  wrapper = mount(LxForm, {
    props: {},
    global: {
      components: {
        LxRow,
      },
    },
    slots: {
      default: '<LxRow label="one">Default</LxRow>',
    },
  });
  const lxRowComponent = wrapper.find('.lx-row');
  expect(lxRowComponent.exists()).toBe(true);
});

test('LxForm sections slot with one section', () => {
  expect(LxForm).toBeTruthy();

  // const section = mount(LxSection, { slots: { default: 'Default' } });

  wrapper = mount(LxForm, {
    props: {},
    slots: {
      sections: '<LxSection>Default</LxSection>',
    },
    global: {
      components: {
        LxSection,
      },
    },
  });

  const lxSectionComponent = wrapper.findAll('.lx-form-section');
  expect(lxSectionComponent.length).toBe(2);
});

test('LxForm sections class test', () => {
  expect(LxForm).toBeTruthy();

  wrapper = mount(LxForm, {
    props: {
      columnCount: 3,
    },
    slots: {
      sections: '<LxSection :columnCount="2"></LxSection>',
    },
    global: {
      components: {
        LxSection,
      },
    },
  });

  const lxSectionComponent = wrapper.findAll('.lx-form-section');
  expect(lxSectionComponent[0].classes()).toContain('lx-form-section-3');
  expect(lxSectionComponent[1].classes()).toContain('lx-form-section-2');
});

test('LxForm pre,post header slots', () => {
  expect(LxForm).toBeTruthy();

  wrapper = mount(LxForm, {
    slots: {
      preHeader: 'preHeader',
      postHeader: 'postHeader',
    },
  });
  const preHeaderSlot = wrapper.find('header').find('.pre-header-group');
  const postHeaderSlot = wrapper.find('header').find('.post-header-group');

  expect(preHeaderSlot.text()).toBe('preHeader');
  expect(postHeaderSlot.text()).toBe('postHeader');
});

/* Index tests */

test('LxForm indexes', () => {
  expect(LxForm).toBeTruthy();
  wrapper = mount(LxForm, {
    props: {
      index: [
        { id: 'one', name: 'one' },
        { id: 'two', name: 'two' },
      ],
      indexType: 'default',
    },
    slots: {
      sections: '<LxSection id="one"/> <LxSection id="two" />',
    },
    global: {
      components: {
        LxSection,
        LxDropDownMenu,
      },
      stubs: {
        'router-link': true,
      },
    },
  });

  const aside = wrapper.find('aside');
  expect(aside.html()).toContain('li');
});

test('LxForm places children of a nested trigger where the trigger would be', () => {
  wrapper = mount(LxForm, {
    props: {
      actionDefinitions: [
        { id: 'save', name: 'Save', kind: 'primary', nestedGroupId: 'save' },
        { id: 'saveDraft', name: 'Save draft', groupId: 'save' },
        { id: 'saveFinal', name: 'Save final', groupId: 'save' },
      ],
    },
    global: {
      stubs: ['router-link'],
    },
  });

  const labels = wrapper.findAll('.lx-button').map((b) => b.text());
  expect(labels).toEqual(['Save draft', 'Save final']);
});

/* Wizard tests */
const wizardIndex = () => [
  { id: 'one', name: 'One' },
  { id: 'two', name: 'Two' },
  { id: 'three', name: 'Three' },
];

function mountWizard(props = {}) {
  return mount(LxForm, {
    attachTo: document.body,
    props: {
      id: 'wizardForm',
      indexType: 'wizard',
      index: wizardIndex(),
      ...props,
    },
    slots: {
      sections: '<LxSection id="one"/><LxSection id="two"/><LxSection id="three"/>',
    },
    global: {
      components: { LxSection },
      stubs: ['router-link'],
    },
  });
}

const wizardButton = (name) => wrapper.find(`#wizardForm-action-_lx_${name}_step`);
const wizardItems = () => wrapper.findComponent(LxWizard).props('items');

test('LxForm wizard Next changes step and writes step states into index objects', async () => {
  const index = wizardIndex();
  wrapper = mountWizard({ index });
  await flushPromises();

  await wizardButton('next').trigger('click');
  await flushPromises();

  expect(wrapper.vm.getSelectedIndex()).toBe('two');
  expect(wrapper.emitted('actionClick').at(-1)).toEqual(['_lx_next_step']);
  expect(wizardItems().map((item) => item.state)).toEqual(['complete', 'current', undefined]);
  // Backward compatible: current step and states are visible in the passed index objects
  expect(index.map((item) => item.state)).toEqual(['complete', 'current', undefined]);
  expect(index[1].isCurrentStep).toBe(true);
});

test('LxForm wizard step indicator updates for a plain (non-reactive) index array', async () => {
  // Parent passes a plain array, like `const steps = [...]` in a page
  const Parent = defineComponent({
    components: { LxForm, LxSection },
    setup() {
      return { steps: wizardIndex() };
    },
    template: `
      <LxForm id="wizardForm" indexType="wizard" :index="steps">
        <template #sections>
          <LxSection id="one"/><LxSection id="two"/><LxSection id="three"/>
        </template>
      </LxForm>`,
  });
  wrapper = mount(Parent, { attachTo: document.body, global: { stubs: ['router-link'] } });
  await flushPromises();
  const stepStates = () =>
    wrapper
      .findComponent(LxSteps)
      .props('items')
      .map((item) => item.state);
  expect(stepStates()).toEqual(['current', undefined, undefined]);

  await wizardButton('next').trigger('click');
  await flushPromises();

  expect(stepStates()).toEqual(['complete', 'current', undefined]);
});

test('LxForm wizard reflects in-place changes of index items', async () => {
  const index = reactive(wizardIndex());
  wrapper = mountWizard({ index });
  await flushPromises();

  index[2].state = 'invalid';
  await flushPromises();
  expect(wizardItems().map((item) => item.state)).toEqual(['current', undefined, 'invalid']);
});

test('LxForm tabs reflect in-place changes of index items', async () => {
  const index = reactive([
    { id: 'one', name: 'One' },
    { id: 'two', name: 'Two' },
  ]);
  wrapper = mount(LxForm, {
    attachTo: document.body,
    props: { id: 'tabsForm', indexType: 'tabs', index },
    slots: { sections: '<LxSection id="one"/><LxSection id="two"/>' },
    global: { components: { LxSection }, stubs: ['router-link'] },
  });
  await flushPromises();

  index[1].name = 'Renamed';
  await flushPromises();
  expect(wrapper.html()).toContain('Renamed');
});

test('LxForm wizard setSelectedIndex and getSelectedIndex', async () => {
  wrapper = mountWizard();
  await flushPromises();
  expect(wrapper.vm.getSelectedIndex()).toBe('one');

  wrapper.vm.setSelectedIndex('three');
  await flushPromises();
  expect(wrapper.vm.getSelectedIndex()).toBe('three');
  expect(wizardItems().map((item) => item.state)).toEqual(['complete', 'complete', 'current']);

  wrapper.vm.setSelectedIndex('one');
  await flushPromises();
  expect(wizardItems().map((item) => item.state)).toEqual(['current', undefined, undefined]);
});

test('LxForm wizard starts on step marked isCurrentStep and keeps invalid state', async () => {
  wrapper = mountWizard({
    index: [{ id: 'one' }, { id: 'two', state: 'invalid' }, { id: 'three', isCurrentStep: true }],
  });
  await flushPromises();
  expect(wrapper.vm.getSelectedIndex()).toBe('three');
  expect(wizardItems().map((item) => item.state)).toEqual(['complete', 'invalid', 'current']);
});

test('LxForm wizard keeps current step when index is replaced', async () => {
  wrapper = mountWizard();
  await flushPromises();
  wrapper.vm.setSelectedIndex('two');
  await flushPromises();

  await wrapper.setProps({
    index: [{ id: 'one' }, { id: 'two' }, { id: 'three', state: 'invalid' }],
  });
  await flushPromises();
  expect(wrapper.vm.getSelectedIndex()).toBe('two');
  expect(wizardItems().map((item) => item.state)).toEqual(['complete', 'current', 'invalid']);
});

test('LxForm wizard buttons can be overridden via actionDefinitions', async () => {
  wrapper = mountWizard({
    actionDefinitions: [
      { id: '_lx_prev_step', disabled: true },
      { id: '_lx_next_step', disabled: true, name: 'Sign' },
    ],
  });
  await flushPromises();
  wrapper.vm.setSelectedIndex('two');
  await flushPromises();

  expect(wizardButton('next').attributes('disabled')).toBeDefined();
  expect(wizardButton('prev').attributes('disabled')).toBeDefined();
  expect(wizardButton('next').text()).toContain('Sign');
  // Overrides are not rendered again as separate buttons
  expect(wrapper.findAll('[id="wizardForm-action-_lx_next_step"]')).toHaveLength(1);
});

test('LxForm wizard button overrides with any kind are not rendered as separate actions', async () => {
  wrapper = mountWizard({
    actionDefinitions: [
      { id: '_lx_prev_step', kind: 'tertiary', disabled: true },
      { id: '_lx_next_step', kind: 'additional', disabled: true },
      { id: 'save', name: 'Save', kind: 'secondary' },
    ],
  });
  await flushPromises();

  expect(wrapper.findAll('[id="wizardForm-action-_lx_prev_step"]')).toHaveLength(1);
  expect(wrapper.findAll('[id="wizardForm-action-_lx_next_step"]')).toHaveLength(1);
  expect(wrapper.find('#wizardForm-action-save').exists()).toBe(true);
});
