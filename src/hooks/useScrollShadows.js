import { nextTick, ref, toValue, watch } from 'vue';
import { useEventListener, useResizeObserver } from '@vueuse/core';
import { SHADOW_FADE_DISTANCE, shadowOpacity } from '@/utils/shadowUtils';

/**
 * Top and bottom scroll shadow opacities of a scroll container, for `--lx-shadow-{top|bottom}-opacity`.
 * Updates on scroll, on resize of the container or its `content`, and when the container or `enabled` changes.
 *
 * @param {import('vue').MaybeRefOrGetter<HTMLElement|null>} target - Scroll container.
 * @param {Object} [options]
 * @param {number} [options.fadeDistance=SHADOW_FADE_DISTANCE] - Scroll distance at which a shadow is fully visible.
 * @param {import('vue').MaybeRefOrGetter<HTMLElement|null>} [options.content] - Inner element whose growth changes the scroll height.
 * @param {import('vue').MaybeRefOrGetter<boolean>} [options.enabled=true] - Skip updates while false.
 * @returns {{ top: import('vue').Ref<number>, bottom: import('vue').Ref<number>, update: () => void }}
 */
export function useScrollShadows(
  target,
  { fadeDistance = SHADOW_FADE_DISTANCE, content = null, enabled = true } = {}
) {
  const top = ref(0);
  const bottom = ref(0);

  function update() {
    const el = toValue(target);
    if (!el) {
      top.value = 0;
      bottom.value = 0;
      return;
    }
    if (!toValue(enabled)) return;
    top.value = shadowOpacity(el.scrollTop, fadeDistance);
    bottom.value = shadowOpacity(el.scrollHeight - el.scrollTop - el.clientHeight, fadeDistance);
  }

  useEventListener(target, 'scroll', update, { passive: true });
  useResizeObserver(() => [toValue(target), toValue(content)].filter(Boolean), update);
  watch(
    () => [toValue(target), toValue(enabled)],
    () => nextTick(update),
    { immediate: true }
  );

  return { top, bottom, update };
}
