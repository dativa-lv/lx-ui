import { onUnmounted, ref, toValue, watch } from 'vue';
import { LOADER_VIEW_CONSTANTS } from '@/constants';

/**
 * Shared screen reader announcer for a `loading` state.
 *
 * The timing rules (originally living inside LxLoaderView) exist so that
 * assistive technology gets a useful narration instead of chatter:
 * - a short load stays silent — "loading" is announced only if it is still
 *   running after `DEFAULT_LOADING_DELAY`, or after
 *   `INITIAL_MOUNTED_LOADING_DELAY` when the component mounts already loading
 *   (so the very first render doesn't talk over the view being announced);
 * - "done" is announced only if "loading" was announced, so the user never
 *   hears an ending without a beginning;
 * - "done" waits at least `MIN_BETWEEN_LOADING_DELAY` after "loading", so the
 *   two messages don't collide in the live region queue;
 * - "done" clears itself after `DONE_ANNOUNCEMENT_CLEAR_DELAY`, so stale text
 *   isn't left sitting in the live region for browse/scan mode to pick up.
 *
 * Consumers only render the returned flags into an always-present
 * `aria-live="polite" role="status"` region — the region itself must never be
 * inside a `v-if`/`v-show` that hides it, or the announcement never happens.
 *
 * @param {import('vue').MaybeRefOrGetter<boolean>} loading loading state source
 * @returns {{
 *   shouldAnnounceLoading: import('vue').Ref<boolean>,
 *   shouldAnnounceDone: import('vue').Ref<boolean>,
 * }}
 */
export function useLoadingAnnouncer(loading) {
  const shouldAnnounceLoading = ref(false);
  const shouldAnnounceDone = ref(false);

  const hasShownLoading = ref(false);
  const canAnnounceDone = ref(false);
  const pendingDoneAnnouncement = ref(false);

  let loadingDelayTimer = null;
  let minDoneDelayTimer = null;
  let doneClearTimer = null;
  let hasUsedInitialMountedLoadingThreshold = false;

  const mountedWithLoading = toValue(loading);

  function clearDoneClearTimer() {
    if (doneClearTimer) {
      clearTimeout(doneClearTimer);
      doneClearTimer = null;
    }
  }

  function announceDone() {
    shouldAnnounceDone.value = true;
    hasShownLoading.value = false;
    pendingDoneAnnouncement.value = false;

    clearDoneClearTimer();
    doneClearTimer = setTimeout(() => {
      doneClearTimer = null;
      shouldAnnounceDone.value = false;
    }, LOADER_VIEW_CONSTANTS.DONE_ANNOUNCEMENT_CLEAR_DELAY);
  }

  watch(
    () => toValue(loading),
    (isLoading) => {
      if (loadingDelayTimer) {
        clearTimeout(loadingDelayTimer);
        loadingDelayTimer = null;
      }

      if (isLoading) {
        if (minDoneDelayTimer) {
          clearTimeout(minDoneDelayTimer);
          minDoneDelayTimer = null;
        }
        clearDoneClearTimer();

        shouldAnnounceDone.value = false;
        shouldAnnounceLoading.value = false;
        hasShownLoading.value = false;
        canAnnounceDone.value = false;
        pendingDoneAnnouncement.value = false;

        const loadingAnnounceDelay =
          mountedWithLoading && !hasUsedInitialMountedLoadingThreshold
            ? LOADER_VIEW_CONSTANTS.INITIAL_MOUNTED_LOADING_DELAY
            : LOADER_VIEW_CONSTANTS.DEFAULT_LOADING_DELAY;

        if (mountedWithLoading && !hasUsedInitialMountedLoadingThreshold) {
          hasUsedInitialMountedLoadingThreshold = true;
        }

        loadingDelayTimer = setTimeout(() => {
          loadingDelayTimer = null;
          if (!toValue(loading)) {
            return;
          }

          shouldAnnounceLoading.value = true;
          hasShownLoading.value = true;
          canAnnounceDone.value = false;

          minDoneDelayTimer = setTimeout(() => {
            minDoneDelayTimer = null;
            canAnnounceDone.value = true;

            if (pendingDoneAnnouncement.value && !toValue(loading)) {
              announceDone();
            }
          }, LOADER_VIEW_CONSTANTS.MIN_BETWEEN_LOADING_DELAY);
        }, loadingAnnounceDelay);
        return;
      }

      shouldAnnounceLoading.value = false;

      if (!hasShownLoading.value) {
        shouldAnnounceDone.value = false;
        pendingDoneAnnouncement.value = false;
        return;
      }

      if (canAnnounceDone.value) {
        announceDone();
      } else {
        shouldAnnounceDone.value = false;
        pendingDoneAnnouncement.value = true;
      }
    },
    { immediate: true }
  );

  onUnmounted(() => {
    if (loadingDelayTimer) {
      clearTimeout(loadingDelayTimer);
    }
    if (minDoneDelayTimer) {
      clearTimeout(minDoneDelayTimer);
    }
    clearDoneClearTimer();
  });

  return { shouldAnnounceLoading, shouldAnnounceDone };
}

export default useLoadingAnnouncer;
