<script setup>
import { defineAsyncComponent } from 'vue';
import { formatDate } from '@/utils/dateUtils';
import LxFlag from '@/components/Flag.vue';
import LxIcon from '@/components/Icon.vue';
import LxInfoWrapper from '@/components/InfoWrapper.vue';
import LxLoader from '@/components/Loader.vue';
import LxRow from '@/components/forms/Row.vue';
import LxSkipLink from '@/components/SkipLink.vue';
import LxPageHeader from '@/components/shell/PageHeader.vue';
import LxMainHeaderDigivesLite from '@/components/shell/HeaderDigivesLite.vue';
import { useShellContext } from '@/components/shell/shellContext';

const LxInfoBox = defineAsyncComponent(() => import('@/components/InfoBox.vue'));
const LxNavBarDigivesLite = defineAsyncComponent(() =>
  import('@/components/shell/NavBarDigivesLite.vue')
);

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
  selectedMegaMenuItemModel,
  customButtonOpenedModal,
  themeModel,
  animationsModel,
  transparencyModel,
  touchModeModel,
  viewSpotlightItems,
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
  toggleSpotlight,
  emits,
} = useShellContext();
</script>

<template>
  <div
    class="lx-layout lx-layout-default lx-layout-digives-lite"
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
      <LxMainHeaderDigivesLite
        v-model:nav-bar-switch="navBarSwitchModel"
        v-model:customButtonOpened="customButtonOpenedModal"
        v-model:theme="themeModel"
        v-model:selectedLanguage="selectedLanguageModel"
        v-model:selectedContextPerson="selectedContextPersonModel"
        v-model:selectedAlternativeProfile="selectedAlternativeProfileModel"
        v-model:hasReducedAnimations="animationsModel"
        v-model:hasReducedTransparency="transparencyModel"
        v-model:isTouchSensitive="touchModeModel"
        :userInfo="props.userInfo"
        :hasAvatar="props.hasAvatar"
        :avatar-kind="props.avatarKind"
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
        :hasThemePicker="props.hasThemePicker"
        :availableThemes="props.availableThemes"
        :has-alerts="props.hasAlerts"
        :alerts-kind="props.alertsKind"
        :alerts="props.alerts"
        :alert-count="props.alertCount"
        :alert-level="props.alertLevel"
        :has-help="props.hasHelp"
        :environment="props.environment"
        :headerNavDisable="props.headerNavDisable"
        :headerNavReadOnly="props.headerNavReadOnly"
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
        @customButtonClick="emits('customButtonClick')"
        @toggleSpotlight="toggleSpotlight"
        @settingsClick="emits('settingsClick')"
      >
        <template v-if="$slots.customButtonPanel" #customButtonPanel>
          <slot name="customButtonPanel" />
        </template>
        <template v-if="$slots.customButtonSafePanel" #customButtonSafePanel>
          <slot name="customButtonSafePanel" />
        </template>
      </LxMainHeaderDigivesLite>
    </header>
    <div v-if="props.userInfo" class="small-nav-bar-button">
      <div
        class="shell-buttons patient-info"
        :class="[{ 'without-context-person': !selectedContextPersonModel }]"
      >
        <LxInfoWrapper v-if="selectedContextPersonModel">
          <LxIcon value="patient-active" />
          <template #panel>
            <LxRow :label="displayTexts.contextPersonsInfoLabel">
              <p class="lx-data">{{ selectedContextPersonModel?.name }}</p>
              <div class="lx-data-with-flag">
                <LxFlag
                  v-if="selectedContextPersonModel?.flag"
                  :value="selectedContextPersonModel.flag"
                  :title="selectedContextPersonModel?.flagTitle"
                />
                <p class="lx-data">
                  {{ selectedContextPersonModel?.description }}
                </p>
              </div>
            </LxRow>
            <LxRow
              v-if="selectedContextPersonModel?.birthDate"
              :label="displayTexts.contextPersonsBirthDate"
            >
              <p class="lx-data">{{ formatDate(selectedContextPersonModel?.birthDate) }}</p>
            </LxRow>
          </template>
        </LxInfoWrapper>
        <div v-else class="no-patient-icon" :title="displayTexts.contextPersonsInfoTitle">
          <LxIcon
            class="patient-inactive-icon"
            value="patient-inactive"
            :title="displayTexts.contextPersonsInfoTitle"
          />
        </div>
      </div>
    </div>
    <nav ref="nav" aria-label="navigation panel">
      <LxNavBarDigivesLite
        v-model:nav-bar-switch="navBarSwitchModel"
        v-model:selectedContextPerson="selectedContextPersonModel"
        v-model:selectedAlternativeProfile="selectedAlternativeProfileModel"
        v-model:selectedMegaMenuItem="selectedMegaMenuItemModel"
        v-model:customButtonOpened="customButtonOpenedModal"
        v-model:selectedLanguage="selectedLanguageModel"
        v-model:theme="themeModel"
        v-model:hasReducedAnimations="animationsModel"
        v-model:hasReducedTransparency="transparencyModel"
        v-model:isTouchSensitive="touchModeModel"
        :nav-items="props.navItems"
        :selectedNavItems="props.navItemsSelected"
        :userInfo="props.userInfo"
        :hasAvatar="props.hasAvatar"
        :avatar-kind="props.avatarKind"
        :alternative-profiles-info="props.alternativeProfilesInfo"
        :context-persons-info="props.contextPersonsInfo"
        :texts="displayTexts"
        :headerNavDisable="props.headerNavDisable"
        :headerNavReadOnly="props.headerNavReadOnly"
        :hasThemePicker="props.hasThemePicker"
        :availableThemes="props.availableThemes"
        :has-alerts="props.hasAlerts"
        :alerts-kind="props.alertsKind"
        :alerts="props.alerts"
        :alert-count="props.alertCount"
        :alert-level="props.alertLevel"
        :has-help="props.hasHelp"
        :has-language-picker="props.hasLanguagePicker"
        :languages="props.languages"
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
        :hasMegaMenu="props.hasMegaMenu"
        :megaMenuItems="props.megaMenuItems"
        @customButtonClick="emits('customButtonClick')"
        @language-change="languageChange"
        @contextPersonChange="contextPersonChange"
        @alternativeProfileChange="alternativeProfileChange"
        @alert-item-click="alertItemClicked"
        @alerts-click="alertsClicked"
        @help-click="helpClicked"
        @log-out="logOut"
        @navClick="navClick"
        @nav-toggle="navToggle"
        @toggleSpotlight="toggleSpotlight"
        @settingsClick="emits('settingsClick')"
      >
        <template v-if="$slots.customButtonPanel" #customButtonPanel>
          <slot name="customButtonPanel" />
        </template>
        <template v-if="$slots.customButtonSafePanel" #customButtonSafePanel>
          <slot name="customButtonSafePanel" />
        </template>
      </LxNavBarDigivesLite>
    </nav>

    <main ref="main" class="lx-main">
      <ul
        v-if="props.alerts?.length > 0 && props.routeName === 'dashboard'"
        class="lx-digives-lite-alert-list"
      >
        <li
          v-for="alert in props.alerts"
          :key="alert.id"
          class="lx-digives-lite-alert"
          :role="alert?.level === 'error' || alert?.level === 'warning' ? 'alert' : 'status'"
        >
          <LxInfoBox
            :variant="alert?.level"
            :label="alert?.name"
            :description="alert?.description"
            :id="alert?.id"
            :kind="alert?.clickable ? 'button' : 'default'"
            :actionDefinitions="
              alert?.clickable
                ? [
                    {
                      id: 'close',
                      icon: 'close',
                      title: displayTexts?.close,
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
