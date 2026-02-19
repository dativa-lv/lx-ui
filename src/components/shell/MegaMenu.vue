<script setup>
import { computed, watch, ref, inject } from 'vue';
import LxIcon from '@/components/Icon.vue';
import LxButton from '@/components/Button.vue';
import LxDropDownMenu from '@/components/DropDownMenu.vue';
import { generateUUID } from '@/utils/stringUtils';
import { getDisplayTexts } from '@/utils/generalUtils';
import { loadLibrary } from '@/utils/libLoader';
import { computedAsync } from '@vueuse/core';

const props = defineProps({
  id: { type: String, default: () => generateUUID() },
  items: { type: Array, default: () => [] },
  hasShowAll: { type: Boolean, default: false },
  showAllHref: { type: Object, default: null },
  showPrimaryMegaMenuItems: { type: Boolean, default: true },
  groupDefinitions: { type: Array, default: null },
  selectedMegaMenuItem: { type: String, default: null },
  buttonVariant: { type: String, default: 'icon-only' },
  disabled: { type: Boolean, default: false },
  texts: {
    type: Object,
    required: false,
    default: () => ({}),
  },
});

const textsDefault = {
  showAllLabel: 'Vairāk',
  megaMenuTitle: 'Lietotnes',
};

const sanitizeUrlLib = loadLibrary('sanitizeUrl');

async function computeSafeTo(href) {
  if (typeof href !== 'string') {
    return href ?? null;
  }

  const lib = await sanitizeUrlLib;
  const cleaned = lib.sanitizeUrl(href);
  if (cleaned === 'about:blank') {
    return null;
  }

  return cleaned ?? null;
}

const displayTexts = computed(() => getDisplayTexts(props.texts, textsDefault));

const emits = defineEmits(['megaMenuShowAllClick', 'update:selectedMegaMenuItem']);

const selectedMegaMenuItemModel = computed({
  get() {
    return props.selectedMegaMenuItem;
  },
  set(value) {
    emits('update:selectedMegaMenuItem', value);
  },
});

const primaryItems = computedAsync(() => {
  const primary = props.items?.filter((o) => o.kind === 'primary') || [];

  return Promise.all(primary.map(async (o) => ({ ...o, href: await computeSafeTo(o.href) })));
});

function triggerShowAllClick() {
  emits('megaMenuShowAllClick');
}

const theme = inject('theme', { state: { value: null } });

function getSpecialColor(item) {
  if (!item?.brandColor) {
    return null;
  }

  const themeName = theme.state?.value;

  const light = item.brandColor;
  const dark = item.brandColorDark || item.brandColor;

  switch (themeName) {
    case 'dark':
      return dark;
    case 'light':
      return light;
    case 'contrast':
      return null;
    default:
      return light;
  }
}

function specialStyles(item) {
  const specialColor = getSpecialColor(item);
  return specialColor ? { fill: specialColor } : null;
}

function getIcon(item) {
  return item.icon || 'none';
}

function getIconSet(item) {
  if (!item.icon) {
    return 'cds';
  }
  return item.iconSet || 'brand';
}

const menu = ref(null);

const closeSignal = inject('closeSignal');

watch(closeSignal, () => {
  menu?.value?.closeMenu();
});

const megaMenuActionsDefinitons = computedAsync(
  () =>
    Promise.all(
      props.items
        .filter((item) => item.kind === 'secondary')
        .map(async (item) => ({
          id: item?.id,
          groupId: item?.group,
          name: item?.name,
          title: item?.description,
          icon: getIcon(item),
          iconSet: getIconSet(item),
          iconColor: getSpecialColor(item),
          active: item?.id === props.selectedMegaMenuItem,
          href: await computeSafeTo(item?.href),
        }))
    ),
  []
);

function updateSelectedMegaMenuItem(id) {
  selectedMegaMenuItemModel.value = id;
}

const safeShowAllHref = computedAsync(() => computeSafeTo(props.showAllHref), null);
</script>
<template>
  <LxDropDownMenu
    ref="menu"
    :disabled="disabled"
    :actionDefinitions="megaMenuActionsDefinitons"
    :groupDefinitions="groupDefinitions"
    @actionClick="updateSelectedMegaMenuItem"
  >
    <div class="lx-toolbar">
      <LxButton
        id="lx-shell-mega-menu-button"
        customClass="lx-header-button"
        :variant="buttonVariant"
        kind="ghost"
        icon="apps"
        :tabindex="-1"
        :disabled="disabled"
        :label="displayTexts.megaMenuTitle"
      />
    </div>

    <template v-slot:panel>
      <div class="lx-mega-menu-container" :id="id">
        <ul v-if="showPrimaryMegaMenuItems" class="primary-menu" role="group">
          <li
            v-for="item in primaryItems"
            :key="item.id"
            class="primary-menu-tile"
            :class="[
              { selected: selectedMegaMenuItemModel === item.id },
              { 'default-icon': !item.id },
            ]"
          >
            <router-link v-if="item.href" :to="item.href" :title="item?.description">
              <LxIcon
                :value="getIcon(item)"
                :iconSet="getIconSet(item)"
                :style="specialStyles(item)"
                :title="item?.description"
              />
              <div class="lx-data">{{ item?.name }}</div>
            </router-link>
            <div
              v-else
              role="button"
              tabindex="0"
              :title="item?.description"
              @click="updateSelectedMegaMenuItem(item.id)"
              @keyup.enter.prevent="updateSelectedMegaMenuItem(item.id)"
            >
              <LxIcon
                :value="getIcon(item)"
                :iconSet="getIconSet(item)"
                :style="specialStyles(item)"
                :title="item?.description"
              />
              <div class="lx-data">{{ item?.name }}</div>
            </div>
          </li>
          <li v-if="props.hasShowAll" class="primary-menu-tile">
            <router-link
              v-if="safeShowAllHref"
              :to="safeShowAllHref"
              :title="displayTexts.showAllLabel"
            >
              <LxIcon value="open" :title="displayTexts.showAllLabel" />
              <div class="lx-data">{{ displayTexts.showAllLabel }}</div>
            </router-link>
            <div
              v-else
              role="button"
              tabindex="0"
              :title="displayTexts.showAllLabel"
              @click="triggerShowAllClick"
              @keyup.enter.prevent="triggerShowAllClick"
            >
              <LxIcon value="open" :title="displayTexts.showAllLabel" />
              <div class="lx-data">{{ displayTexts.showAllLabel }}</div>
            </div>
          </li>
        </ul>
      </div>
    </template>
  </LxDropDownMenu>
</template>
