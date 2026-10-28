import { describe, test, expect } from 'vitest';
import {
  flattenNestedActions,
  limitPrimaryActions,
  resolveActionGroups,
} from '@/utils/actionDefinitionsUtils';

describe('flattenNestedActions', () => {
  test('returns arrays without nested triggers unchanged', () => {
    const actions = [{ id: 'save' }, { id: 'print', groupId: 'more' }];
    expect(flattenNestedActions(actions)).toBe(actions);
  });

  test('keeps a trigger without children', () => {
    const actions = [{ id: 'share', nestedGroupId: 'share' }];
    expect(flattenNestedActions(actions)).toBe(actions);
  });

  test('removes triggers that have children and keeps order', () => {
    const result = flattenNestedActions([
      { id: 'save' },
      { id: 'share', nestedGroupId: 'share' },
      { id: 'shareEmail', groupId: 'share' },
      { id: 'shareLink', groupId: 'share' },
    ]);
    expect(result.map((a) => a.id)).toEqual(['save', 'shareEmail', 'shareLink']);
  });

  test('children inherit trigger state unless they define their own', () => {
    const result = flattenNestedActions([
      {
        id: 'share',
        nestedGroupId: 'share',
        visibleByAttribute: 'canShare',
        enableByAttribute: 'shareEnabled',
        disabled: true,
      },
      { id: 'shareEmail', groupId: 'share' },
      { id: 'shareLink', groupId: 'share', visibleByAttribute: 'hasLink' },
    ]);
    expect(result[0]).toMatchObject({
      visibleByAttribute: 'canShare',
      enableByAttribute: 'shareEnabled',
      disabled: true,
    });
    expect(result[1].visibleByAttribute).toBe('hasLink');
  });

  test('resolves multiple nesting levels', () => {
    const result = flattenNestedActions([
      { id: 'more', nestedGroupId: 'more', visibleByAttribute: 'canMore' },
      { id: 'export', groupId: 'more', nestedGroupId: 'export' },
      { id: 'exportPdf', groupId: 'export' },
    ]);
    expect(result.map((a) => a.id)).toEqual(['exportPdf']);
    expect(result[0].visibleByAttribute).toBe('canMore');
  });

  test('children inherit the trigger kind only when asked', () => {
    const actions = [
      { id: 'save', kind: 'primary', nestedGroupId: 'save' },
      { id: 'saveDraft', groupId: 'save' },
      { id: 'saveFinal', groupId: 'save', kind: 'secondary' },
    ];
    expect(flattenNestedActions(actions)[0].kind).toBeUndefined();
    expect(flattenNestedActions(actions, { inheritKind: true }).map((a) => a.kind)).toEqual([
      'primary',
      'secondary',
    ]);
  });
});

describe('limitPrimaryActions', () => {
  test('returns arrays within the limit unchanged', () => {
    const actions = [
      { id: 'save', kind: 'primary' },
      { id: 'cancel', kind: 'secondary' },
    ];
    expect(limitPrimaryActions(actions)).toBe(actions);
  });

  test('shows primary actions over the limit as secondary', () => {
    const result = limitPrimaryActions([
      { id: 'save', kind: 'primary' },
      { id: 'send', kind: 'primary' },
      { id: 'cancel', kind: 'secondary' },
      { id: 'next', kind: 'primary' },
    ]);
    expect(result.map((a) => a.kind)).toEqual(['primary', 'secondary', 'secondary', 'secondary']);
  });

  test('supports a custom limit', () => {
    const result = limitPrimaryActions(
      [{ kind: 'primary' }, { kind: 'primary' }, { kind: 'primary' }],
      2
    );
    expect(result.map((a) => a.kind)).toEqual(['primary', 'primary', 'secondary']);
  });
});

describe('resolveActionGroups', () => {
  const actions = [
    { id: 'print', groupId: 'more' },
    { id: 'save', groupId: 'main' },
    { id: 'help' },
    { id: 'archive', groupId: 'more' },
  ];

  test('returns actions unchanged without group definitions', () => {
    expect(resolveActionGroups(actions)).toBe(actions);
    expect(resolveActionGroups(actions, [])).toBe(actions);
  });

  test('orders actions by group definitions, unknown groups last', () => {
    const result = resolveActionGroups(actions, [{ id: 'main' }, { id: 'more' }]);
    expect(result.map((a) => a.id)).toEqual(['save', 'print', 'archive', 'help']);
  });

  test('applies group area to actions without their own area', () => {
    const result = resolveActionGroups(
      [
        { id: 'a', groupId: 'left' },
        { id: 'b', groupId: 'left', area: 'right' },
      ],
      [{ id: 'left', area: 'left' }]
    );
    expect(result.map((a) => a.area)).toEqual(['left', 'right']);
  });

  test('turns a nested group into a trigger placed in its parent group', () => {
    const result = resolveActionGroups(
      [
        { id: 'save', groupId: 'main' },
        { id: 'email', groupId: 'share' },
      ],
      [
        { id: 'main' },
        {
          id: 'share',
          groupId: 'main',
          nested: true,
          name: 'Share',
          icon: 'share',
          disabled: true,
        },
      ]
    );
    expect(result).toEqual([
      { id: 'save', groupId: 'main' },
      {
        id: 'share',
        nestedGroupId: 'share',
        groupId: 'main',
        name: 'Share',
        icon: 'share',
        disabled: true,
      },
      { id: 'email', groupId: 'share' },
    ]);
  });

  test('does not pass the tags kind to a nested group trigger', () => {
    const resolved = resolveActionGroups(
      [{ id: 'a', groupId: 'g' }],
      [{ id: 'g', nested: true, kind: 'tags', icon: 'filter' }]
    );
    expect(resolved.find((a) => a.id === 'g')).toEqual({
      id: 'g',
      nestedGroupId: 'g',
      icon: 'filter',
    });
  });

  test('skips nested groups without actions and existing triggers', () => {
    const result = resolveActionGroups(
      [
        { id: 'more', nestedGroupId: 'more' },
        { id: 'print', groupId: 'more' },
      ],
      [
        { id: 'empty', nested: true, name: 'Empty' },
        { id: 'more', nested: true, name: 'More' },
      ]
    );
    expect(result.map((a) => a.id)).toEqual(['print', 'more']);
  });

  test('works with flattenNestedActions for components without submenus', () => {
    const resolved = resolveActionGroups(
      [{ id: 'email', groupId: 'share' }],
      [{ id: 'share', nested: true, name: 'Share', disabled: true }]
    );
    expect(flattenNestedActions(resolved)).toEqual([
      { id: 'email', groupId: 'share', disabled: true },
    ]);
  });
});
