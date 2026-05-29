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
  animationsModel,
  transparencyModel,
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
    <main class="lx-main" ref="main">
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
      <LxMainHeaderDigimaksLite
        v-model:customButtonOpened="customButtonOpenedModal"
        v-model:selectedLanguage="selectedLanguageModel"
        v-model:selectedContextPerson="selectedContextPersonModel"
        v-model:selectedAlternativeProfile="selectedAlternativeProfileModel"
        v-model:theme="themeModel"
        v-model:hasReducedAnimations="animationsModel"
        v-model:hasReducedTransparency="transparencyModel"
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
        @customButtonClick="emits('customButtonClick')"
        @megaMenuShowAllClick="triggerShowAllClick"
        @languageChange="languageChange"
        @alertItemClick="alertItemClicked"
        @alertsClick="alertsClicked"
        @helpClick="helpClicked"
        @goHome="goHome"
        @goBack="goBack"
        @logOut="logOut"
        @navToggle="navToggle"
        @contextPersonChange="contextPersonChange"
        @alternativeProfileChange="alternativeProfileChange"
      />
    </header>
    <div ref="modals" id="modals"></div>
    <div ref="poppers" id="poppers"></div>
  </div>
</template>
