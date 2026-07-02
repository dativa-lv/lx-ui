<script setup>
import LxLoader from '@/components/Loader.vue';
import LxSkipLink from '@/components/SkipLink.vue';
import { useShellContext } from '@/components/shell/shellContext';

const {
  props,
  semiResponsiveView,
  header,
  main,
  footer,
  modals,
  poppers,
  displayTexts,
  focusFirstMainFocusableElement,
} = useShellContext();
</script>
<template>
  <div class="lx-layout lx-layout-custom" :class="[{ 'lx-override': props.overrideDefaultStyles }]">
    <LxSkipLink
      v-if="props.hasSkipLink"
      :label="displayTexts.skipLinkLabel"
      :title="displayTexts.skipLinkTitle"
      :tabindex="semiResponsiveView ? 1 : 0"
      @click="focusFirstMainFocusableElement"
    />
    <header v-if="$slots.header" ref="header" class="lx-layout-custom-header">
      <slot name="header" />
    </header>

    <aside v-if="$slots['aside-left']" class="lx-layout-custom-aside-left">
      <slot name="aside-left" />
    </aside>

    <main ref="main" class="lx-main" :aria-busy="props.navigating">
      <div v-if="$slots['page-header']" class="lx-layout-custom-page-header">
        <slot name="page-header" />
      </div>
      <transition name="nav">
        <slot />
      </transition>
      <div v-if="props.navigating" class="lx-loader-screen">
        <div class="spinner">
          <LxLoader :loading="true" />
        </div>
      </div>
      <div aria-live="polite" role="status" class="lx-invisible">
        {{ props.navigating ? displayTexts.loadingInProgress : displayTexts.loadingComplete }}
      </div>
    </main>

    <aside v-if="$slots['aside-right']" class="lx-layout-custom-aside-right">
      <slot name="aside-right" />
    </aside>

    <footer ref="footer">
      <slot name="footer" />
    </footer>

    <div ref="modals" id="modals"></div>
    <div ref="poppers" id="poppers"></div>
  </div>
</template>
