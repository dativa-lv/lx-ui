/* eslint-disable no-restricted-imports */
import { test, expect } from 'vitest';
import { checkButtonState } from './buttonHelpers';

export const actionDefinitionsCommon = [
  {
    id: 'actionSimple',
    name: 'Simple action',
    icon: 'ai',
    title: 'This is a simple action',
  },
  {
    id: 'actionDestructive',
    name: 'Destructive action',
    icon: 'ai',
    destructive: true,
  },
  {
    id: 'actionDisabled',
    name: 'Disabled action',
    icon: 'ai',
    disabled: true,
  },
  {
    id: 'actionBusy',
    name: 'Busy action',
    icon: 'ai',
    busy: true,
  },
  {
    id: 'actionLoading',
    name: 'Loading action',
    icon: 'ai',
    loading: true,
  },
  {
    id: 'actionActive',
    name: 'Active action',
    icon: 'ai',
    active: true,
  },
  {
    id: 'actionBadge',
    name: 'Action with badge',
    icon: 'ai',
    badge: '🌞',
  },
];

/**
 * Checks action definitions with a single action.
 * @param {Function} mountComponent - Function to mount the component
 * @param {Function} setWrapper - Callback to store wrapper for cleanup (e.g., (w) => {wrapper = w;})
 * @param {string} buttonSelector - CSS selector to find the button element
 * @param {Object} [options={}] - Configuration options
 * @param {Object} [options.props={}] - Additional props for component mounting
 */
export function checkActionDefinitionsButtonsSingle(
  mountComponent,
  setWrapper,
  buttonSelector,
  { props = {} } = {}
) {
  function initButton(action) {
    const wrapper = mountComponent({ props: { ...props, actionDefinitions: [action] } });

    setWrapper(wrapper);

    const button = wrapper.find(buttonSelector);

    expect(button.exists()).toBe(true);
    expect(button.attributes('id')).toContain(action.id);
    expect(button.attributes('aria-label')).toContain(action.name);

    return button;
  }

  test('simple', () => {
    const action = {
      id: 'actionSimple',
      name: 'Simple action',
      icon: 'ai',
      title: 'This is a simple action',
    };

    const button = initButton(action);

    expect(button.attributes('title')).toBe(action.title);
  });

  test('destructive', () => {
    const action = {
      id: 'actionDestructive',
      name: 'Destructive action',
      icon: 'ai',
      destructive: true,
    };

    const button = initButton(action);

    checkButtonState(button, 'destructive');
  });

  test('disabled', () => {
    const action = {
      id: 'actionDisabled',
      name: 'Disabled action',
      icon: 'ai',
      disabled: true,
    };

    const button = initButton(action);

    checkButtonState(button, 'disabled');
  });

  test('busy', () => {
    const action = {
      id: 'actionBusy',
      name: 'Busy action',
      icon: 'ai',
      busy: true,
    };

    const button = initButton(action);

    checkButtonState(button, 'busy');
  });

  test('loading', () => {
    const action = {
      id: 'actionLoading',
      name: 'Loading action',
      icon: 'ai',
      loading: true,
    };

    const button = initButton(action);

    checkButtonState(button, 'loading');
  });

  test('active', () => {
    const action = {
      id: 'actionActive',
      name: 'Active action',
      icon: 'ai',
      active: true,
    };

    const button = initButton(action);

    checkButtonState(button, 'active');
  });

  test('with badge', () => {
    const action = {
      id: 'actionBadge',
      name: 'Action with badge',
      icon: 'ai',
      badge: '🌞',
    };

    const button = initButton(action);

    expect(button.find('.lx-badge').exists()).toBe(true);
  });
}

/**
 * Checks that button elements (properties and states) match the expected action definitions.
 * @param {NodeListOf<Element>|Array} buttons - DOM button elements or Vue Test Utils wrappers to validate
 * @param {Object} [options={}] - Configuration options
 * @param {Array} [options.actionDefinitionsOverride=null] - Custom action definitions to validate against; if null, uses actionDefinitionsCommon
 * @param {boolean} [options.areIconOnly=false] - When true, skips visible label text assertion for icon-only buttons
 */
export function checkActionDefinitionsButtonsMultiple(
  buttons,
  { actionDefinitionsOverride = null, areIconOnly = false } = {}
) {
  const actionDefinitions = actionDefinitionsOverride ?? actionDefinitionsCommon;

  expect(buttons.length).toBe(actionDefinitions.length);

  buttons.forEach((button, i) => {
    const buttonElement = button?.element ?? button;

    expect(buttonElement.getAttribute('id')).toContain(actionDefinitions[i].id);
    expect(buttonElement.getAttribute('aria-label')).toContain(actionDefinitions[i].name);

    if (!areIconOnly) {
      expect(buttonElement.querySelector('.lx-button-label').textContent).toBe(
        actionDefinitions[i].name
      );
    }

    if (actionDefinitions[i].title) {
      expect(buttonElement.getAttribute('title')).toBe(actionDefinitions[i].title);
    }

    if (actionDefinitions[i].destructive) {
      checkButtonState(button, 'destructive');
    }

    if (actionDefinitions[i].disabled) {
      checkButtonState(button, 'disabled');
    }

    if (actionDefinitions[i].busy) {
      checkButtonState(button, 'busy');
    }

    if (actionDefinitions[i].loading) {
      checkButtonState(button, 'loading');
    }

    if (actionDefinitions[i].active) {
      checkButtonState(button, 'active');
    }

    if (actionDefinitions[i].badge) {
      expect(buttonElement.querySelector('.lx-badge')).toBeTruthy();
    }
  });
}
