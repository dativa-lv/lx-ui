<script setup>
import { defineAsyncComponent } from 'vue';
import LxButton from '@/components/Button.vue';
import LxLoader from '@/components/Loader.vue';
import LxSkipLink from '@/components/SkipLink.vue';
import LxPageHeader from '@/components/shell/PageHeader.vue';
import LxMainHeaderDigives from '@/components/shell/HeaderDigives.vue';
import { useShellContext } from '@/components/shell/shellContext';

const LxInfoBox = defineAsyncComponent(() => import('@/components/InfoBox.vue'));
const LxNavBarDigives = defineAsyncComponent(() => import('@/components/shell/NavBarDigives.vue'));

const {
  props,
  header,
  nav,
  main,
  footer,
  modals,
  poppers,
  displayTexts,
  navBarSwitchModel,
  pageTitle,
  selectedLanguageModel,
  selectedContextPersonModel,
  selectedAlternativeProfileModel,
  focusFirstMainFocusableElement,
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
  navClick,
  navToggleButton,
  emits,
} = useShellContext();
</script>

<template>
  <div
    class="lx-layout lx-layout-default lx-layout-digives"
    :class="[
      { 'lx-collapsed': navBarSwitchModel },
      { 'lx-hide-nav-bar': props.hideNavBar },
      { 'lx-collapsed-null': navBarSwitchModel === null },
      { 'lx-override': props.overrideDefaultStyles },
    ]"
  >
    <!-- eslint-disable-next-line vuejs-accessibility/tabindex-no-positive -->
    <LxSkipLink
      v-if="props.hasSkipLink"
      :label="displayTexts.skipLinkLabel"
      :title="displayTexts.skipLinkTitle"
      :tabindex="1"
      @click="focusFirstMainFocusableElement"
    />
    <header ref="header">
      <LxMainHeaderDigives
        v-model:nav-bar-switch="navBarSwitchModel"
        v-model:selectedLanguage="selectedLanguageModel"
        v-model:selectedContextPerson="selectedContextPersonModel"
        v-model:selectedAlternativeProfile="selectedAlternativeProfileModel"
        :userInfo="props.userInfo"
        :alternative-profiles-info="props.alternativeProfilesInfo"
        :context-persons-info="props.contextPersonsInfo"
        :nav-items="props.navItems"
        :hide-nav-bar="props.hideNavBar"
        :systemNameShort="props.systemNameShort"
        :systemSubheader="props.systemSubheader"
        :system-name-formatted="props.systemNameFormatted"
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
        :alerts="props.alerts"
        :alert-count="props.alertCount"
        :alert-level="props.alertLevel"
        :has-help="props.hasHelp"
        :environment="props.environment"
        kind="public"
        :headerNavDisable="props.headerNavDisable"
        :headerNavReadOnly="props.headerNavReadOnly"
        :texts="displayTexts"
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
        @navClick="navClick"
        @settingsClick="emits('settingsClick')"
      />
    </header>
    <div class="small-nav-bar-button">
      <LxButton
        :icon="navBarSwitchModel === null ? 'menu' : navBarSwitchModel ? 'menu' : 'close'"
        variant="icon-only"
        kind="ghost"
        :label="
          navBarSwitchModel === null
            ? displayTexts.openNavbar
            : navBarSwitchModel
            ? displayTexts.openNavbar
            : displayTexts.close
        "
        @click="navToggleButton()"
      />
    </div>
    <nav ref="nav" aria-label="navigation panel">
      <LxNavBarDigives
        v-model:nav-bar-switch="navBarSwitchModel"
        v-model:selectedContextPerson="selectedContextPersonModel"
        v-model:selectedAlternativeProfile="selectedAlternativeProfileModel"
        :nav-items="props.navItems"
        :selectedNavItems="props.navItemsSelected"
        :userInfo="props.userInfo"
        :alternative-profiles-info="props.alternativeProfilesInfo"
        :context-persons-info="props.contextPersonsInfo"
        :texts="displayTexts"
        :headerNavDisable="props.headerNavDisable"
        :headerNavReadOnly="props.headerNavReadOnly"
        @contextPersonChange="contextPersonChange"
        @alternativeProfileChange="alternativeProfileChange"
        @log-out="logOut"
        @navClick="navClick"
        @nav-toggle="navToggle"
        @settingsClick="emits('settingsClick')"
      />
    </nav>
    <main ref="main" class="lx-main">
      <ul v-if="props.alerts?.length > 0" class="lx-digives-alert-list">
        <li
          v-for="alert in props.alerts"
          :key="alert.id"
          class="lx-digives-alert"
          :role="alert?.level === 'error' || alert?.level === 'warning' ? 'alert' : 'status'"
          @click="alert?.clickable && alertItemClicked(alert)"
          @keydown.space.prevent="alert?.clickable && alertItemClicked(alert)"
          @keydown.enter.prevent="alert?.clickable && alertItemClicked(alert)"
        >
          <LxInfoBox
            :variant="alert?.level"
            :label="alert?.name"
            :description="alert?.description"
            :id="alert?.id"
            :kind="alert?.clickable ? 'clickable' : 'default'"
            :actionDefinitions="
              alert?.clickable
                ? [
                    {
                      id: 'open',
                      icon: 'open',
                      title: displayTexts?.open,
                      destructive: false,
                    },
                  ]
                : []
            "
            @actionClick="() => alertItemClicked(alert)"
          />
        </li>
      </ul>
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
    <div ref="modals" id="modals"></div>
    <div ref="poppers" id="poppers"></div>
  </div>
</template>
