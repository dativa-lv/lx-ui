// @ts-nocheck
import { test, expect, describe, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import LxMasterDetail from '@/components/MasterDetail.vue';
import 'regenerator-runtime/runtime';

let wrapper;

const dummyClickAway = {
  beforeMount() {},
  mounted() {},
  beforeUnmount() {},
  unmounted() {},
};

afterEach(() => {
  if (wrapper) {
    wrapper.unmount();
  }
});

describe('LxMasterDetail', () => {
  test('should be a valid component', () => {
    expect(LxMasterDetail).toBeTruthy();
  });

  describe('Props', () => {
    test('should have default values', () => {
      wrapper = mount(LxMasterDetail, {
        global: {
          stubs: ['router-link'],
          directives: {
            ClickAway: dummyClickAway,
          },
        },
      });

      const props = wrapper.props();

      expect(props.modelValue).toEqual(null);
      expect(props.items).toEqual([]);
      expect(props.readOnly).toBe(false);
      expect(props.idAttribute).toBe('id');
      expect(props.nameAttribute).toBe('name');
      expect(props.descriptionAttribute).toBe(null);
      expect(props.categoryAttribute).toBe('category');
      expect(props.invalidAttribute).toBe('invalid');
    });

    test('should accept provided values', () => {
      wrapper = mount(LxMasterDetail, {
        props: {
          modelValue: '1',
          items: [
            {
              id: '1',
              name: 'League of Legends',
              popularity: 153109020,
              description: null,
              multiplayer: true,
              rating: 4.5,
              country: 'us',
              group: '1',
              clickable: true,
              category: 'red',
              person: {
                firstName: 'Andrei',
                lastName: 'van Roon',
                description: 'Director of League of Legends',
                role: 'SVP',
                institution: 'Riot Games',
              },
            },
          ],
          readOnly: false,
          idAttribute: 'group',
          nameAttribute: 'name',
          descriptionAttribute: 'customDescription',
          texts: {
            add: 'Add',
          },
        },
        global: {
          stubs: ['router-link'],
          directives: {
            ClickAway: dummyClickAway,
          },
        },
      });

      const props = wrapper.props();

      expect(props.items).toEqual([
        {
          id: '1',
          name: 'League of Legends',
          popularity: 153109020,
          description: null,
          multiplayer: true,
          rating: 4.5,
          country: 'us',
          group: '1',
          clickable: true,
          category: 'red',
          person: {
            firstName: 'Andrei',
            lastName: 'van Roon',
            description: 'Director of League of Legends',
            role: 'SVP',
            institution: 'Riot Games',
          },
        },
      ]);
      expect(Array.isArray(props.items)).toBe(true);
      expect(props.readOnly).toBe(false).toBeTypeOf('boolean');
      expect(props.idAttribute).toBe('group').toBeTypeOf('string');
      expect(props.nameAttribute).toBe('name').toBeTypeOf('string');
      expect(props.descriptionAttribute).toBe('customDescription').toBeTypeOf('string');
      expect(props.texts.add).toBe('Add').toBeTypeOf('string');
    });
  });

  describe('Computed properties and methods', () => {
    test('model computed property should get and set modelValue correctly', async () => {
      wrapper = mount(LxMasterDetail, {
        props: {
          modelValue: '1',
          items: [
            { id: '1', name: 'Item 1' },
            { id: '2', name: 'Item 2' },
            { id: '3', name: 'Item 3' },
          ],
        },
        global: {
          stubs: ['router-link'],
          directives: {
            ClickAway: dummyClickAway,
          },
        },
      });

      const { model } = wrapper.vm;
      expect(model).toEqual('1');

      await wrapper.setProps({ modelValue: '2' });
      expect(wrapper.vm.model).toEqual('2');

      wrapper.vm.model = '3';
      const emits = wrapper.emitted()['update:modelValue'];
      expect(emits).toBeTruthy();
      expect(emits.at(-1)).toEqual(['3']);
    });

    test('addItem method should emit newItemAdded', () => {
      wrapper = mount(LxMasterDetail, {
        props: {
          modelValue: null,
        },
        global: {
          stubs: ['router-link'],
          directives: {
            ClickAway: dummyClickAway,
          },
        },
      });

      wrapper.vm.addItem();
      expect(wrapper.emitted().newItemAdded).toBeTruthy();
    });

    test('invalid items test', () => {
      wrapper = mount(LxMasterDetail, {
        props: {
          items: [
            { id: '1', name: 'Item 1', invalid: true },
            { id: '2', name: 'Item 2' },
          ],
        },
        global: {
          stubs: ['router-link'],
          directives: {
            ClickAway: dummyClickAway,
          },
        },
      });

      const rows = wrapper.findAll('.lx-list-item');
      expect(rows[0].classes()).toContain('lx-invalid');
      expect(rows[1].classes()).not.toContain('lx-invalid');
    });

    test('item category test', () => {
      wrapper = mount(LxMasterDetail, {
        props: {
          categoryAttribute: 'type',
          items: [
            { id: '1', name: 'Item 1', type: 'red' },
            { id: '2', name: 'Item 2', type: 'deleted' },
            { id: '3', name: 'Item 3' },
          ],
        },
        global: {
          stubs: ['router-link'],
          directives: {
            ClickAway: dummyClickAway,
          },
        },
      });

      const rows = wrapper.findAll('.lx-list-item');
      expect(rows[0].classes()).toContain('lx-category-red');
      expect(rows[1].classes()).toContain('lx-category-deleted');
      expect(rows[2].classes()).not.toContain('lx-category');
    });

    test('mode prop test', async () => {
      wrapper = mount(LxMasterDetail, {
        props: {
          items: [{ id: '1', name: 'Item 1' }],
          readOnly: false,
        },
        global: {
          stubs: ['router-link'],
          directives: {
            ClickAway: dummyClickAway,
          },
        },
      });

      const master = wrapper.find('.lx-master');
      expect(master.html()).toContain('lx-master-detail-button');
      await wrapper.setProps({ readOnly: true });
      expect(master.html()).not.toContain('lx-master-detail-button');
    });
  });
});
