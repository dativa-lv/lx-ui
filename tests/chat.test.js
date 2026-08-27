// @ts-nocheck
import { mount, shallowMount } from '@vue/test-utils';
import { describe, test, expect, afterEach } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import LxChat from '@/components/chat/Chat.vue';
import MessageComposer from '@/components/chat/MessageComposer.vue';
import LxRichTextDisplay from '@/components/RichTextDisplay.vue';
import LxPersonDisplay from '@/components/PersonDisplay.vue';
import { formatFull } from '@/utils/date/format';

// Minimal stand-in for the optional LxFormBuilder (from @dativa-lv/lx-builders).
const StubBuilder = defineComponent({
  name: 'StubBuilder',
  props: {
    modelValue: { type: Object, default: () => ({}) },
    schema: { type: Object, default: null },
    readOnly: { type: Boolean, default: false },
  },
  emits: ['update:modelValue'],
  setup(props, { expose }) {
    expose({ validateModel: () => [] });
    return () => h('div', { class: 'stub-builder' }, 'form');
  },
});

let wrapper;

// LxChat renders a teleported LxModal; stub Teleport so mounts stay self-contained.
const mountOptions = { global: { stubs: { teleport: true } } };

afterEach(() => {
  if (wrapper) {
    wrapper.unmount();
    wrapper = null;
  }
});

