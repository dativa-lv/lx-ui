<script setup>
import { defineAsyncComponent } from 'vue';
import LxIcon from '@/components/Icon.vue';
import LxLoader from '@/components/Loader.vue';
import LxSkipLink from '@/components/SkipLink.vue';
import LxPageHeader from '@/components/shell/PageHeader.vue';
import LxMainHeader from '@/components/shell/Header.vue';
import { useShellContext } from '@/components/shell/shellContext';

const LxNavBar = defineAsyncComponent(() => import('@/components/shell/NavBar.vue'));

const {
  props,
  semiResponsiveView,
  header,
  nav,
  main,
  footer,
  modals,
  poppers,
  displayTexts,
  navBarSwitchBasic,
  pageTitle,
  selectedContextPersonModel,
  selectedAlternativeProfileModel,
  selectedMegaMenuItemModel,
  selectedLanguageModel,
  themeModel,
  animationsModel,
  transparencyModel,
  touchModeModel,
  customButtonOpenedModal,
  viewSpotlightItems,
  headerButtonsVisibility,
  focusFirstMainFocusableElement,
  triggerShowAllClick,
  loginClicked,
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
  toggleSpotlight,
  handleSettingsClick,
  navClick,
  emits,
} = useShellContext();
</script>

<template>
  <div
    class="lx-layout lx-layout-default"
    :class="[{ 'lx-collapsed': navBarSwitchBasic }, { 'lx-override': props.overrideDefaultStyles }]"
  >
    <LxSkipLink
      v-if="props.hasSkipLink"
      :label="displayTexts.skipLinkLabel"
      :title="displayTexts.skipLinkTitle"
      :tabindex="semiResponsiveView ? 1 : 0"
      @click="focusFirstMainFocusableElement"
    />
    <header ref="header">
      <LxMainHeader
        v-model:selectedContextPerson="selectedContextPersonModel"
        v-model:selectedAlternativeProfile="selectedAlternativeProfileModel"
        v-model:customButtonOpened="customButtonOpenedModal"
        v-model:selectedLanguage="selectedLanguageModel"
        v-model:theme="themeModel"
        v-model:hasReducedAnimations="animationsModel"
        v-model:hasReducedTransparency="transparencyModel"
        v-model:isTouchSensitive="touchModeModel"
        v-model:headerButtonsVisibility="headerButtonsVisibility"
        :mode="props.mode"
        :alternative-profiles-info="props.alternativeProfilesInfo"
        :context-persons-info="props.contextPersonsInfo"
        :userInfo="props.userInfo"
        :has-avatar="props.hasAvatar"
        :avatar-kind="props.avatarKind"
        :nav-items="props.navItems"
        :nav-bar-switch="navBarSwitchBasic"
        :hideNavBar="props.hideNavBar"
        :systemNameShort="props.systemNameShort"
        :page-label="pageTitle"
        :home-path="props.pageIndexPath"
        :backLabel="props.pageBackLabel"
        :backPath="props.pageBackPath"
        :show-back-button="props.pageBackButtonVisible"
        :breadcrumbs="props.pageBreadcrumbs"
        :has-language-picker="props.hasLanguagePicker"
        :languages="props.languages"
        :system-icon="props.systemIcon"
        :has-alerts="props.hasAlerts"
        :alerts-kind="props.alertsKind"
        :clickSafeAlerts="props.clickSafeAlerts"
        :alerts="props.alerts"
        :alert-count="props.alertCount"
        :alert-level="props.alertLevel"
        :has-help="props.hasHelp"
        :has-theme-picker="props.hasThemePicker"
        :available-themes="props.availableThemes"
        :environment="props.environment"
        :headerNavDisable="props.headerNavDisable"
        :hasMegaMenu="props.hasMegaMenu"
        :megaMenuItems="props.megaMenuItems"
        :hasLoginButton="props.hasLoginButton"
        v-model:selectedMegaMenuItem="selectedMegaMenuItemModel"
        :megaMenuHasShowAll="props.megaMenuHasShowAll"
        :megaMenuShowAllHref="props.megaMenuShowAllHref"
        :showPrimaryMegaMenuItems="props.showPrimaryMegaMenuItems"
        :megaMenuGroupDefinitions="props.megaMenuGroupDefinitions"
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
        :texts="displayTexts"
        @mega-menu-show-all-click="triggerShowAllClick"
        @log-in-click="loginClicked"
        @language-change="languageChange"
        @alert-item-click="alertItemClicked"
        @alerts-click="alertsClicked"
        @help-click="helpClicked"
        @go-home="goHome"
        @go-back="goBack"
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
        <LxIcon v-if="props.systemIcon" :value="props.systemIcon" icon-set="brand" />
        <template v-if="$slots.customButtonPanel" #customButtonPanel>
          <slot name="customButtonPanel" />
        </template>
        <template v-if="$slots.customButtonSafePanel" #customButtonSafePanel>
          <slot name="customButtonSafePanel" />
        </template>
      </LxMainHeader>
    </header>
    <nav v-if="!props.hideNavBar" ref="nav" aria-label="navigation panel">
      <LxNavBar
        v-model:theme="themeModel"
        v-model:selectedLanguage="selectedLanguageModel"
        v-model:hasReducedAnimations="animationsModel"
        v-model:hasReducedTransparency="transparencyModel"
        v-model:isTouchSensitive="touchModeModel"
        v-model:selectedMegaMenuItem="selectedMegaMenuItemModel"
        :nav-bar-hidden="navBarSwitchBasic"
        :userInfo="props.userInfo"
        :nav-items="props.navItems"
        :headerNavDisable="props.headerNavDisable"
        :has-theme-picker="props.hasThemePicker"
        :available-themes="props.availableThemes"
        :has-language-picker="props.hasLanguagePicker"
        :languages="props.languages"
        :selectedNavItems="props.navItemsSelected"
        :texts="displayTexts"
        :hasMegaMenu="props.hasMegaMenu"
        :megaMenuItems="props.megaMenuItems"
        :has-login-button="props.hasLoginButton"
        :megaMenuHasShowAll="props.megaMenuHasShowAll"
        :megaMenuShowAllHref="props.megaMenuShowAllHref"
        :showPrimaryMegaMenuItems="props.showPrimaryMegaMenuItems"
        :megaMenuGroupDefinitions="props.megaMenuGroupDefinitions"
        :hasSpotlight="viewSpotlightItems?.length > 0"
        :spotlightHasBadge="props.spotlightHasBadge"
        :headerButtonsVisibility="headerButtonsVisibility"
        @log-in-click="loginClicked"
        @mega-menu-show-all-click="triggerShowAllClick"
        @nav-toggle="navToggle"
        @navClick="navClick"
        @toggleSpotlight="toggleSpotlight"
        @settingsClick="handleSettingsClick"
      />
    </nav>
    <main ref="main" class="lx-main" :aria-busy="props.navigating">
      <LxPageHeader
        v-if="props.pageHeaderVisible"
        :label="pageTitle"
        :description="props.pageDescription"
        :backLabel="props.pageBackLabel"
        :backPath="props.pageBackPath"
        :show-back-button="props.pageBackButtonVisible"
        :breadcrumbs="props.pageBreadcrumbs"
        :hide-header-text="props.hideHeaderText"
        :texts="displayTexts"
        @go-back="goBack"
      />
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
