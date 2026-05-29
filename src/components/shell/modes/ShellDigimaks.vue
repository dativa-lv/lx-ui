<script setup>
import LxLoader from '@/components/Loader.vue';
import LxSkipLink from '@/components/SkipLink.vue';
import LxPageHeader from '@/components/shell/PageHeader.vue';
import LxMainHeaderDigimaks from '@/components/shell/HeaderDigimaks.vue';
import { useShellContext } from '@/components/shell/shellContext';

const {
  props,
  header,
  main,
  footer,
  modals,
  poppers,
  displayTexts,
  pageTitle,
  navBarSwitchModel,
  selectedLanguageModel,
  selectedContextPersonModel,
  selectedAlternativeProfileModel,
  selectedMegaMenuItemModel,
  themeModel,
  animationsModel,
  transparencyModel,
  touchModeModel,
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
    <main class="lx-main" ref="main">
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
    </main>
    <footer ref="footer">
      <div>
        <slot name="footer" />
      </div>
    </footer>
    <header ref="header">
      <LxMainHeaderDigimaks
        v-model:nav-bar-switch="navBarSwitchModel"
        v-model:selectedLanguage="selectedLanguageModel"
        v-model:selectedContextPerson="selectedContextPersonModel"
        v-model:selectedAlternativeProfile="selectedAlternativeProfileModel"
        v-model:theme="themeModel"
        v-model:hasReducedAnimations="animationsModel"
        v-model:hasReducedTransparency="transparencyModel"
        v-model:isTouchSensitive="touchModeModel"
        v-model:selectedMegaMenuItem="selectedMegaMenuItemModel"
        :userInfo="props.userInfo"
        :avatar-kind="props.avatarKind"
        :alternative-profiles-info="props.alternativeProfilesInfo"
        :context-persons-info="props.contextPersonsInfo"
        :nav-items="props.navItems"
        :hide-nav-bar="props.hideNavBar"
        :has-language-picker="props.hasLanguagePicker"
        :languages="props.languages"
        :has-theme-picker="props.hasThemePicker"
        :available-themes="props.availableThemes"
        :has-alerts="props.hasAlerts"
        :alerts-kind="props.alertsKind"
        :alerts="props.alerts"
        :alert-level="props.alertLevel"
        :has-help="props.hasHelp"
        :headerNavDisable="props.headerNavDisable"
        :selectedNavItems="props.navItemsSelected"
        :hasMegaMenu="props.hasMegaMenu"
        :megaMenuItems="props.megaMenuItems"
        :megaMenuGroupDefinitions="props.megaMenuGroupDefinitions"
        :megaMenuHasShowAll="props.megaMenuHasShowAll"
        :megaMenuShowAllHref="props.megaMenuShowAllHref"
        :showPrimaryMegaMenuItems="props.showPrimaryMegaMenuItems"
        :texts="displayTexts"
        @mega-menu-show-all-click="triggerShowAllClick"
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
        @settingsClick="emits('settingsClick')"
      />
    </header>
    <div ref="modals" id="modals"></div>
    <div ref="poppers" id="poppers"></div>
  </div>
</template>
