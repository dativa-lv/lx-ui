<script setup>
import { ref, computed, watch, inject } from 'vue';
import LxIcon from '@/components/Icon.vue';
import LxDataBlock from '@/components/DataBlock.vue';
import LxButton from '@/components/Button.vue';
import LxStack from '@/components/Stack.vue';
import LxToggle from '@/components/Toggle.vue';
import LxDropDown from '@/components/Dropdown.vue';
import LxValuePicker from '@/components/ValuePicker.vue';
import LxLink from '@/components/Link.vue';
import { getDisplayTexts } from '@/utils/generalUtils';
import { getInitialProps } from '@/utils/accessibilityUtils';

const props = defineProps({
  headingTag: { type: String, default: 'div' }, // h1, h2, h3, h4, h5, h6, div
  headingLevel: { type: Number, default: 2 }, // 1-6
  texts: { type: Object, default: () => ({}) },
});

const textsDefault = {
  appearance: 'Vizuālais izskats',
  animations: 'Kustība un animācijas',
  fonts: 'Teksts un fonti',
  interactions: 'Mijiedarbība',
  reset: 'Atiestatīt iestatījumus',
  themeTitle: 'Noformējuma izvēle',
  transparencyTitle: 'Caurspīdīgums',
  animationsTitle: 'Animācijas',
  fontsTitle: 'Iekārtas fonti',
  touchModeTitle: 'Skārienvadība',
  transparencyDescription:
    'Caurspīdīgums ir vizuāls efekts, kas ļauj redzēt daļu no fona zem aktīviem logiem vai paneļiem. Šis iestatījums ļauj samazināt vai izslēgt caurspīdīgumu, lai fons būtu vienkrāsains, tā uzlabojot satura un fona atšķirību, padarot saturu vieglāk uztveramu. Piemērots lietotājiem ar redzes traucējumiem, koncentrēšanās grūtībām vai krāsu uztveres problēmām.',
  animationsDescription:
    'Animācijas ir vizuāli kustīgi efekti, kas parādās pārejās, klikšķos un citu elementu mijiedarbībā, piemēram, kad tiek atvērti logi vai pārslēgti izvēlnes elementi. Šis iestatījums ļauj samazināt vai izslēgt animācijas, lai saskarne būtu mierīgāka un mazāk traucējoša. Svarīgi lietotājiem ar vestibulāriem traucējumiem vai paaugstinātu jutību pret kustību.',
  fontsDescription:
    'Iekārtas fonti ir ierīces vai operētājsistēmas noklusējuma fonti. To izmantošana uzlabo teksta salasāmību un atpazīstamību, nodrošinot konsekventu un lietotājam pazīstamu teksta attēlojumu.',
  touchModeDescription:
    'Ieslēdzot skārienjutīgu režīmu, lietotne tiek pielāgota lietošanai ar pirkstu uz skārienekrāna. Tiek palielināti nospiežamie elementi (pogas, izvēlnes u.c. ), lai uzlabotu lietošanas ērtumu.',
  themeAuto: 'Automātisks',
  themeLight: 'Gaišs',
  themeDark: 'Tumšs',
  themeContrast: 'Kontrastains',
  themeAutoDescription: 'Automātiskais noformējums ņem vērā ierīces vai sistēmas iestatījumus.',
  themeLightDescription: 'Gaišs noformējums ar tumšu tekstu uz gaiša fona.',
  themeDarkDescription: 'Tumšs noformējums ar gaišu tekstu uz tumša fona.',
  themeContrastDescription:
    'Noformējums ar paaugstinātu krāsu kontrastu, kas uzlabo satura salasāmību. Īpaši piemērots lietotājiem ar redzes traucējumiem.',
  transparencyLinkLabel: 'Piekļūstamības standarti (WCAG Contrast (Minimum))',
  animationsLinkLabel: 'Piekļūstamības standarti (WCAG Animation from Interactions)',
  reduceTransparencyOn: 'Jā',
  reduceTransparencyOff: 'Nē',
  reduceMotionOn: 'Jā',
  reduceMotionOff: 'Nē',
  systemFontsOn: 'Jā',
  systemFontsOff: 'Nē',
  touchModeOn: 'Jā',
  touchModeOff: 'Nē',
};

