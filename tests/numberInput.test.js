// @ts-nocheck
import { mount, config } from '@vue/test-utils';
import { describe, test, expect, afterEach, vi } from 'vitest';
import { ref } from 'vue';
import LxNumberInput from '@/components/NumberInput.vue';
import { ARIA_LIVE_ANNOUNCEMENT_CONSTANTS } from '@/constants';
import 'regenerator-runtime/runtime';

config.global.stubs = { ...config.global.stubs, 'router-link': true };

let wrapper;

afterEach(() => {
  if (wrapper) {
    wrapper.unmount();
  }
});

const ID = 'test-slider';

// Wires modelValue back like a real v-model, so consecutive steps build on each other.
// Values emitted during mount are queued, since `mounted` is only bound once mount() returns.
function mountWithModel(props = {}) {
  const emittedDuringMount = [];
  const holder = { wrapper: null };
  holder.wrapper = mount(LxNumberInput, {
    props: {
      id: ID,
      ...props,
      'onUpdate:modelValue': (value) => {
        if (holder.wrapper) holder.wrapper.setProps({ modelValue: value });
        else emittedDuringMount.push(value);
      },
    },
  });
  if (emittedDuringMount.length) {
    holder.wrapper.setProps({ modelValue: emittedDuringMount.at(-1) });
  }
  return holder.wrapper;
}

function emittedValues(component) {
  return (component.emitted()['update:modelValue'] ?? []).map(([value]) => value);
}

function lastEmitted(component) {
  const values = emittedValues(component);
  return values[values.length - 1];
}

