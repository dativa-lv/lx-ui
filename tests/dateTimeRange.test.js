// @ts-nocheck
import { test, expect, describe, afterEach, beforeEach } from 'vitest';
import LxDateTimeRange from '@/components/datePicker/DateTimeRange.vue';
import { mount } from '@vue/test-utils';

let wrapper;

const dummyClickAway = {
  beforeMount() {},
  mounted() {},
  beforeUnmount() {},
  unmounted() {},
};

beforeEach(() => {
  const el = document.createElement('div');
  el.id = 'poppers';
  document.body.appendChild(el);
});

afterEach(() => {
  document.body.innerHTML = '';
  if (wrapper) {
    wrapper.unmount();
  }
});

describe.each([
  ['date', '.lx-calendar-container', '.lx-calendar-day-content', /\d+/],
  ['month', '.lx-calendar-container', '.lx-calendar-month', /Janv\./i],
  ['year', '.lx-calendar-container', '.lx-calendar-year', /\d+/],
  ['month-year', '.lx-calendar-container', '.lx-calendar-month', /Janv\./i],
  ['quarters', '.lx-calendar-container', '.lx-calendar-quarter', /^Q1$/],
  ['legacy', '.lx-calendar-container', '.lx-calendar-day-content', /\d+/],
])('LxDateTimePicker kind %s', (kind, container, unit, regEx) => {
  test('LxDateTimePicker test  container renders and there is item to select', async () => {
    expect(LxDateTimeRange).toBeTruthy();

    wrapper = mount(LxDateTimeRange, {
      props: {
        kind,
      },
      global: {
        stubs: ['router-link'],
        directives: {
          ClickAway: dummyClickAway,
        },
      },
    });

    const pickerInput = wrapper.find('.lx-date-time-picker.lx-input-area');
    expect(pickerInput.exists()).toBe(true);

    await pickerInput.trigger('keyup', { key: 'ArrowDown' });

    const calendarContainer = document.body.querySelector(container);
    expect(calendarContainer).toBeTruthy();

    const unitContent = calendarContainer.querySelector(unit);
    expect(unitContent).toBeTruthy();
    expect(unitContent.textContent).toMatch(regEx);
  });
});

describe('LxDateTimeRange close on click beside vertically wrapped inputs', () => {
  function mountRange() {
    return mount(LxDateTimeRange, {
      props: { kind: 'date' },
      global: {
        stubs: ['router-link'],
        directives: { ClickAway: dummyClickAway },
      },
    });
  }

  async function openCalendar() {
    const startInput = wrapper.find('.lx-date-time-picker.lx-input-area');
    await startInput.trigger('keyup', { key: 'ArrowDown' });
    expect(document.body.querySelector('.lx-calendar-container')).toBeTruthy();
  }

  test('clicking the stretched empty area of the input container closes the calendar', async () => {
    wrapper = mountRange();
    await openCalendar();

    // The container stretches full width when inputs wrap vertically (responsive).
    // A click on the container itself (target === currentTarget) must fall through
    // to the toggler and close the menu instead of being swallowed by preventClose.
    await wrapper.find('.lx-datepicker-input-container').trigger('click');

    expect(document.body.querySelector('.lx-calendar-container')).toBeFalsy();
  });

  test('clicking an inner element (separator) keeps the calendar open', async () => {
    wrapper = mountRange();
    await openCalendar();

    await wrapper.find('.lx-date-time-range-separator').trigger('click');

    expect(document.body.querySelector('.lx-calendar-container')).toBeTruthy();
  });

  test('clicking the stretched empty area while closed does not open the calendar', async () => {
    wrapper = mountRange();

    expect(document.body.querySelector('.lx-calendar-container')).toBeFalsy();

    await wrapper.find('.lx-datepicker-input-container').trigger('click');

    expect(document.body.querySelector('.lx-calendar-container')).toBeFalsy();
  });
});
