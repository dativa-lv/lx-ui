export const shellModeLoaders = {
  cover: () => import('@/components/shell/modes/ShellCover.vue'),
  'cover-digives-lite': () => import('@/components/shell/modes/ShellCover.vue'),
  public: () => import('@/components/shell/modes/ShellPublic.vue'),
  latvijalv: () => import('@/components/shell/modes/ShellLatvijaLv.vue'),
  digives: () => import('@/components/shell/modes/ShellDigives.vue'),
  'digives-lite': () => import('@/components/shell/modes/ShellDigivesLite.vue'),
  digimaks: () => import('@/components/shell/modes/ShellDigimaks.vue'),
  'digimaks-lite': () => import('@/components/shell/modes/ShellDigimaksLite.vue'),
  'full-screen': () => import('@/components/shell/modes/ShellFullScreen.vue'),
  custom: () => import('@/components/shell/modes/ShellCustom.vue'),
  default: () => import('@/components/shell/modes/ShellDefault.vue'),
};
