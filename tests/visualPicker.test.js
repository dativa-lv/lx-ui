import { test, expect, describe, afterEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import LxVisualPicker from '@/components/VisualPicker.vue';

let wrapper;

afterEach(() => {
  if (wrapper) {
    wrapper.unmount();
  }
});

describe('LxVisualPicker', () => {
  test('should be a valid component', () => {
    expect(LxVisualPicker).toBeTruthy();
  });

  describe('Props', () => {
    test('should have default values', () => {
      wrapper = shallowMount(LxVisualPicker, {
        global: {
          stubs: ['router-link'],
        },
      });
      const props = wrapper.props();
      expect(props.id).toBeTruthy();
      expect(props.id).toBeTypeOf('string');
      expect(props.kind).toBe('europe');
      expect(props.kind).toBeTypeOf('string');
      expect(props.modelValue).toEqual([]);
      expect(Array.isArray(props.modelValue)).toBe(true);
      expect(props.readOnly).toBe(false);
      expect(props.readOnly).toBeTypeOf('boolean');
      expect(props.mode).toBe('default');
      expect(props.mode).toBeTypeOf('string');
      expect(props.texts).toBeTypeOf('object');
    });

    test('should accept provided values with kind:europe', () => {
      wrapper = shallowMount(LxVisualPicker, {
        props: {
          id: 'custom-id',
          kind: 'europe',
          modelValue: ['DK', 'NL'],
          readOnly: true,
          mode: 'compact',
          texts: {
            visualView: 'Visual View',
            listView: 'List View',
            removeCountry: 'Remove Country',
            errorLabel: 'Failed to load image',
          },
        },
        global: {
          stubs: ['router-link'],
        },
      });
      const props = wrapper.props();

      expect(props.id).toBe('custom-id');
      expect(props.id).toBeTypeOf('string');
      expect(props.kind).toBe('europe');
      expect(props.kind).toBeTypeOf('string');
      expect(props.modelValue).toEqual(['DK', 'NL']);
      expect(Array.isArray(props.modelValue)).toBe(true);
      expect(props.readOnly).toBe(true);
      expect(props.readOnly).toBeTypeOf('boolean');
      expect(props.mode).toBe('compact');
      expect(props.mode).toBeTypeOf('string');
      expect(props.texts).toBeTypeOf('object');
      expect(props.texts).toEqual({
        visualView: 'Visual View',
        listView: 'List View',
        removeCountry: 'Remove Country',
        errorLabel: 'Failed to load image',
      });
    });

    test('should accept provided values with kind skeleton', () => {
      wrapper = shallowMount(LxVisualPicker, {
        props: {
          kind: 'skeleton',
          modelValue: ['60413009', '272679001'],
          texts: {
            skeleton: {
              60413009: 'Rib cage',
              272679001: 'Bone structure of head',
            },
          },
        },
        global: {
          stubs: ['router-link'],
        },
      });
      const props = wrapper.props();

      expect(props.kind).toBe('skeleton');
      expect(props.kind).toBeTypeOf('string');
      expect(props.modelValue).toEqual(['60413009', '272679001']);
      expect(Array.isArray(props.modelValue)).toBe(true);
      expect(props.texts).toEqual({
        skeleton: {
          60413009: 'Rib cage',
          272679001: 'Bone structure of head',
        },
      });
      expect(props.texts).toBeTypeOf('object');
    });

    test('should accept provided values with kind spine', () => {
      wrapper = shallowMount(LxVisualPicker, {
        props: {
          kind: 'spine',
          modelValue: ['278915007', '699698002'],
          texts: {
            spine: {
              278915007: 'Coccyx',
              699698002: 'Sacrum',
            },
          },
        },
        global: {
          stubs: ['router-link'],
        },
      });
      const props = wrapper.props();

      expect(props.kind).toBe('spine');
      expect(props.kind).toBeTypeOf('string');
      expect(props.modelValue).toEqual(['278915007', '699698002']);
      expect(Array.isArray(props.modelValue)).toBe(true);
      expect(props.texts).toEqual({
        spine: {
          278915007: 'Coccyx',
          699698002: 'Sacrum',
        },
      });
      expect(props.texts).toBeTypeOf('object');
    });

    test('should accept provided values with kind arms', () => {
      wrapper = shallowMount(LxVisualPicker, {
        props: {
          kind: 'arms',
          modelValue: ['734355008', '734354007'],
          texts: {
            arms: {
              734355008: 'Bone structure of right hand',
              734354007: 'Bone structure of left hand',
            },
          },
        },
        global: {
          stubs: ['router-link'],
        },
      });
      const props = wrapper.props();

      expect(props.kind).toBe('arms');
      expect(props.kind).toBeTypeOf('string');
      expect(props.modelValue).toEqual(['734355008', '734354007']);
      expect(Array.isArray(props.modelValue)).toBe(true);
      expect(props.texts).toEqual({
        arms: {
          734355008: 'Bone structure of right hand',
          734354007: 'Bone structure of left hand',
        },
      });
      expect(props.texts).toBeTypeOf('object');
    });

    test('should accept provided values with kind left-hand', () => {
      wrapper = shallowMount(LxVisualPicker, {
        props: {
          kind: 'left-hand',
          modelValue: ['737403003', '764825000'],
          texts: {
            leftHand: {
              737403003: 'Left lunate bone',
              764825000: 'Left triquetum',
            },
          },
        },
        global: {
          stubs: ['router-link'],
        },
      });
      const props = wrapper.props();

      expect(props.kind).toBe('left-hand');
      expect(props.kind).toBeTypeOf('string');
      expect(props.modelValue).toEqual(['737403003', '764825000']);
      expect(Array.isArray(props.modelValue)).toBe(true);
      expect(props.texts).toEqual({
        leftHand: {
          737403003: 'Left lunate bone',
          764825000: 'Left triquetum',
        },
      });
      expect(props.texts).toBeTypeOf('object');
    });

    test('should accept provided values with kind right-hand', () => {
      wrapper = shallowMount(LxVisualPicker, {
        props: {
          kind: 'right-hand',
          modelValue: ['737404009', '764824001'],
          texts: {
            rightHand: {
              737404009: 'Right lunate bone',
              764824001: 'Right triquetum',
            },
          },
        },
        global: {
          stubs: ['router-link'],
        },
      });
      const props = wrapper.props();

      expect(props.kind).toBe('right-hand');
      expect(props.kind).toBeTypeOf('string');
      expect(props.modelValue).toEqual(['737404009', '764824001']);
      expect(Array.isArray(props.modelValue)).toBe(true);
      expect(props.texts).toEqual({
        rightHand: {
          737404009: 'Right lunate bone',
          764824001: 'Right triquetum',
        },
      });
      expect(props.texts).toBeTypeOf('object');
    });

    test('should accept provided values with kind latvia', () => {
      wrapper = shallowMount(LxVisualPicker, {
        props: {
          kind: 'latvia',
          modelValue: ['0001000', '0002000'],
          texts: {
            latvia: {
              '0001000': 'Rīga',
              '0002000': 'Daugavpils',
            },
          },
        },
        global: {
          stubs: ['router-link'],
        },
      });
      const props = wrapper.props();

      expect(props.kind).toBe('latvia');
      expect(props.kind).toBeTypeOf('string');
      expect(props.modelValue).toEqual(['0001000', '0002000']);
      expect(Array.isArray(props.modelValue)).toBe(true);
      expect(props.texts).toEqual({
        latvia: {
          '0001000': 'Rīga',
          '0002000': 'Daugavpils',
        },
      });
      expect(props.texts).toBeTypeOf('object');
    });
  });
});