describe('LxNumberInput', () => {
  test('should be a valid component', () => {
    expect(LxNumberInput).toBeTruthy();
  });

  describe('Props', () => {
    test('should have the correct default props', () => {
      wrapper = mount(LxNumberInput);
      const props = wrapper.props();

      expect(props.id).toBeTypeOf('string');
      expect(props.id.length).toBeGreaterThan(0);
      expect(props.modelValue).toBe(0);
      expect(props.kind).toBe('slider');
      expect(props.min).toBe(0);
      expect(props.max).toBe(9999);
      expect(props.step).toBe(1);
      expect(props.stepMultiplier).toBe(5);
      expect(props.hasInput).toBe(false);
      expect(props.disabled).toBe(false);
      expect(props.readOnly).toBe(false);
      expect(props.labelId).toBe(null);
      expect(props.disableArrowKeys).toBe(false);
      expect(props.texts).toEqual({});
      expect(props.builderOptions).toEqual({
        innerComponent: false,
        componentStack: null,
        schemaPath: null,
        useRegistry: false,
      });
    });

    test('should accept provided prop values', () => {
      wrapper = mount(LxNumberInput, {
        props: {
          id: ID,
          modelValue: 42,
          kind: 'stepper',
          min: -10,
          max: 100,
          step: 2,
          stepMultiplier: 20,
          hasInput: true,
          disabled: true,
          readOnly: false,
          labelId: 'custom-label',
          disableArrowKeys: true,
          texts: {
            decreaseValue: 'Custom decrease',
            increaseValue: 'Custom increase',
          },
        },
      });
      const props = wrapper.props();

      expect(props.id).toBe(ID);
      expect(props.id).toBeTypeOf('string');
      expect(props.modelValue).toBe(42);
      expect(props.modelValue).toBeTypeOf('number');
      expect(props.kind).toBe('stepper');
      expect(props.kind).toBeTypeOf('string');
      expect(props.min).toBe(-10);
      expect(props.min).toBeTypeOf('number');
      expect(props.max).toBe(100);
      expect(props.max).toBeTypeOf('number');
      expect(props.step).toBe(2);
      expect(props.step).toBeTypeOf('number');
      expect(props.stepMultiplier).toBe(20);
      expect(props.stepMultiplier).toBeTypeOf('number');
      expect(props.hasInput).toBe(true);
      expect(props.hasInput).toBeTypeOf('boolean');
      expect(props.disabled).toBe(true);
      expect(props.disabled).toBeTypeOf('boolean');
      expect(props.labelId).toBe('custom-label');
      expect(props.labelId).toBeTypeOf('string');
      expect(props.disableArrowKeys).toBe(true);
      expect(props.disableArrowKeys).toBeTypeOf('boolean');
      expect(props.texts.decreaseValue).toBe('Custom decrease');
      expect(props.texts.increaseValue).toBe('Custom increase');
    });

    test('should generate a unique id per instance when none is given', () => {
      wrapper = mount(LxNumberInput);
      const other = mount(LxNumberInput);

      expect(wrapper.props().id).not.toBe(other.props().id);
      other.unmount();
    });

    describe('kind', () => {
      test('should render the slider kind by default', () => {
        wrapper = mount(LxNumberInput);

        expect(wrapper.find('.lx-number-slider-wrapper').exists()).toBe(true);
        expect(wrapper.find('.lx-number-slider').exists()).toBe(true);
        expect(wrapper.find('.lx-number-stepper').exists()).toBe(false);
      });

      test('should render the stepper kind when requested', () => {
        wrapper = mount(LxNumberInput, { props: { kind: 'stepper' } });

        expect(wrapper.find('.lx-number-stepper').exists()).toBe(true);
        expect(wrapper.find('.lx-number-slider-wrapper').exists()).toBe(false);
        expect(wrapper.find('.lx-number-slider').exists()).toBe(false);
      });

      test('should fall back to the slider kind for an unknown value', () => {
        wrapper = mount(LxNumberInput, { props: { kind: 'nonsense' } });

        expect(wrapper.find('.lx-number-slider-wrapper').exists()).toBe(true);
      });
    });
  });

  describe('Rendering - slider kind', () => {
    test('should pass min, max and step down to the range input', () => {
      wrapper = mount(LxNumberInput, {
        props: { id: ID, modelValue: 5, min: -10, max: 10, step: 2 },
      });
      const input = wrapper.find('.lx-number-slider');

      expect(input.attributes('type')).toBe('range');
      expect(input.attributes('id')).toBe(ID);
      expect(input.attributes('min')).toBe('-10');
      expect(input.attributes('max')).toBe('10');
      expect(input.attributes('step')).toBe('2');
      expect(input.element.value).toBe('5');
    });

    test('should render the min and max range labels', () => {
      wrapper = mount(LxNumberInput, { props: { min: -10, max: 250 } });
      const labels = wrapper.findAll('.lx-number-slider-range-label');

      expect(labels.length).toBe(2);
      expect(labels[0].text()).toBe('-10');
      expect(labels[1].text()).toBe('250');
    });

    test('should expose the current value as the slider tooltip', () => {
      wrapper = mount(LxNumberInput, { props: { modelValue: 7 } });

      expect(wrapper.find('.lx-number-slider-container').attributes('data-lx-tooltip')).toBe('7');
    });

    test('should render both track parts', () => {
      wrapper = mount(LxNumberInput);

      expect(wrapper.find('.lx-number-slider-track-filled').exists()).toBe(true);
      expect(wrapper.find('.lx-number-slider-track-unfilled').exists()).toBe(true);
    });

    describe('fill position', () => {
      test.each([
        ['0%', 0],
        ['50%', 5],
        ['100%', 10],
        ['30%', 3],
      ])('should be positioned at %s for modelValue %i', (expected, modelValue) => {
        wrapper = mount(LxNumberInput, { props: { modelValue, min: 0, max: 10 } });

        expect(
          wrapper.find('.lx-number-slider-container').element.style.getPropertyValue('--fill')
        ).toBe(expected);
      });

      test('should stay proportional for a non-zero min', () => {
        wrapper = mount(LxNumberInput, { props: { modelValue: 150, min: 100, max: 200 } });

        expect(
          wrapper.find('.lx-number-slider-container').element.style.getPropertyValue('--fill')
        ).toBe('50%');
      });
    });

    test('should mark the wrapper as disabled and disable the range input', () => {
      wrapper = mount(LxNumberInput, { props: { disabled: true } });

      expect(wrapper.find('.lx-number-slider-wrapper').classes()).toContain('lx-disabled');
      expect(wrapper.find('.lx-number-slider').attributes('disabled')).toBeDefined();
    });

    test('should not mark the wrapper as disabled when enabled', () => {
      wrapper = mount(LxNumberInput);

      expect(wrapper.find('.lx-number-slider-wrapper').classes()).not.toContain('lx-disabled');
      expect(wrapper.find('.lx-number-slider').attributes('disabled')).toBeUndefined();
    });

    describe('hasInput', () => {
      test('should keep the value input hidden by default', () => {
        wrapper = mount(LxNumberInput);
        const rangeText = wrapper.find('.lx-number-slider-range-text');

        expect(rangeText.exists()).toBe(true);
        expect(rangeText.element.style.display).toBe('none');
      });

      test('should reveal the value input when hasInput is true', () => {
        wrapper = mount(LxNumberInput, { props: { id: ID, hasInput: true, modelValue: 12 } });
        const rangeText = wrapper.find('.lx-number-slider-range-text');

        expect(rangeText.element.style.display).toBe('');
        expect(rangeText.find(`input#${ID}-text`).exists()).toBe(true);
        expect(rangeText.find(`input#${ID}-text`).element.value).toBe('12');
      });

      test('should keep the range input id separate from the text input id', () => {
        wrapper = mount(LxNumberInput, { props: { id: ID, hasInput: true } });

        expect(wrapper.find(`.lx-number-slider#${ID}`).exists()).toBe(true);
        expect(wrapper.find(`input#${ID}-text`).exists()).toBe(true);
      });
    });
  });

  describe('Rendering - stepper kind', () => {
    test('should render the value, the decrease and the increase buttons', () => {
      wrapper = mount(LxNumberInput, { props: { id: ID, kind: 'stepper', modelValue: 3 } });

      expect(wrapper.find('.lx-number-stepper-value').text()).toBe('3');
      expect(wrapper.find(`button#${ID}-decrease`).exists()).toBe(true);
      expect(wrapper.find(`button#${ID}-increase`).exists()).toBe(true);
    });

    test('should mark the buttons with their own custom classes', () => {
      wrapper = mount(LxNumberInput, { props: { id: ID, kind: 'stepper' } });

      expect(wrapper.find(`button#${ID}-decrease`).classes()).toContain(
        'lx-number-stepper-decrease'
      );
      expect(wrapper.find(`button#${ID}-increase`).classes()).toContain(
        'lx-number-stepper-increase'
      );
    });

    test('should render both buttons as ghost icon-only buttons', () => {
      wrapper = mount(LxNumberInput, { props: { id: ID, kind: 'stepper' } });
      const decrease = wrapper.find(`button#${ID}-decrease`);

      expect(decrease.classes()).toContain('lx-button-ghost');
      expect(decrease.classes()).toContain('lx-button-icon-only');
    });

    test('should add the no-input class and skip the text input by default', () => {
      wrapper = mount(LxNumberInput, { props: { id: ID, kind: 'stepper' } });

      expect(wrapper.find('.lx-number-stepper').classes()).toContain('lx-number-stepper-no-input');
      expect(wrapper.find('.lx-number-stepper-text-input').exists()).toBe(false);
      expect(wrapper.find('input.lx-text-input').exists()).toBe(false);
    });

    test('should swap the static value for a text input when hasInput is true', () => {
      wrapper = mount(LxNumberInput, {
        props: { id: ID, kind: 'stepper', hasInput: true, modelValue: 8 },
      });

      expect(wrapper.find('.lx-number-stepper').classes()).not.toContain(
        'lx-number-stepper-no-input'
      );
      expect(wrapper.find('.lx-number-stepper-value').exists()).toBe(false);
      expect(wrapper.find('.lx-number-stepper-text-input').exists()).toBe(true);
      expect(wrapper.find(`input#${ID}`).element.value).toBe('8');
    });

    test('should keep the stepper wrapper an lx-input-wrapper so it inherits input styling', () => {
      wrapper = mount(LxNumberInput, { props: { kind: 'stepper' } });

      expect(wrapper.find('.lx-number-stepper').classes()).toContain('lx-input-wrapper');
    });

    test('should mark the wrapper and the buttons as disabled', () => {
      wrapper = mount(LxNumberInput, {
        props: { id: ID, kind: 'stepper', modelValue: 5, min: 0, max: 10, disabled: true },
      });

      expect(wrapper.find('.lx-number-stepper').classes()).toContain('lx-disabled');
      expect(wrapper.find(`button#${ID}-decrease`).attributes('disabled')).toBeDefined();
      expect(wrapper.find(`button#${ID}-increase`).attributes('disabled')).toBeDefined();
    });

    test('should disable the text input when disabled', () => {
      wrapper = mount(LxNumberInput, {
        props: { id: ID, kind: 'stepper', hasInput: true, disabled: true },
      });

      expect(wrapper.find(`input#${ID}`).attributes('disabled')).toBeDefined();
    });

    describe('button availability at the bounds', () => {
      test('should disable only decrease at min', () => {
        wrapper = mount(LxNumberInput, {
          props: { id: ID, kind: 'stepper', modelValue: 0, min: 0, max: 10 },
        });

        expect(wrapper.find(`button#${ID}-decrease`).attributes('disabled')).toBeDefined();
        expect(wrapper.find(`button#${ID}-increase`).attributes('disabled')).toBeUndefined();
      });

      test('should disable only increase at max', () => {
        wrapper = mount(LxNumberInput, {
          props: { id: ID, kind: 'stepper', modelValue: 10, min: 0, max: 10 },
        });

        expect(wrapper.find(`button#${ID}-decrease`).attributes('disabled')).toBeUndefined();
        expect(wrapper.find(`button#${ID}-increase`).attributes('disabled')).toBeDefined();
      });

      test('should enable both between the bounds', () => {
        wrapper = mount(LxNumberInput, {
          props: { id: ID, kind: 'stepper', modelValue: 5, min: 0, max: 10 },
        });

        expect(wrapper.find(`button#${ID}-decrease`).attributes('disabled')).toBeUndefined();
        expect(wrapper.find(`button#${ID}-increase`).attributes('disabled')).toBeUndefined();
      });

      test('should re-enable the button once the value moves away from the bound', async () => {
        wrapper = mount(LxNumberInput, {
          props: { id: ID, kind: 'stepper', modelValue: 0, min: 0, max: 10 },
        });
        expect(wrapper.find(`button#${ID}-decrease`).attributes('disabled')).toBeDefined();

        await wrapper.setProps({ modelValue: 1 });

        expect(wrapper.find(`button#${ID}-decrease`).attributes('disabled')).toBeUndefined();
      });
    });

    describe('focus handling', () => {
      test('should keep the buttons tabbable when there is no text input', () => {
        wrapper = mount(LxNumberInput, { props: { id: ID, kind: 'stepper' } });

        expect(wrapper.find(`button#${ID}-decrease`).attributes('tabindex')).toBe('0');
        expect(wrapper.find(`button#${ID}-increase`).attributes('tabindex')).toBe('0');
      });

      test('should take the buttons out of the tab order when the text input owns focus', () => {
        wrapper = mount(LxNumberInput, {
          props: { id: ID, kind: 'stepper', hasInput: true },
        });

        expect(wrapper.find(`button#${ID}-decrease`).attributes('tabindex')).toBe('-1');
        expect(wrapper.find(`button#${ID}-increase`).attributes('tabindex')).toBe('-1');
      });

      test('should prevent the default mousedown so the text input keeps focus', () => {
        wrapper = mount(LxNumberInput, {
          props: { id: ID, kind: 'stepper', hasInput: true, modelValue: 5, min: 0, max: 10 },
        });

        const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
        wrapper.find(`button#${ID}-increase`).element.dispatchEvent(event);

        expect(event.defaultPrevented).toBe(true);
      });

      test('should not prevent the default mousedown when there is no text input', () => {
        wrapper = mount(LxNumberInput, {
          props: { id: ID, kind: 'stepper', modelValue: 5, min: 0, max: 10 },
        });

        const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
        wrapper.find(`button#${ID}-increase`).element.dispatchEvent(event);

        expect(event.defaultPrevented).toBe(false);
      });
    });
  });

  describe('Rendering - readOnly', () => {
    test('should render the value as plain data for the slider kind', () => {
      wrapper = mount(LxNumberInput, { props: { modelValue: 33, readOnly: true } });

      expect(wrapper.find('.lx-data').text()).toBe('33');
      expect(wrapper.find('.lx-number-slider-wrapper').exists()).toBe(false);
      expect(wrapper.find('input').exists()).toBe(false);
    });

    test('should render the value as plain data for the stepper kind', () => {
      wrapper = mount(LxNumberInput, {
        props: { id: ID, modelValue: 33, kind: 'stepper', readOnly: true },
      });

      expect(wrapper.find('.lx-data').text()).toBe('33');
      expect(wrapper.find('.lx-number-stepper').exists()).toBe(false);
      expect(wrapper.find(`button#${ID}-increase`).exists()).toBe(false);
    });

    test('should win over hasInput', () => {
      wrapper = mount(LxNumberInput, {
        props: { modelValue: 33, kind: 'stepper', hasInput: true, readOnly: true },
      });

      expect(wrapper.find('.lx-data').text()).toBe('33');
      expect(wrapper.find('input').exists()).toBe(false);
    });
  });

  describe('Accessibility', () => {
    test('should keep the wrapper data-id in sync with the id prop', () => {
      wrapper = mount(LxNumberInput, { props: { id: ID } });

      expect(wrapper.find('.lx-field-wrapper').attributes('data-id')).toBe(ID);
    });

    test('should label the range input with the labelId prop', () => {
      wrapper = mount(LxNumberInput, { props: { labelId: 'custom-label' } });

      expect(wrapper.find('.lx-number-slider').attributes('aria-labelledby')).toBe('custom-label');
    });

    test('should label the range input with the injected rowId when no labelId is given', () => {
      wrapper = mount(LxNumberInput, {
        global: { provide: { rowId: ref('row-label') } },
      });

      expect(wrapper.find('.lx-number-slider').attributes('aria-labelledby')).toBe('row-label');
    });

    test('should let labelId win over the injected rowId', () => {
      wrapper = mount(LxNumberInput, {
        props: { labelId: 'custom-label' },
        global: { provide: { rowId: ref('row-label') } },
      });

      expect(wrapper.find('.lx-number-slider').attributes('aria-labelledby')).toBe('custom-label');
    });

    test('should label the read-only value', () => {
      wrapper = mount(LxNumberInput, {
        props: { readOnly: true, labelId: 'custom-label' },
      });

      expect(wrapper.find('.lx-data').attributes('aria-labelledby')).toBe('custom-label');
    });

    test('should expose the stepper value as a spinbutton with its range', () => {
      wrapper = mount(LxNumberInput, {
        props: {
          kind: 'stepper',
          modelValue: 5,
          min: -10,
          max: 10,
          labelId: 'custom-label',
        },
      });
      const value = wrapper.find('.lx-number-stepper-value');

      expect(value.attributes('role')).toBe('spinbutton');
      expect(value.attributes('aria-labelledby')).toBe('custom-label');
      expect(value.attributes('aria-valuenow')).toBe('5');
      expect(value.attributes('aria-valuemin')).toBe('-10');
      expect(value.attributes('aria-valuemax')).toBe('10');
    });

    test('should keep the spinbutton value in sync with the model', async () => {
      wrapper = mount(LxNumberInput, {
        props: { kind: 'stepper', modelValue: 5, min: 0, max: 10 },
      });

      await wrapper.setProps({ modelValue: 6 });

      expect(wrapper.find('.lx-number-stepper-value').attributes('aria-valuenow')).toBe('6');
    });

    test('should render a polite live region for the slider kind', () => {
      wrapper = mount(LxNumberInput);
      const status = wrapper.find('[role="status"]');

      expect(status.exists()).toBe(true);
      expect(status.classes()).toContain('lx-invisible');
      expect(status.attributes('aria-live')).toBe('polite');
      expect(status.attributes('aria-atomic')).toBe('true');
    });

    test('should render a live region for the stepper kind without a text input', () => {
      wrapper = mount(LxNumberInput, { props: { kind: 'stepper' } });

      expect(wrapper.find('[role="status"]').exists()).toBe(true);
    });

    test('should skip the live region when the stepper has a text input', () => {
      wrapper = mount(LxNumberInput, { props: { kind: 'stepper', hasInput: true } });

      expect(wrapper.find('[role="status"]').exists()).toBe(false);
    });

    test('should announce the new value after the announcement delay', async () => {
      vi.useFakeTimers();
      try {
        wrapper = mount(LxNumberInput, { props: { modelValue: 5, min: 0, max: 10 } });
        vi.advanceTimersByTime(ARIA_LIVE_ANNOUNCEMENT_CONSTANTS.DELAY);
        await wrapper.vm.$nextTick();
        expect(wrapper.find('[role="status"]').text()).toBe('5');

        await wrapper.setProps({ modelValue: 8 });
        expect(wrapper.find('[role="status"]').text()).toBe('5');

        vi.advanceTimersByTime(ARIA_LIVE_ANNOUNCEMENT_CONSTANTS.DELAY);
        await wrapper.vm.$nextTick();
        expect(wrapper.find('[role="status"]').text()).toBe('8');
      } finally {
        vi.useRealTimers();
      }
    });

    test('should only announce the last value of a rapid burst', async () => {
      vi.useFakeTimers();
      try {
        wrapper = mount(LxNumberInput, { props: { modelValue: 1, min: 0, max: 10 } });
        vi.advanceTimersByTime(ARIA_LIVE_ANNOUNCEMENT_CONSTANTS.DELAY);
        await wrapper.vm.$nextTick();

        await wrapper.setProps({ modelValue: 2 });
        vi.advanceTimersByTime(ARIA_LIVE_ANNOUNCEMENT_CONSTANTS.DELAY - 50);
        await wrapper.setProps({ modelValue: 3 });
        vi.advanceTimersByTime(ARIA_LIVE_ANNOUNCEMENT_CONSTANTS.DELAY - 50);
        await wrapper.setProps({ modelValue: 4 });
        await wrapper.vm.$nextTick();
        expect(wrapper.find('[role="status"]').text()).toBe('1');

        vi.advanceTimersByTime(ARIA_LIVE_ANNOUNCEMENT_CONSTANTS.DELAY);
        await wrapper.vm.$nextTick();
        expect(wrapper.find('[role="status"]').text()).toBe('4');
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('Texts', () => {
    test('should label the stepper buttons with the default texts', () => {
      wrapper = mount(LxNumberInput, { props: { id: ID, kind: 'stepper' } });

      expect(wrapper.find(`button#${ID}-decrease`).attributes('aria-label')).toBe(
        'Samazināt vērtību'
      );
      expect(wrapper.find(`button#${ID}-increase`).attributes('aria-label')).toBe(
        'Palielināt vērtību'
      );
    });

    test('should label the stepper buttons with the provided texts', () => {
      wrapper = mount(LxNumberInput, {
        props: {
          id: ID,
          kind: 'stepper',
          texts: { decreaseValue: 'Custom decrease', increaseValue: 'Custom increase' },
        },
      });

      expect(wrapper.find(`button#${ID}-decrease`).attributes('aria-label')).toBe(
        'Custom decrease'
      );
      expect(wrapper.find(`button#${ID}-increase`).attributes('aria-label')).toBe(
        'Custom increase'
      );
    });

    test('should keep the default for the keys that are not overridden', () => {
      wrapper = mount(LxNumberInput, {
        props: { id: ID, kind: 'stepper', texts: { increaseValue: 'Custom increase' } },
      });

      expect(wrapper.find(`button#${ID}-decrease`).attributes('aria-label')).toBe(
        'Samazināt vērtību'
      );
      expect(wrapper.find(`button#${ID}-increase`).attributes('aria-label')).toBe(
        'Custom increase'
      );
    });

    test('should react to a texts prop change', async () => {
      wrapper = mount(LxNumberInput, { props: { id: ID, kind: 'stepper' } });

      await wrapper.setProps({ texts: { increaseValue: 'Later' } });

      expect(wrapper.find(`button#${ID}-increase`).attributes('aria-label')).toBe('Later');
    });
  });

  describe('Model', () => {
    test('should round a decimal model value when rendering', () => {
      wrapper = mount(LxNumberInput, { props: { modelValue: 5.6, readOnly: true } });

      expect(wrapper.find('.lx-data').text()).toBe('6');
    });

    test('should round the min and max used for the range', () => {
      wrapper = mount(LxNumberInput, { props: { min: -2.4, max: 10.5 } });
      const input = wrapper.find('.lx-number-slider');

      expect(input.attributes('min')).toBe('-2');
      expect(input.attributes('max')).toBe('11');
    });

    test('should emit a whole number when the range input reports a decimal', async () => {
      wrapper = mount(LxNumberInput, { props: { modelValue: 5, min: 0, max: 10 } });

      await wrapper.find('.lx-number-slider').setValue('7.4');

      expect(lastEmitted(wrapper)).toBe(7);
      expect(lastEmitted(wrapper)).toBeTypeOf('number');
    });

    test('should emit a number when the range input reports a string', async () => {
      wrapper = mount(LxNumberInput, { props: { modelValue: 5, min: 0, max: 10 } });

      await wrapper.find('.lx-number-slider').setValue('8');

      expect(lastEmitted(wrapper)).toBe(8);
      expect(lastEmitted(wrapper)).toBeTypeOf('number');
    });
  });

  describe('Behaviour - stepper buttons', () => {
    test('should step up on increase and down on decrease', async () => {
      wrapper = mountWithModel({ kind: 'stepper', modelValue: 5, min: 0, max: 10 });

      await wrapper.find(`button#${ID}-increase`).trigger('click');
      expect(lastEmitted(wrapper)).toBe(6);

      await wrapper.find(`button#${ID}-decrease`).trigger('click');
      expect(lastEmitted(wrapper)).toBe(5);
    });

    test('should respect a custom step', async () => {
      wrapper = mountWithModel({ kind: 'stepper', modelValue: 0, min: 0, max: 100, step: 25 });

      await wrapper.find(`button#${ID}-increase`).trigger('click');
      await wrapper.find(`button#${ID}-increase`).trigger('click');

      expect(emittedValues(wrapper)).toEqual([25, 50]);
    });

    test('should accumulate repeated clicks', async () => {
      wrapper = mountWithModel({ kind: 'stepper', modelValue: 0, min: 0, max: 10 });

      await wrapper.find(`button#${ID}-increase`).trigger('click');
      await wrapper.find(`button#${ID}-increase`).trigger('click');
      await wrapper.find(`button#${ID}-increase`).trigger('click');

      expect(emittedValues(wrapper)).toEqual([1, 2, 3]);
      expect(wrapper.find('.lx-number-stepper-value').text()).toBe('3');
    });

    test('should not step past max', async () => {
      wrapper = mountWithModel({ kind: 'stepper', modelValue: 9, min: 0, max: 10 });

      await wrapper.find(`button#${ID}-increase`).trigger('click');
      expect(lastEmitted(wrapper)).toBe(10);

      expect(wrapper.find(`button#${ID}-increase`).attributes('disabled')).toBeDefined();
      await wrapper.find(`button#${ID}-increase`).trigger('click');
      expect(lastEmitted(wrapper)).toBe(10);
    });

    test('should not step past min', async () => {
      wrapper = mountWithModel({ kind: 'stepper', modelValue: 1, min: 0, max: 10 });

      await wrapper.find(`button#${ID}-decrease`).trigger('click');
      expect(lastEmitted(wrapper)).toBe(0);

      expect(wrapper.find(`button#${ID}-decrease`).attributes('disabled')).toBeDefined();
      await wrapper.find(`button#${ID}-decrease`).trigger('click');
      expect(lastEmitted(wrapper)).toBe(0);
    });

    test('should clamp a step that overshoots max', async () => {
      wrapper = mountWithModel({ kind: 'stepper', modelValue: 8, min: 0, max: 10, step: 25 });

      await wrapper.find(`button#${ID}-increase`).trigger('click');

      expect(lastEmitted(wrapper)).toBe(10);
      expect(wrapper.find('.lx-number-stepper-value').text()).toBe('10');
    });

    test('should clamp a step that undershoots min', async () => {
      wrapper = mountWithModel({ kind: 'stepper', modelValue: 2, min: 0, max: 10, step: 25 });

      await wrapper.find(`button#${ID}-decrease`).trigger('click');

      expect(lastEmitted(wrapper)).toBe(0);
      expect(wrapper.find('.lx-number-stepper-value').text()).toBe('0');
    });

    test('should not emit anything while disabled', async () => {
      wrapper = mountWithModel({
        kind: 'stepper',
        modelValue: 5,
        min: 0,
        max: 10,
        disabled: true,
      });

      await wrapper.find(`button#${ID}-increase`).trigger('click');
      await wrapper.find(`button#${ID}-decrease`).trigger('click');

      expect(wrapper.emitted()['update:modelValue']).toBeFalsy();
    });

    test('should work with a negative range', async () => {
      wrapper = mountWithModel({ kind: 'stepper', modelValue: -5, min: -10, max: -1 });

      await wrapper.find(`button#${ID}-decrease`).trigger('click');

      expect(lastEmitted(wrapper)).toBe(-6);
    });
  });

  describe('Behaviour - stepper keyboard', () => {
    const stepperInput = () => wrapper.find(`input#${ID}`);

    test('should step up and down with the arrow keys', async () => {
      wrapper = mountWithModel({ kind: 'stepper', hasInput: true, modelValue: 5, max: 10 });

      await stepperInput().trigger('keydown', { key: 'ArrowUp' });
      expect(lastEmitted(wrapper)).toBe(6);

      await stepperInput().trigger('keydown', { key: 'ArrowDown' });
      expect(lastEmitted(wrapper)).toBe(5);
    });

    test('should jump by stepMultiplier with shift and the arrow keys', async () => {
      wrapper = mountWithModel({
        kind: 'stepper',
        hasInput: true,
        modelValue: 20,
        max: 100,
        stepMultiplier: 5,
      });

      await stepperInput().trigger('keydown', { key: 'ArrowUp', shiftKey: true });
      expect(lastEmitted(wrapper)).toBe(25);

      await stepperInput().trigger('keydown', { key: 'ArrowDown', shiftKey: true });
      expect(lastEmitted(wrapper)).toBe(20);
    });

    test('should respect a custom stepMultiplier', async () => {
      wrapper = mountWithModel({
        kind: 'stepper',
        hasInput: true,
        modelValue: 0,
        max: 1000,
        stepMultiplier: 100,
      });

      await stepperInput().trigger('keydown', { key: 'ArrowUp', shiftKey: true });

      expect(lastEmitted(wrapper)).toBe(100);
    });

    test('should jump a page with PageUp and PageDown', async () => {
      wrapper = mountWithModel({
        kind: 'stepper',
        hasInput: true,
        modelValue: 500,
        min: 0,
        max: 1000,
      });

      await stepperInput().trigger('keydown', { key: 'PageUp' });
      expect(lastEmitted(wrapper)).toBe(600);

      await stepperInput().trigger('keydown', { key: 'PageDown' });
      expect(lastEmitted(wrapper)).toBe(500);
    });

    test('should never let the page step fall below the step', async () => {
      wrapper = mountWithModel({
        kind: 'stepper',
        hasInput: true,
        modelValue: 0,
        min: 0,
        max: 12,
        step: 5,
      });

      await stepperInput().trigger('keydown', { key: 'PageUp' });

      expect(lastEmitted(wrapper)).toBe(5);
    });

    test('should clamp a page jump to the bounds', async () => {
      wrapper = mountWithModel({
        kind: 'stepper',
        hasInput: true,
        modelValue: 950,
        min: 0,
        max: 1000,
      });

      await stepperInput().trigger('keydown', { key: 'PageUp' });

      expect(lastEmitted(wrapper)).toBe(1000);
    });

    test('should ignore the arrow keys when disableArrowKeys is true', async () => {
      wrapper = mountWithModel({
        kind: 'stepper',
        hasInput: true,
        modelValue: 5,
        max: 10,
        disableArrowKeys: true,
      });

      await stepperInput().trigger('keydown', { key: 'ArrowUp' });
      await stepperInput().trigger('keydown', { key: 'ArrowDown' });
      await stepperInput().trigger('keydown', { key: 'ArrowUp', shiftKey: true });
      await stepperInput().trigger('keydown', { key: 'ArrowDown', shiftKey: true });

      expect(wrapper.emitted()['update:modelValue']).toBeFalsy();
    });

    test('should still allow the page keys when disableArrowKeys is true', async () => {
      wrapper = mountWithModel({
        kind: 'stepper',
        hasInput: true,
        modelValue: 500,
        min: 0,
        max: 1000,
        disableArrowKeys: true,
      });

      await stepperInput().trigger('keydown', { key: 'PageUp' });

      expect(lastEmitted(wrapper)).toBe(600);
    });

    test('should prevent the default so the caret does not move', async () => {
      wrapper = mountWithModel({ kind: 'stepper', hasInput: true, modelValue: 5, max: 10 });

      const event = new KeyboardEvent('keydown', {
        key: 'ArrowUp',
        bubbles: true,
        cancelable: true,
      });
      stepperInput().element.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
    });

    test('should ignore unrelated keys', async () => {
      wrapper = mountWithModel({ kind: 'stepper', hasInput: true, modelValue: 5, max: 10 });

      await stepperInput().trigger('keydown', { key: 'ArrowLeft' });
      await stepperInput().trigger('keydown', { key: 'ArrowRight' });
      await stepperInput().trigger('keydown', { key: 'Home' });
      await stepperInput().trigger('keydown', { key: 'End' });

      expect(wrapper.emitted()['update:modelValue']).toBeFalsy();
    });
  });

  describe('Behaviour - slider keyboard', () => {
    const slider = () => wrapper.find('.lx-number-slider');

    test('should step up with ArrowUp and ArrowRight', async () => {
      wrapper = mountWithModel({ modelValue: 5, min: 0, max: 10 });

      await slider().trigger('keydown', { key: 'ArrowUp' });
      expect(lastEmitted(wrapper)).toBe(6);

      await slider().trigger('keydown', { key: 'ArrowRight' });
      expect(lastEmitted(wrapper)).toBe(7);
    });

    test('should step down with ArrowDown and ArrowLeft', async () => {
      wrapper = mountWithModel({ modelValue: 5, min: 0, max: 10 });

      await slider().trigger('keydown', { key: 'ArrowDown' });
      expect(lastEmitted(wrapper)).toBe(4);

      await slider().trigger('keydown', { key: 'ArrowLeft' });
      expect(lastEmitted(wrapper)).toBe(3);
    });

    test('should clamp at the bounds', async () => {
      wrapper = mountWithModel({ modelValue: 10, min: 0, max: 10 });

      await slider().trigger('keydown', { key: 'ArrowRight' });
      expect(wrapper.find('.lx-number-slider-container').attributes('data-lx-tooltip')).toBe('10');

      await slider().trigger('keydown', { key: 'ArrowLeft' });
      await slider().trigger('keydown', { key: 'ArrowLeft' });
      expect(wrapper.find('.lx-number-slider-container').attributes('data-lx-tooltip')).toBe('8');
    });

    test('should ignore ArrowUp and ArrowDown when disableArrowKeys is true', async () => {
      wrapper = mountWithModel({ modelValue: 5, min: 0, max: 10, disableArrowKeys: true });

      await slider().trigger('keydown', { key: 'ArrowUp' });
      await slider().trigger('keydown', { key: 'ArrowDown' });

      expect(wrapper.emitted()['update:modelValue']).toBeFalsy();
    });

    test('should still move with ArrowLeft and ArrowRight when disableArrowKeys is true', async () => {
      wrapper = mountWithModel({ modelValue: 5, min: 0, max: 10, disableArrowKeys: true });

      await slider().trigger('keydown', { key: 'ArrowRight' });

      expect(lastEmitted(wrapper)).toBe(6);
    });

    test('should jump by stepMultiplier with shift and the arrow keys', async () => {
      wrapper = mountWithModel({ modelValue: 5, min: 0, max: 100, step: 1, stepMultiplier: 5 });

      await slider().trigger('keydown', { key: 'ArrowRight', shiftKey: true });
      expect(emittedValues(wrapper)).toEqual([10]);

      await slider().trigger('keydown', { key: 'ArrowLeft', shiftKey: true });
      expect(emittedValues(wrapper)).toEqual([10, 5]);
    });

    test('should jump by stepMultiplier with shift and the vertical arrow keys', async () => {
      wrapper = mountWithModel({ modelValue: 20, min: 0, max: 100, stepMultiplier: 5 });

      await slider().trigger('keydown', { key: 'ArrowUp', shiftKey: true });
      expect(emittedValues(wrapper)).toEqual([25]);

      await slider().trigger('keydown', { key: 'ArrowDown', shiftKey: true });
      expect(emittedValues(wrapper)).toEqual([25, 20]);
    });

    test('should jump a page with PageUp and PageDown when hasInput is true', async () => {
      wrapper = mountWithModel({ hasInput: true, modelValue: 500, min: 0, max: 1000 });

      await wrapper.find(`input#${ID}-text`).trigger('keydown', { key: 'PageUp' });
      expect(lastEmitted(wrapper)).toBe(600);

      await wrapper.find(`input#${ID}-text`).trigger('keydown', { key: 'PageDown' });
      expect(lastEmitted(wrapper)).toBe(500);
    });

    test('should step from the text input with the arrow keys', async () => {
      wrapper = mountWithModel({ hasInput: true, modelValue: 5, min: 0, max: 10 });

      await wrapper.find(`input#${ID}-text`).trigger('keydown', { key: 'ArrowUp' });
      expect(lastEmitted(wrapper)).toBe(6);

      await wrapper
        .find(`input#${ID}-text`)
        .trigger('keydown', { key: 'ArrowDown', shiftKey: true });
      expect(lastEmitted(wrapper)).toBe(1);
    });

    test('should clear the text selection on mousedown so dragging does not select the labels', async () => {
      const removeAllRanges = vi.fn();
      const getSelectionSpy = vi
        .spyOn(globalThis, 'getSelection')
        .mockReturnValue({ removeAllRanges });

      wrapper = mount(LxNumberInput, { props: { modelValue: 5, min: 0, max: 10 } });
      await wrapper.find('.lx-number-slider').trigger('mousedown');

      expect(getSelectionSpy).toHaveBeenCalled();
      expect(removeAllRanges).toHaveBeenCalled();

      getSelectionSpy.mockRestore();
    });
  });

  describe('Behaviour - clamping on prop changes', () => {
    test('should pull a value above max back down to max', async () => {
      wrapper = mount(LxNumberInput, { props: { modelValue: 5, min: 0, max: 10 } });

      await wrapper.setProps({ modelValue: 20 });

      expect(emittedValues(wrapper)).toEqual([10]);
    });

    test('should pull a value below min back up to min', async () => {
      wrapper = mount(LxNumberInput, { props: { modelValue: 5, min: 0, max: 10 } });

      await wrapper.setProps({ modelValue: -20 });

      expect(emittedValues(wrapper)).toEqual([0]);
    });

    test('should leave a value that lands exactly on a bound alone', async () => {
      wrapper = mount(LxNumberInput, { props: { modelValue: 5, min: 0, max: 10 } });

      await wrapper.setProps({ modelValue: 10 });
      await wrapper.setProps({ modelValue: 0 });

      expect(wrapper.emitted()['update:modelValue']).toBeFalsy();
    });

    test('should settle at max when the whole model is out of range', async () => {
      wrapper = mountWithModel({ modelValue: 5, min: 0, max: 10 });

      await wrapper.setProps({ modelValue: 999 });
      await wrapper.vm.$nextTick();

      expect(wrapper.props().modelValue).toBe(10);
      expect(wrapper.find('.lx-number-slider-container').attributes('data-lx-tooltip')).toBe('10');
    });

    test('should settle at min when the whole model is out of range', async () => {
      wrapper = mountWithModel({ modelValue: 5, min: 0, max: 10 });

      await wrapper.setProps({ modelValue: -999 });
      await wrapper.vm.$nextTick();

      expect(wrapper.props().modelValue).toBe(0);
      expect(wrapper.find('.lx-number-slider-container').attributes('data-lx-tooltip')).toBe('0');
    });

    test('should leave an in-range value alone', async () => {
      wrapper = mountWithModel({ modelValue: 5, min: 0, max: 10 });

      await wrapper.setProps({ modelValue: 7 });

      expect(wrapper.props().modelValue).toBe(7);
      expect(wrapper.find('.lx-number-slider-container').attributes('data-lx-tooltip')).toBe('7');
    });

    test('should clamp a value handed in above max on mount', () => {
      wrapper = mount(LxNumberInput, { props: { modelValue: 1000, min: 0, max: 999 } });

      expect(emittedValues(wrapper)).toEqual([999]);
    });

    test('should clamp a value handed in below min on mount', () => {
      wrapper = mount(LxNumberInput, { props: { modelValue: -50, min: 0, max: 999 } });

      expect(emittedValues(wrapper)).toEqual([0]);
    });

    test('should show max, not the out-of-range value, on the stepper input', async () => {
      wrapper = mountWithModel({ kind: 'stepper', hasInput: true, modelValue: 1000, max: 999 });
      await wrapper.vm.$nextTick();

      expect(wrapper.props().modelValue).toBe(999);
      expect(wrapper.find(`input#${ID}`).element.value).toBe('999');
    });

    test('should show max, not the out-of-range value, on the spinbutton', async () => {
      wrapper = mountWithModel({ kind: 'stepper', modelValue: 1000, max: 999 });
      await wrapper.vm.$nextTick();

      expect(wrapper.props().modelValue).toBe(999);
      expect(wrapper.find('.lx-number-stepper-value').text()).toBe('999');
    });

    test('should clamp an out-of-range value in read-only too', async () => {
      wrapper = mountWithModel({ modelValue: 1000, max: 999, readOnly: true });
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.lx-data').text()).toBe('999');
    });

    test('should not emit on mount for a value already in range', () => {
      wrapper = mount(LxNumberInput, { props: { modelValue: 50, min: 0, max: 999 } });

      expect(wrapper.emitted()['update:modelValue']).toBeFalsy();
    });

    test('should settle at max instead of oscillating when min is above max', async () => {
      wrapper = mountWithModel({ kind: 'stepper', modelValue: 7, min: 10, max: 5 });
      await wrapper.vm.$nextTick();

      expect(wrapper.props().modelValue).toBe(5);
      expect(emittedValues(wrapper)).toEqual([5]);
    });
  });

  describe('Behaviour - unspecified value', () => {
    test('should not overwrite a null model with 0 on mount', () => {
      wrapper = mount(LxNumberInput, {
        props: { id: ID, kind: 'stepper', hasInput: true, modelValue: null, min: 0, max: 10 },
      });

      expect(wrapper.emitted()['update:modelValue']).toBeFalsy();
      expect(wrapper.props().modelValue).toBe(null);
    });

    test('should not overwrite a null model with 0 when min is null too', () => {
      wrapper = mountWithModel({ kind: 'stepper', hasInput: true, modelValue: null, min: null });

      expect(wrapper.emitted()['update:modelValue']).toBeFalsy();
      expect(wrapper.props().modelValue).toBe(null);
    });

    test('should leave the stepper text input empty instead of showing 0', () => {
      wrapper = mount(LxNumberInput, {
        props: { id: ID, kind: 'stepper', hasInput: true, modelValue: null },
      });

      expect(wrapper.find(`input#${ID}`).element.value).toBe('');
    });

    test('should leave the slider text input empty instead of showing 0', () => {
      wrapper = mount(LxNumberInput, {
        props: { id: ID, hasInput: true, modelValue: null },
      });

      expect(wrapper.find(`input#${ID}-text`).element.value).toBe('');
    });

    test('should leave the editable spinbutton blank rather than show a placeholder', () => {
      wrapper = mount(LxNumberInput, {
        props: { id: ID, kind: 'stepper', modelValue: null },
      });
      const value = wrapper.find('.lx-number-stepper-value');

      // An editable field reads as empty; the em dash is a read-only display affordance
      expect(value.text()).toBe('');
      expect(value.attributes('aria-valuenow')).toBeUndefined();
      expect(value.attributes('aria-valuetext')).toBe('Nav norādīts');
    });

    test('should show the empty value in read-only instead of 0', () => {
      wrapper = mount(LxNumberInput, { props: { modelValue: null, readOnly: true } });

      expect(wrapper.find('.lx-data').text()).not.toContain('0');
      expect(wrapper.find('.lx-data').text()).toContain('Nav norādīts');
    });

    test('should use an overridden emptyValue text', () => {
      wrapper = mount(LxNumberInput, {
        props: { modelValue: null, readOnly: true, texts: { emptyValue: 'Not specified' } },
      });

      expect(wrapper.find('.lx-data').text()).toContain('Not specified');
    });

    test('should emit null, not 0, when the stepper input is cleared', async () => {
      wrapper = mount(LxNumberInput, {
        props: { id: ID, kind: 'stepper', hasInput: true, modelValue: 5, min: 0, max: 10 },
      });

      await wrapper.find(`input#${ID}`).setValue('');

      expect(emittedValues(wrapper)).toEqual([null]);
    });

    test('should emit null, not 0, when the slider input is cleared', async () => {
      wrapper = mount(LxNumberInput, {
        props: { id: ID, hasInput: true, modelValue: 5, min: 0, max: 10 },
      });

      await wrapper.find(`input#${ID}-text`).setValue('');

      expect(emittedValues(wrapper)).toEqual([null]);
    });

    test('should keep the model empty after clearing instead of jumping back to 0', async () => {
      wrapper = mountWithModel({ kind: 'stepper', hasInput: true, modelValue: 5, min: 0, max: 10 });

      await wrapper.find(`input#${ID}`).setValue('');
      await wrapper.vm.$nextTick();

      expect(wrapper.props().modelValue).toBe(null);
      expect(emittedValues(wrapper)).toEqual([null]);
      expect(wrapper.find(`input#${ID}`).element.value).toBe('');
    });

    test('should not clamp an unspecified value into range', async () => {
      wrapper = mount(LxNumberInput, { props: { modelValue: 5, min: 2, max: 10 } });

      await wrapper.setProps({ modelValue: null });

      expect(wrapper.emitted()['update:modelValue']).toBeFalsy();
    });

    test('should offer only increase while unspecified', () => {
      wrapper = mount(LxNumberInput, {
        props: { id: ID, kind: 'stepper', modelValue: null, min: 0, max: 10 },
      });

      expect(wrapper.find(`button#${ID}-decrease`).attributes('disabled')).toBeDefined();
      expect(wrapper.find(`button#${ID}-increase`).attributes('disabled')).toBeUndefined();
    });

    test('should re-enable decrease once a value is specified', async () => {
      wrapper = mountWithModel({ kind: 'stepper', modelValue: null, min: 0, max: 10 });

      await wrapper.find(`button#${ID}-increase`).trigger('click');
      await wrapper.vm.$nextTick();

      expect(wrapper.props().modelValue).toBe(1);
      expect(wrapper.find(`button#${ID}-decrease`).attributes('disabled')).toBeUndefined();
    });

    test('should step up from zero when increasing an unspecified value', async () => {
      wrapper = mountWithModel({ kind: 'stepper', modelValue: null, min: 0, max: 10 });

      await wrapper.find(`button#${ID}-increase`).trigger('click');

      expect(wrapper.props().modelValue).toBe(1);
    });

    test('should not turn an unspecified value into 0 by decreasing it', async () => {
      wrapper = mountWithModel({ kind: 'stepper', modelValue: null, min: 0, max: 10 });

      await wrapper.find(`button#${ID}-decrease`).trigger('click');
      await wrapper.vm.$nextTick();

      expect(wrapper.props().modelValue).toBe(null);
      expect(wrapper.emitted()['update:modelValue']).toBeFalsy();
    });

    test('should ignore the keyboard decrease shortcuts while unspecified', async () => {
      wrapper = mountWithModel({
        kind: 'stepper',
        hasInput: true,
        modelValue: null,
        min: 0,
        max: 10,
      });
      const input = wrapper.find(`input#${ID}`);

      await input.trigger('keydown', { key: 'ArrowDown' });
      await input.trigger('keydown', { key: 'ArrowDown', shiftKey: true });
      await input.trigger('keydown', { key: 'PageDown' });

      expect(wrapper.props().modelValue).toBe(null);
      expect(wrapper.emitted()['update:modelValue']).toBeFalsy();
    });

    test('should still allow the keyboard increase shortcuts while unspecified', async () => {
      wrapper = mountWithModel({
        kind: 'stepper',
        hasInput: true,
        modelValue: null,
        min: 0,
        max: 10,
      });

      await wrapper.find(`input#${ID}`).trigger('keydown', { key: 'ArrowUp' });
      await wrapper.vm.$nextTick();

      expect(wrapper.props().modelValue).toBe(1);
    });

    test('should rest the range input at min while unspecified', () => {
      wrapper = mount(LxNumberInput, { props: { modelValue: null, min: 2, max: 10 } });

      expect(wrapper.find('.lx-number-slider').element.value).toBe('2');
      expect(
        wrapper.find('.lx-number-slider-container').element.style.getPropertyValue('--fill')
      ).toBe('0%');
    });

    test('should announce the empty value instead of 0', async () => {
      vi.useFakeTimers();
      try {
        wrapper = mount(LxNumberInput, { props: { modelValue: null, min: 0, max: 10 } });
        vi.advanceTimersByTime(ARIA_LIVE_ANNOUNCEMENT_CONSTANTS.DELAY);
        await wrapper.vm.$nextTick();

        expect(wrapper.find('[role="status"]').text()).toBe('Nav norādīts');
      } finally {
        vi.useRealTimers();
      }
    });

    test('should not treat an unspecified value as 0 in the slider tooltip', () => {
      wrapper = mount(LxNumberInput, { props: { modelValue: null, min: 0, max: 10 } });

      expect(wrapper.find('.lx-number-slider-container').attributes('data-lx-tooltip')).toBe(
        'Nav norādīts'
      );
    });

    test('should still apply the prop default when modelValue is omitted', () => {
      wrapper = mount(LxNumberInput, { props: { kind: 'stepper' } });

      expect(wrapper.props().modelValue).toBe(0);
      expect(wrapper.find('.lx-number-stepper-value').text()).toBe('0');
    });

    test('should fall back to the prop defaults when min, max and step are null', async () => {
      wrapper = mountWithModel({
        kind: 'stepper',
        modelValue: 5,
        min: null,
        max: null,
        step: null,
      });

      await wrapper.find(`button#${ID}-increase`).trigger('click');
      await wrapper.vm.$nextTick();

      expect(wrapper.props().modelValue).toBe(6);
    });

    test('should expose the default range on the spinbutton when min and max are null', () => {
      wrapper = mount(LxNumberInput, { props: { kind: 'stepper', min: null, max: null } });
      const value = wrapper.find('.lx-number-stepper-value');

      expect(value.attributes('aria-valuemin')).toBe('0');
      expect(value.attributes('aria-valuemax')).toBe('9999');
    });
  });

  describe('Emits', () => {
    test('should declare update:modelValue', () => {
      wrapper = mount(LxNumberInput);

      expect(wrapper.vm.$options.emits).toContain('update:modelValue');
    });

    test('should not emit anything on mount', () => {
      wrapper = mount(LxNumberInput, { props: { kind: 'stepper', modelValue: 5, max: 10 } });

      expect(wrapper.emitted()['update:modelValue']).toBeFalsy();
    });

    test('should emit exactly once per stepper click while the model prop stays put', async () => {
      wrapper = mount(LxNumberInput, {
        props: { id: ID, kind: 'stepper', modelValue: 5, min: 0, max: 10 },
      });

      await wrapper.find(`button#${ID}-increase`).trigger('click');

      expect(wrapper.emitted()['update:modelValue'].length).toBe(1);
      expect(lastEmitted(wrapper)).toBe(6);
    });

    test('should emit exactly once per stepper click with the model prop wired up', async () => {
      wrapper = mountWithModel({ kind: 'stepper', modelValue: 5, min: 0, max: 10 });

      await wrapper.find(`button#${ID}-increase`).trigger('click');

      expect(emittedValues(wrapper)).toEqual([6]);
      expect(wrapper.props().modelValue).toBe(6);
    });

    test('should not emit again when a step lands exactly on a bound', async () => {
      wrapper = mountWithModel({ kind: 'stepper', modelValue: 9, min: 0, max: 10 });

      await wrapper.find(`button#${ID}-increase`).trigger('click');

      expect(emittedValues(wrapper)).toEqual([10]);
    });

    test('should emit the clamped value once when a step overshoots a bound', async () => {
      wrapper = mountWithModel({ kind: 'stepper', modelValue: 8, min: 0, max: 10, step: 25 });

      await wrapper.find(`button#${ID}-increase`).trigger('click');

      expect(emittedValues(wrapper)).toEqual([33, 10]);
      expect(wrapper.props().modelValue).toBe(10);
    });
  });
});

describe('LxNumberInput required', () => {
  test('slider kind sets aria-required on the range input', () => {
    wrapper = mount(LxNumberInput, { props: { required: true } });
    expect(wrapper.find('.lx-number-slider').attributes('aria-required')).toBe('true');
  });

  test('stepper kind hands required to the inner LxTextInput', () => {
    wrapper = mount(LxNumberInput, {
      props: { kind: 'stepper', hasInput: true, required: true },
    });
    expect(wrapper.find('.lx-text-input').attributes('aria-required')).toBe('true');
  });

  test('stepper kind without an input sets aria-required on the spinbutton', () => {
    wrapper = mount(LxNumberInput, { props: { kind: 'stepper', required: true } });
    expect(wrapper.find('[role="spinbutton"]').attributes('aria-required')).toBe('true');
  });

  test('aria-required is omitted by default', () => {
    wrapper = mount(LxNumberInput);
    expect(wrapper.find('.lx-number-slider').attributes('aria-required')).toBeUndefined();
  });
});
