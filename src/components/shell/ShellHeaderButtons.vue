<script setup>
import { ref } from 'vue';
import LxHeaderButtons from '@/components/shell/HeaderButtons.vue';
import { useShellContext } from '@/components/shell/shellContext';

const {
  props,
  displayTexts,
  viewSpotlightItems,
  headerButtonsVisibility,
  themeModel,
  animationsModel,
  transparencyModel,
  touchModeModel,
  selectedLanguageModel,
  selectedContextPersonModel,
  selectedMegaMenuItemModel,
  customButtonOpenedModal,
  triggerShowAllClick,
  loginClicked,
  languageChange,
  alertItemClicked,
  alertsClicked,
  helpClicked,
  logOut,
  toggleSpotlight,
  handleSettingsClick,
  emits,
} = useShellContext();

const headerActionsVisibility = ref({
  showGoBackButton: false,
  showScrollUpButton: false,
});
</script>

<template>
  <LxHeaderButtons
    :mode="props.mode"
    :enable-responsivity="false"
    :userInfo="props.userInfo"
    :nav-items="props.navItems"
    :has-language-picker="props.hasLanguagePicker"
    :languages="props.languages"
    :has-theme-picker="props.hasThemePicker"
    :available-themes="props.availableThemes"
    :has-alerts="props.hasAlerts"
    :alerts-kind="props.alertsKind"
    :clickSafeAlerts="props.clickSafeAlerts"
    :alerts="props.alerts"
    :alert-count="props.alertCount"
    :alert-level="props.alertLevel"
    :has-help="props.hasHelp"
    :has-login-button="props.hasLoginButton"
    :headerNavDisable="props.headerNavDisable"
    :has-avatar="props.hasAvatar"
    :avatar-kind="props.avatarKind"
    :alternative-profiles-info="props.alternativeProfilesInfo"
    :context-persons-info="props.contextPersonsInfo"
    :hasMegaMenu="props.hasMegaMenu"
    :megaMenuItems="props.megaMenuItems"
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
    v-model:customButtonOpened="customButtonOpenedModal"
    v-model:selectedLanguage="selectedLanguageModel"
    v-model:theme="themeModel"
    v-model:hasReducedAnimations="animationsModel"
    v-model:hasReducedTransparency="transparencyModel"
    v-model:isTouchSensitive="touchModeModel"
    v-model:selectedContextPerson="selectedContextPersonModel"
    v-model:selectedMegaMenuItem="selectedMegaMenuItemModel"
    v-model:headerButtonsVisibility="headerButtonsVisibility"
    v-model:headerActionsVisibility="headerActionsVisibility"
    @mega-menu-show-all-click="triggerShowAllClick"
    @log-in-click="loginClicked"
    @language-change="languageChange"
    @alert-item-click="alertItemClicked"
    @alerts-click="alertsClicked"
    @help-click="helpClicked"
    @log-out="logOut"
    @customButtonClick="emits('customButtonClick')"
    @toggleSpotlight="toggleSpotlight"
    @settingsClick="handleSettingsClick"
  >
    <template #customButtonPanel v-if="$slots.customButtonPanel">
      <slot name="customButtonPanel" />
    </template>
    <template #customButtonSafePanel v-if="$slots.customButtonSafePanel">
      <slot name="customButtonSafePanel" />
    </template>
  </LxHeaderButtons>
</template>