const displayTexts = computed(() => getDisplayTexts(props.texts, textsDefault));

const blocks = [
  {
    id: 'theme',
    icon: 'theme',
    label: 'themeTitle',
    section: 'appearance',
  },
  {
    id: 'transparency',
    icon: 'transparency',
    label: 'transparencyTitle',
    description: 'transparencyDescription',
    section: 'appearance',
  },
  {
    id: 'animations',
    icon: 'animation',
    label: 'animationsTitle',
    description: 'animationsDescription',
    section: 'animations',
  },
  {
    id: 'fonts',
    icon: 'text',
    label: 'fontsTitle',
    description: 'fontsDescription',
    section: 'fonts',
  },
  {
    id: 'touchMode',
    icon: 'touchMode',
    label: 'touchModeTitle',
    description: 'touchModeDescription',
    section: 'interactions',
  },
];

const toggleTextMap = {
  transparency: { yes: 'reduceTransparencyOn', no: 'reduceTransparencyOff' },
  animations: { yes: 'reduceMotionOn', no: 'reduceMotionOff' },
  fonts: { yes: 'systemFontsOn', no: 'systemFontsOff' },
  touchMode: { yes: 'touchModeOn', no: 'touchModeOff' },
};

const themes = ref([
  {
    id: 'auto',
    name: 'themeAuto',
    description: 'themeAutoDescription',
    icon: 'theme-auto',
  },
  {
    id: 'light',
    name: 'themeLight',
    description: 'themeLightDescription',
    icon: 'theme-light',
  },
  {
    id: 'dark',
    name: 'themeDark',
    description: 'themeDarkDescription',
    icon: 'theme-dark',
  },
  {
    id: 'contrast',
    name: 'themeContrast',
    description: 'themeContrastDescription',
    icon: 'theme-contrast',
  },
]);

const guidelineLinks = {
  transparency: 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html',
  animations: 'https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html',
};

const shellModels = {
  animations: inject('hasReducedAnimations'),
  transparency: inject('hasReducedTransparency'),
  fonts: inject('hasDeviceFonts'),
  theme: inject('theme'),
  touchMode: inject('isTouchMode'),
};

const blockExpanderModels = ref(Object.fromEntries(blocks.map((item) => [item.id, false])));
const shellKeys = Object.keys(shellModels);
const isInverted = (id) => id === 'animations' || id === 'transparency';

const sections = computed(() => {
  const map = {};
  blocks.forEach((item) => {
    if (!map[item.section]) map[item.section] = [];
    map[item.section].push(item);
  });
  return map;
});

const themeDisplayItems = computed(() =>
  themes.value.map((theme) => ({
    ...theme,
    name: displayTexts.value[theme.name],
    description: displayTexts.value[theme.description],
  }))
);

const blockToggleModels = ref(
  Object.fromEntries(
    shellKeys.map((id) => [id, isInverted(id) ? !shellModels[id].value : shellModels[id].value])
  )
);

watch(
  blockToggleModels,
  (newVals) => {
    shellKeys.forEach((id) => {
      shellModels[id].value = isInverted(id) ? !newVals[id] : newVals[id];
    });
  },
  { deep: true }
);

shellKeys.forEach((id) => {
  watch(
    shellModels[id],
    (val) => {
      blockToggleModels.value[id] = isInverted(id) ? !val : val;
    },
    { immediate: true }
  );
});

function resetAccessibilitySettings() {
  const initial = getInitialProps();

  blockToggleModels.value.animations = initial.animations;
  blockToggleModels.value.transparency = initial.transparency;
  blockToggleModels.value.fonts = initial.fonts;
  blockToggleModels.value.touchMode = initial.touchMode;
  blockToggleModels.value.theme = initial.theme;
}

const headingTag = computed(() => {
  if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(props.headingTag)) {
    return props.headingTag;
  }
  return 'div';
});

const headingAttrs = computed(() => {
  if (props.headingTag === 'div') {
    const level = Math.min(6, Math.max(1, Math.round(props.headingLevel)));
    return { role: 'heading', 'aria-level': level };
  }
  return {};
});
</script>

