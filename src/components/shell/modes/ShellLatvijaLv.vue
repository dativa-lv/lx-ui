<script setup>
import { defineAsyncComponent } from 'vue';
import LxButton from '@/components/Button.vue';
import LxIcon from '@/components/Icon.vue';
import LxLoader from '@/components/Loader.vue';
import LxSkipLink from '@/components/SkipLink.vue';
import LxPageHeader from '@/components/shell/PageHeader.vue';
import LxMainHeader from '@/components/shell/Header.vue';
import { useShellContext } from '@/components/shell/shellContext';

const LxNavBar = defineAsyncComponent(() => import('@/components/shell/NavBar.vue'));

const {
  props,
  header,
  nav,
  main,
  footer,
  modals,
  poppers,
  displayTexts,
  navBarSwitchBasic,
  pageTitle,
  selectedMegaMenuItemModel,
  selectedLanguageModel,
  themeModel,
  animationsModel,
  transparencyModel,
  touchModeModel,
  selectedContextPersonModel,
  selectedAlternativeProfileModel,
  customButtonOpenedModal,
  visibleAlerts,
  viewSpotlightItems,
  focusFirstMainFocusableElement,
  triggerShowAllClick,
  loginClicked,
  contextPersonChange,
  alternativeProfileChange,
  languageChange,
  alertItemClicked,
  alertsClicked,
  helpClicked,
  goHome,
  goBack,
  logOut,
  navToggle,
  toggleSpotlight,
  navClick,
  closeAlert,
  lvAlertItemClicked,
  pickIcon,
  pickSvgTitle,
  emits,
} = useShellContext();
</script>

