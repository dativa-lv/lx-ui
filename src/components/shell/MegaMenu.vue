<script setup>
import { computed, watch, ref, inject } from 'vue';
import LxIcon from '@/components/Icon.vue';
import LxButton from '@/components/Button.vue';
import LxDropDownMenu from '@/components/DropDownMenu.vue';
import { generateUUID } from '@/utils/stringUtils';
import { getDisplayTexts } from '@/utils/generalUtils';

const props = defineProps({
  id: { type: String, default: () => generateUUID() },
  items: { type: Array, default: () => [] },
  hasShowAll: { type: Boolean, default: false },
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

const primaryItems = computed(() => {
  const primary = props.items?.filter((o) => o.kind === 'primary') || [];

  return primary;
});

function triggerShowAllClick() {
  emits('megaMenuShowAllClick');
}

const lxElement = document.querySelector('.lx');

function specialStyles(item) {
  if (!item?.brandColor) {
    return {};
  }

  const { className } = lxElement;

  if (className.includes('dark')) {
    return {
      fill: item.brandColorDark || item.brandColor,
    };
  }
  if (className.includes('light')) {
    return {
      fill: item.brandColor,
    };
  }
  if (className.includes('contrast')) {
    return null;
  }

  return {
    fill: item.brandColor,
  };
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

const megaMenuActionsDefinitons = computed(() =>
  props.items
    .filter((item) => item.kind === 'secondary')
    .map((item) => ({
      id: item?.id,
      groupId: item?.group,
      name: item?.name,
      title: item?.description,
      icon: getIcon(item),
      iconSet: getIconSet(item),
      active: item?.id === props.selectedMegaMenuItem,
    }))
);

function updateSelectedMegaMenuItem(id) {
  selectedMegaMenuItemModel.value = id;
}
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
            :title="item?.description"
            tabindex="0"
            :class="[
              { selected: selectedMegaMenuItemModel === item.id },
              {
                'default-icon': !item.id,
              },
            ]"
            role="button"
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
          </li>
          <li
            v-if="props.hasShowAll"
            class="primary-menu-tile"
            :title="displayTexts.showAllLabel"
            @keyup.enter.prevent="triggerShowAllClick"
            @click="triggerShowAllClick"
            tabindex="0"
          >
            <LxIcon value="open" :title="displayTexts.showAllLabel" />
            <div class="lx-data">{{ displayTexts.showAllLabel }}</div>
          </li>
        </ul>
      </div>
    </template>
  </LxDropDownMenu>
</template>
