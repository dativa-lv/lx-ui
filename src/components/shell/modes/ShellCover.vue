<script setup>
import { buildVueDompurifyHTMLDirective } from 'vue-dompurify-html';

import LxAlertWidget from '@/components/AlertWidget.vue';
import LxIcon from '@/components/Icon.vue';
import LxLoader from '@/components/Loader.vue';
import LxSkipLink from '@/components/SkipLink.vue';
import LxMainHeader from '@/components/shell/Header.vue';
import { useShellContext } from '@/components/shell/shellContext';

const {
  props,
  shell,
  header,
  main,
  footer,
  modals,
  poppers,
  displayTexts,
  selectedMegaMenuItemModel,
  selectedContextPersonModel,
  selectedAlternativeProfileModel,
  selectedLanguageModel,
  themeModel,
  animationsModel,
  transparencyModel,
  touchModeModel,
  customButtonOpenedModal,
  viewSpotlightItems,
  focusFirstMainFocusableElement,
  triggerShowAllClick,
  languageChange,
  helpClicked,
  logOut,
  navToggle,
  contextPersonChange,
  alternativeProfileChange,
  toggleSpotlight,
  emits,
} = useShellContext();

const vCleanHtml = buildVueDompurifyHTMLDirective();
</script>

<template>
  <div
    ref="shell"
    class="lx-layout"
    :class="[
      props.mode === 'cover' ? 'lx-layout-cover' : 'lx-layout-cover-digives-lite',
      { 'lx-override': props.overrideDefaultStyles },
    ]"
  >
    <LxSkipLink
      v-if="props.hasSkipLink"
      :label="displayTexts.skipLinkLabel"
      :title="displayTexts.skipLinkTitle"
      @click="focusFirstMainFocusableElement"
    />
    <header ref="header">
      <LxMainHeader
        v-model:customButtonOpened="customButtonOpenedModal"
        v-model:selectedMegaMenuItem="selectedMegaMenuItemModel"
        v-model:selectedContextPerson="selectedContextPersonModel"
        v-model:selectedAlternativeProfile="selectedAlternativeProfileModel"
        v-model:selectedLanguage="selectedLanguageModel"
        v-model:theme="themeModel"
        v-model:hasReducedAnimations="animationsModel"
        v-model:hasReducedTransparency="transparencyModel"
        v-model:isTouchSensitive="touchModeModel"
        :mode="props.mode"
        :alternative-profiles-info="props.alternativeProfilesInfo"
        :context-persons-info="props.contextPersonsInfo"
        :nav-items="props.navItems"
        :userInfo="props.userInfo"
        :hideNavBar="true"
        :has-language-picker="props.hasLanguagePicker"
        :languages="props.languages"
        :has-help="props.hasHelp"
        :has-avatar="props.hasAvatar"
        :avatar-kind="props.avatarKind"
        :has-theme-picker="props.hasThemePicker"
        :available-themes="props.availableThemes"
        :environment="props.environment"
        :headerNavDisable="props.headerNavDisable"
        :hasMegaMenu="props.hasMegaMenu"
        :megaMenuItems="props.megaMenuItems"
        :megaMenuHasShowAll="props.megaMenuHasShowAll"
        :megaMenuShowAllHref="props.megaMenuShowAllHref"
        :showPrimaryMegaMenuItems="props.showPrimaryMegaMenuItems"
        :hasCustomButton="props.hasCustomButton"
        :customButtonIcon="props.customButtonIcon"
        :customButtonBadge="props.customButtonBadge"
        :customButtonBadgeType="props.customButtonBadgeType"
        :customButtonBadgeIcon="props.customButtonBadgeIcon"
        :customButtonKind="props.customButtonKind"
        :hasSpotlight="viewSpotlightItems?.length > 0"
        :spotlightHasBadge="props.spotlightHasBadge"
        :secondsToLive="props.secondsToLive"
        :showIdleBadge="props.showIdleBadge"
        :megaMenuGroupDefinitions="props.megaMenuGroupDefinitions"
        :texts="displayTexts"
        @mega-menu-show-all-click="triggerShowAllClick"
        @language-change="languageChange"
        @help-click="helpClicked"
        @log-out="logOut"
        @nav-toggle="navToggle"
        @contextPersonChange="contextPersonChange"
        @alternativeProfileChange="alternativeProfileChange"
        @customButtonClick="emits('customButtonClick')"
        @toggleSpotlight="toggleSpotlight"
        @settingsClick="emits('settingsClick')"
      >
        <template v-if="!props.systemIcon" #logo>
          <slot name="logoSmall" />
        </template>
        <LxIcon
          v-if="props.systemIcon"
          :value="props.systemIcon"
          icon-set="brand"
          :title="`${props.systemName} logo`"
          :desc="`${props.systemName}: ${props.systemSubheader}`"
        />
        <template v-if="$slots.customButtonPanel" #customButtonPanel>
          <slot name="customButtonPanel" />
        </template>
        <template v-if="$slots.customButtonSafePanel" #customButtonSafePanel>
          <slot name="customButtonSafePanel" />
        </template>
      </LxMainHeader>
    </header>
    <main ref="main" class="lx-main" :aria-busy="props.navigating">
      <div class="lx-cover">
        <slot name="backdrop" />
        <div class="lx-content">
          <div class="lx-logo">
            <template v-if="props.hasCoverLogo">
              <img v-if="props.coverLogo" :src="props.coverLogo" alt="Logo" />
              <slot v-else name="logo" />
            </template>
            <template v-else>
              <LxIcon
                :value="props.systemIcon"
                icon-set="brand"
                :title="`${props.systemName} logo`"
                :desc="`${props.systemName}: ${props.systemSubheader}`"
              />
            </template>
          </div>
          <div>
            <div
              v-if="props.systemNameFormatted"
              v-clean-html="props.systemNameFormatted"
              class="heading-1"
              role="heading"
              aria-level="1"
            />
            <div v-else class="heading-1" role="heading" aria-level="1">
              {{ props.systemName }}
            </div>
            <p class="lx-description">{{ props.systemSubheader }}</p>
          </div>
          <div class="cover-main-area">
            <slot name="coverArea" />
            <LxAlertWidget
              v-if="props.alerts?.length > 0"
              :alerts="props.alerts"
              :nextAlertTitle="displayTexts.nextAlertTitle"
              :previousAlertTitle="displayTexts.previousAlertTitle"
            />
          </div>
        </div>
      </div>
      <div v-if="props.navigating" class="lx-loader-screen">
        <div class="spinner">
          <LxLoader :loading="true" />
        </div>
      </div>
      <div aria-live="polite" role="status" class="lx-invisible">
        {{ props.navigating ? displayTexts.loadingInProgress : displayTexts.loadingComplete }}
      </div>
    </main>
    <footer ref="footer">
      <div></div>
      <div>
        <slot name="footer" />
      </div>
      <div></div>
    </footer>
    <div ref="modals" id="modals"></div>
    <div ref="poppers" id="poppers"></div>
  </div>
</template>