describe('LxChat', () => {
  test('should be a valid component', () => {
    expect(LxChat).toBeTruthy();
  });

  describe('Props', () => {
    test('should have the correct default props', () => {
      wrapper = shallowMount(LxChat, {
        props: {},
        ...mountOptions,
      });

      expect(wrapper.props().id).toBeTypeOf('string');
      expect(wrapper.props().messageText).toBe(null);
      expect(wrapper.props().items).toEqual([]);
      expect(wrapper.props().userDefinitions).toEqual([]);
      expect(wrapper.props().kind).toBe('chat');
      expect(wrapper.props().messageGrouping).toBe(true);
      expect(wrapper.props().messageGroupingInterval).toBe(10);
      expect(wrapper.props().texts).toEqual({});
    });
  });

  describe('Grouping', () => {
    const day1 = new Date('2026-07-18T10:00:00.000Z');
    const day2 = new Date('2026-07-19T10:00:00.000Z');

    const messages = [
      { id: 'm1', userId: 'user-me', userName: 'Me', text: 'Hi', createdAt: day1 },
      { id: 'm2', userId: 'user-other', userName: 'Other', text: 'Hello', createdAt: day1 },
      { id: 'm3', userId: 'user-other', userName: 'Other', text: 'Again', createdAt: day1 },
      { id: 'm4', userId: 'user-ai', userName: 'AI', text: 'Beep', createdAt: day2 },
    ];

    test('splits messages into clusters (same user + same day)', () => {
      wrapper = mount(LxChat, {
        props: {
          userDefinitions: [
            { id: 'user-me', isMe: true },
            { id: 'user-ai', isAi: true },
          ],
          items: messages,
        },
        ...mountOptions,
      });

      // [me d1], [other x2 d1], [ai d2] -> 3 clusters.
      expect(wrapper.findAll('.lx-chat-user-group')).toHaveLength(3);
    });

    test('messageGrouping=false disables clustering and shows a person header for every message', () => {
      wrapper = mount(LxChat, {
        props: {
          messageGrouping: false,
          userDefinitions: [
            { id: 'user-me', isMe: true },
            { id: 'user-ai', isAi: true },
          ],
          items: messages,
        },
        ...mountOptions,
      });

      expect(wrapper.findAll('.lx-chat-user-group')).toHaveLength(messages.length);
      expect(wrapper.findAll('.lx-chat-bubble-header')).toHaveLength(messages.length);
      expect(wrapper.findAll('.lx-chat-bubble-time')).toHaveLength(0);
    });

    test('flags the current user and the AI user', () => {
      wrapper = mount(LxChat, {
        props: {
          userDefinitions: [
            { id: 'user-me', isMe: true },
            { id: 'user-ai', isAi: true },
          ],
          items: messages,
        },
        ...mountOptions,
      });

      expect(wrapper.find('.lx-chat-user-me').exists()).toBe(true);
      expect(wrapper.find('.lx-chat-user-ai').exists()).toBe(true);
    });

    test('renders each message inside an LxListItem', () => {
      wrapper = mount(LxChat, {
        props: {
          userDefinitions: [
            { id: 'user-me', isMe: true },
            { id: 'user-ai', isAi: true },
          ],
          items: messages,
        },
        ...mountOptions,
      });

      expect(wrapper.find('.lx-chat-message .lx-list-item').exists()).toBe(true);
    });

    test('applies an explicit message.category to a receiver, never to the sender', () => {
      wrapper = mount(LxChat, {
        props: {
          userDefinitions: [
            { id: 'user-me', isMe: true },
            { id: 'user-ai', isAi: true },
          ],
          items: [
            { ...messages[0], category: 'blue' },
            { ...messages[1], category: 'blue' },
          ],
        },
        ...mountOptions,
      });

      expect(
        wrapper.find('.lx-chat-user-group:not(.lx-chat-user-me) .lx-category-blue').exists()
      ).toBe(true);
      expect(wrapper.find('.lx-chat-user-me .lx-category-blue').exists()).toBe(false);
    });

    test('does not auto-assign a category when none is provided', () => {
      wrapper = mount(LxChat, {
        props: {
          userDefinitions: [
            { id: 'user-me', isMe: true },
            { id: 'user-ai', isAi: true },
          ],
          items: messages,
        },
        ...mountOptions,
      });

      const colored = wrapper
        .findAll('.lx-list-item')
        .some((item) => /lx-category-\w/.test(item.classes().join(' ')));
      expect(colored).toBe(false);
    });

    test('renders the empty state when there are no messages', () => {
      wrapper = mount(LxChat, {
        props: { userDefinitions: [{ id: 'user-me', isMe: true }], items: [] },
        ...mountOptions,
      });

      expect(wrapper.find('.lx-chat-message-list-items').exists()).toBe(false);
    });

    test('takes the displayed name from userDefinitions, ignoring any userName on the message', () => {
      wrapper = mount(LxChat, {
        props: {
          userDefinitions: [{ id: 'user-other', name: 'Other From Definitions' }],
          items: [
            {
              id: 'm1',
              userId: 'user-other',
              userName: 'Ignored Name',
              text: 'hi',
              createdAt: day1,
            },
          ],
        },
        ...mountOptions,
      });

      const personDisplay = wrapper.findComponent(LxPersonDisplay);
      expect(personDisplay.props('value')).toEqual({
        id: 'user-other',
        name: 'Other From Definitions',
        fullTime: expect.any(String),
      });
    });

    test('an unknown userId (no matching userDefinitions entry) is treated as neither isMe nor isAi', () => {
      wrapper = mount(LxChat, {
        props: {
          userDefinitions: [{ id: 'user-me', isMe: true }],
          items: [
            { id: 'm1', userId: 'user-unknown', userName: 'Ghost', text: 'hi', createdAt: day1 },
          ],
        },
        ...mountOptions,
      });

      expect(wrapper.find('.lx-chat-user-me').exists()).toBe(false);
      expect(wrapper.find('.lx-chat-user-ai').exists()).toBe(false);
      expect(wrapper.find('.lx-chat-user-group').exists()).toBe(true);
    });
  });

  describe('Sending', () => {
    test('emits send with trimmed text on Enter', async () => {
      wrapper = mount(MessageComposer, { props: { id: 'c' }, ...mountOptions });

      const textarea = wrapper.find('textarea');
      await textarea.setValue('  hello  ');
      await textarea.trigger('keydown', { key: 'Enter' });

      expect(wrapper.emitted().send).toBeTruthy();
      expect(wrapper.emitted().send[0][0]).toEqual({ text: 'hello' });
    });

    test('does not send on Shift+Enter', async () => {
      wrapper = mount(MessageComposer, { props: { id: 'c' }, ...mountOptions });

      const textarea = wrapper.find('textarea');
      await textarea.setValue('hello');
      await textarea.trigger('keydown', { key: 'Enter', shiftKey: true });

      expect(wrapper.emitted().send).toBeFalsy();
    });

    test('does not send when empty', async () => {
      wrapper = mount(MessageComposer, { props: { id: 'c' }, ...mountOptions });

      const textarea = wrapper.find('textarea');
      await textarea.setValue('   ');
      await textarea.trigger('keydown', { key: 'Enter' });

      expect(wrapper.emitted().send).toBeFalsy();
    });
  });

  describe('Loading', () => {
    test('disables the composer input and send button while loading', () => {
      wrapper = mount(MessageComposer, {
        props: { id: 'c', loading: true, texts: { send: 'Send' } },
        ...mountOptions,
      });

      expect(wrapper.find('textarea').attributes('disabled')).toBeDefined();
      const sendBtn = wrapper.find('[id$="-action-send"]');
      expect(sendBtn.exists()).toBe(true);
      expect(sendBtn.element.disabled).toBe(true);
    });

    test('busy disables the composer the same way loading does', () => {
      wrapper = mount(MessageComposer, {
        props: { id: 'c', busy: true, texts: { send: 'Send' } },
        ...mountOptions,
      });

      expect(wrapper.find('textarea').attributes('disabled')).toBeDefined();
      const sendBtn = wrapper.find('[id$="-action-send"]');
      expect(sendBtn.exists()).toBe(true);
      expect(sendBtn.element.disabled).toBe(true);
    });
  });

  describe('Scroll to bottom', () => {
    const day = new Date('2026-07-20T10:00:00.000Z');

    function mountScrollableChat() {
      const w = mount(LxChat, {
        props: {
          userDefinitions: [
            { id: 'user-me', name: 'Me', isMe: true },
            { id: 'user-other', name: 'Other' },
          ],
          // Different authors -> each message is its own cluster, so the last one has its own header.
          items: [
            { id: 'm1', userId: 'user-me', text: 'one', createdAt: day },
            { id: 'm2', userId: 'user-other', text: 'two', createdAt: day },
          ],
        },
        attachTo: document.body,
        ...mountOptions,
      });

      const listEl = w.find('.lx-chat-message-list').element;
      Object.defineProperty(listEl, 'scrollHeight', { value: 1000, configurable: true });
      Object.defineProperty(listEl, 'clientHeight', { value: 200, configurable: true });
      listEl.scrollTop = 0;
      listEl.dispatchEvent(new Event('scroll'));

      return w;
    }

    test('keyboard-activated scroll-down moves focus to the newest message author', async () => {
      wrapper = mountScrollableChat();
      await nextTick();

      const scrollDownBtn = wrapper.find('.lx-chat-scroll-down');
      expect(scrollDownBtn.exists()).toBe(true);

      // Enter/Space-activated clicks carry detail: 0 (a real mouse click is >= 1).
      scrollDownBtn.element.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }));
      await nextTick();

      const personDisplays = wrapper.findAllComponents(LxPersonDisplay);
      const lastPersonDisplay = personDisplays[personDisplays.length - 1];
      expect(document.activeElement).toBe(
        lastPersonDisplay.find('.lx-info-wrapper-content').element
      );
    });

    test('a mouse-activated scroll-down click does not move focus', async () => {
      wrapper = mountScrollableChat();
      await nextTick();

      const scrollDownBtn = wrapper.find('.lx-chat-scroll-down');
      const activeBefore = document.activeElement;

      scrollDownBtn.element.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
      await nextTick();

      expect(document.activeElement).toBe(activeBefore);
    });

    test('sending a message scrolls to it even if the user had scrolled up', async () => {
      wrapper = mountScrollableChat();
      await nextTick(); // flush the mount's own pending scrollToLatest before simulating scroll-up

      const listEl = wrapper.find('.lx-chat-message-list').element;
      // Simulate having scrolled up (not just "at the top"), so a later scrollTop of 0 is
      // distinguishable from "never moved" rather than coinciding with the initial position.
      listEl.scrollTop = 400;
      listEl.dispatchEvent(new Event('scroll'));
      await nextTick();
      expect(listEl.scrollTop).toBe(400);

      // Uses the same (possibly smooth) scrollTo as the scroll-down button; force 'auto' so the
      // jsdom-like environment applies it synchronously instead of deferring a smooth animation.
      document.body.classList.add('lx-no-animations');
      await wrapper.setProps({
        items: [
          { id: 'm1', userId: 'user-me', text: 'one', createdAt: day },
          { id: 'm2', userId: 'user-other', text: 'two', createdAt: day },
          { id: 'm3', userId: 'user-me', text: 'three, just sent', createdAt: day },
        ],
      });
      await nextTick();
      await nextTick();
      document.body.classList.remove('lx-no-animations');

      expect(listEl.scrollTop).toBe(listEl.scrollHeight);
    });

    test('an incoming message from someone else does not force-scroll a user who scrolled up', async () => {
      wrapper = mountScrollableChat();
      await nextTick(); // flush the mount's own pending scrollToLatest before simulating scroll-up

      const listEl = wrapper.find('.lx-chat-message-list').element;
      listEl.scrollTop = 400;
      listEl.dispatchEvent(new Event('scroll'));
      await nextTick();

      await wrapper.setProps({
        items: [
          { id: 'm1', userId: 'user-me', text: 'one', createdAt: day },
          { id: 'm2', userId: 'user-other', text: 'two', createdAt: day },
          { id: 'm3', userId: 'user-other', text: 'three, from someone else', createdAt: day },
        ],
      });
      await nextTick();
      await nextTick();

      expect(listEl.scrollTop).toBe(400);
    });
  });

  describe('Time-based grouping', () => {
    const t0 = new Date('2026-07-20T10:00:00.000Z');
    const t5 = new Date('2026-07-20T10:05:00.000Z');

    function receiverMessages() {
      return [
        { id: 'm1', userId: 'user-other', userName: 'Other', text: 'one', createdAt: t0 },
        { id: 'm2', userId: 'user-other', userName: 'Other', text: 'two', createdAt: t5 },
      ];
    }

    test('groups messages within the window under one header (default 10 min)', () => {
      wrapper = mount(LxChat, {
        props: { userDefinitions: [{ id: 'user-me', isMe: true }], items: receiverMessages() },
        ...mountOptions,
      });

      expect(wrapper.findAll('.lx-chat-bubble-header')).toHaveLength(1);
      expect(wrapper.findAll('.lx-chat-bubble-time')).toHaveLength(0);
    });

    test('messageGroupingInterval=0 shows a timestamp per message', () => {
      wrapper = mount(LxChat, {
        props: {
          userDefinitions: [{ id: 'user-me', isMe: true }],
          messageGroupingInterval: 0,
          items: receiverMessages(),
        },
        ...mountOptions,
      });

      // cluster start keeps the full person header; the second message gets a timestamp label.
      expect(wrapper.findAll('.lx-chat-bubble-header')).toHaveLength(1);
      expect(wrapper.findAll('.lx-chat-bubble-time')).toHaveLength(1);
    });

    test('messageGrouping=false ignores interval splitting and keeps full person headers', () => {
      wrapper = mount(LxChat, {
        props: {
          userDefinitions: [{ id: 'user-me', isMe: true }],
          messageGrouping: false,
          items: receiverMessages(),
        },
        ...mountOptions,
      });

      expect(wrapper.findAll('.lx-chat-bubble-header')).toHaveLength(2);
      expect(wrapper.findAll('.lx-chat-bubble-time')).toHaveLength(0);
    });

    test('a sub-group timestamp shows only the time, even for an old message (no repeated date)', () => {
      const old0 = new Date('2020-01-10T10:00:00.000Z');
      const old5 = new Date('2020-01-10T10:05:00.000Z');

      wrapper = mount(LxChat, {
        props: {
          userDefinitions: [{ id: 'user-me', isMe: true }],
          messageGroupingInterval: 0,
          items: [
            { id: 'm1', userId: 'user-other', userName: 'Other', text: 'one', createdAt: old0 },
            { id: 'm2', userId: 'user-other', userName: 'Other', text: 'two', createdAt: old5 },
          ],
        },
        ...mountOptions,
      });

      const timeLabel = wrapper.find('.lx-chat-bubble-time');
      expect(timeLabel.text()).not.toContain('2020');
      expect(timeLabel.text()).toMatch(/^\d{1,2}[.:]\d{2}$/);
    });
  });

  describe('Person display', () => {
    const day = new Date('2026-07-20T10:00:00.000Z');

    test('keeps the compact humanized description visible, with the full date+time only in the tooltip', () => {
      wrapper = mount(LxChat, {
        props: {
          userDefinitions: [
            { id: 'user-me', isMe: true },
            { id: 'user-other', name: 'Other' },
          ],
          texts: { messageTimeLabel: 'Message time' },
          items: [{ id: 'm1', userId: 'user-other', text: 'hi', createdAt: day }],
        },
        ...mountOptions,
      });

      const personDisplay = wrapper.findComponent(LxPersonDisplay);
      // Visible description stays the compact humanized text (unchanged from before).
      expect(personDisplay.props('description')).not.toBe(formatFull(day));
      // The full date+time (with seconds) is exposed as a translatable tooltip-only custom attribute.
      expect(personDisplay.props('value')).toEqual({
        id: 'user-other',
        name: 'Other',
        fullTime: formatFull(day),
      });
      expect(personDisplay.props('customAttributes')).toEqual([
        { name: 'Message time', attributeName: 'fullTime' },
      ]);
    });

    test('avatar seed (value.id) stays the userId even when the display name changes (e.g. locale switch)', async () => {
      wrapper = mount(LxChat, {
        props: {
          userDefinitions: [{ id: 'user-other', name: 'Cita' }],
          items: [{ id: 'm1', userId: 'user-other', text: 'hi', createdAt: day }],
        },
        ...mountOptions,
      });

      const before = wrapper.findComponent(LxPersonDisplay).props('value');
      expect(before.id).toBe('user-other');
      expect(before.name).toBe('Cita');

      // Same userId, different display name — simulates a locale switch translating userDefinitions.
      await wrapper.setProps({ userDefinitions: [{ id: 'user-other', name: 'Other' }] });

      const after = wrapper.findComponent(LxPersonDisplay).props('value');
      expect(after.id).toBe('user-other');
      expect(after.name).toBe('Other');
    });

    test('passes avatarKind through to LxPersonDisplay', () => {
      wrapper = mount(LxChat, {
        props: {
          avatarKind: 'initials',
          userDefinitions: [{ id: 'user-other', name: 'Other' }],
          items: [{ id: 'm1', userId: 'user-other', text: 'hi', createdAt: day }],
        },
        ...mountOptions,
      });

      expect(wrapper.findComponent(LxPersonDisplay).props('kind')).toBe('initials');
    });

    test('passes a userDefinitions icon/iconSet through to LxPersonDisplay', () => {
      wrapper = mount(LxChat, {
        props: {
          userDefinitions: [{ id: 'user-other', name: 'Other', icon: 'bug', iconSet: 'cds' }],
          items: [{ id: 'm1', userId: 'user-other', text: 'hi', createdAt: day }],
        },
        ...mountOptions,
      });

      const personDisplay = wrapper.findComponent(LxPersonDisplay);
      expect(personDisplay.props('icon')).toBe('bug');
      expect(personDisplay.props('iconSet')).toBe('cds');
    });

    test('exposes a userDefinitions description/role/institution as extra tooltip customAttributes', () => {
      wrapper = mount(LxChat, {
        props: {
          texts: {
            messageTimeLabel: 'Message time',
            descriptionLabel: 'Bio',
            roleLabel: 'Role',
            institutionLabel: 'Org',
          },
          userDefinitions: [
            {
              id: 'user-other',
              name: 'Other',
              description: 'Loves long walks on the beach',
              role: 'SVP',
              institution: 'Riot Games',
            },
          ],
          items: [{ id: 'm1', userId: 'user-other', text: 'hi', createdAt: day }],
        },
        ...mountOptions,
      });

      const personDisplay = wrapper.findComponent(LxPersonDisplay);
      expect(personDisplay.props('value')).toEqual(
        expect.objectContaining({
          description: 'Loves long walks on the beach',
          role: 'SVP',
          institution: 'Riot Games',
        })
      );
      expect(personDisplay.props('customAttributes')).toEqual([
        { name: 'Message time', attributeName: 'fullTime' },
        { name: 'Bio', attributeName: 'description' },
        { name: 'Role', attributeName: 'role' },
        { name: 'Org', attributeName: 'institution' },
      ]);
    });

    test('omits description/role/institution customAttributes when not set on userDefinitions', () => {
      wrapper = mount(LxChat, {
        props: {
          userDefinitions: [{ id: 'user-other', name: 'Other' }],
          items: [{ id: 'm1', userId: 'user-other', text: 'hi', createdAt: day }],
        },
        ...mountOptions,
      });

      const attributeNames = wrapper
        .findComponent(LxPersonDisplay)
        .props('customAttributes')
        .map((a) => a.attributeName);
      expect(attributeNames).toEqual(['fullTime']);
    });
  });

  describe('Typing indicator', () => {
    const day = new Date('2026-07-20T10:00:00.000Z');
    const userDefinitions = [
      { id: 'user-me', isMe: true },
      { id: 'user-ai', isAi: true, name: 'AI' },
      { id: 'user-1', name: 'Hemingvejs' },
      { id: 'user-2', name: 'Bukovskis' },
    ];

    test('is hidden by default', () => {
      wrapper = mount(LxChat, {
        props: { userDefinitions, items: [] },
        ...mountOptions,
      });

      expect(wrapper.find('.lx-chat-typing').exists()).toBe(false);
    });

    test('shows the animated dots and default statusText when typing is true', () => {
      wrapper = mount(LxChat, {
        props: { userDefinitions, typing: true, items: [] },
        ...mountOptions,
      });

      expect(wrapper.find('.lx-chat-typing').exists()).toBe(true);
      expect(wrapper.find('.lx-chat-status-text').text()).toBe('Domā');
    });

    test('shows even when there are no messages yet (empty chat)', () => {
      wrapper = mount(LxChat, {
        props: { userDefinitions, typing: true, items: [] },
        ...mountOptions,
      });

      expect(wrapper.find('.lx-chat-typing').exists()).toBe(true);
      expect(wrapper.find('.lx-empty-state-wrapper').exists()).toBe(false);
    });

    test('resolves a single typingUsers id into a name from userDefinitions', () => {
      wrapper = mount(LxChat, {
        props: { userDefinitions, typing: true, typingUsers: ['user-1'], items: [] },
        ...mountOptions,
      });

      expect(wrapper.find('.lx-chat-status-text').text()).toBe('Hemingvejs domā');
    });

    test('joins multiple typingUsers names with texts.and', () => {
      wrapper = mount(LxChat, {
        props: {
          userDefinitions,
          typing: true,
          typingUsers: ['user-1', 'user-2'],
          items: [],
        },
        ...mountOptions,
      });

      expect(wrapper.find('.lx-chat-status-text').text()).toBe('Hemingvejs un Bukovskis domā');
    });

    test('ignores unknown typingUsers ids and falls back to the generic statusTextSingular', () => {
      wrapper = mount(LxChat, {
        props: { userDefinitions, typing: true, typingUsers: ['user-unknown'], items: [] },
        ...mountOptions,
      });

      expect(wrapper.find('.lx-chat-status-text').text()).toBe('Domā');
    });

    test('accepts a custom statusTextSingular via the texts prop', () => {
      wrapper = mount(LxChat, {
        props: {
          userDefinitions,
          typing: true,
          texts: { statusTextSingular: 'Raksta...' },
          items: [],
        },
        ...mountOptions,
      });

      expect(wrapper.find('.lx-chat-status-text').text()).toBe('Raksta...');
    });

    test('uses statusTextPlural (not statusTextSingular) when more than one person is typing', () => {
      wrapper = mount(LxChat, {
        props: {
          userDefinitions,
          typing: true,
          typingUsers: ['user-1', 'user-2'],
          texts: { statusTextSingular: 'domā', statusTextPlural: 'domājam' },
          items: [],
        },
        ...mountOptions,
      });

      expect(wrapper.find('.lx-chat-status-text').text()).toBe('Hemingvejs un Bukovskis domājam');
    });

    test('uses statusTextSingular when exactly one person is typing', () => {
      wrapper = mount(LxChat, {
        props: {
          userDefinitions,
          typing: true,
          typingUsers: ['user-1'],
          texts: { statusTextSingular: 'domā', statusTextPlural: 'domājam' },
          items: [],
        },
        ...mountOptions,
      });

      expect(wrapper.find('.lx-chat-status-text').text()).toBe('Hemingvejs domā');
    });

    test('renders typingActionDefinitions and emits typing-action-click on click', async () => {
      wrapper = mount(LxChat, {
        props: {
          userDefinitions,
          typing: true,
          typingActionDefinitions: [{ id: 'stop', name: 'Stop', icon: 'close' }],
          items: [],
        },
        ...mountOptions,
      });

      await wrapper.find('[id$="-action-stop"]').trigger('click');

      const emitted = wrapper.emitted()['typing-action-click'];
      expect(emitted).toBeTruthy();
      expect(emitted[0][0]).toEqual({ id: 'stop' });
    });

    test('a real message with its own loading flag no longer shows a bubble-level status', () => {
      wrapper = mount(LxChat, {
        props: {
          userDefinitions,
          items: [{ id: 'm1', userId: 'user-ai', userName: 'AI', createdAt: day, loading: true }],
        },
        ...mountOptions,
      });

      expect(wrapper.find('.lx-chat-status').exists()).toBe(false);
    });

    const reasoningAction = {
      id: 'reasoning',
      name: 'Reasoning',
      icon: 'reasoning',
      visibleByAttribute: 'isAi',
    };

    test('renders a message action only where visibleByAttribute matches (AI only)', () => {
      wrapper = mount(LxChat, {
        props: {
          userDefinitions: [
            { id: 'user-me', isMe: true },
            { id: 'user-ai', isAi: true },
          ],
          messageActionDefinitions: [reasoningAction],
          items: [
            { id: 'm1', userId: 'user-ai', userName: 'AI', text: 'answer', createdAt: day },
            { id: 'm2', userId: 'user-other', userName: 'Other', text: 'hi', createdAt: day },
          ],
        },
        ...mountOptions,
      });

      // Only the AI message exposes the action (visibleByAttribute: 'isAi').
      expect(wrapper.findAll('[id$="-action-reasoning"]')).toHaveLength(1);
    });

    test('clicking a message action emits message-action-click with the action id and message id', async () => {
      const message = {
        id: 'm1',
        userId: 'user-ai',
        userName: 'AI',
        text: 'answer',
        createdAt: day,
        reasoning: 'because',
      };
      wrapper = mount(LxChat, {
        props: {
          userDefinitions: [
            { id: 'user-me', isMe: true },
            { id: 'user-ai', isAi: true },
          ],
          messageActionDefinitions: [reasoningAction],
          items: [message],
        },
        ...mountOptions,
      });

      await wrapper.find('[id$="-action-reasoning"]').trigger('click');

      const emitted = wrapper.emitted()['message-action-click'];
      expect(emitted).toBeTruthy();
      expect(emitted[0][0].id).toBe('reasoning');
      expect(emitted[0][0].messageId).toBe('m1');
    });

    test('disables an action while busy or loading when it opts in with enableByAttribute: "notBusy"', () => {
      const message = {
        id: 'm1',
        userId: 'user-ai',
        userName: 'AI',
        text: 'answer',
        createdAt: day,
      };

      wrapper = mount(LxChat, {
        props: {
          userDefinitions: [
            { id: 'user-me', isMe: true },
            { id: 'user-ai', isAi: true },
          ],
          busy: true,
          messageActionDefinitions: [{ ...reasoningAction, enableByAttribute: 'notBusy' }],
          items: [message],
        },
        ...mountOptions,
      });

      expect(wrapper.find('[id$="-action-reasoning"]').element.disabled).toBe(true);
    });

    test('leaves an action enabled while busy or loading by default (no enableByAttribute gating)', () => {
      const message = {
        id: 'm1',
        userId: 'user-ai',
        userName: 'AI',
        text: 'answer',
        createdAt: day,
      };

      wrapper = mount(LxChat, {
        props: {
          userDefinitions: [
            { id: 'user-me', isMe: true },
            { id: 'user-ai', isAi: true },
          ],
          busy: true,
          messageActionDefinitions: [reasoningAction],
          items: [message],
        },
        ...mountOptions,
      });

      expect(wrapper.find('[id$="-action-reasoning"]').element.disabled).toBe(false);
    });
  });

  describe('Message content dispatch', () => {
    const day = new Date('2026-07-20T10:00:00.000Z');
    const schema = { type: 'object', properties: { name: { type: 'string', title: 'Name' } } };

    test('renders a text/markdown message with LxRichTextDisplay', () => {
      wrapper = mount(LxChat, {
        props: {
          userDefinitions: [{ id: 'user-me', isMe: true }],
          items: [{ id: 'm1', userId: 'other', userName: 'Other', text: '**hi**', createdAt: day }],
        },
        ...mountOptions,
      });

      expect(wrapper.findComponent(LxRichTextDisplay).exists()).toBe(true);
    });

    test('renders a schema message with the provided builder and emits on submit', async () => {
      wrapper = mount(LxChat, {
        props: {
          userDefinitions: [
            { id: 'user-me', isMe: true },
            { id: 'user-ai', isAi: true },
          ],
          clarifyingQuestionsBuilder: StubBuilder,
          items: [{ id: 'm1', userId: 'user-ai', userName: 'AI', schema, createdAt: day }],
        },
        ...mountOptions,
      });

      expect(wrapper.find('.stub-builder').exists()).toBe(true);
      // Submit is the LxForm footer's primary action.
      await wrapper.find('[id$="-action-submit"]').trigger('click');

      const emitted = wrapper.emitted()['clarifying-questions-submit'];
      expect(emitted).toBeTruthy();
      expect(emitted[0][0]).toHaveProperty('message');
      expect(emitted[0][0]).toHaveProperty('values');
    });

    test('disables the form submit button while the chat is busy or loading', () => {
      wrapper = mount(LxChat, {
        props: {
          userDefinitions: [
            { id: 'user-me', isMe: true },
            { id: 'user-ai', isAi: true },
          ],
          loading: true,
          clarifyingQuestionsBuilder: StubBuilder,
          items: [{ id: 'm1', userId: 'user-ai', userName: 'AI', schema, createdAt: day }],
        },
        ...mountOptions,
      });

      expect(wrapper.find('[id$="-action-submit"]').element.disabled).toBe(true);
    });

    test('renders the message text as a prompt above the form', () => {
      wrapper = mount(LxChat, {
        props: {
          userDefinitions: [
            { id: 'user-me', isMe: true },
            { id: 'user-ai', isAi: true },
          ],
          clarifyingQuestionsBuilder: StubBuilder,
          items: [
            {
              id: 'm1',
              userId: 'user-ai',
              userName: 'AI',
              text: 'Pick one',
              schema,
              createdAt: day,
            },
          ],
        },
        ...mountOptions,
      });

      // Both the markdown prompt and the builder render.
      expect(wrapper.find('.lx-chat-form-prompt').exists()).toBe(true);
      expect(wrapper.find('.stub-builder').exists()).toBe(true);
    });

    test('ignores a schema message when no builder is provided', () => {
      wrapper = mount(LxChat, {
        props: {
          userDefinitions: [
            { id: 'user-me', isMe: true },
            { id: 'user-ai', isAi: true },
          ],
          items: [
            { id: 'm1', userId: 'user-ai', userName: 'AI', schema, text: '', createdAt: day },
          ],
        },
        ...mountOptions,
      });

      expect(wrapper.find('.stub-builder').exists()).toBe(false);
      // falls back to the rich-text renderer (schema ignored)
      expect(wrapper.findComponent(LxRichTextDisplay).exists()).toBe(true);
    });
  });
});
