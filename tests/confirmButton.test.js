import { nextTick } from 'vue';
import { describe, test, expect, afterEach, beforeEach, vi } from 'vitest';
import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils';
import LxConfirmButton from '@/components/ConfirmButton.vue';

let wrapper;

function mountButton(props = {}) {
  return mount(LxConfirmButton, {
    props: { id: 'cb', label: 'Dzēst', ...props },
    attachTo: document.body,
    global: { stubs: { RouterLink: RouterLinkStub } },
  });
}

async function clickButton() {
  await wrapper.find('#cb').trigger('click');
  await nextTick();
}

beforeEach(() => {
  const el = document.createElement('div');
  el.id = 'modals';
  document.body.appendChild(el);
});

afterEach(() => {
  if (wrapper) wrapper.unmount();
  document.body.innerHTML = '';
});

describe('LxConfirmButton', () => {
  test('opens dialog with default texts instead of emitting click', async () => {
    wrapper = mountButton();
    await clickButton();

    expect(wrapper.emitted('click')).toBeUndefined();
    expect(document.querySelector('#cb-dialog-label').textContent).toBe('Vai tiešām gribat dzēst?');
    expect(document.querySelector('#cb-dialog-action-primary').textContent.trim()).toBe(
      'Jā, dzēst'
    );
    expect(document.querySelector('#cb-dialog-action-secondary').textContent.trim()).toBe('Nē');
    expect(document.querySelector('#cb-dialog').getAttribute('role')).toBe('alertdialog');
  });

  test('emits click only after confirmation', async () => {
    wrapper = mountButton();
    await clickButton();

    document.querySelector('#cb-dialog-action-primary').click();
    await nextTick();

    expect(wrapper.emitted('click')).toHaveLength(1);
    expect(wrapper.emitted('cancel')).toBeUndefined();
    expect(document.querySelector('#cb-dialog')).toBeNull();
  });

  test('emits cancel and no click when declined', async () => {
    wrapper = mountButton();
    await clickButton();

    document.querySelector('#cb-dialog-action-secondary').click();
    await nextTick();

    expect(wrapper.emitted('click')).toBeUndefined();
    expect(wrapper.emitted('cancel')).toHaveLength(1);
  });

  test('custom dialog texts override defaults', async () => {
    wrapper = mountButton({
      texts: {
        dialogLabel: 'Dzēst ierakstu?',
        dialogDescription: 'Darbību nevarēs atsaukt',
        dialogPrimaryLabel: 'Dzēst',
        dialogSecondaryLabel: 'Atcelt',
        dialogClose: 'Close',
      },
    });
    await clickButton();

    expect(document.querySelector('#cb-dialog-label').textContent).toBe('Dzēst ierakstu?');
    expect(document.querySelector('#cb-dialog-description').textContent).toBe(
      'Darbību nevarēs atsaukt'
    );
    expect(document.querySelector('#cb-dialog-action-primary').textContent.trim()).toBe('Dzēst');
    expect(document.querySelector('#cb-dialog-action-secondary').textContent.trim()).toBe('Atcelt');
    expect(document.querySelector('#cb-dialog-close-button').getAttribute('aria-label')).toBe(
      'Close'
    );
  });

  test('keeps acronym labels unchanged', async () => {
    wrapper = mountButton({ label: 'PDF lejupielāde' });
    await clickButton();

    expect(document.querySelector('#cb-dialog-label').textContent).toBe(
      'Vai tiešām gribat PDF lejupielāde?'
    );
  });
});

describe('LxConfirmButton hold shortcut', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function press(duration) {
    const btn = wrapper.find('#cb');
    await btn.trigger('pointerdown', { button: 0 });
    vi.advanceTimersByTime(duration);
    await nextTick();
    await btn.trigger('pointerup');
    await btn.trigger('click');
    await nextTick();
  }

  test('emits click without dialog after holding', async () => {
    wrapper = mountButton({ icon: 'delete' });
    const btn = wrapper.find('#cb');
    await btn.trigger('pointerdown', { button: 0 });
    vi.advanceTimersByTime(500);
    await nextTick();
    expect(btn.classes()).toContain('lx-confirm-button-holding');
    expect(btn.find('.lx-button-hold-loader .lx-loader-progress').exists()).toBe(true);

    vi.advanceTimersByTime(1000);
    await nextTick();
    expect(btn.classes()).toContain('lx-confirm-button-hold-done');
    expect(btn.find('.lx-button-hold-loader').exists()).toBe(false);
    expect(wrapper.emitted('click')).toHaveLength(1);

    await btn.trigger('pointerup');
    await btn.trigger('click');
    await nextTick();
    expect(wrapper.emitted('click')).toHaveLength(1);
    expect(document.querySelector('#cb-dialog')).toBeNull();

    vi.advanceTimersByTime(1000);
    await nextTick();
    expect(btn.classes()).not.toContain('lx-confirm-button-hold-done');
  });

  test('releasing early cancels without dialog', async () => {
    wrapper = mountButton();
    await press(1000);

    expect(wrapper.emitted('click')).toBeUndefined();
    expect(document.querySelector('#cb-dialog')).toBeNull();
  });

  test('releasing early rewinds the progress before resetting', async () => {
    let finish;
    const animation = {
      animationName: 'lx-confirm-hold-ring',
      updatePlaybackRate: vi.fn(),
      finished: new Promise((resolve) => {
        finish = resolve;
      }),
    };
    const getAnimations = vi.fn(() => [animation]);
    Element.prototype.getAnimations = getAnimations;

    wrapper = mountButton({ icon: 'delete' });
    const btn = wrapper.find('#cb');
    await btn.trigger('pointerdown', { button: 0 });
    vi.advanceTimersByTime(1000);
    await nextTick();
    await btn.trigger('pointerup');
    await nextTick();

    expect(animation.updatePlaybackRate).toHaveBeenCalledWith(-4);
    expect(btn.classes()).toContain('lx-confirm-button-holding');

    finish();
    await flushPromises();
    expect(btn.classes()).not.toContain('lx-confirm-button-holding');
    expect(wrapper.emitted('click')).toBeUndefined();

    delete Element.prototype.getAnimations;
  });

  test('short press still opens dialog', async () => {
    wrapper = mountButton();
    await press(100);

    expect(wrapper.emitted('click')).toBeUndefined();
    expect(document.querySelector('#cb-dialog')).not.toBeNull();
  });

  test('holding does nothing when disabled', async () => {
    wrapper = mountButton({ disabled: true });
    await wrapper.find('#cb').trigger('pointerdown', { button: 0 });
    vi.advanceTimersByTime(5000);
    await nextTick();

    expect(wrapper.emitted('click')).toBeUndefined();
  });
});