<template>
  <div
    class="lx-layout lx-layout-latvijalv"
    :class="[
      { 'lx-collapsed': navBarSwitchBasic },
      { 'lx-hide-nav-bar': props.hideNavBar },
      { 'no-nav-items': !props.navItems || props.navItems?.length === 0 },
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
        v-model:selectedLanguage="selectedLanguageModel"
        v-model:theme="themeModel"
        v-model:hasReducedAnimations="animationsModel"
        v-model:hasReducedTransparency="transparencyModel"
        v-model:isTouchSensitive="touchModeModel"
        v-model:selectedContextPerson="selectedContextPersonModel"
        v-model:selectedAlternativeProfile="selectedAlternativeProfileModel"
        :mode="props.mode"
        :userInfo="props.userInfo"
        :nav-items="props.navItems"
        :nav-bar-switch="navBarSwitchBasic"
        :hideNavBar="props.hideNavBar"
        :systemNameShort="props.systemNameShort"
        :systemSubheader="props.systemSubheader"
        :page-label="pageTitle"
        :home-path="props.pageIndexPath"
        :backLabel="props.pageBackLabel"
        :backPath="props.pageBackPath"
        :show-back-button="props.pageBackButtonVisible"
        :breadcrumbs="props.pageBreadcrumbs"
        :has-language-picker="props.hasLanguagePicker"
        :languages="props.languages"
        :has-theme-picker="props.hasThemePicker"
        :has-login-button="props.hasLoginButton"
        :available-themes="props.availableThemes"
        :system-icon="props.systemIcon"
        :has-alerts="props.hasAlerts"
        :alerts-kind="props.alertsKind"
        :clickSafeAlerts="props.clickSafeAlerts"
        :alerts="props.alerts"
        :alert-count="props.alertCount"
        :alert-level="props.alertLevel"
        :has-help="props.hasHelp"
        :environment="props.environment"
        :headerNavDisable="props.headerNavDisable"
        :has-avatar="props.hasAvatar"
        :avatar-kind="props.avatarKind"
        kind="latvijalv"
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
        :alternative-profiles-info="props.alternativeProfilesInfo"
        :context-persons-info="props.contextPersonsInfo"
        :texts="displayTexts"
        @mega-menu-show-all-click="triggerShowAllClick"
        @log-in-click="loginClicked"
        @contextPersonChange="contextPersonChange"
        @alternativeProfileChange="alternativeProfileChange"
        @language-change="languageChange"
        @alert-item-click="alertItemClicked"
        @alerts-click="alertsClicked"
        @help-click="helpClicked"
        @go-home="goHome"
        @go-back="goBack"
        @log-out="logOut"
        @nav-toggle="navToggle"
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
        v-model:selectedMegaMenuItem="selectedMegaMenuItemModel"
        v-model:theme="themeModel"
        v-model:selectedLanguage="selectedLanguageModel"
        v-model:hasReducedAnimations="animationsModel"
        v-model:hasReducedTransparency="transparencyModel"
        v-model:isTouchSensitive="touchModeModel"
        layoutMode="latvijalv"
        :nav-items="props.navItems"
        :headerNavDisable="props.headerNavDisable"
        :userInfo="props.userInfo"
        :has-theme-picker="props.hasThemePicker"
        :available-themes="props.availableThemes"
        :has-language-picker="props.hasLanguagePicker"
        :languages="props.languages"
        :hasMegaMenu="props.hasMegaMenu"
        :megaMenuItems="props.megaMenuItems"
        :megaMenuHasShowAll="props.megaMenuHasShowAll"
        :megaMenuShowAllHref="props.megaMenuShowAllHref"
        :showPrimaryMegaMenuItems="props.showPrimaryMegaMenuItems"
        :megaMenuGroupDefinitions="props.megaMenuGroupDefinitions"
        :selectedNavItems="props.navItemsSelected"
        :hasSpotlight="viewSpotlightItems?.length > 0"
        :spotlightHasBadge="props.spotlightHasBadge"
        :has-login-button="props.hasLoginButton"
        :texts="displayTexts"
        @mega-menu-show-all-click="triggerShowAllClick"
        @log-in-click="loginClicked"
        @nav-toggle="navToggle"
        @navClick="navClick"
        @toggleSpotlight="toggleSpotlight"
        @settingsClick="emits('settingsClick')"
      />
    </nav>
    <ul v-if="props.alerts?.length > 0 && !props.hasAlerts" class="lx-latvijalv-alert-list">
      <li
        v-for="alert in visibleAlerts"
        :key="alert.id"
        class="lx-latvijalv-alert"
        :class="[
          { 'lx-alert-success': alert?.level === 'success' },
          { 'lx-alert-info': alert?.level === 'info' },
          { 'lx-alert-warning': alert?.level === 'warning' },
          { 'lx-alert-error': alert?.level === 'error' },
          { 'lx-alert-clickable': alert?.clickable },
        ]"
        :role="alert?.level === 'error' || alert?.level === 'warning' ? 'alert' : 'status'"
        aria-live="polite"
        :aria-label="alert?.name"
        :aria-labelledby="alert?.name ? `${alert.id}-label` : null"
        :aria-describedby="alert?.description ? `${alert.id}-desc` : null"
        :tabindex="alert?.clickable ? '0' : '-1'"
        @click="lvAlertItemClicked($event, alert)"
        @keydown.space.prevent="lvAlertItemClicked($event, alert)"
        @keydown.enter.prevent="lvAlertItemClicked($event, alert)"
      >
        <div class="lx-latvijalv-alert-content-wrapper">
          <div class="lx-latvijalv-alert-icon">
            <LxIcon
              :value="pickIcon(alert.level, 'latvijalv')"
              :meaningful="true"
              :title="pickSvgTitle(alert.level)"
              :icon-set="alert.iconSet || 'cds'"
            />
          </div>
          <div class="lx-latvijalv-alert-text">
            <p class="lx-primary">{{ alert?.name }}</p>
            <p v-if="alert?.description" class="lx-secondary">{{ alert?.description }}</p>
          </div>
          <LxButton
            icon="close"
            kind="ghost"
            variant="icon-only"
            :label="displayTexts.close"
            @click="closeAlert(alert)"
          />
        </div>
      </li>
    </ul>
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
