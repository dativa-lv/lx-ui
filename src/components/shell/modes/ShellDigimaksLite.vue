<script setup>
import LxLoader from '@/components/Loader.vue';
import LxSkipLink from '@/components/SkipLink.vue';
import LxMainHeaderDigimaksLite from '@/components/shell/HeaderDigimaksLite.vue';
import { useShellContext } from '@/components/shell/shellContext';

const {
  props,
  header,
  main,
  footer,
  modals,
  poppers,
  displayTexts,
  deviceFontsModel,
  navBarSwitchModel,
  selectedLanguageModel,
  selectedContextPersonModel,
  selectedAlternativeProfileModel,
  selectedMegaMenuItemModel,
  themeModel,
  customButtonOpenedModal,
  focusFirstMainFocusableElement,
  triggerShowAllClick,
  languageChange,
  alertItemClicked,
  alertsClicked,
  helpClicked,
  goHome,
  goBack,
  logOut,
  navToggle,
  contextPersonChange,
  alternativeProfileChange,
  emits,
} = useShellContext();
</script>

<template>
  <div class="lx-layout lx-layout-digimaks" :class="{ 'lx-override': props.overrideDefaultStyles }">
    <LxSkipLink
      v-if="props.hasSkipLink"
      :label="displayTexts.skipLinkLabel"
      :title="displayTexts.skipLinkTitle"
      @click="focusFirstMainFocusableElement"
    />
    <main class="lx-main" ref="main" :aria-busy="props.navigating">
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
    <footer ref="footer">
      <div>
        <slot name="footer" />
      </div>
    </footer>
    <header ref="header">
      <LxMainHeaderDigimaksLite
        v-model:customButtonOpened="customButtonOpenedModal"
        v-model:selectedLanguage="selectedLanguageModel"
        v-model:selectedContextPerson="selectedContextPersonModel"
        v-model:selectedAlternativeProfile="selectedAlternativeProfileModel"
        v-model:theme="themeModel"
        v-model:hasDeviceFonts="deviceFontsModel"
        v-model:navBarSwitch="navBarSwitchModel"
        v-model:selectedMegaMenuItem="selectedMegaMenuItemModel"
        :userInfo="props.userInfo"
        :avatar-kind="props.avatarKind"
        :alternativeProfilesInfo="props.alternativeProfilesInfo"
        :contextPersonsInfo="props.contextPersonsInfo"
        :navItems="props.navItems"
        :hideNavBar="props.hideNavBar"
        :hasLanguagePicker="props.hasLanguagePicker"
        :languages="props.languages"
        :hasThemePicker="props.hasThemePicker"
        :availableThemes="props.availableThemes"
        :hasAlerts="props.hasAlerts"
        :alertsKind="props.alertsKind"
        :alerts="props.alerts"
        :alertLevel="props.alertLevel"
        :hasHelp="props.hasHelp"
        :headerNavDisable="props.headerNavDisable"
        :hasMegaMenu="props.hasMegaMenu"
        :megaMenuItems="props.megaMenuItems"
        :megaMenuGroupDefinitions="props.megaMenuGroupDefinitions"
        :megaMenuHasShowAll="props.megaMenuHasShowAll"
        :megaMenuShowAllHref="props.megaMenuShowAllHref"
        :showPrimaryMegaMenuItems="props.showPrimaryMegaMenuItems"
        :selectedNavItems="props.navItemsSelected"
        :pageLabel="props.pageLabel"
        :pageBackLabel="props.pageBackLabel"
        :pageIndexPath="props.pageIndexPath"
        :pageBackPath="props.pageBackPath"
        :pageBackButtonVisible="props.pageBackButtonVisible"
        :breadcrumbs="props.pageBreadcrumbs"
        :hasCustomButton="props.hasCustomButton"
        :hideHeaderText="props.hideHeaderText"
        :customButtonIcon="props.customButtonIcon"
        :customButtonBadge="props.customButtonBadge"
        :customButtonBadgeType="props.customButtonBadgeType"
        :customButtonBadgeIcon="props.customButtonBadgeIcon"
        :customButtonKind="props.customButtonKind"
        :texts="displayTexts"
        @custom-button-click="emits('customButtonClick')"
        @mega-menu-show-all-click="triggerShowAllClick"
        @language-change="languageChange"
        @alert-item-click="alertItemClicked"
        @alerts-click="alertsClicked"
        @help-click="helpClicked"
        @go-home="goHome"
        @go-back="goBack"
        @log-out="logOut"
        @nav-toggle="navToggle"
        @context-person-change="contextPersonChange"
        @alternative-profile-change="alternativeProfileChange"
      >
        <template #settingsExtra v-if="$slots.settingsExtra">
          <slot name="settingsExtra" />
        </template>
      </LxMainHeaderDigimaksLite>
    </header>
    <div ref="modals" id="modals"></div>
    <div ref="poppers" id="poppers"></div>
  </div>
</template>