<template>
  <div class="lx-accessibility-settings-wrapper">
    <template v-for="(blocksInSection, section) in sections" :key="section">
      <div class="lx-accessibility-settings-block">
        <component :is="headingTag" v-bind="headingAttrs" class="heading-2">
          {{ displayTexts[section] }}
        </component>
        <template v-for="block in blocksInSection" :key="block.id">
          <LxDataBlock size="l" :expandable="true" v-model="blockExpanderModels[block.id]">
            <template #customHeader>
              <LxStack
                mode="grid"
                orientation="horizontal"
                horizontalAlignment="stretch"
                verticalAlignment="center"
                :horizontalConfig="[1, 'auto']"
              >
                <LxStack
                  mode="grid"
                  orientation="horizontal"
                  horizontalAlignment="stretch"
                  verticalAlignment="center"
                  :horizontalConfig="[1, 'auto']"
                >
                  <LxStack
                    mode="grid"
                    orientation="horizontal"
                    kind="compact"
                    :horizontalConfig="['auto', 1]"
                  >
                    <div class="lx-icons"><LxIcon :value="block.icon" /></div>
                    <LxStack verticalAlignment="center" kind="compact">
                      <div :id="`${block.id}-label`" class="lx-primary">
                        {{ displayTexts[block.label] }}
                      </div>
                      <div v-if="block.id !== 'theme'" class="lx-secondary">
                        {{ displayTexts[block.description] }}
                      </div>
                    </LxStack>
                  </LxStack>
                  <LxToggle
                    v-if="block.id !== 'theme'"
                    v-model="blockToggleModels[block.id]"
                    :tooltip="displayTexts[block.label]"
                    :labelId="`${block.id}-label`"
                    :texts="{
                      valueYes: displayTexts[toggleTextMap[block.id].yes],
                      valueNo: displayTexts[toggleTextMap[block.id].no],
                    }"
                    @click.stop
                    @keyup.space.stop
                  />
                  <LxDropDown
                    v-else-if="block.id === 'theme' && !blockExpanderModels[block.id]"
                    v-model="blockToggleModels[block.id]"
                    :items="themeDisplayItems"
                    :labelId="`${block.id}-label`"
                    @click.stop
                  >
                    <template #customItem="{ icon, name }">
                      <div class="lx-accessibility-settings-dropdown-content">
                        <LxIcon :value="icon" />
                        <span class="lx-data">
                          {{ name }}
                        </span>
                      </div>
                    </template>
                  </LxDropDown>
                </LxStack>
                <div class="lx-indications">
                  <LxIcon :value="blockExpanderModels[block.id] ? 'chevron-up' : 'chevron-down'" />
                </div>
              </LxStack>
            </template>
            <template v-if="block.id !== 'theme'">
              <div class="lx-accessibility-settings-block-content">
                <div class="lx-data">
                  {{ displayTexts[block.description] }}
                </div>
              </div>
              <LxLink
                v-if="block.id === 'transparency' || block.id === 'animations'"
                :href="guidelineLinks[block.id]"
              >
                <template v-if="block.id === 'transparency'">
                  {{ displayTexts.transparencyLinkLabel }}
                </template>
                <template v-else>
                  {{ displayTexts.animationsLinkLabel }}
                </template>
              </LxLink>
            </template>
            <div v-else-if="block.id === 'theme'" class="lx-theme-item-wrapper">
              <LxValuePicker
                variant="tiles-custom"
                v-model="blockToggleModels[block.id]"
                :items="themeDisplayItems"
                selectionKind="single"
                :labelId="`${block.id}-label`"
              >
                <template #customItem="{ icon, name, iconSet, description }">
                  <div class="lx-theme-item-content">
                    <LxIcon :value="icon" :iconSet="iconSet"></LxIcon>
                    <div class="lx-value-picker-tile-name">{{ name }}</div>
                    <div class="lx-value-picker-description">{{ description }}</div>
                  </div>
                </template>
              </LxValuePicker>
            </div>
          </LxDataBlock>
        </template>
      </div>
    </template>
    <LxButton
      :label="displayTexts.reset"
      icon="reset"
      kind="tertiary"
      @click="resetAccessibilitySettings"
    />
  </div>
</template>
