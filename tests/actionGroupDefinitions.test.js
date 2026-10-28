import { describe, test, expect, afterEach, beforeEach } from 'vitest';
import { mount, RouterLinkStub, flushPromises } from '@vue/test-utils';
import LxToolbar from '@/components/Toolbar.vue';
import LxDropDownMenu from '@/components/DropDownMenu.vue';
import LxWidget from '@/components/Widget.vue';
import LxForm from '@/components/forms/Form.vue';
import LxList from '@/components/list/List.vue';
import LxDataGrid from '@/components/DataGrid.vue';

let wrapper;

const actions = [
  { id: 'print', name: 'Print', icon: 'print', groupId: 'more', nonResponsive: true },
  { id: 'save', name: 'Save', icon: 'save', groupId: 'main', nonResponsive: true },
  { id: 'email', name: 'Send by email', icon: 'email', groupId: 'share', nonResponsive: true },
];
const groups = [
  { id: 'main', name: 'Main' },
  { id: 'share', groupId: 'main', nested: true, name: 'Share', icon: 'share', nonResponsive: true },
  { id: 'more', name: 'More' },
];

function mountComponent(component, props, slots = {}) {
  return mount(component, {
    props,
    slots,
    attachTo: document.body,
    global: { stubs: { RouterLink: RouterLinkStub } },
  });
}

async function openMenu(toggler) {
  await toggler.trigger('click');
  await flushPromises();
  return [...document.body.querySelectorAll('.lx-dropdown-panel-wrapper')].pop();
}

const menuSections = (panel) =>
  [...panel.querySelectorAll('.lx-dropdown-menu-group')].map((group) => ({
    title: group.querySelector('.lx-label')?.textContent.trim() ?? null,
    ids: [...group.querySelectorAll('button')].map((b) => b.id),
  }));

beforeEach(() => {
  document.body.innerHTML = '<div id="poppers"></div><div id="modals"></div>';
});

afterEach(() => {
  if (wrapper) {
    wrapper.unmount();
    wrapper = null;
  }
});

describe('actionGroupDefinitions', () => {
  test('LxToolbar orders groups and renders a nested group as dropdown', async () => {
    wrapper = mountComponent(LxToolbar, {
      id: 't',
      actionDefinitions: actions,
      actionGroupDefinitions: groups,
    });
    await flushPromises();

    const ids = [...wrapper.findAll('button')]
      .map((b) => b.attributes('id'))
      .filter((id) => /-action-/.test(id));
    expect(ids).toEqual(['t-action-save', 't-action-share', 't-action-print']);

    const shareToggler = wrapper
      .findAll('.lx-dropdown-toggler')
      .find((t) => t.find('#t-action-share').exists());
    const panel = await openMenu(shareToggler);
    expect([...panel.querySelectorAll('button')].map((b) => b.id)).toEqual(['email']);
  });

  test('LxToolbar applies the group area', async () => {
    wrapper = mountComponent(LxToolbar, {
      id: 't',
      actionDefinitions: [
        { id: 'back', name: 'Back', icon: 'back', groupId: 'nav', nonResponsive: true },
      ],
      actionGroupDefinitions: [{ id: 'nav', area: 'left' }],
    });
    await flushPromises();

    expect(wrapper.find('.left-area #t-action-back').exists()).toBe(true);
  });

  test('LxDropDownMenu shows group titles and flattens nested groups', async () => {
    wrapper = mountComponent(
      LxDropDownMenu,
      { actionDefinitions: actions, actionGroupDefinitions: groups },
      { default: () => 'open' }
    );

    const panel = await openMenu(wrapper.find('.lx-dropdown-toggler'));
    expect(menuSections(panel)).toEqual([
      { title: 'Main', ids: ['save'] },
      { title: 'Share', ids: ['email'] },
      { title: 'More', ids: ['print'] },
    ]);
  });

  test('LxDropDownMenu shows a tags group', async () => {
    wrapper = mountComponent(
      LxDropDownMenu,
      {
        actionDefinitions: [
          { id: 'all', name: 'All', groupId: 'filter' },
          { id: 'mine', name: 'Mine', groupId: 'filter' },
        ],
        actionGroupDefinitions: [{ id: 'filter', kind: 'tags' }],
      },
      { default: () => 'open' }
    );

    const panel = await openMenu(wrapper.find('.lx-dropdown-toggler'));
    const tags = panel.querySelectorAll(
      '.lx-dropdown-menu-tag-wrapper .lx-dropdown-menu-tag-label'
    );
    expect([...tags].map((t) => t.textContent)).toEqual(['All', 'Mine']);
  });

  test('LxWidget passes group titles to its menu', async () => {
    wrapper = mountComponent(LxWidget, {
      id: 'w',
      actionDefinitions: actions,
      actionGroupDefinitions: groups,
    });

    const panel = await openMenu(wrapper.find('.lx-dropdown-toggler'));
    expect(menuSections(panel).map((s) => s.title)).toEqual(['Main', 'Share', 'More']);
  });

  test('LxList row menus show group titles', async () => {
    wrapper = mountComponent(LxList, {
      items: [{ id: 'r1', name: 'Row' }],
      actionDefinitions: actions,
      actionGroupDefinitions: groups,
      hasVirtualization: false,
    });
    await flushPromises();

    const panel = await openMenu(wrapper.find('.lx-list-item-actions .lx-dropdown-toggler'));
    expect(menuSections(panel).map((s) => s.title)).toEqual(['Main', 'Share', 'More']);
  });

  test('LxForm shows group titles in the additional actions menu', async () => {
    wrapper = mountComponent(LxForm, {
      id: 'f',
      actionDefinitions: [
        { id: 'save', name: 'Save', kind: 'primary' },
        { id: 'export', name: 'Export', kind: 'additional', groupId: 'files' },
        { id: 'print', name: 'Print', kind: 'additional', groupId: 'files' },
      ],
      actionGroupDefinitions: [{ id: 'files', name: 'Files' }],
    });
    await flushPromises();

    const toggler = wrapper
      .findAll('.lx-dropdown-toggler')
      .find((t) => t.find('#f-header-actions-button').exists());
    await openMenu(toggler);

    const title = document.getElementById('f-files-group');
    expect(title?.textContent.trim()).toBe('Files');
  });

  test('LxDataGrid applies selection action groups', async () => {
    wrapper = mountComponent(LxDataGrid, {
      id: 'g',
      items: [{ id: 'r1', name: 'Row' }],
      columnDefinitions: [{ id: 'name', attributeName: 'name', name: 'Name' }],
      hasSelecting: true,
      selectionActionDefinitions: [
        { id: 'archive', name: 'Archive', icon: 'archive', groupId: 'more' },
        { id: 'delete', name: 'Delete', icon: 'delete', groupId: 'danger' },
      ],
      selectionActionGroupDefinitions: [{ id: 'danger' }, { id: 'more' }],
      hasVirtualization: false,
    });
    await flushPromises();
    wrapper.vm.selectRows();
    await flushPromises();

    const ids = [...document.body.querySelectorAll('.selection-action-buttons button')].map(
      (b) => b.id
    );
    expect(ids).toEqual(['delete', 'archive']);
  });
});
